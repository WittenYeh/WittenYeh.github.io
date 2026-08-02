import {
  projectDocConfigs,
  type ProjectDocChapterDefinition,
  type ProjectDocConfig,
} from './projectDocMetadata'

export type {
  ProjectDocBadge,
  ProjectDocAsciiHero,
  ProjectDocChapterDefinition,
  ProjectDocConfig,
} from './projectDocMetadata'

export interface ProjectDocChapter extends ProjectDocChapterDefinition {
  body: string
  path: string
}

export interface ProjectDoc extends Omit<ProjectDocConfig, 'chapters'> {
  chapters: ProjectDocChapter[]
}

type MarkdownModule = Record<string, unknown> & { body: string }

const chapterModules = import.meta.glob('/content/project-docs/*/*.md', {
  eager: true,
  import: 'default',
}) as Record<string, MarkdownModule>

export const projectDocs: ProjectDoc[] = projectDocConfigs.map((config) => {
  const directory = `/content/project-docs/${config.slug}`
  const chapters = config.chapters.map((chapter, index) => {
    const modulePath = `${directory}/${chapter.file}`
    const markdown = chapterModules[modulePath]
    if (!markdown) throw new Error(`Missing project docs chapter: ${modulePath}`)
    return {
      ...chapter,
      body: markdown.body,
      path: index === 0
        ? `/projects/${config.slug}`
        : `/projects/${config.slug}/${chapter.slug}`,
    }
  })

  return { ...config, chapters }
})

export const getProjectDocs = (slug: string) =>
  projectDocs.find((project) => project.slug === slug || project.legacySlugs?.includes(slug))
