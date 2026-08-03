import { Box, Button, Flex, HStack, Text, useColorMode } from '@chakra-ui/react'
import { terminalPalette } from '@/config/theme'

type PageToken = number | 'left-ellipsis' | 'right-ellipsis'

interface TerminalPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPagePreload?: (page: number) => void
  ariaLabel: string
}

export const TERMINAL_PAGE_SIZE = 10

function getPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'right-ellipsis', totalPages]
  if (currentPage >= totalPages - 3) {
    return [1, 'left-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'left-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'right-ellipsis', totalPages]
}

const TerminalPagination: React.FC<TerminalPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPagePreload,
  ariaLabel,
}) => {
  const { colorMode } = useColorMode()
  const tc = terminalPalette.colors(colorMode === 'dark')

  if (totalPages <= 1) return null

  const tokens = getPageTokens(currentPage, totalPages)
  const preload = (page: number) => {
    if (page >= 1 && page <= totalPages) onPagePreload?.(page)
  }
  const buttonStyles = {
    h: '28px',
    minW: '28px',
    px: 2,
    borderRadius: 'sm',
    border: '1px solid',
    borderColor: tc.border,
    bg: 'transparent',
    color: tc.secondary,
    fontFamily: 'mono',
    fontSize: '2xs',
    fontWeight: 'normal',
    _hover: { borderColor: tc.info, color: tc.info, bg: tc.tabBar },
    _disabled: { opacity: 0.35, cursor: 'not-allowed' },
  } as const

  return (
    <Flex
      as="nav"
      aria-label={ariaLabel}
      px={[3, 4]}
      py={2.5}
      bg={tc.tabBar}
      borderTop={`1px solid ${tc.border}`}
      align="center"
      justify="space-between"
      gap={3}
      flexWrap="wrap"
    >
      <Text color={tc.muted} fontFamily="mono" fontSize="2xs">
        page <Text as="span" color={tc.highlight}>{currentPage}</Text>/{totalPages}
      </Text>

      <HStack spacing={1}>
        <Button
          {...buttonStyles}
          onClick={() => onPageChange(currentPage - 1)}
          onMouseEnter={() => preload(currentPage - 1)}
          onFocus={() => preload(currentPage - 1)}
          isDisabled={currentPage === 1}
          aria-label="Previous page"
        >
          ←<Text as="span" display={["none", "inline"]} ml={1}>prev</Text>
        </Button>

        {tokens.map((token) => token === 'left-ellipsis' || token === 'right-ellipsis' ? (
          <Box key={token} minW="22px" textAlign="center" color={tc.muted} fontSize="2xs" aria-hidden="true">
            …
          </Box>
        ) : (
          <Button
            key={token}
            {...buttonStyles}
            bg={token === currentPage ? tc.bg : 'transparent'}
            color={token === currentPage ? tc.prompt : tc.secondary}
            borderColor={token === currentPage ? tc.prompt : tc.border}
            fontWeight={token === currentPage ? 'bold' : 'normal'}
            onClick={() => onPageChange(token)}
            onMouseEnter={() => preload(token)}
            onFocus={() => preload(token)}
            aria-label={`Page ${token}`}
            aria-current={token === currentPage ? 'page' : undefined}
          >
            {token}
          </Button>
        ))}

        <Button
          {...buttonStyles}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={() => preload(currentPage + 1)}
          onFocus={() => preload(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <Text as="span" display={["none", "inline"]} mr={1}>next</Text>→
        </Button>
      </HStack>
    </Flex>
  )
}

export default TerminalPagination
