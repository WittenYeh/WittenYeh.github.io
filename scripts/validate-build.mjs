// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

import { existsSync, readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import matter from 'gray-matter'
import { loadProjectDocs } from './project-docs.mjs'

const root = resolve(import.meta.dirname, '..')
const site = JSON.parse(readFileSync(resolve(root, 'content/site.json'), 'utf8'))
const distIndexPath = resolve(root, 'dist/index.html')
const distIndex = readFileSync(distIndexPath, 'utf8')
const projectDocs = loadProjectDocs(root)
const projectDir = resolve(root, 'content/projects')
const projectTitles = readdirSync(projectDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => matter(readFileSync(resolve(projectDir, file), 'utf8')).data.title)
const assetsDir = resolve(root, 'dist/assets')
const javascriptFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.js'))
const projectDocRoutes = projectDocs.flatMap((project) => project.chapters.map((chapter) => chapter.route))
const legacyProjectDocRoutes = projectDocs.flatMap((project) =>
  (project.legacySlugs ?? []).flatMap((legacySlug) =>
    project.chapters.map((chapter, chapterIndex) => ({
      route: chapterIndex === 0
        ? `projects/${legacySlug}`
        : `projects/${legacySlug}/${chapter.slug}`,
      canonicalRoute: chapter.route,
    })),
  ),
)

if (site.sections?.includes('bio')) {
  const { content } = matter(readFileSync(resolve(root, 'content/about.md'), 'utf8'))
  const biography = content.replace(/\s+/g, ' ').trim()

  if (!biography) {
    throw new Error('The home page enables the bio section, but content/about.md has no body text.')
  }

  const signature = biography.slice(0, 100)
  const javascript = javascriptFiles
    .map((file) => readFileSync(resolve(assetsDir, file), 'utf8'))
    .join('\n')
    .replace(/\s+/g, ' ')

  if (!javascript.includes(signature)) {
    throw new Error('The biography from content/about.md is missing from the production bundle.')
  }

  console.log('✓ Biography is present in the production bundle')
}

const mainBundleName = javascriptFiles.find((file) => /^main-[^.]+\.js$/.test(file))
if (!mainBundleName) throw new Error('Build validation failed: main JavaScript bundle is missing')
const mainBundle = readFileSync(resolve(assetsDir, mainBundleName), 'utf8')
for (const signal of ['vite:preloadError', 'Reload page', 'Loading page module']) {
  if (!mainBundle.includes(signal)) {
    throw new Error(`Build validation failed: route recovery bundle is missing ${signal}`)
  }
}

const lazyJavascript = javascriptFiles
  .filter((file) => file !== mainBundleName)
  .map((file) => readFileSync(resolve(assetsDir, file), 'utf8'))
  .join('\n')
for (const signal of [
  'data-language="cpp"',
  'data-language="json"',
  'hljs language-cpp',
  'hljs language-json',
  'hljs-keyword',
]) {
  if (!lazyJavascript.includes(signal)) {
    throw new Error(`Build validation failed: Markdown syntax highlighting is missing ${signal}`)
  }
}

const publicationFiles = readdirSync(resolve(root, 'content/publications'))
  .filter((file) => file.endsWith('.md'))
const publicationBodySignature = publicationFiles.length === 0
  ? ''
  : matter(readFileSync(resolve(root, 'content/publications', publicationFiles[0]), 'utf8'))
      .content.replace(/\s+/g, ' ').trim().slice(0, 80)
if (publicationBodySignature) {
  const lazyBundles = javascriptFiles
    .filter((file) => file !== mainBundleName)
    .map((file) => readFileSync(resolve(assetsDir, file), 'utf8'))
    .join('\n')
    .replace(/\s+/g, ' ')
  if (mainBundle.replace(/\s+/g, ' ').includes(publicationBodySignature)) {
    throw new Error('Build validation failed: full publication bodies leaked into the main bundle')
  }
  if (!lazyBundles.includes(publicationBodySignature)) {
    throw new Error('Build validation failed: paged publication content chunks are missing')
  }
}

const projectFiles = readdirSync(projectDir).filter((file) => file.endsWith('.md'))
const projectBodySignature = projectFiles.length === 0
  ? ''
  : matter(readFileSync(resolve(projectDir, projectFiles[0]), 'utf8'))
      .content.replace(/\s+/g, ' ').trim().slice(0, 80)
if (projectBodySignature) {
  const normalizedMainBundle = mainBundle.replace(/\s+/g, ' ')
  const lazyBundles = javascriptFiles
    .filter((file) => file !== mainBundleName)
    .map((file) => readFileSync(resolve(assetsDir, file), 'utf8'))
    .join('\n')
    .replace(/\s+/g, ' ')
  if (normalizedMainBundle.includes(projectBodySignature)) {
    throw new Error('Build validation failed: full project bodies leaked into the main bundle')
  }
  if (!lazyBundles.includes(projectBodySignature)) {
    throw new Error('Build validation failed: paged project content chunks are missing')
  }
}

const requiredHomepageSignals = [
  '<title>Weitang Ye | PhD Student at NTU</title>',
  '<link rel="canonical" href="https://wittenyeh.github.io/" />',
  'type="application/ld+json"',
  '"@type": "ProfilePage"',
  '<main id="seo-static-content">',
  'I am a PhD student at the College of Computing and Data Science',
]

for (const signal of requiredHomepageSignals) {
  if (!distIndex.includes(signal)) {
    throw new Error(`SEO validation failed: dist/index.html is missing ${signal}`)
  }
}

for (const route of ['publications', 'projects', 'cv', 'benchmarks', ...projectDocRoutes]) {
  const routePath = resolve(root, `dist/${route}/index.html`)
  if (!existsSync(routePath)) throw new Error(`SEO validation failed: missing ${routePath}`)

  const routeHtml = readFileSync(routePath, 'utf8')
  if (!routeHtml.includes(`<link rel="canonical" href="https://wittenyeh.github.io/${route}/" />`)) {
    throw new Error(`SEO validation failed: ${route} has no route-specific canonical URL`)
  }
}

const projectsHtml = readFileSync(resolve(root, 'dist/projects/index.html'), 'utf8')
if (!projectsHtml.includes('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />')) {
  throw new Error('SEO validation failed: projects page must be indexable')
}
for (const title of projectTitles) {
  if (!projectsHtml.includes(title)) {
    throw new Error(`SEO validation failed: projects page is missing ${title}`)
  }
}

for (const { route, canonicalRoute } of legacyProjectDocRoutes) {
  const routePath = resolve(root, `dist/${route}/index.html`)
  if (!existsSync(routePath)) throw new Error(`SEO validation failed: missing legacy route ${routePath}`)

  const routeHtml = readFileSync(routePath, 'utf8')
  if (!routeHtml.includes(`<link rel="canonical" href="https://wittenyeh.github.io/${canonicalRoute}/" />`)) {
    throw new Error(`SEO validation failed: ${route} does not canonicalize to ${canonicalRoute}`)
  }
  if (!routeHtml.includes('<meta name="robots" content="noindex, follow" />')) {
    throw new Error(`SEO validation failed: legacy route ${route} must be noindex`)
  }
}

const sitemapPath = resolve(root, 'dist/sitemap.xml')
const robotsPath = resolve(root, 'dist/robots.txt')
if (!existsSync(sitemapPath)) throw new Error('SEO validation failed: dist/sitemap.xml is missing')
const sitemap = readFileSync(sitemapPath, 'utf8')
if (!sitemap.includes('<loc>https://wittenyeh.github.io/projects/</loc>')) {
  throw new Error('SEO validation failed: sitemap is missing projects')
}
for (const route of projectDocRoutes) {
  if (!sitemap.includes(`<loc>https://wittenyeh.github.io/${route}/</loc>`)) {
    throw new Error(`SEO validation failed: sitemap is missing ${route}`)
  }
}
for (const { route } of legacyProjectDocRoutes) {
  if (sitemap.includes(`<loc>https://wittenyeh.github.io/${route}/</loc>`)) {
    throw new Error(`SEO validation failed: sitemap must not include legacy route ${route}`)
  }
}
if (!readFileSync(robotsPath, 'utf8').includes('Sitemap: https://wittenyeh.github.io/sitemap.xml')) {
  throw new Error('SEO validation failed: robots.txt does not declare the sitemap')
}

console.log('✓ Static content, canonical URLs, structured data, robots.txt, and sitemap.xml validated')
