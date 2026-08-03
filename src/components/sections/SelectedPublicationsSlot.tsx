import { Box } from '@chakra-ui/react'
import { lazy, Suspense } from 'react'

const SelectedPublicationsSection = lazy(() => import('./SelectedPublicationsSection'))

const SelectedPublicationsSlot: React.FC = () => (
  <Suspense fallback={<Box minH="120px" aria-label="Loading selected publications" />}>
    <SelectedPublicationsSection />
  </Suspense>
)

export default SelectedPublicationsSlot
