export interface ProjectDocBadge {
  label: string
  colorScheme?: string
}

export interface ProjectDocChapterDefinition {
  slug: string
  title: string
  shortTitle?: string
  file: string
  description: string
  hideTitle?: boolean
}

export interface ProjectDocAsciiHero {
  type: 'ascii'
  ariaLabel?: string
  lines: string[]
}

export interface ProjectDocConfig {
  slug: string
  legacySlugs?: string[]
  title: string
  description: string
  repository?: string
  repositoryLabel?: string
  updated?: string
  badges?: ProjectDocBadge[]
  hero?: ProjectDocAsciiHero
  chapters: ProjectDocChapterDefinition[]
}

const configModules = import.meta.glob('/content/project-docs/*/project.json', {
  eager: true,
  import: 'default',
}) as Record<string, ProjectDocConfig>

export const projectDocConfigs: ProjectDocConfig[] = Object.entries(configModules).map(([configPath, config]) => {
  const directory = configPath.slice(0, -'/project.json'.length)
  const directorySlug = directory.split('/').pop()
  if (directorySlug !== config.slug) {
    throw new Error(`Project docs slug "${config.slug}" must match directory "${directorySlug}"`)
  }
  if (config.chapters.length === 0) {
    throw new Error(`Project docs "${config.slug}" must define at least one chapter`)
  }
  return config
})

export const getProjectDocConfig = (slug: string) =>
  projectDocConfigs.find((project) => project.slug === slug || project.legacySlugs?.includes(slug))

export const resolveProjectDocMetadataRoute = (pathname: string) => {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (parts[0] !== 'projects' || parts.length < 2 || parts.length > 3) return undefined

  const project = getProjectDocConfig(parts[1])
  if (!project) return undefined

  const chapterIndex = parts[2]
    ? project.chapters.findIndex((chapter) => chapter.slug === parts[2])
    : 0
  if (chapterIndex < 0) return undefined

  return {
    project,
    chapter: project.chapters[chapterIndex],
    chapterIndex,
    isLegacy: parts[1] !== project.slug,
  }
}
