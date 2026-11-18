/**
 * Vite plugin: transforms .md files with YAML frontmatter into JS modules.
 *
 * Input:  content/publications/paper.md
 * Output: { ...frontmatter, body: '<p>rendered HTML</p>' }
 *
 * Usage in code:
 *   import paper from '@content/publications/paper.md'
 *   // paper.title, paper.authors, paper.body (HTML string)
 */

import matter from 'gray-matter'
import { markdown, addCodeLanguageLabels } from '../scripts/markdown.mjs'
import type { Plugin } from 'vite'

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(flattenText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(flattenText).join(' ')
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const buildContentIndex = (data: Record<string, unknown>, id: string) => {
  if (id.includes('/content/publications/')) {
    const {
      id: publicationId,
      title,
      authors,
      venue,
      venueType,
      year,
      status,
      keywords,
      links,
      isFirstAuthor,
      isCorrespondingAuthor,
    } = data
    const searchText = flattenText({ title, authors, venue, keywords })
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    return {
      id: publicationId,
      title,
      authors,
      venue,
      venueType,
      year,
      status,
      keywords,
      links,
      isFirstAuthor,
      isCorrespondingAuthor,
      searchText,
    }
  }

  return { searchText: flattenText(data).replace(/\s+/g, ' ').trim().toLowerCase() }
}

export default function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    transform(code: string, id: string) {
      const queryIndex = id.indexOf('?')
      const fileId = queryIndex >= 0 ? id.slice(0, queryIndex) : id
      const query = queryIndex >= 0 ? id.slice(queryIndex + 1) : ''
      if (!fileId.endsWith('.md')) return null

      const { data, content } = matter(code)
      if (new URLSearchParams(query).has('content-index')) {
        return {
          code: `export default ${JSON.stringify(buildContentIndex(data, fileId))}`,
          map: null,
        }
      }

      const body = addCodeLanguageLabels(markdown.parse(content.trim()) as string)

      const result = { ...data, body }
      return {
        code: `export default ${JSON.stringify(result)}`,
        map: null,
      }
    },
  }
}
