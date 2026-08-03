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

const githubLogoMask = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57A12.02 12.02 0 0 0 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
)}")`

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through for browsers that expose the API but deny permission.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard copy failed')
}

const ProjectDocs: React.FC = () => {
  const { projectSlug = '', chapterSlug } = useParams()
  const isDark = useColorMode().colorMode === 'dark'
  const tc = terminalPalette.colors(isDark)
  const project = getProjectDocs(projectSlug)

  if (!project) return <Navigate to="/projects" replace />
  if (projectSlug !== project.slug) {
    const legacyChapter = chapterSlug
      ? project.chapters.find((chapter) => chapter.slug === chapterSlug)
      : project.chapters[0]
    return <Navigate to={legacyChapter?.path ?? `/projects/${project.slug}`} replace />
  }
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

  const handleCodeCopy = async (event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>('.code-copy-button')
    if (!button || !event.currentTarget.contains(button)) return

    const code = button.closest('pre')?.querySelector('code')
    if (!code) return

    try {
      await copyText(code.textContent ?? '')
      button.setAttribute('aria-label', 'Code copied')
      button.dataset.copyState = 'success'
    } catch {
      button.setAttribute('aria-label', 'Unable to copy code')
      button.dataset.copyState = 'error'
    }

    window.setTimeout(() => {
      if (!button.isConnected) return
      button.setAttribute('aria-label', 'Copy code to clipboard')
      delete button.dataset.copyState
    }, 1600)
  }

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
                <Heading as="h1" fontSize={['xl', '2xl', '3xl']} lineHeight="1.3" color={tc.text} mb={4}>
                  {chapter.title}
                </Heading>
              )}
              {chapter.overview?.length ? (
                <Box maxW="780px" mt={showAsciiHero ? 5 : 0} color={tc.secondary} fontSize={['sm', 'md']} lineHeight="1.8">
                  <Text mb={2}>
                    The{' '}
                    <Text as="span" color={tc.text} fontWeight={700}>
                      {chapter.shortTitle ?? chapter.title}
                    </Text>{' '}
                    chapter includes:
                  </Text>
                  <Box
                    as="ul"
                    m={0}
                    pl={5}
                    sx={{ '& li::marker': { color: tc.command } }}
                  >
                    {chapter.overview.map((item) => (
                      <Text as="li" key={item} mb={1}>
                        {item}
                      </Text>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Text maxW="780px" color={tc.secondary} fontSize={['sm', 'md']} lineHeight="1.8">
                  {chapter.description}
                </Text>
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
              onClick={handleCodeCopy}
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
                '& h2:has(> a[title="View source on GitHub"])': {
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mt: 12,
                  mb: 4,
                  px: 3,
                  py: 2.5,
                  bg: tc.header,
                  border: '1px solid',
                  borderLeftWidth: '3px',
                  borderColor: tc.border,
                  borderLeftColor: tc.command,
                  borderRadius: 'sm',
                  fontSize: ['md', 'lg'],
                  scrollMarginTop: '96px',
                },
                '& h2:first-of-type:has(> a[title="View source on GitHub"])': {
                  mt: 0,
                },
                '& h2:has(> a[title="View source on GitHub"]) > code': {
                  p: 0,
                  color: tc.text,
                  bg: 'transparent',
                  border: 0,
                  fontSize: 'inherit',
                },
                '& h2 > a[title="View source on GitHub"]': {
                  display: 'inline-block',
                  flexShrink: 0,
                  w: '15px',
                  h: '15px',
                  color: tc.secondary,
                  bg: 'currentColor',
                  fontSize: 0,
                  textDecoration: 'none',
                  WebkitMask: `${githubLogoMask} center / contain no-repeat`,
                  mask: `${githubLogoMask} center / contain no-repeat`,
                  transition: 'color 0.15s ease',
                },
                '& h2 > a[title="View source on GitHub"]:hover': {
                  color: tc.command,
                  textDecoration: 'none',
                },
                '& h2 > a[title="View source on GitHub"]:focus-visible': {
                  color: tc.command,
                  outline: '1px solid currentColor',
                  outlineOffset: '3px',
                },
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
                  position: 'relative',
                  bg: tc.touchBar,
                  border: `1px solid ${tc.border}`,
                  borderRadius: 'md',
                  p: 4,
                  pr: '44px',
                  mb: 5,
                  overflowX: 'auto',
                  lineHeight: 1.7,
                },
                '& pre code': { color: tc.text, bg: 'transparent', border: 0, p: 0 },
                '& pre code.hljs': { display: 'block' },
                '& pre[data-language]': {
                  pt: 4,
                  pr: '160px',
                },
                '& .code-block-tools': {
                  position: 'absolute',
                  top: 2,
                  right: 3,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                },
                '& .code-language-label': {
                  px: 1.5,
                  py: 0.5,
                  color: tc.command,
                  bg: isDark ? 'rgba(46, 52, 64, 0.82)' : 'rgba(255, 255, 255, 0.78)',
                  border: `1px solid ${tc.border}`,
                  borderRadius: 'sm',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                },
                '& .code-copy-button': {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  w: '16px',
                  h: '16px',
                  p: 0,
                  color: tc.secondary,
                  bg: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                },
                '& .code-copy-button svg': {
                  w: '14px',
                  h: '14px',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
                '& .code-copy-button:hover': {
                  color: tc.command,
                },
                '& .code-copy-button:focus-visible': {
                  color: tc.command,
                  outline: '1px solid currentColor',
                  outlineOffset: '2px',
                },
                '& .code-copy-button[data-copy-state="success"]': {
                  color: tc.success,
                },
                '& .code-copy-button[data-copy-state="error"]': {
                  color: tc.error,
                },
                '& .hljs-comment, & .hljs-quote': {
                  color: tc.secondary,
                  fontStyle: 'italic',
                },
                '& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-section, & .hljs-link': {
                  color: tc.param,
                },
                '& .hljs-string, & .hljs-title, & .hljs-name, & .hljs-type': {
                  color: tc.success,
                },
                '& .hljs-number, & .hljs-symbol, & .hljs-bullet, & .hljs-variable, & .hljs-template-variable': {
                  color: tc.highlight,
                },
                '& .hljs-built_in, & .hljs-builtin-name, & .hljs-attr, & .hljs-attribute, & .hljs-property': {
                  color: tc.command,
                },
                '& .hljs-meta, & .hljs-selector-attr, & .hljs-selector-pseudo': {
                  color: tc.info,
                },
                '& .hljs-doctag, & .hljs-regexp': { color: tc.warning },
                '& .hljs-addition': { color: tc.success },
                '& .hljs-deletion': { color: tc.error },
                '& pre:has(> code.language-command)': {
                  position: 'relative',
                  bg: isDark ? '#202b27' : '#edf8f1',
                  borderColor: tc.success,
                  borderLeftWidth: '3px',
                  borderBottomWidth: 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  mb: 0,
                  pr: '100px',
                },
                '& pre:has(> code.language-output)': {
                  position: 'relative',
                  bg: isDark ? '#222a36' : '#eef4fb',
                  borderColor: tc.info,
                  borderLeftWidth: '3px',
                  pr: '100px',
                },
                '& pre:has(> code.language-command) + pre:has(> code.language-output)': {
                  borderTopColor: tc.border,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                },
                '& pre code.language-command, & pre code.language-output': {
                  display: 'block',
                },
                '& pre code.language-command': { color: tc.success },
                '& pre code.language-output': { color: tc.info },
                '& pre code.language-command::after, & pre code.language-output::after': {
                  position: 'absolute',
                  right: 3,
                  bottom: 2.5,
                  px: 1.5,
                  py: 0.5,
                  bg: isDark ? 'rgba(46, 52, 64, 0.78)' : 'rgba(255, 255, 255, 0.72)',
                  border: `1px solid ${tc.border}`,
                  borderRadius: 'sm',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  lineHeight: 1.2,
                },
                '& pre code.language-command::after': {
                  content: '"COMMAND"',
                  color: tc.success,
                },
                '& pre code.language-output::after': {
                  content: '"OUTPUT"',
                  color: tc.info,
                },
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
