// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

/**
 * Validation script for the Terminal Portfolio Template.
 * Checks for common configuration issues before building.
 *
 * Usage: node scripts/validate.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { loadProjectDocs } from './project-docs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

let errors = 0
let warnings = 0

function pass(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`)
}

function fail(msg) {
  errors++
  console.log(`\x1b[31m✗\x1b[0m ${msg}`)
}

function warn(msg) {
  warnings++
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(relPath) {
  const abs = resolve(ROOT, relPath)
  if (!existsSync(abs)) return null
  try {
    return JSON.parse(readFileSync(abs, 'utf-8'))
  } catch (e) {
    fail(`${relPath} is not valid JSON: ${e.message}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// 1. content/site.json exists and is valid JSON
// ---------------------------------------------------------------------------

const site = readJson('content/site.json')
if (!site) {
  fail('content/site.json not found — restore it from Git or create it using the schema in README.md')
} else {
  pass('content/site.json found and valid')
}

// ---------------------------------------------------------------------------
// 2. Avatar file check
// ---------------------------------------------------------------------------

if (site?.avatar) {
  const avatarPath = `content/images/${site.avatar}`
  if (existsSync(resolve(ROOT, avatarPath))) {
    pass(`Avatar file found: ${avatarPath}`)
  } else {
    const baseName = site.avatar.replace(/\.[^.]+$/, '')
    const altExts = ['jpg', 'jpeg', 'png', 'svg', 'webp']
    const found = altExts.find((ext) =>
      existsSync(resolve(ROOT, `content/images/${baseName}.${ext}`))
    )
    if (found) {
      warn(
        `Avatar configured as "${site.avatar}" but found "${baseName}.${found}" — update content/site.json or rename the file`
      )
    } else {
      fail(`Avatar file missing: ${avatarPath} — place your avatar image in content/images/`)
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Example data check
// ---------------------------------------------------------------------------

if (site) {
  const siteStr = JSON.stringify(site)
  const examplePatterns = ['Alex Chen', 'example.com', 'example.edu']
  const found = examplePatterns.filter((p) => siteStr.includes(p))
  if (found.length > 0) {
    warn(`content/site.json still contains example data (${found.join(', ')})`)
  } else {
    pass('content/site.json has been personalized')
  }
}

// ---------------------------------------------------------------------------
// 3a. Runtime GitHub contribution graph configuration
// ---------------------------------------------------------------------------

if (site?.sections?.includes('githubContributions')) {
  const config = site.githubContributions
  if (!config || typeof config !== 'object') {
    fail('githubContributions is enabled in sections but has no configuration')
  } else {
    if (typeof config.username !== 'string' || !/^[A-Za-z0-9-]+$/.test(config.username)) {
      fail('githubContributions.username must be a valid GitHub username')
    }
    if (typeof config.apiBaseUrl !== 'string' || !config.apiBaseUrl.startsWith('https://')) {
      fail('githubContributions.apiBaseUrl must be an HTTPS URL')
    }
    if (config.year !== 'last') {
      fail('githubContributions.year must currently be "last"')
    }
    if (!Number.isFinite(config.refreshMinutes) || config.refreshMinutes < 5) {
      fail('githubContributions.refreshMinutes must be a number of at least 5')
    }
  }
}

// ---------------------------------------------------------------------------
// 4. All content JSON files are valid
// ---------------------------------------------------------------------------

const jsonFiles = [
  'experience.json', 'news.json',
  'awards.json', 'research.json', 'logos.json',
  'cv.json', 'benchmarks.json',
]

let validCount = 0
for (const file of jsonFiles) {
  const data = readJson(`content/${file}`)
  if (data !== null) validCount++
}

// Check that Markdown directories have content
const mdDirs = ['publications', 'projects', 'articles']
let mdCount = 0
for (const dir of mdDirs) {
  const dirPath = resolve(ROOT, 'content', dir)
  if (existsSync(dirPath)) mdCount++
}

if (existsSync(resolve(ROOT, 'content', 'about.md'))) mdCount++

const totalExpected = jsonFiles.length + mdDirs.length + 1
const totalFound = validCount + mdCount

if (totalFound === totalExpected) {
  pass(`All ${totalExpected} content files/directories found`)
} else {
  // Individual errors already reported
}

// ---------------------------------------------------------------------------
// 5. Institution logo files check
// ---------------------------------------------------------------------------

const logos = readJson('content/logos.json')
if (logos) {
  const entries = Object.entries(logos)
  const missing = []

  for (const [name, logoPath] of entries) {
    if (logoPath === '/images/logos/placeholder.png' || logoPath === '/images/logos/placeholder.svg') {
      missing.push(name)
      continue
    }
    const absPath = resolve(ROOT, 'content', logoPath.replace(/^\//, ''))
    if (!existsSync(absPath)) {
      missing.push(name)
    }
  }

  if (missing.length === 0) {
    pass('All institution logos have matching files')
  } else if (missing.length === entries.length) {
    warn(`All ${missing.length} institutions use placeholder logos`)
  } else {
    warn(`${missing.length} institution(s) missing logo files (using placeholder)`)
  }
}

// ---------------------------------------------------------------------------
// 6. Project preview image files check
// ---------------------------------------------------------------------------

const projectDir = resolve(ROOT, 'content', 'projects')
if (existsSync(projectDir)) {
  const projectFiles = readdirSync(projectDir).filter((file) => file.endsWith('.md'))
  const previewImages = []
  const invalidPreviews = []

  for (const file of projectFiles) {
    const { data } = matter(readFileSync(resolve(projectDir, file), 'utf-8'))
    if (!data.featuredImage) continue

    previewImages.push(data.featuredImage)
    if (typeof data.featuredImage !== 'string' || !data.featuredImage.startsWith('/images/')) {
      invalidPreviews.push(`${file}: featuredImage must start with /images/`)
      continue
    }

    const previewPath = resolve(ROOT, 'content', data.featuredImage.replace(/^\//, ''))
    if (!existsSync(previewPath)) invalidPreviews.push(`${file}: missing ${data.featuredImage}`)
  }

  if (invalidPreviews.length === 0) pass(`All ${previewImages.length} project preview image(s) valid`)
  else invalidPreviews.forEach(fail)
}

// ---------------------------------------------------------------------------
// 7. Selected publication IDs check
// ---------------------------------------------------------------------------

if (site?.selectedPublicationIds?.length > 0) {
  // Read publication IDs from Markdown frontmatter
  const pubDir = resolve(ROOT, 'content', 'publications')
  if (!existsSync(pubDir)) {
    warn('content/publications/ not found — skipping publication ID check')
  } else {
    const allIds = new Set()
    const pubFiles = readdirSync(pubDir).filter(f => f.endsWith('.md'))
    for (const file of pubFiles) {
      const content = readFileSync(resolve(pubDir, file), 'utf-8')
      const idMatch = content.match(/^id:\s*(.+)$/m)
      if (idMatch) allIds.add(idMatch[1].trim())
    }

    const invalid = site.selectedPublicationIds.filter((id) => !allIds.has(id))

    if (invalid.length === 0) {
      pass(`All ${site.selectedPublicationIds.length} selected publication ID(s) valid`)
    } else {
      fail(
        `Invalid selectedPublicationIds: ${invalid.join(', ')}\n  Available IDs: ${[...allIds].join(', ')}`
      )
    }
  }
} else {
  pass('No selectedPublicationIds configured (none to validate)')
}

// ---------------------------------------------------------------------------
// 8. Downloadable CV and benchmark targets
// ---------------------------------------------------------------------------

const cv = readJson('content/cv.json')
if (cv?.available) {
  const cvPath = resolve(ROOT, 'public', cv.file)
  if (existsSync(cvPath)) pass(`CV file found: public/${cv.file}`)
  else fail(`CV is marked available but file is missing: public/${cv.file}`)
}

const benchmarks = readJson('content/benchmarks.json')
if (benchmarks?.items && Array.isArray(benchmarks.items)) {
  const missingTargets = benchmarks.items
    .filter((item) => !item.file || !existsSync(resolve(ROOT, 'public', item.file)))
    .map((item) => item.file || item.id || '<unknown>')

  if (missingTargets.length === 0) {
    pass(`All ${benchmarks.items.length} benchmark target(s) found`)
  } else {
    fail(`Missing benchmark target(s): ${missingTargets.join(', ')}`)
  }
}

// ---------------------------------------------------------------------------
// 9. Project documentation structure
// ---------------------------------------------------------------------------

try {
  const projectDocs = loadProjectDocs(ROOT)
  const chapterCount = projectDocs.reduce((total, project) => total + project.chapters.length, 0)
  pass(`${projectDocs.length} project documentation set(s), ${chapterCount} chapter(s) valid`)
} catch (error) {
  fail(error.message)
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('')
if (errors > 0) {
  console.log(`\x1b[31mValidation failed with ${errors} error(s) and ${warnings} warning(s)\x1b[0m`)
  process.exit(1)
} else if (warnings > 0) {
  console.log(`\x1b[33mValidation passed with ${warnings} warning(s)\x1b[0m`)
  process.exit(0)
} else {
  console.log(`\x1b[32mAll checks passed!\x1b[0m`)
  process.exit(0)
}
