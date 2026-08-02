import { existsSync, readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import matter from 'gray-matter'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const requireString = (value, field, source) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${source}: ${field} must be a non-empty string`)
  }
}

export const projectDocRoute = (project, chapter, index) =>
  index === 0
    ? `projects/${project.slug}`
    : `projects/${project.slug}/${chapter.slug}`

export const loadProjectDocs = (root) => {
  const docsRoot = resolve(root, 'content/project-docs')
  if (!existsSync(docsRoot)) return []

  return readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const projectDir = resolve(docsRoot, entry.name)
      const configPath = resolve(projectDir, 'project.json')
      if (!existsSync(configPath)) {
        throw new Error(`content/project-docs/${entry.name}/project.json is missing`)
      }

      let config
      try {
        config = JSON.parse(readFileSync(configPath, 'utf8'))
      } catch (error) {
        throw new Error(`Invalid project docs config ${configPath}: ${error.message}`)
      }

      requireString(config.slug, 'slug', configPath)
      requireString(config.title, 'title', configPath)
      requireString(config.description, 'description', configPath)
      if (config.slug !== entry.name) {
        throw new Error(`${configPath}: slug must match its directory name`)
      }
      if (!slugPattern.test(config.slug)) {
        throw new Error(`${configPath}: slug must use lowercase kebab-case`)
      }
      if (!Array.isArray(config.chapters) || config.chapters.length === 0) {
        throw new Error(`${configPath}: chapters must be a non-empty array`)
      }
      if (config.hero !== undefined) {
        if (config.hero?.type !== 'ascii') {
          throw new Error(`${configPath}: hero.type must be "ascii"`)
        }
        if (!Array.isArray(config.hero.lines) || config.hero.lines.length === 0
          || config.hero.lines.some((line) => typeof line !== 'string' || !line)) {
          throw new Error(`${configPath}: hero.lines must be a non-empty string array`)
        }
      }

      const slugs = new Set()
      const files = new Set()
      const chapters = config.chapters.map((chapter, index) => {
        const source = `${configPath} chapter ${index + 1}`
        requireString(chapter.slug, 'slug', source)
        requireString(chapter.title, 'title', source)
        requireString(chapter.description, 'description', source)
        requireString(chapter.file, 'file', source)
        if (chapter.hideTitle !== undefined && typeof chapter.hideTitle !== 'boolean') {
          throw new Error(`${source}: hideTitle must be a boolean`)
        }
        if (chapter.hideTitle && !config.hero) {
          throw new Error(`${source}: hideTitle requires a project hero`)
        }
        if (!slugPattern.test(chapter.slug)) {
          throw new Error(`${source}: slug must use lowercase kebab-case`)
        }
        if (slugs.has(chapter.slug)) throw new Error(`${source}: duplicate slug ${chapter.slug}`)
        if (files.has(chapter.file)) throw new Error(`${source}: duplicate file ${chapter.file}`)
        if (!/^[a-z0-9][a-z0-9-]*\.md$/.test(chapter.file)) {
          throw new Error(`${source}: file must be a local kebab-case Markdown filename`)
        }

        const chapterPath = resolve(projectDir, chapter.file)
        if (!existsSync(chapterPath)) throw new Error(`${source}: missing ${chapter.file}`)
        const { content } = matter(readFileSync(chapterPath, 'utf8'))
        if (!content.trim()) throw new Error(`${source}: ${chapter.file} has no content`)

        slugs.add(chapter.slug)
        files.add(chapter.file)
        return {
          ...chapter,
          markdown: content.trim(),
          route: projectDocRoute(config, chapter, index),
        }
      })

      const unlistedMarkdown = readdirSync(projectDir)
        .filter((file) => file.endsWith('.md') && !files.has(file))
      if (unlistedMarkdown.length > 0) {
        throw new Error(`${configPath}: unlisted Markdown file(s): ${unlistedMarkdown.join(', ')}`)
      }

      return { ...config, chapters }
    })
}
