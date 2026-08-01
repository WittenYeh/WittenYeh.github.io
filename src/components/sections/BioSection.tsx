import { Box, Container, Text, Heading, Flex, Link, VStack, HStack, Image, SimpleGrid, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { withBase } from '@/utils/asset'

const BioSection: React.FC = () => {
  const { t } = useTranslation()
  const { about, research, experience, institutionLogos } = useLocalizedData()
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const lineColor = useColorModeValue('gray.200', 'gray.700')
  const cardBorder = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.50')
  const fallbackBg = useColorModeValue('blue.50', 'blue.900')

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

        <SimpleGrid columns={[1, 1, 2]} spacing={[5, 6, 8]} mt={[6, 7]} pt={[5, 6]} borderTop="1px dashed" borderColor={lineColor}>
          <VStack align="stretch" spacing={3}>
            <Heading size="xs" color={textColor} textTransform="uppercase" letterSpacing="wider" fontSize="2xs">
              Current Research
            </Heading>
            {research.currentResearch.map((item) => {
              const logo = institutionLogos[item.lab]
              return (
                <Link key={item.lab} href={item.link} isExternal _hover={{ textDecoration: 'none' }}>
                  <HStack
                    spacing={4}
                    p={3}
                    minH="88px"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={cardBorder}
                    borderRadius="md"
                    transition="all 0.2s"
                    _hover={{ bg: hoverBg, borderColor: 'cyan.500', transform: 'translateY(-1px)' }}
                  >
                    <Flex w="72px" h="58px" align="center" justify="center" flexShrink={0} overflow="hidden" borderRadius="sm">
                      {logo ? (
                        <Image src={withBase(logo)} alt={`${item.lab} logo`} w="full" h="full" objectFit="contain" />
                      ) : (
                        <Flex w="full" h="full" align="center" justify="center" bg={fallbackBg}>
                          <Text fontSize="xl">{item.emoji}</Text>
                        </Flex>
                      )}
                    </Flex>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" fontWeight="semibold" color={headingColor}>{item.lab}</Text>
                      <Text fontSize="xs" color={textColor} lineHeight="tall">{item.focus}</Text>
                      {item.advisor && <Text fontSize="2xs" color="cyan.400" fontFamily="mono">with {item.advisor}</Text>}
                    </VStack>
                  </HStack>
                </Link>
              )
            })}
          </VStack>

          <VStack align="stretch" spacing={3}>
            <Heading size="xs" color={textColor} textTransform="uppercase" letterSpacing="wider" fontSize="2xs">
              Education
            </Heading>
            {experience.education.courses.map((item) => {
              const logo = institutionLogos[item.institution]
              return (
                <HStack key={`${item.course}-${item.year}`} spacing={3} p={2.5} minH="64px" borderRadius="md">
                  <Flex w="44px" h="44px" align="center" justify="center" flexShrink={0} overflow="hidden">
                    {logo ? (
                      <Image src={withBase(logo)} alt={`${item.institution} crest`} w="full" h="full" objectFit="contain" />
                    ) : (
                      <Flex w="full" h="full" borderRadius="sm" bg={fallbackBg} align="center" justify="center">
                        <Text fontSize="sm" fontWeight="bold" color="blue.500">{item.institution.charAt(0)}</Text>
                      </Flex>
                    )}
                  </Flex>
                  <VStack align="start" spacing={0.5} flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color={headingColor}>{item.course}</Text>
                    <Text fontSize="2xs" color={textColor} lineHeight="short">{item.institution}</Text>
                    <Text fontSize="2xs" color="cyan.400" fontFamily="mono">{item.year}</Text>
                  </VStack>
                </HStack>
              )
            })}
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  )
}

export default BioSection
