import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cacheDirectory, loadProjectDocs, projectCard } from '../scripts/project-docs.mjs'

export default function projectDocsPlugin() {
  const modules = new Map()
  const images = new Map()
  return {
    name: 'project-docs',
    configResolved({ root }) {
      const projects = loadProjectDocs(root)
      const metadata = []
      const bodies = {}
      const index = []
      for (const project of projects) {
        const { slug, legacySlugs, title, description, repository, repositoryLabel, badges, updated } = project
        const chapters = project.chapters.map(({ file, slug, route, title, shortTitle, description, headingId, body }) => {
          bodies[route] = body
          return { file, slug, route, title, shortTitle, description, headingId }
        })
        metadata.push({ slug, legacySlugs, title, description, repository, repositoryLabel, badges, updated, chapters })
        const card = projectCard(project)
        const { category, date, role, featured, extraLinks } = card
        const searchText = [title, ...card.tags, card.summary, ...(card.highlights ?? [])].join(' ').toLowerCase()
        const sourcePath = `/content/project-docs/${slug}/project.json`
        index.push({ id: slug, sourcePath, title, category, date, role, featured, extraLinks, searchText })
        for (const { url, sha } of project.assets) images.set(url, resolve(cacheDirectory(root), 'blobs', sha))
      }
      modules.set('virtual:project-doc-metadata', metadata)
      modules.set('virtual:project-doc-bodies', bodies)
      modules.set('virtual:project-index', index)
    },
    resolveId(id) {
      if (modules.has(id)) return '\0' + id
    },
    load(id) {
      if (id.startsWith('\0') && modules.has(id.slice(1))) {
        return `export default ${JSON.stringify(modules.get(id.slice(1)))}`
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        const file = images.get(path)
        if (!file) return next()
        const extension = path.split('.').pop()
        res.setHeader('Content-Type', `image/${extension === 'jpg' ? 'jpeg' : extension}`)
        res.end(readFileSync(file))
      })
    },
    generateBundle() {
      for (const [url, file] of images) {
        this.emitFile({ type: 'asset', fileName: url.slice(1), source: readFileSync(file) })
      }
    },
  }
}
