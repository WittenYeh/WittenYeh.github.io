import { Box, Heading, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import AcademicPageShell from './AcademicPageShell'

const Research = () => {
  const { t } = useTranslation()
  const { research } = useLocalizedData()
  const items = research.currentResearch

  return (
    <AcademicPageShell
      title={t('research.title')}
      command="cat content/research.json"
      status={`${items.length} ${t('research.items')}`}
    >
      <VStack align="stretch" spacing={5}>
        <Box>
          <Heading size="lg" mb={2}>{t('research.title')}</Heading>
          <Text color="var(--secondary-text)">{t('research.description')}</Text>
        </Box>

        {items.length === 0 ? (
          <Text color="var(--secondary-text)">{t('common.contentPending')}</Text>
        ) : (
          <SimpleGrid columns={[1, 1, 2]} spacing={4}>
            {items.map((item, index) => (
              <Box
                key={`${item.lab}-${index}`}
                p={5}
                border="1px solid"
                borderColor="var(--border-color)"
                borderRadius="md"
                bg="var(--card-bg)"
              >
                <Text fontSize="2xl" mb={3}>{item.emoji || '⌁'}</Text>
                <Heading size="sm" mb={2}>{item.lab}</Heading>
                {item.advisor && <Text fontSize="xs" color="var(--secondary-text)" mb={2}>{item.advisor}</Text>}
                <Text fontSize="sm" mb={3}>{item.focus}</Text>
                {item.link && item.link !== '#' && (
                  <Link href={item.link} isExternal fontSize="xs">{t('research.visit')} →</Link>
                )}
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </AcademicPageShell>
  )
}

export default Research
