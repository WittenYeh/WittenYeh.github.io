// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import matter from 'gray-matter'

const root = resolve(import.meta.dirname, '..')
const site = JSON.parse(readFileSync(resolve(root, 'content/site.json'), 'utf8'))

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
