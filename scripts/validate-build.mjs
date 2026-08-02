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
const projectDocRoutes = projectDocs.flatMap((project) => project.chapters.map((chapter) => chapter.route))

if (site.sections?.includes('bio')) {
  const { content } = matter(readFileSync(resolve(root, 'content/about.md'), 'utf8'))
  const biography = content.replace(/\s+/g, ' ').trim()

  if (!biography) {
    throw new Error('The home page enables the bio section, but content/about.md has no body text.')
  }

  const signature = biography.slice(0, 100)
  const assetsDir = resolve(root, 'dist/assets')
  const javascript = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(resolve(assetsDir, file), 'utf8'))
    .join('\n')
    .replace(/\s+/g, ' ')

  if (!javascript.includes(signature)) {
    throw new Error('The biography from content/about.md is missing from the production bundle.')
  }

  console.log('✓ Biography is present in the production bundle')
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

const sitemapPath = resolve(root, 'dist/sitemap.xml')
const robotsPath = resolve(root, 'dist/robots.txt')
if (!existsSync(sitemapPath)) throw new Error('SEO validation failed: dist/sitemap.xml is missing')
const sitemap = readFileSync(sitemapPath, 'utf8')
for (const route of projectDocRoutes) {
  if (!sitemap.includes(`<loc>https://wittenyeh.github.io/${route}/</loc>`)) {
    throw new Error(`SEO validation failed: sitemap is missing ${route}`)
  }
}
if (!readFileSync(robotsPath, 'utf8').includes('Sitemap: https://wittenyeh.github.io/sitemap.xml')) {
  throw new Error('SEO validation failed: robots.txt does not declare the sitemap')
}

console.log('✓ Static content, canonical URLs, structured data, robots.txt, and sitemap.xml validated')
