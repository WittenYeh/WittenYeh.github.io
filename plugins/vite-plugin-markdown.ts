/**
 * Vite plugin: transforms .md files with YAML frontmatter into JS modules.
 *
 * Input:  content/projects/my-project.md
 * Output: { ...frontmatter, body: '<p>rendered HTML</p>' }
 *
 * Usage in code:
 *   import project from '@content/projects/my-project.md'
 *   // project.title, project.tags, project.body (HTML string)
 */

import matter from 'gray-matter'
import hljs from 'highlight.js'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import type { Plugin } from 'vite'

const terminalBlockLanguages = new Set(['command', 'output'])

const markdown = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, language) {
      // These pseudo-languages use ProjectDocs' paired terminal presentation.
      if (terminalBlockLanguages.has(language)) return code
      const resolvedLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      return hljs.highlight(code, {
        language: resolvedLanguage,
        ignoreIllegals: true,
      }).value
    },
  }),
)

const addCodeLanguageLabels = (html: string): string =>
  html.replace(
    /<pre><code class="hljs language-([^"]+)">/g,
    (openingTag, language: string) => terminalBlockLanguages.has(language)
      ? openingTag
      : `<pre data-language="${language}"><code class="hljs language-${language}">`,
  )

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(flattenText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(flattenText).join(' ')
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const buildContentIndex = (data: Record<string, unknown>, content: string, id: string) => {
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

  if (id.includes('/content/projects/')) {
    const { title, category, date, role, featured } = data
    const searchSource = {
      title,
      tags: data.tags,
      summary: data.summary ?? content,
      highlights: data.highlights,
    }
    const searchText = flattenText(searchSource).replace(/\s+/g, ' ').trim().toLowerCase()
    return { title, category, date, role, featured, searchText }
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
          code: `export default ${JSON.stringify(buildContentIndex(data, content, fileId))}`,
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
