import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveProjectDocMetadataRoute } from '@/data/projectDocMetadata'

const baseUrl = 'https://wittenyeh.github.io'

const routeMetadata: Record<string, { title: string; description: string; index: boolean }> = {
  '/': {
    title: 'Weitang Ye | PhD Student at NTU',
    description: 'Weitang Ye is a PhD student at Nanyang Technological University researching vector search, multi-vector retrieval, and high-performance data systems.',
    index: true,
  },
  '/publications': {
    title: 'Publications | Weitang Ye',
    description: 'Research publications by Weitang Ye on database systems, vector search, and high-performance data systems.',
    index: true,
  },
  '/benchmarks': {
    title: 'GDSE Benchmarks | Weitang Ye',
    description: 'Interactive latency results for the Graph Database Storage Engine benchmark, covering structural workloads and batch-size sensitivity.',
    index: true,
  },
  '/projects': {
    title: 'Projects | Weitang Ye',
    description: 'Research and systems projects by Weitang Ye.',
    index: true,
  },
  '/cv': {
    title: 'CV | Weitang Ye',
    description: 'Curriculum vitae of Weitang Ye.',
    index: false,
  },
}

const setMeta = (selector: string, attribute: string, value: string) => {
  document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute(attribute, value)
}

const RouteMetadata: React.FC = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
    const projectDocRoute = resolveProjectDocMetadataRoute(normalizedPath)
    const projectDocMetadata = projectDocRoute ? {
      title: projectDocRoute.chapterIndex === 0
        ? `${projectDocRoute.project.title} Documentation | Weitang Ye`
        : `${projectDocRoute.chapter.title} | ${projectDocRoute.project.title} | Weitang Ye`,
      description: projectDocRoute.chapter.description,
      index: !projectDocRoute.isLegacy,
    } : undefined
    const metadata = routeMetadata[normalizedPath] ?? projectDocMetadata ?? {
      title: 'Page Not Found | Weitang Ye',
      description: 'The requested page could not be found.',
      index: false,
    }
    const canonicalPath = projectDocRoute
      ? (projectDocRoute.chapterIndex === 0
          ? `/projects/${projectDocRoute.project.slug}`
          : `/projects/${projectDocRoute.project.slug}/${projectDocRoute.chapter.slug}`)
      : normalizedPath
    const canonicalUrl = canonicalPath === '/' ? `${baseUrl}/` : `${baseUrl}${canonicalPath}/`

    document.title = metadata.title
    setMeta('meta[name="description"]', 'content', metadata.description)
    setMeta('meta[name="robots"]', 'content', metadata.index ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow')
    setMeta('meta[property="og:type"]', 'content', normalizedPath === '/' ? 'profile' : 'website')
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:title"]', 'content', metadata.title)
    setMeta('meta[property="og:description"]', 'content', metadata.description)
    setMeta('meta[name="twitter:title"]', 'content', metadata.title)
    setMeta('meta[name="twitter:description"]', 'content', metadata.description)
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  }, [pathname])

  return null
}

export default RouteMetadata
