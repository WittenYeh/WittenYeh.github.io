import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, type ReactNode } from 'react'
import { siteConfig } from './site.config'
import { getTemplate, getResolvedSlots, SlotProvider } from './templates'
import RouteMetadata from './components/RouteMetadata'
import { RouteErrorBoundary, RouteLoading } from './components/RouteFeedback'
import './styles/globals.css'
import './i18n'

const RouteGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()

  return (
    <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<RouteLoading />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  )
}

function App() {
  const features = siteConfig.features as Record<string, boolean>
  const cfg = siteConfig as Record<string, unknown>
  const template = getTemplate(cfg.template as string | undefined)
  const slots = getResolvedSlots(template, cfg.components as Record<string, string> | undefined)

  const { layout: TemplateLayout, pages, theme } = template

  return (
    <>
      <ColorModeScript initialColorMode="dark" />
      <ChakraProvider theme={theme}>
        <SlotProvider slots={slots}>
          <Router basename={import.meta.env.BASE_URL}>
            <RouteMetadata />
            <TemplateLayout>
              <RouteGuard>
                <Routes>
                  <Route path="/" element={<pages.home />} />
                  {features.research && pages.research && (
                    <Route path="/research" element={<pages.research />} />
                  )}
                  {features.publications && pages.publications && (
                    <Route path="/publications" element={<pages.publications />} />
                  )}
                  {features.projects && pages.projects && (
                    <Route path="/projects" element={<pages.projects />} />
                  )}
                  {features.projects && pages.projectDocs && (
                    <Route path="/projects/:projectSlug/:chapterSlug?" element={<pages.projectDocs />} />
                  )}
                  {features.articles && pages.articles && (
                    <Route path="/articles" element={<pages.articles />} />
                  )}
                  {features.experience && pages.experience && (
                    <Route path="/experience" element={<pages.experience />} />
                  )}
                  {features.news && pages.news && (
                    <Route path="/news" element={<pages.news />} />
                  )}
                  {features.cv && pages.cv && (
                    <Route path="/cv" element={<pages.cv />} />
                  )}
                  {features.benchmarks && pages.benchmarks && (
                    <Route path="/benchmarks" element={<pages.benchmarks />} />
                  )}
                  {features.guide !== false && pages.guide && (
                    <Route path="/guide" element={<pages.guide />} />
                  )}
                  {features.guide !== false && pages.guideDocs && (
                    <Route path="/docs" element={<pages.guideDocs />} />
                  )}
                </Routes>
              </RouteGuard>
            </TemplateLayout>
          </Router>
        </SlotProvider>
      </ChakraProvider>
    </>
  )
}

export default App
