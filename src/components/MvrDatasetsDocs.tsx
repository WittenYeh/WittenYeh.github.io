import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Link,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaArrowLeft, FaGithub } from 'react-icons/fa'
import mvrDatasetsDoc from '@content/mvr-datasets.md'
import { terminalPalette } from '@/config/theme'

const MvrDatasetsDocs: React.FC = () => {
  const isDark = useColorMode().colorMode === 'dark'
  const tc = terminalPalette.colors(isDark)

  return (
    <Box w="full" minH="100vh" bg={isDark ? 'gray.900' : 'gray.50'} py={[6, 8, 10]}>
      <Container maxW="5xl">
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

        <Box
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
            dangerouslySetInnerHTML={{ __html: mvrDatasetsDoc.body }}
          />
        </Box>
      </Container>
    </Box>
  )
}

export default MvrDatasetsDocs
