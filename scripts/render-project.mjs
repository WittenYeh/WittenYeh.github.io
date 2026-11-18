import { createHash } from 'node:crypto'
import { basename, extname } from 'node:path/posix'
import { fromHtml } from 'hast-util-from-html'
import { defaultSchema, sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import { visit } from 'unist-util-visit'
import { markdown, addCodeBlockTools, addCodeLanguageLabels } from './markdown.mjs'

markdown.use(gfmHeadingId())

const markdownExtension = /\.(md|markdown)$/i
const rootReadme = /^readme\.(md|markdown)$/i
const isFile = ({ mode }) => mode === '100644' || mode === '100755'
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/')
const comparePaths = (a, b) => a < b ? -1 : a > b ? 1 : 0
const shortHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 12)
const schema = {
  ...defaultSchema,
  attributes: {
    a: ['href', 'title', 'id', 'name'], img: ['src', 'alt', 'title', 'width', 'height'],
    div: ['align'], p: ['align'], th: ['align', 'colSpan', 'rowSpan'], td: ['align', 'colSpan', 'rowSpan'],
    pre: [['dataLanguage', /^[\w.+#-]+$/]], ol: ['start'],
    code: [['className', 'hljs', /^language-/]], span: [['className', /^hljs-/, 'class_', 'function_', 'language_']],
    ...Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => [tag, ['id']])),
  },
}
// Match the sanitizer's prefix for local fragment links (including links across chapters).
const localHash = (hash) => hash.length > 1 ? '#' + schema.clobberPrefix + hash.slice(1) : hash
const textContent = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(textContent).join('')

export function discoverPages(config, entries) {
  const paths = entries.filter(isFile).map((entry) => entry.path).sort(comparePaths)
  const readme = paths.find((path) => path === 'README.md') ?? paths.find((path) => rootReadme.test(path))
  const docs = paths.filter((path) => path.startsWith('docs/') && markdownExtension.test(path))
  const index = docs.find((path) => /^docs\/index\.(md|markdown)$/i.test(path))
    ?? docs.find((path) => /^docs\/readme\.(md|markdown)$/i.test(path))
  const files = [readme, index, ...docs.filter((path) => path !== index)].filter(Boolean)
  const used = new Set()
  return files.map((file) => {
    const segments = file.replace(markdownExtension, '').split('/').map((part) =>
      part.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || shortHash(part))
    let slug = file === readme ? '' : segments.join('/')
    while (used.has(slug)) slug += `-${shortHash(file)}`
    used.add(slug)
    return { file, slug, route: [`projects/${config.slug}`, slug].filter(Boolean).join('/') }
  })
}

export async function renderProject(config, source, readBlob, imageUrl) {
  const entries = new Map(source.entries.map((entry) => [entry.path, entry]))
  const chapters = discoverPages(config, source.entries)
  const routes = new Map(chapters.map(({ file, route }) => [file, `/${route}/`]))
  for (const { file, route } of chapters) {
    const directory = file.split('/').slice(0, -1).join('/')
    if (/^(index|readme)\.(md|markdown)$/i.test(basename(file)) && !routes.has(directory)) {
      routes.set(directory, `/${route}/`)
    }
  }
  const rawBase = config.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')
  const resolveLink = (value, file, isImage) => {
    if (value.startsWith('#')) return localHash(value)
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value
    let url, path
    try {
      url = new URL(value, `https://repo.invalid/${encodePath(file)}`)
      if (url.origin !== 'https://repo.invalid') return undefined
      path = decodeURIComponent(url.pathname.slice(1)).replace(/\/$/, '')
    } catch { return undefined }
    const suffix = url.search + url.hash
    const entry = entries.get(path)
    if (isImage) {
      if (entry && isFile(entry) && /\.(?:png|jpe?g|gif|webp|avif)$/i.test(path)) {
        return imageUrl(entry) + suffix
      }
      return `${rawBase}/${source.revision}/${encodePath(path)}${suffix}`
    }
    if (routes.has(path)) return routes.get(path) + url.search + localHash(url.hash)
    const kind = !path || entry?.type === 'tree' || url.pathname.endsWith('/') ? 'tree' : 'blob'
    return `${config.repository}/${kind}/${source.revision}/${encodePath(path)}${suffix}`
  }

  for (const chapter of chapters) {
    const bytes = await readBlob(entries.get(chapter.file))
    // Frontmatter belongs to the upstream generator. Treat it strictly as text.
    const sourceText = bytes.toString('utf8').replace(/^\uFEFF/, '')
      .replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '')
    const tree = sanitize(fromHtml(addCodeLanguageLabels(markdown.parse(sourceText)), { fragment: true }), schema)
    let heading
    visit(tree, 'element', (node) => {
      if (!heading && node.tagName === 'h1') heading = node
      const attribute = node.tagName === 'a' ? 'href' : node.tagName === 'img' ? 'src' : undefined
      if (attribute && typeof node.properties[attribute] === 'string') {
        const url = resolveLink(node.properties[attribute], chapter.file, attribute === 'src')
        if (url) node.properties[attribute] = url
        else delete node.properties[attribute]
      }
    })
    const headingText = heading && textContent(heading)
    const name = basename(chapter.file, extname(chapter.file)).replace(/[-_]+/g, ' ')
    chapter.title = chapter.slug ? headingText || name : config.title
    chapter.shortTitle = chapter.slug ? chapter.title : 'Overview'
    chapter.description = chapter.slug ? `${chapter.title} — ${config.title} documentation.` : config.description

    if (heading && heading === tree.children.find((node) => node.type === 'element')
      && (chapter.slug || headingText === config.title)) {
      chapter.headingId = heading.properties.id
      tree.children.splice(tree.children.indexOf(heading), 1)
    }
    chapter.body = addCodeBlockTools(toHtml(tree))
  }
  return { ...config, revision: source.revision, updated: source.updated, chapters }
}
