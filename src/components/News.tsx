import { Badge, Box, Heading, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import AcademicPageShell from './AcademicPageShell'

const News = () => {
  const { t } = useTranslation()
  const { news } = useLocalizedData()
  const sortedNews = [...news].sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))

  return (
    <AcademicPageShell title={t('news.title')} command="tail -n +1 content/news.json" status={`${news.length} ${t('news.items')}`}>
      <VStack align="stretch" spacing={5}>
        <Heading size="lg">{t('news.title')}</Heading>
        {sortedNews.length === 0 ? (
          <Text color="var(--secondary-text)">{t('common.contentPending')}</Text>
        ) : sortedNews.map((item, index) => (
          <Box key={`${item.sortDate || item.date}-${index}`} p={5} border="1px solid" borderColor="var(--border-color)" borderRadius="md" bg="var(--card-bg)">
            <HStack spacing={3} mb={2} flexWrap="wrap">
              <Text fontSize="xs" color="var(--secondary-text)">{item.date}</Text>
              {item.badge && <Badge colorScheme="cyan">{item.badge}</Badge>}
            </HStack>
            <Heading size="sm" mb={2}>{item.title}</Heading>
            <Text fontSize="sm">{item.description}</Text>
            {item.links?.length > 0 && (
              <HStack mt={3} spacing={4} flexWrap="wrap">
                {item.links.map(link => (
                  <Link key={`${link.text}-${link.url}`} href={link.url} isExternal fontSize="xs">{link.text} →</Link>
                ))}
              </HStack>
            )}
          </Box>
        ))}
      </VStack>
    </AcademicPageShell>
  )
}

export default News
