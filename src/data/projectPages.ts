import index from 'virtual:project-index'
import type { ProjectItem, ProjectLink } from '@/types'

export interface ProjectIndexItem {
  sourcePath: string
  id: string
  title: string
  category: ProjectItem['category']
  date?: string
  role?: ProjectItem['role']
  featured?: boolean
  searchText: string
  extraLinks: ProjectLink[]
}

export const projectIndex = index

interface ProjectFile {
  title: string
  description: string
  card: Omit<ProjectItem, 'title' | 'summary'> & { summary?: string }
}

const loaders = import.meta.glob<ProjectFile>('/content/project-docs/*/project.json', { import: 'default' })

export const loadProjectPage = (entries: readonly ProjectIndexItem[]) =>
  Promise.all(entries.map(async (entry) => {
    const config = await loaders[entry.sourcePath]()
    return {
      summary: config.description,
      ...config.card,
      id: entry.id,
      title: config.title,
      extraLinks: entry.extraLinks,
    }
  }))
