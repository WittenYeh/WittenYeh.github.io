import { Badge, Box, Button, Heading, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import data from '@content/benchmarks.json'
import { withBase } from '@/utils/asset'
import AcademicPageShell from './AcademicPageShell'

const Benchmarks = () => {
  const { t } = useTranslation()

  return (
    <AcademicPageShell
      title={data.title}
      command="ls public/gdse-benchmarks"
      status={`${data.items.length} ${t('benchmarks.reports')}`}
    >
      <VStack align="stretch" spacing={7}>
        <Box>
          <Heading size="lg" mb={2}>{data.title}</Heading>
          <Text color="var(--secondary-text)" maxW="4xl">{data.description}</Text>
          <HStack mt={4} spacing={2} flexWrap="wrap">
            {data.systems.map(system => <Badge key={system} colorScheme="cyan">{system}</Badge>)}
          </HStack>
        </Box>

        <SimpleGrid columns={[1, 1, 2]} spacing={4}>
          {data.items.map(item => (
            <Box
              key={item.id}
              p={[4, 5]}
              border="1px solid"
              borderColor="var(--border-color)"
              borderRadius="md"
              bg="var(--card-bg)"
              transition="all 0.2s"
              _hover={{ borderColor: 'cyan.400', transform: 'translateY(-2px)' }}
            >
              <HStack justify="space-between" align="start" mb={3}>
                <Badge colorScheme={item.kind === 'performance' ? 'blue' : 'purple'}>{t(`benchmarks.${item.kind}`)}</Badge>
                <Text fontSize="2xs" color="var(--secondary-text)">{data.updated}</Text>
              </HStack>
              <Heading size="sm" mb={2}>{item.title}</Heading>
              <Text fontSize="xs" color="var(--secondary-text)" mb={4}>{item.dataset}</Text>
              <Button
                as="a"
                href={withBase(item.file)}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="outline"
              >
                {t('benchmarks.open')} →
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </AcademicPageShell>
  )
}

export default Benchmarks
