import projects from 'virtual:project-doc-metadata'

export interface ProjectDocBadge {
  label: string
  colorScheme?: string
}

export interface ProjectDocChapterDefinition {
  slug: string
  title: string
  shortTitle?: string
  file: string
  route: string
  headingId?: string
  description: string
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
  chapters: ProjectDocChapterDefinition[]
}

export const projectDocConfigs = projects

export const getProjectDocConfig = (slug: string) =>
  projectDocConfigs.find((project) => project.slug === slug || project.legacySlugs?.includes(slug))

export const resolveProjectDocMetadataRoute = (pathname: string) => {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (parts[0] !== 'projects' || parts.length < 2) return undefined

  const project = getProjectDocConfig(parts[1])
  if (!project) return undefined

  const slug = parts.slice(2).join('/')
  const chapter = project.chapters.find((item) => item.slug === slug)
  if (!chapter) return undefined

  return {
    project,
    chapter,
    isLegacy: parts[1] !== project.slug,
  }
}
