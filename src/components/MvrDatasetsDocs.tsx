import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Link,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { FaArrowLeft, FaGithub } from 'react-icons/fa'
import mvrDatasetsDoc from '@content/mvr-datasets.md'
import { terminalPalette } from '@/config/theme'

const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'install', title: 'Install' },
  { id: 'create-an-embedded-dataset', title: 'Create an embedded dataset' },
  { id: 'create-a-raw-dataset', title: 'Create a raw dataset' },
  { id: 'read-a-dataset', title: 'Read a dataset' },
  { id: 'inspect-validate-and-distribute', title: 'Inspect, validate, and distribute' },
  { id: 'package-layout', title: 'Package layout' },
  { id: 'cli-reference', title: 'CLI reference' },
  { id: 'source-guide', title: 'Source guide' },
  { id: 'further-reference', title: 'Further reference' },
] as const

const documentationHtml = sections.reduce(
  (html, section) => html.replace(
    `<h2>${section.title}</h2>`,
    `<h2 id="${section.id}">${section.title}</h2>`,
  ),
  mvrDatasetsDoc.body,
)

const MvrDatasetsDocs: React.FC = () => {
  const isDark = useColorMode().colorMode === 'dark'
  const tc = terminalPalette.colors(isDark)
  const [activeSection, setActiveSection] = useState<string>(sections[0].id)

  useEffect(() => {
    const updateActiveSection = () => {
      let current: string = sections[0].id
      for (const section of sections) {
        const heading = document.getElementById(section.id)
        if (heading && heading.getBoundingClientRect().top <= 140) current = section.id
      }
      setActiveSection(current)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    return () => window.removeEventListener('scroll', updateActiveSection)
  }, [])

  return (
    <Box w="full" minH="100vh" bg={isDark ? 'gray.900' : 'gray.50'} py={[6, 8, 10]}>
      <Container maxW="7xl">
        <Link
          as={RouterLink}
          to="/projects"
          display="inline-flex"
          alignItems="center"
          gap={2}
          mb={5}
          color={tc.secondary}
          fontSize="xs"
          _hover={{ color: tc.command }}
        >
          <Icon as={FaArrowLeft} boxSize="10px" />
          Back to projects
        </Link>

        <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '220px minmax(0, 1fr)' }} gap={5} alignItems="start">
          <Box
            as="aside"
            aria-label="MVR-Datasets documentation sections"
            position={{ base: 'static', lg: 'sticky' }}
            top={{ lg: '92px' }}
            maxH={{ lg: 'calc(100vh - 112px)' }}
            overflowY={{ lg: 'auto' }}
            border="1px solid"
            borderTop="3px solid"
            borderColor={tc.border}
            borderTopColor={tc.command}
            borderRadius="md"
            bg={tc.bg}
          >
            <Box px={4} py={3} bg={tc.header} borderBottom="1px solid" borderColor={tc.border}>
              <Text fontSize="xs" fontWeight="bold" color={tc.text}>
                <Text as="span" color={tc.prompt}>$ </Text>
                tree docs
              </Text>
              <Text mt={1} fontSize="2xs" color={tc.muted}>On this page</Text>
            </Box>
            <Grid
              as="nav"
              templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: '1fr' }}
              gap={1}
              p={2}
            >
              {sections.map((section, index) => {
                const isActive = activeSection === section.id
                return (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    display="flex"
                    alignItems="flex-start"
                    gap={2}
                    px={2.5}
                    py={2}
                    borderRadius="sm"
                    borderLeft="2px solid"
                    borderLeftColor={isActive ? tc.command : 'transparent'}
                    bg={isActive ? tc.touchBar : 'transparent'}
                    color={isActive ? tc.text : tc.secondary}
                    fontSize="xs"
                    lineHeight="1.45"
                    _hover={{ color: tc.command, bg: tc.touchBar }}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Text as="span" color={isActive ? tc.prompt : tc.muted} flexShrink={0}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Text as="span">{section.title}</Text>
                  </Link>
                )
              })}
            </Grid>
          </Box>

          <Box
            minW={0}
            border="1px solid"
            borderColor={tc.border}
            borderRadius="md"
            overflow="hidden"
            bg={tc.bg}
            boxShadow={isDark ? '0 18px 48px rgba(0,0,0,0.28)' : '0 18px 48px rgba(43,54,72,0.10)'}
          >
            <Flex h="3px" aria-hidden="true">
              {terminalPalette.rainbow.map((color) => (
                <Box key={color} flex="1" bg={color} />
              ))}
            </Flex>

            <Flex
              px={[4, 6, 8]}
              py={3}
              align="center"
              justify="space-between"
              gap={4}
              bg={tc.header}
              borderBottom="1px solid"
              borderColor={tc.border}
            >
              <HStack spacing={2} fontSize="xs" color={tc.secondary} minW={0}>
                <Text color={tc.prompt}>researcher@projects</Text>
                <Text>:</Text>
                <Text color={tc.info} isTruncated>~/mvr-datasets/README.md</Text>
              </HStack>
              <HStack spacing={1.5} flexShrink={0}>
                <Box w="8px" h="8px" borderRadius="full" bg="#bf616a" />
                <Box w="8px" h="8px" borderRadius="full" bg="#ebcb8b" />
                <Box w="8px" h="8px" borderRadius="full" bg="#a3be8c" />
              </HStack>
            </Flex>

            <Box as="header" px={[5, 8, 12]} pt={[8, 10, 12]} pb={[7, 8, 10]} borderBottom="1px solid" borderColor={tc.border}>
              <HStack spacing={2} mb={4} flexWrap="wrap">
                <Badge colorScheme="green" variant="subtle">Format v1.0</Badge>
                <Badge colorScheme="blue" variant="subtle">Python 3.10+</Badge>
                <Badge colorScheme="purple" variant="subtle">Apache Arrow</Badge>
              </HStack>
              <Heading as="h1" fontSize={['2xl', '3xl', '4xl']} lineHeight="1.2" color={tc.text} mb={4}>
                MVR-Datasets
              </Heading>
              <Text maxW="760px" color={tc.secondary} fontSize={['sm', 'md']} lineHeight="1.8">
                A concise guide to creating, reading, validating, and packaging multi-vector retrieval datasets.
              </Text>
              <Link
                href="https://github.com/WittenYeh/MVR-Datasets"
                isExternal
                display="inline-flex"
                alignItems="center"
                gap={2}
                mt={5}
                fontSize="sm"
                color={tc.command}
              >
                <Icon as={FaGithub} /> View repository
              </Link>
            </Box>

            <Box
              as="article"
              px={[5, 8, 12]}
              py={[8, 10, 12]}
              color={tc.secondary}
              sx={{
                '& h2': {
                  color: tc.text,
                  fontSize: ['lg', 'xl'],
                  fontWeight: 700,
                  mt: 12,
                  mb: 4,
                  pb: 2,
                  borderBottom: `1px solid ${tc.border}`,
                  scrollMarginTop: '96px',
                },
                '& h2:first-of-type': { mt: 0 },
                '& p': { mb: 4, lineHeight: 1.85 },
                '& ul': { mb: 5, pl: 6 },
                '& li': { mb: 2, lineHeight: 1.75 },
                '& strong': { color: tc.text },
                '& a': { color: tc.command, textDecoration: 'none' },
                '& a:hover': { textDecoration: 'underline' },
                '& code': {
                  color: tc.highlight,
                  bg: tc.touchBar,
                  border: `1px solid ${tc.border}`,
                  borderRadius: 'sm',
                  px: 1.5,
                  py: 0.5,
                },
                '& pre': {
                  bg: tc.touchBar,
                  border: `1px solid ${tc.border}`,
                  borderRadius: 'md',
                  p: 4,
                  mb: 5,
                  overflowX: 'auto',
                  lineHeight: 1.7,
                },
                '& pre code': { color: tc.text, bg: 'transparent', border: 0, p: 0 },
                '& table': {
                  display: 'block',
                  width: '100%',
                  overflowX: 'auto',
                  borderCollapse: 'collapse',
                  mb: 6,
                },
                '& th, & td': {
                  border: `1px solid ${tc.border}`,
                  px: 3,
                  py: 2.5,
                  textAlign: 'left',
                  verticalAlign: 'top',
                },
                '& th': { color: tc.text, bg: tc.header },
                '& td:first-of-type': { whiteSpace: 'nowrap' },
              }}
              dangerouslySetInnerHTML={{ __html: documentationHtml }}
            />
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}

export default MvrDatasetsDocs
