import { Box, Container, Text, Heading, Flex, Link, VStack, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'

const BioSection: React.FC = () => {
  const { t } = useTranslation()
  const { about } = useLocalizedData()
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const lineColor = useColorModeValue('gray.200', 'gray.700')

  if (!about.journey) return null

  const renderLinkedText = (text: string) => {
    const links = about.links ?? []
    if (links.length === 0) return text

    const escapedLabels = links
      .map(({ label }) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const parts = text.split(new RegExp(`(${escapedLabels})`, 'g'))

    return parts.map((part, index) => {
      const link = links.find(({ label }) => label === part)
      return link ? (
        <Link key={`${part}-${index}`} href={link.url} isExternal color="cyan.400" fontWeight="medium">
          {part}
        </Link>
      ) : part
    })
  }

  return (
    <Box w="full">
      <Container maxW={["full", "full", "7xl"]} px={[2, 4, 8]}>
        <Flex align="center" gap={3} mb={4}>
          <Box h="2px" w="20px" bg="cyan.400" borderRadius="full" flexShrink={0} />
          <Heading size="md" fontWeight="semibold">{t('about.bio', 'About')}</Heading>
          <Box flex="1" h="1px" bg={lineColor} />
        </Flex>
        <VStack align="stretch" spacing={3}>
          {about.journey.split(/\n+/).filter(Boolean).map((paragraph, index) => (
            <Text key={index} fontSize="sm" lineHeight="tall" color={textColor}>
              {renderLinkedText(paragraph)}
            </Text>
          ))}
        </VStack>
      </Container>
    </Box>
  )
}

export default BioSection
