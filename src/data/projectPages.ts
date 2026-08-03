import type { ProjectItem } from '@/types'

interface MarkdownModule {
  default: Record<string, unknown> & { body?: string }
}

export interface ProjectIndexItem {
  sourcePath: string
  id: string
  title: string
  category: ProjectItem['category']
  date?: string
  role?: ProjectItem['role']
  featured?: boolean
  searchText: string
}

export type LoadedProjectItem = ProjectItem & { id: string }

const projectIndexModules = import.meta.glob('/content/projects/*.md', {
  eager: true,
  query: '?content-index',
}) as Record<string, { default: Omit<ProjectIndexItem, 'sourcePath' | 'id'> }>

const projectLoaders = import.meta.glob('/content/projects/*.md') as Record<
  string,
  () => Promise<MarkdownModule>
>

export const projectIndex: ProjectIndexItem[] = Object.entries(projectIndexModules)
  .map(([sourcePath, module]) => ({
    ...module.default,
    sourcePath,
    id: `project:${sourcePath}`,
  }))

const projectCache = new Map<string, Promise<LoadedProjectItem>>()
const htmlToText = (html: string): string => html.replace(/<[^>]+>/g, '').trim()

function loadProject(entry: ProjectIndexItem): Promise<LoadedProjectItem> {
  const cached = projectCache.get(entry.sourcePath)
  if (cached) return cached

  const loader = projectLoaders[entry.sourcePath]
  if (!loader) return Promise.reject(new Error(`Missing project content: ${entry.sourcePath}`))

  const promise = loader()
    .then(({ default: raw }) => {
      const { body, ...frontmatter } = raw
      const fallbackSummary = htmlToText(typeof body === 'string' ? body : '')
      return {
        summary: fallbackSummary,
        ...frontmatter,
        id: entry.id,
      } as unknown as LoadedProjectItem
    })
    .catch((error) => {
      projectCache.delete(entry.sourcePath)
      throw error
    })
  projectCache.set(entry.sourcePath, promise)
  return promise
}

export const loadProjectPage = (entries: readonly ProjectIndexItem[]) =>
  Promise.all(entries.map(loadProject))
