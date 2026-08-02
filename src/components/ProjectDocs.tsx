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
  VisuallyHidden,
} from '@chakra-ui/react'
import { Navigate, Link as RouterLink, useParams } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight, FaGithub } from 'react-icons/fa'
import { getProjectDocs } from '@/data/projectDocs'
import { terminalPalette } from '@/config/theme'
import { siteOwner } from '@/site.config'

const ProjectDocs: React.FC = () => {
  const { projectSlug = '', chapterSlug } = useParams()
  const isDark = useColorMode().colorMode === 'dark'
  const tc = terminalPalette.colors(isDark)
  const project = getProjectDocs(projectSlug)

  if (!project) return <Navigate to="/projects" replace />
  if (chapterSlug === project.chapters[0].slug) {
    return <Navigate to={`/projects/${project.slug}`} replace />
  }

  const chapterIndex = chapterSlug
    ? project.chapters.findIndex((chapter) => chapter.slug === chapterSlug)
    : 0
  if (chapterIndex < 0) return <Navigate to={`/projects/${project.slug}`} replace />

  const chapter = project.chapters[chapterIndex]
  const previous = project.chapters[chapterIndex - 1]
  const next = project.chapters[chapterIndex + 1]
  const showAsciiHero = chapter.hideTitle && project.hero?.type === 'ascii'

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

        <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '230px minmax(0, 1fr)' }} gap={5} alignItems="start">
          <Box
            as="aside"
            aria-label={`${project.title} documentation chapters`}
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
              <Text fontSize="xs" fontWeight="bold" color={tc.text} isTruncated>
                <Text as="span" color={tc.prompt}>$ </Text>
                tree {project.slug}
              </Text>
              <Text mt={1} fontSize="2xs" color={tc.muted}>Documentation</Text>
            </Box>
            <Grid
              as="nav"
              templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: '1fr' }}
              gap={1}
              p={2}
            >
              {project.chapters.map((item, index) => {
                const isActive = chapter.slug === item.slug
                return (
                  <Link
                    key={item.slug}
                    as={RouterLink}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
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
                  >
                    <Text as="span" color={isActive ? tc.prompt : tc.muted} flexShrink={0}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Text as="span">{item.shortTitle ?? item.title}</Text>
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
                <Text color={tc.prompt}>{siteOwner.terminalUsername}@projects</Text>
                <Text>:</Text>
                <Text color={tc.info} isTruncated>~/{project.slug}/{chapter.file}</Text>
              </HStack>
              <HStack spacing={1.5} flexShrink={0}>
                <Box w="8px" h="8px" borderRadius="full" bg="#bf616a" />
                <Box w="8px" h="8px" borderRadius="full" bg="#ebcb8b" />
                <Box w="8px" h="8px" borderRadius="full" bg="#a3be8c" />
              </HStack>
            </Flex>

            <Box as="header" px={[5, 8, 12]} pt={[8, 10, 12]} pb={[7, 8, 10]} borderBottom="1px solid" borderColor={tc.border}>
              <HStack spacing={2} mb={4} flexWrap="wrap">
                {project.badges?.map((badge) => (
                  <Badge key={badge.label} colorScheme={badge.colorScheme ?? 'blue'} variant="subtle">
                    {badge.label}
                  </Badge>
                ))}
              </HStack>
              <Text color={tc.prompt} fontSize="xs" mb={2}>
                Chapter {String(chapterIndex + 1).padStart(2, '0')} / {String(project.chapters.length).padStart(2, '0')}
              </Text>
              {showAsciiHero ? (
                <>
                  <VisuallyHidden as="h1">{project.hero?.ariaLabel ?? project.title}</VisuallyHidden>
                  <Box
                    as="pre"
                    role="img"
                    aria-label={project.hero?.ariaLabel ?? project.title}
                    m={0}
                    p={0}
                    maxW="full"
                    overflowX="auto"
                    bg="transparent"
                    border="0"
                    borderRadius="0"
                    color={tc.command}
                    fontSize={['5px', '6px', '7px', '8px']}
                    lineHeight="1.25"
                  >
                    {project.hero?.lines.join('\n')}
                  </Box>
                </>
              ) : (
                <>
                  <Heading as="h1" fontSize={['xl', '2xl', '3xl']} lineHeight="1.3" color={tc.text} mb={4}>
                    {chapter.title}
                  </Heading>
                  <Text maxW="780px" color={tc.secondary} fontSize={['sm', 'md']} lineHeight="1.8">
                    {chapter.description}
                  </Text>
                </>
              )}
              {project.repository && (
                <Link
                  href={project.repository}
                  isExternal
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  mt={5}
                  fontSize="sm"
                  color={tc.command}
                >
                  <Icon as={FaGithub} /> {project.repositoryLabel ?? 'View repository'}
                </Link>
              )}
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
                  mt: 10,
                  mb: 4,
                  pb: 2,
                  borderBottom: `1px solid ${tc.border}`,
                  scrollMarginTop: '96px',
                },
                '& h2:first-of-type': { mt: 0 },
                '& h3': { color: tc.text, fontSize: 'md', fontWeight: 700, mt: 7, mb: 3 },
                '& p': { mb: 4, lineHeight: 1.85 },
                '& ul, & ol': { mb: 5, pl: 6 },
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
                '& img': { maxWidth: '100%', height: 'auto' },
                '& blockquote': {
                  borderLeft: `3px solid ${tc.command}`,
                  color: tc.secondary,
                  my: 5,
                  pl: 4,
                },
                '& blockquote p:last-of-type': { mb: 0 },
                '& hr': { border: 0, borderTop: `1px solid ${tc.border}`, my: 8 },
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
              dangerouslySetInnerHTML={{ __html: chapter.body }}
            />

            <Grid
              templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }}
              gap={3}
              px={[5, 8, 12]}
              pb={[8, 10, 12]}
            >
              <Box>
                {previous && (
                  <Link
                    as={RouterLink}
                    to={previous.path}
                    display="block"
                    h="full"
                    p={4}
                    border="1px solid"
                    borderColor={tc.border}
                    borderRadius="md"
                    color={tc.secondary}
                    _hover={{ color: tc.command, borderColor: tc.command }}
                  >
                    <Text fontSize="2xs" color={tc.muted} mb={1}>PREVIOUS</Text>
                    <HStack spacing={2}><Icon as={FaArrowLeft} boxSize="10px" /><Text fontSize="xs">{previous.shortTitle ?? previous.title}</Text></HStack>
                  </Link>
                )}
              </Box>
              <Box>
                {next && (
                  <Link
                    as={RouterLink}
                    to={next.path}
                    display="block"
                    h="full"
                    p={4}
                    border="1px solid"
                    borderColor={tc.border}
                    borderRadius="md"
                    color={tc.secondary}
                    textAlign="right"
                    _hover={{ color: tc.command, borderColor: tc.command }}
                  >
                    <Text fontSize="2xs" color={tc.muted} mb={1}>NEXT</Text>
                    <HStack spacing={2} justify="flex-end"><Text fontSize="xs">{next.shortTitle ?? next.title}</Text><Icon as={FaArrowRight} boxSize="10px" /></HStack>
                  </Link>
                )}
              </Box>
            </Grid>
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}

export default ProjectDocs
