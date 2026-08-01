// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

const root = resolve(import.meta.dirname, '..')
const distDir = resolve(root, 'dist')
const baseHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8')
const experience = JSON.parse(readFileSync(resolve(root, 'content/experience.json'), 'utf8'))
const research = JSON.parse(readFileSync(resolve(root, 'content/research.json'), 'utf8'))
const news = JSON.parse(readFileSync(resolve(root, 'content/news.json'), 'utf8'))
const benchmarks = JSON.parse(readFileSync(resolve(root, 'content/benchmarks.json'), 'utf8'))
const cv = JSON.parse(readFileSync(resolve(root, 'content/cv.json'), 'utf8'))
const baseUrl = 'https://wittenyeh.github.io'

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const aboutSource = readFileSync(resolve(root, 'content/about.md'), 'utf8')
const { content: aboutMarkdown } = matter(aboutSource)
const aboutHtml = marked.parse(aboutMarkdown.trim())
  .replace('Prof. Siqiang Luo', '<a href="https://siqiangluo.com/">Prof. Siqiang Luo</a>')
  .replace('Prof. Feng Zhang', '<a href="https://fengzhangcs.github.io/">Prof. Feng Zhang</a>')

const publicationDir = resolve(root, 'content/publications')
const publications = readdirSync(publicationDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const { data, content } = matter(readFileSync(resolve(publicationDir, file), 'utf8'))
    return { ...data, abstract: content.trim() }
  })
  .sort((a, b) => Number(b.year) - Number(a.year))

const staticStyle = `
  <style id="seo-static-style">
    #seo-static-content{max-width:1120px;margin:0 auto;padding:32px 24px 48px;font-family:"SF Mono",Consolas,monospace;line-height:1.65;color:#d8dee9;background:#2e3440}
    #seo-static-content h1{margin:0 0 8px;font-size:2rem;color:#eceff4}
    #seo-static-content h2{margin:28px 0 12px;font-size:1.1rem;color:#88c0d0}
    #seo-static-content h3{margin:16px 0 6px;font-size:1rem;color:#eceff4}
    #seo-static-content p,#seo-static-content li{font-size:.9rem;color:#d8dee9}
    #seo-static-content a{color:#88c0d0}
    #seo-static-content .seo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
    #seo-static-content .seo-card{padding:14px;border:1px solid #4c566a;border-radius:6px}
    #seo-static-content .seo-meta{color:#a3be8c;font-size:.8rem}
    @media(max-width:700px){#seo-static-content{padding:24px 16px}#seo-static-content .seo-grid{grid-template-columns:1fr}}
  </style>`

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatExperienceDate = (value = 'Present') => {
  if (value.toLowerCase() === 'present') return 'Present'
  const match = value.match(/^(\d{4})-(\d{2})$/)
  if (!match) return value
  const month = monthNames[Number(match[2]) - 1]
  return month ? `${month} ${match[1]}` : value
}
const educationHtml = experience.timeline.map((item) => `
  <article class="seo-card">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.company)}</p>
    <p class="seo-meta">${escapeHtml(formatExperienceDate(item.start))} – ${escapeHtml(formatExperienceDate(item.end))}</p>
  </article>`).join('')

const researchHtml = research.currentResearch.map((item) => `
  <article class="seo-card">
    <h3><a href="${escapeHtml(item.link)}">${escapeHtml(item.lab)}</a></h3>
    <p>${escapeHtml(item.focus)}</p>
    ${item.advisor ? `<p class="seo-meta">with ${escapeHtml(item.advisor)}</p>` : ''}
  </article>`).join('')

const newsHtml = news.map((item) => `
  <article>
    <h3>${escapeHtml(item.title)}</h3>
    <p class="seo-meta">${escapeHtml(item.date)}</p>
    <p>${escapeHtml(item.description)}</p>
  </article>`).join('')

const publicationHtml = publications.map((publication) => `
  <article class="seo-card">
    <h3>${escapeHtml(publication.title)}</h3>
    <p>${escapeHtml((publication.authors ?? []).join(', '))}</p>
    <p class="seo-meta">${escapeHtml(publication.venue)} · ${escapeHtml(publication.year)}</p>
    ${publication.abstract ? `<p>${escapeHtml(publication.abstract)}</p>` : ''}
    ${publication.links?.paper ? `<a href="${escapeHtml(publication.links.paper)}">Paper</a>` : ''}
    ${publication.links?.code ? ` · <a href="${escapeHtml(publication.links.code)}">Code</a>` : ''}
  </article>`).join('')

