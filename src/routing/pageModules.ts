import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type PageModule = { default: ComponentType }
type PageKey =
  | 'publications'
  | 'research'
  | 'projects'
  | 'articles'
  | 'experience'
  | 'news'
  | 'cv'
  | 'benchmarks'
  | 'guide'
  | 'guideDocs'
  | 'projectDocs'

const pageLoaders: Record<PageKey, () => Promise<PageModule>> = {
  publications: () => import('../components/Publications'),
  research: () => import('../components/Research'),
  projects: () => import('../components/Projects'),
  articles: () => import('../components/Articles'),
  experience: () => import('../components/Experience'),
  news: () => import('../components/News'),
  cv: () => import('../components/Cv'),
  benchmarks: () => import('../components/Benchmarks'),
  guide: () => import('../components/GuideLanding'),
  guideDocs: () => import('../components/GuideDocs'),
  projectDocs: () => import('../components/ProjectDocs'),
}

const pagePromises = new Map<PageKey, Promise<PageModule>>()

function loadPage(key: PageKey): Promise<PageModule> {
  const cached = pagePromises.get(key)
  if (cached) return cached

  const promise = pageLoaders[key]().catch((error) => {
    pagePromises.delete(key)
    throw error
  })
  pagePromises.set(key, promise)
  return promise
}

function lazyPage(key: PageKey): LazyExoticComponent<ComponentType> {
  return lazy(() => loadPage(key))
}

function pageKeyForPath(path: string): PageKey | undefined {
  const normalized = path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/'
  if (normalized.startsWith('/projects/')) return 'projectDocs'

  const routeKeys: Record<string, PageKey> = {
    '/publications': 'publications',
    '/research': 'research',
    '/projects': 'projects',
    '/articles': 'articles',
    '/experience': 'experience',
    '/news': 'news',
    '/cv': 'cv',
    '/benchmarks': 'benchmarks',
    '/guide': 'guide',
    '/docs': 'guideDocs',
  }
  return routeKeys[normalized]
}

export function preloadRoute(path: string): void {
  const key = pageKeyForPath(path)
  if (key) void loadPage(key).catch(() => undefined)
}

export const PublicationsPage = lazyPage('publications')
export const ResearchPage = lazyPage('research')
export const ProjectsPage = lazyPage('projects')
export const ArticlesPage = lazyPage('articles')
export const ExperiencePage = lazyPage('experience')
export const NewsPage = lazyPage('news')
export const CvPage = lazyPage('cv')
export const BenchmarksPage = lazyPage('benchmarks')
export const GuideLandingPage = lazyPage('guide')
export const GuideDocsPage = lazyPage('guideDocs')
export const ProjectDocsPage = lazyPage('projectDocs')
