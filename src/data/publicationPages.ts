import type { Publication } from '@/types'

interface MarkdownModule {
  default: Record<string, unknown> & { body?: string }
}

export interface PublicationIndexItem {
  sourcePath: string
  id: string
  title: string
  authors: string[]
  venue: string
  venueType: Publication['venueType']
  year: number
  status: Publication['status']
  keywords?: string[]
  links: Publication['links']
  isFirstAuthor?: boolean
  isCorrespondingAuthor?: boolean
  searchText: string
}

const publicationIndexModules = import.meta.glob('/content/publications/*.md', {
  eager: true,
  query: '?content-index',
}) as Record<string, { default: Omit<PublicationIndexItem, 'sourcePath'> }>

const publicationLoaders = import.meta.glob('/content/publications/*.md') as Record<
  string,
  () => Promise<MarkdownModule>
>

export const publicationIndex: PublicationIndexItem[] = Object.entries(publicationIndexModules)
  .map(([sourcePath, module]) => ({ ...module.default, sourcePath }))

const publicationCache = new Map<string, Promise<Publication>>()
const htmlToText = (html: string): string => html.replace(/<[^>]+>/g, '').trim()

function loadPublication(entry: PublicationIndexItem): Promise<Publication> {
  const cached = publicationCache.get(entry.sourcePath)
  if (cached) return cached

  const loader = publicationLoaders[entry.sourcePath]
  if (!loader) return Promise.reject(new Error(`Missing publication content: ${entry.sourcePath}`))

  const promise = loader()
    .then(({ default: raw }) => {
      const { body, ...frontmatter } = raw
      return {
        abstract: htmlToText(typeof body === 'string' ? body : ''),
        ...frontmatter,
      } as unknown as Publication
    })
    .catch((error) => {
      publicationCache.delete(entry.sourcePath)
      throw error
    })
  publicationCache.set(entry.sourcePath, promise)
  return promise
}

export const loadPublicationPage = (entries: readonly PublicationIndexItem[]) =>
  Promise.all(entries.map(loadPublication))

export const getPublicationStats = (entries: readonly PublicationIndexItem[]) => {
  const stats = {
    total: entries.length,
    byYear: {} as Record<number, number>,
    byVenue: {} as Record<string, number>,
    firstAuthor: 0,
    correspondingAuthor: 0,
    withCode: 0,
    withDataset: 0,
  }

  entries.forEach((publication) => {
    stats.byYear[publication.year] = (stats.byYear[publication.year] || 0) + 1
    stats.byVenue[publication.venueType] = (stats.byVenue[publication.venueType] || 0) + 1
    if (publication.isFirstAuthor) stats.firstAuthor++
    if (publication.isCorrespondingAuthor) stats.correspondingAuthor++
    if (publication.links.code) stats.withCode++
    if (publication.links.dataset) stats.withDataset++
  })
  return stats
}
