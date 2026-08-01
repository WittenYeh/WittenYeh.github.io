import type { ReactNode } from 'react'
import { Box, Container, Flex, HStack, Text, useColorMode } from '@chakra-ui/react'
import { terminalPalette } from '@/config/theme'

interface AcademicPageShellProps {
  title: string
  command: string
  status?: string
  children: ReactNode
}

const AcademicPageShell = ({ title, command, status, children }: AcademicPageShellProps) => {
  const { colorMode } = useColorMode()
  const colors = terminalPalette.colors(colorMode === 'dark')

  return (
    <Box w="full" minH="calc(100vh - 72px)" py={[5, 8]}>
      <Container maxW="7xl" px={[0, 2, 4]}>
        <Box
          overflow="hidden"
          borderRadius="md"
          bg={colors.bg}
          color={colors.text}
          border="1px solid"
          borderColor={colors.border}
          boxShadow="0 16px 45px rgba(15, 23, 42, 0.18)"
          fontFamily="mono"
        >
          <Flex h="3px">
            {terminalPalette.rainbow.map(color => (
              <Box key={color} flex="1" bg={color} />
            ))}
          </Flex>

          <Flex
            px={[3, 4]}
            py={2.5}
            bg={colors.header}
            borderBottom="1px solid"
            borderColor={colors.border}
            align="center"
            justify="space-between"
            gap={4}
          >
            <HStack spacing={3} minW={0}>
              <HStack spacing={1.5} flexShrink={0}>
                <Box w="10px" h="10px" borderRadius="full" bg="#bf616a" />
                <Box w="10px" h="10px" borderRadius="full" bg="#ebcb8b" />
                <Box w="10px" h="10px" borderRadius="full" bg="#a3be8c" />
              </HStack>
              <Text fontSize="xs" color={colors.command} noOfLines={1}>{title}</Text>
            </HStack>
            {status && <Text fontSize="2xs" color={colors.success} flexShrink={0}>{status}</Text>}
          </Flex>

          <Box px={[4, 6, 8]} py={[5, 7, 9]}>
            <Text fontSize="xs" mb={6} color={colors.secondary}>
              <Box as="span" color={colors.prompt}>visitor@wittenyeh</Box>
              <Box as="span">:</Box>
              <Box as="span" color={colors.info}>~</Box>
              <Box as="span">$ </Box>
              <Box as="span" color={colors.command}>{command}</Box>
            </Text>
            {children}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default AcademicPageShell
