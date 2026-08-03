import { Box, Button, Flex, HStack, Text, useColorMode } from '@chakra-ui/react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { terminalPalette } from '@/config/theme'

const TerminalFrame: React.FC<{
  title: string
  command: string
  message: string
  tone: 'info' | 'error'
  action?: ReactNode
}> = ({ title, command, message, tone, action }) => {
  const { colorMode } = useColorMode()
  const tc = terminalPalette.colors(colorMode === 'dark')
  const accent = tone === 'error' ? tc.error : tc.info

  return (
    <Flex minH="calc(100vh - 76px)" align="center" justify="center" px={4} py={10}>
      <Box
        w="full"
        maxW="680px"
        overflow="hidden"
        border="1px solid"
        borderColor={tc.border}
        borderRadius="md"
        bg={tc.bg}
        color={tc.text}
        fontFamily="mono"
        boxShadow={`0 10px 30px ${colorMode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)'}`}
      >
        <Flex bg={tc.header} px={4} py={2} align="center" justify="space-between">
          <HStack spacing={1.5}>
            <Box w="10px" h="10px" borderRadius="full" bg="#bf616a" />
            <Box w="10px" h="10px" borderRadius="full" bg="#ebcb8b" />
            <Box w="10px" h="10px" borderRadius="full" bg="#a3be8c" />
          </HStack>
          <Text fontSize="xs" color={tc.muted}>{title}</Text>
        </Flex>
        <Box px={[4, 6]} py={6}>
          <Text fontSize="sm">
            <Text as="span" color={tc.prompt}>researcher@portfolio:~$ </Text>
            <Text as="span" color={tc.command}>{command}</Text>
          </Text>
          <Text mt={3} fontSize="sm" color={accent} lineHeight="tall">
            {message}
          </Text>
          {action && <Box mt={5}>{action}</Box>}
        </Box>
      </Box>
    </Flex>
  )
}

export const RouteLoading: React.FC = () => (
  <TerminalFrame
    title="route-loader"
    command="load --route current"
    message="Loading page module…"
    tone="info"
  />
)

const RouteErrorFallback: React.FC = () => {
  const { colorMode } = useColorMode()
  const tc = terminalPalette.colors(colorMode === 'dark')

  return (
    <TerminalFrame
      title="route-error"
      command="recover --latest"
      message="The page module could not be loaded. A newer site version may be available."
      tone="error"
      action={(
        <Button
          size="sm"
          variant="outline"
          borderColor={tc.prompt}
          color={tc.prompt}
          fontFamily="mono"
          _hover={{ bg: tc.tabBar }}
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      )}
    />
  )
}

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Route rendering failed', error, info)
  }

  render(): ReactNode {
    return this.state.hasError ? <RouteErrorFallback /> : this.props.children
  }
}
