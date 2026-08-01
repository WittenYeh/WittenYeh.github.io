import { Box, Container, VStack, HStack, Text, Heading, Flex, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'

/** Parse **bold** markers in text */
const renderBoldText = (text: string, color: string, boldColor: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text as="span" key={i} fontWeight="semibold" color={boldColor}>{part.slice(2, -2)}</Text>
    }
    return <Text as="span" key={i} color={color}>{part}</Text>
  })
}

const JourneySection: React.FC = () => {
  const { t } = useTranslation()
  const { experienceTimeline } = useLocalizedData()
  const textColor = useColorModeValue('gray.500', 'gray.400')
  const boldColor = useColorModeValue('gray.700', 'gray.200')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const lineColor = useColorModeValue('gray.200', 'gray.700')
  const dotBorder = useColorModeValue('gray.300', 'gray.600')
  const dotBg = useColorModeValue('white', 'gray.800')
  const tagBg = useColorModeValue('gray.100', 'gray.800')

  if (!experienceTimeline || experienceTimeline.length === 0) return null

  const formatPeriod = (start: string, end?: string) => {
    const formatDate = (date: string) => date === 'Present' ? date : date.replace('-', '.')
    return `${formatDate(start)} – ${formatDate(end || 'Present')}`
  }

  return (
    <Box w="full">
      <Container maxW={["full", "full", "7xl"]} px={[2, 4, 8]}>
        <Flex align="center" gap={3} w="full" mb={4}>
          <Box h="2px" w="20px" bg="cyan.400" borderRadius="full" flexShrink={0} />
          <Heading size={["sm", "md"]} fontWeight="semibold">{t('about.myJourney')}</Heading>
          <Box flex="1" h="1px" bg={lineColor} />
        </Flex>

        <Box w="full" position="relative">
          <Box position="absolute" left={["7px", "7px", "7px"]} top="12px" bottom="12px" w="1px" bg={lineColor} />

          <VStack spacing={0} align="stretch">
            {experienceTimeline.map((phase) => (
              <Flex key={`${phase.title}-${phase.start}`} gap={[3, 4]} align="start" py={3} position="relative">
                <Box flexShrink={0} mt="6px">
                  <Box
                    w="14px" h="14px" borderRadius="full" border="2px solid"
                    borderColor={phase.isCurrent ? 'cyan.400' : dotBorder}
                    bg={phase.isCurrent ? 'cyan.400' : dotBg}
                  />
                </Box>
                <Box flex={1} pb={2}>
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text fontSize="2xs" fontFamily="mono" color="cyan.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                      {formatPeriod(phase.start, phase.end)}
                    </Text>
                    <Text fontSize="2xs" color={useColorModeValue('gray.400', 'gray.600')}>/</Text>
                    <Text fontSize="2xs" fontFamily="mono" color={useColorModeValue('gray.400', 'gray.500')}>{phase.company}</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={1}>{phase.title}</Text>
                  <Text fontSize="xs" lineHeight="tall" mb={2}>
                    {renderBoldText(phase.summary || '', textColor, boldColor)}
                  </Text>
                  {(phase.location || phase.category) && (
                    <HStack spacing={1.5} flexWrap="wrap">
                      {[phase.location, phase.category].filter(Boolean).map((tag) => (
                        <Text key={tag} fontSize="2xs" fontFamily="mono" color={textColor} px={1.5} py={0.5} bg={tagBg} borderRadius="sm">
                          {tag}
                        </Text>
                      ))}
                    </HStack>
                  )}
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default JourneySection