const homeStaticContent = `${staticStyle}
  <main id="seo-static-content">
    <header>
      <h1>Weitang Ye</h1>
      <p>PhD Student at the College of Computing and Data Science, Nanyang Technological University</p>
    </header>
    <section aria-labelledby="seo-about"><h2 id="seo-about">About</h2>${aboutHtml}</section>
    <div class="seo-grid">
      <section aria-labelledby="seo-research"><h2 id="seo-research">Current Research</h2>${researchHtml}</section>
      <section aria-labelledby="seo-education"><h2 id="seo-education">Education</h2>${educationHtml}</section>
    </div>
    <section aria-labelledby="seo-news"><h2 id="seo-news">Recent Updates</h2>${newsHtml}</section>
    <section aria-labelledby="seo-publications"><h2 id="seo-publications">Selected Publications</h2>${publicationHtml}</section>
  </main>`

const routeConfigs = {
  publications: {
    title: 'Publications | Weitang Ye',
    description: 'Research publications by Weitang Ye on database systems, vector search, and high-performance data systems.',
    index: true,
    content: `<main id="seo-static-content"><h1>Publications by Weitang Ye</h1>${publicationHtml}</main>`,
  },
  benchmarks: {
    title: 'GDSE Benchmarks | Weitang Ye',
    description: benchmarks.description,
    index: true,
    content: `<main id="seo-static-content"><h1>${escapeHtml(benchmarks.title)}</h1><p>${escapeHtml(benchmarks.description)}</p><p>Systems: ${escapeHtml(benchmarks.systems.join(', '))}</p></main>`,
  },
  projects: {
    title: 'Projects | Weitang Ye',
    description: 'Research and systems projects by Weitang Ye.',
    index: false,
    content: '<main id="seo-static-content"><h1>Projects by Weitang Ye</h1><p>Project information will be added here.</p></main>',
  },
  cv: {
    title: 'CV | Weitang Ye',
    description: cv.description,
    index: cv.available === true,
    content: `<main id="seo-static-content"><h1>Curriculum Vitae — Weitang Ye</h1><p>${escapeHtml(cv.description)}</p></main>`,
  },
}

const replaceMetadata = (html, { title, description, canonical, index, type = 'website' }) => html
  .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${index ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow'}" />`)
  .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
  .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`)
  .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
  .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)

const replaceRoot = (html, content) => html.replace('<div id="root"></div>', `<div id="root">${content}</div>`)
const removeProfileJsonLd = (html) => html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')

const homepage = replaceRoot(baseHtml, homeStaticContent)
writeFileSync(resolve(distDir, 'index.html'), homepage)

for (const [route, config] of Object.entries(routeConfigs)) {
  const canonical = `${baseUrl}/${route}/`
  const pageJsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.title,
    url: canonical,
    description: config.description,
    about: { '@id': `${baseUrl}/#person` },
    isPartOf: { '@type': 'WebSite', name: "Weitang Ye's Academic Homepage", url: `${baseUrl}/` },
  })}</script>`

  let html = removeProfileJsonLd(baseHtml)
  html = replaceMetadata(html, { ...config, canonical })
  html = html.replace('</head>', `  ${pageJsonLd}\n  </head>`)
  html = replaceRoot(html, `${staticStyle}${config.content}`)

  const routeDir = resolve(distDir, route)
  mkdirSync(routeDir, { recursive: true })
  writeFileSync(resolve(routeDir, 'index.html'), html)
}

const notFound = replaceMetadata(removeProfileJsonLd(baseHtml), {
  title: 'Page Not Found | Weitang Ye',
  description: 'The requested page could not be found.',
  canonical: `${baseUrl}/404.html`,
  index: false,
})
writeFileSync(resolve(distDir, '404.html'), replaceRoot(notFound, `${staticStyle}<main id="seo-static-content"><h1>Page Not Found</h1><p><a href="/">Return to Weitang Ye's homepage</a>.</p></main>`))

console.log('✓ SEO metadata and static HTML generated for the homepage and route entry points')
