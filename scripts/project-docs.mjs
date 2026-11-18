import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const cacheDirectory = (root) => resolve(root, '.cache/project-docs')

export function readProjectConfigs(root) {
  const directory = resolve(root, 'content/project-docs')
  if (!existsSync(directory)) return []
  const slugs = new Set()
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => readdirSync(resolve(directory, entry.name)).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map(({ name }) => {
      const path = resolve(directory, name, 'project.json')
      const config = JSON.parse(readFileSync(path, 'utf8'))
      if (name !== config.slug || !config.title?.trim() || !config.description?.trim()) {
        throw new Error(`${path}: provide a matching slug, title and description`)
      }
      if (config.legacySlugs !== undefined && !Array.isArray(config.legacySlugs)) {
        throw new Error(`${path}: legacySlugs must be an array`)
      }
      for (const slug of [config.slug, ...(config.legacySlugs ?? [])]) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)) {
          throw new Error(`${path}: invalid or duplicate project slug ${slug}`)
        }
        slugs.add(slug)
      }
      if (!/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(config.repository)) {
        throw new Error(`${path}: repository must be a GitHub repository URL`)
      }
      const card = config.card
      if (!['robotics', 'nlp', 'web-app', 'data', 'tooling', 'healthcare'].includes(card?.category)
        || !Array.isArray(card.tags) || !card.tags.every((tag) => typeof tag === 'string')) {
        throw new Error(`${path}: card requires a valid category and an array of tags`)
      }
      const images = Object.values(config.imageAssets ?? {})
      if (card.featuredImage) images.push(card.featuredImage)
      for (const image of images) {
        if (typeof image !== 'string' || !image.startsWith('/images/') || image.split('/').includes('..')
          || !existsSync(resolve(root, 'content', image.slice(1)))) {
          throw new Error(`${path}: missing local project image ${image}`)
        }
      }
      return config
    })
}

export function loadProjectDocs(root) {
  return JSON.parse(readFileSync(resolve(cacheDirectory(root), 'site.json'), 'utf8'))
}

export function projectCard(project) {
  const overview = project.chapters.find((page) => page.slug === '')
  const docs = project.chapters.find((page) => page.slug !== '')
  const extraLinks = []
  if (overview) extraLinks.push({ label: 'Overview', url: `/${overview.route}/` })
  if (docs) extraLinks.push({ label: 'Documentation', url: `/${docs.route}/` })
  extraLinks.push({ label: 'GitHub', url: project.repository }, ...(project.card.extraLinks ?? []))
  return { summary: project.description, ...project.card, title: project.title, extraLinks }
}
