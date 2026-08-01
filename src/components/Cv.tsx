import { Button, Heading, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import cv from '@content/cv.json'
import { withBase } from '@/utils/asset'
import AcademicPageShell from './AcademicPageShell'

const Cv = () => {
  const { t } = useTranslation()

  return (
    <AcademicPageShell title={t('cv.title')} command="open public/cv.pdf" status={cv.available ? 'READY' : 'PENDING'}>
      <VStack align="start" spacing={4}>
        <Heading size="lg">{t('cv.title')}</Heading>
        <Text color="var(--secondary-text)">{cv.description || t('cv.description')}</Text>
        {cv.available ? (
          <Button as="a" href={withBase(cv.file)} target="_blank" rel="noopener noreferrer" colorScheme="cyan">
            {cv.label || t('cv.open')}
          </Button>
        ) : (
          <Text fontSize="sm" color="var(--secondary-text)">{t('cv.pendingHelp')}</Text>
        )}
      </VStack>
    </AcademicPageShell>
  )
}

export default Cv
