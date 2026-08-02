import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Link,
  Skeleton,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'

type ContributionLevel = 0 | 1 | 2 | 3 | 4

interface ContributionDay {
  date: string
  count: number
  level: ContributionLevel
}

interface ContributionData {
  contributions: ContributionDay[]
}

interface CachedContributionData {
  savedAt: number
  data: ContributionData
}

const CELL_SIZE = 11
const CELL_GAP = 3
const CACHE_PREFIX = 'github-contributions-v1'
const LEVEL_COLORS = ['#3b4252', '#435a4a', '#58765f', '#789a78', '#a3be8c'] as const
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pendingRequests = new Map<string, Promise<ContributionData>>()

function parseContributionData(value: unknown): ContributionData {
  if (!value || typeof value !== 'object') throw new Error('The contribution response is not an object.')

  const rawContributions = (value as Record<string, unknown>).contributions
  if (!Array.isArray(rawContributions)) throw new Error('The contribution response has no daily data.')

  const contributions = rawContributions.map((rawDay) => {
    if (!rawDay || typeof rawDay !== 'object') throw new Error('A contribution day is invalid.')
    const day = rawDay as Record<string, unknown>
    const level = day.level

    if (
      typeof day.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
      typeof day.count !== 'number' ||
      !Number.isInteger(day.count) ||
      day.count < 0 ||
      typeof level !== 'number' ||
      !Number.isInteger(level) ||
      level < 0 ||
      level > 4
    ) {
      throw new Error('A contribution day has an unexpected shape.')
    }

    return {
      date: day.date,
      count: day.count,
      level: level as ContributionLevel,
    }
  })

  return { contributions }
}

function fetchContributionData(endpoint: string) {
  const pending = pendingRequests.get(endpoint)
  if (pending) return pending

  const request = fetch(endpoint, { headers: { Accept: 'application/json' } }).then(async (response) => {
    if (!response.ok) throw new Error(`Contribution API returned ${response.status}.`)
    return parseContributionData(await response.json())
  })

  pendingRequests.set(endpoint, request)
  request.then(
    () => pendingRequests.delete(endpoint),
    () => pendingRequests.delete(endpoint),
  )
  return request
}

function readCachedData(cacheKey: string): CachedContributionData | null {
  try {
    const cached = window.localStorage.getItem(cacheKey)
    if (!cached) return null
    const parsed = JSON.parse(cached) as Record<string, unknown>
    if (typeof parsed.savedAt !== 'number') return null
    return { savedAt: parsed.savedAt, data: parseContributionData(parsed.data) }
  } catch {
    return null
  }
}

function writeCachedData(cacheKey: string, data: ContributionData, savedAt: number) {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ savedAt, data }))
  } catch {
    // The live graph still works when storage is disabled or unavailable.
  }
}

function weekdayOf(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

function buildCalendarWeeks(days: ContributionDay[]) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date))
  if (sortedDays.length === 0) return [] as Array<Array<ContributionDay | null>>

  const cells: Array<ContributionDay | null> = [
    ...Array.from({ length: weekdayOf(sortedDays[0].date) }, () => null),
    ...sortedDays,
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7))
}

function buildMonthLabels(weeks: Array<Array<ContributionDay | null>>) {
  let previousMonth = -1
  let previousLabelWeek = -4

  return weeks.flatMap((week, weekIndex) => {
    const firstDay = week.find((day): day is ContributionDay => day !== null)
    if (!firstDay) return []

    const month = Number(firstDay.date.slice(5, 7)) - 1
    if (month === previousMonth) return []
    previousMonth = month

    if (weekIndex - previousLabelWeek < 3) return []
    previousLabelWeek = weekIndex
    return [{ label: MONTH_NAMES[month], weekIndex }]
  })
}

function formatCheckedAt(timestamp: number | null) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

const GithubContributionsSection: React.FC = () => {
  const { t } = useTranslation()
  const { siteConfig } = useLocalizedData()
  const lineColor = useColorModeValue('gray.200', 'gray.700')
  const config = siteConfig.githubContributions
  const githubUrl = siteConfig.social.github
  const username = config.username || githubUrl.replace(/\/+$/, '').split('/').pop() || ''
  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '')
  const endpoint = `${apiBaseUrl}/${encodeURIComponent(username)}?y=${encodeURIComponent(config.year)}`
  const refreshMs = Math.max(config.refreshMinutes, 5) * 60 * 1000
  const cacheKey = `${CACHE_PREFIX}:${username}:${config.year}`

  const [data, setData] = useState<ContributionData | null>(null)
  const [checkedAt, setCheckedAt] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCached, setIsCached] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let active = true
    let lastRequestAt = 0
    const cached = readCachedData(cacheKey)

    if (cached) {
      setData(cached.data)
      setCheckedAt(cached.savedAt)
      setIsCached(true)
      setIsLoading(false)
    }

    const refresh = async () => {
      lastRequestAt = Date.now()
      setHasError(false)
      setIsLoading(true)

      try {
        const nextData = await fetchContributionData(endpoint)
        if (!active) return
        const savedAt = Date.now()
        setData(nextData)
        setCheckedAt(savedAt)
        setIsCached(false)
        writeCachedData(cacheKey, nextData, savedAt)
      } catch {
        if (active) setHasError(true)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void refresh()
    const interval = window.setInterval(refresh, refreshMs)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRequestAt >= refreshMs) void refresh()
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [cacheKey, endpoint, refreshMs])

  const weeks = useMemo(() => buildCalendarWeeks(data?.contributions ?? []), [data])
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks])
  const totalContributions = useMemo(
    () => data?.contributions.reduce((total, day) => total + day.count, 0) ?? 0,
    [data],
  )
  const graphWidth = Math.max(weeks.length, 53) * (CELL_SIZE + CELL_GAP) - CELL_GAP
  const status = isLoading
    ? { label: t('githubContributions.syncing'), colorScheme: 'yellow' }
    : hasError
      ? { label: data ? t('githubContributions.cached') : t('githubContributions.offline'), colorScheme: 'red' }
      : isCached
        ? { label: t('githubContributions.cached'), colorScheme: 'orange' }
        : { label: t('githubContributions.autoSync'), colorScheme: 'green' }

  return (
    <Box w="full">
      <Container maxW={["full", "full", "7xl"]} px={[2, 4, 8]}>
        <Flex align="center" gap={3} mb={4}>
          <Box h="2px" w="20px" bg="cyan.400" borderRadius="full" flexShrink={0} />
          <Heading size="md" fontWeight="semibold" whiteSpace="nowrap">{t('githubContributions.title')}</Heading>
          <Badge display={["none", "inline-flex"]} colorScheme={status.colorScheme} variant="subtle" fontSize="2xs" fontFamily="mono">
            {status.label}
          </Badge>
          <Box flex="1" h="1px" bg={lineColor} />
        </Flex>

        <Box
          bg="#2e3440"
          color="#d8dee9"
          border="1px solid"
          borderColor="#4c566a"
          borderRadius="md"
          overflow="hidden"
          boxShadow="0 10px 30px rgba(0, 0, 0, 0.18)"
        >
          <Flex align="center" px={4} py={2.5} bg="#3b4252" borderBottom="1px solid" borderColor="#4c566a">
            <HStack spacing={2} aria-hidden="true">
              <Box boxSize="9px" borderRadius="full" bg="#bf616a" />
              <Box boxSize="9px" borderRadius="full" bg="#ebcb8b" />
              <Box boxSize="9px" borderRadius="full" bg="#a3be8c" />
            </HStack>
            <Text flex="1" textAlign="center" fontSize="2xs" color="#81a1c1" fontFamily="mono" pr="43px">
              {username}@github: ~/activity
            </Text>
          </Flex>

          <Box px={[3, 4, 6]} py={[4, 5, 6]}>
            <HStack spacing={2} align="start" mb={1} fontFamily="mono" fontSize={["2xs", "xs"]} flexWrap="wrap">
              <Text color="#a3be8c">{username}@github</Text>
              <Text color="#d8dee9">:</Text>
              <Text color="#88c0d0">~</Text>
              <Text color="#d8dee9">$</Text>
              <Text color="#eceff4">gh contribution-graph --period=last-year --theme=nord</Text>
            </HStack>

            {isLoading && !data ? (
              <VStack align="stretch" spacing={3} mt={5}>
                <Text fontSize="xs" color="#ebcb8b">{t('githubContributions.fetching')}</Text>
                <Skeleton h="108px" startColor="#3b4252" endColor="#4c566a" borderRadius="sm" />
              </VStack>
            ) : data && weeks.length > 0 ? (
              <Box mt={5}>
                <Box overflowX="auto" pb={2} sx={{ scrollbarColor: '#4c566a #2e3440' }}>
                  <Box minW={`${graphWidth + 30}px`} w="max-content">
                    <Box position="relative" h="16px" ml="30px" w={`${graphWidth}px`}>
                      {monthLabels.map(({ label, weekIndex }) => (
                        <Text
                          key={`${label}-${weekIndex}`}
                          position="absolute"
                          left={`${weekIndex * (CELL_SIZE + CELL_GAP)}px`}
                          top={0}
                          fontSize="9px"
                          color="#81a1c1"
                          lineHeight="12px"
                        >
                          {label}
                        </Text>
                      ))}
                    </Box>
                    <Flex align="start">
                      <Box
                        w="24px"
                        mr="6px"
                        display="grid"
                        gridTemplateRows={`repeat(7, ${CELL_SIZE}px)`}
                        rowGap={`${CELL_GAP}px`}
                        color="#81a1c1"
                        fontSize="9px"
                        lineHeight={`${CELL_SIZE}px`}
                        textAlign="right"
                      >
                        <Text gridRow={2}>Mon</Text>
                        <Text gridRow={4}>Wed</Text>
                        <Text gridRow={6}>Fri</Text>
                      </Box>
                      <HStack spacing={`${CELL_GAP}px`} align="start" role="img" aria-label={`${totalContributions} contributions by ${username} in the last year`}>
                        {weeks.map((week, weekIndex) => (
                          <VStack key={weekIndex} spacing={`${CELL_GAP}px`}>
                            {week.map((day, dayIndex) => day ? (
                              <Tooltip
                                key={day.date}
                                label={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                                hasArrow
                                placement="top"
                                fontSize="2xs"
                                bg="#4c566a"
                                color="#eceff4"
                                openDelay={100}
                              >
                                <Box
                                  as="span"
                                  display="block"
                                  w={`${CELL_SIZE}px`}
                                  h={`${CELL_SIZE}px`}
                                  borderRadius="2px"
                                  bg={LEVEL_COLORS[day.level]}
                                  border="1px solid rgba(236, 239, 244, 0.06)"
                                  transition="transform 0.12s, outline-color 0.12s"
                                  _hover={{ transform: 'scale(1.35)', outline: '1px solid #88c0d0', zIndex: 1 }}
                                  aria-hidden="true"
                                />
                              </Tooltip>
                            ) : (
                              <Box key={`empty-${weekIndex}-${dayIndex}`} w={`${CELL_SIZE}px`} h={`${CELL_SIZE}px`} visibility="hidden" />
                            ))}
                          </VStack>
                        ))}
                      </HStack>
                    </Flex>
                  </Box>
                </Box>

                <Flex mt={3} gap={3} direction={["column", "row"]} justify="space-between" align={["start", "center"]}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="#eceff4">
                      <Text as="span" color="#a3be8c" fontWeight="bold">{totalContributions.toLocaleString()}</Text>{' '}
                      {t('githubContributions.inLastYear')}
                    </Text>
                    {checkedAt && (
                      <Text fontSize="2xs" color={hasError ? '#ebcb8b' : '#81a1c1'}>
                        {hasError ? t('githubContributions.cacheFallback') : t('githubContributions.lastChecked')} {formatCheckedAt(checkedAt)}
                      </Text>
                    )}
                  </VStack>
                  <HStack spacing={2} color="#81a1c1" fontSize="2xs">
                    <Text>{t('githubContributions.less')}</Text>
                    {LEVEL_COLORS.map((color, level) => (
                      <Box key={color} boxSize="10px" borderRadius="2px" bg={color} aria-label={`Contribution level ${level}`} />
                    ))}
                    <Text>{t('githubContributions.more')}</Text>
                  </HStack>
                </Flex>
              </Box>
            ) : (
              <VStack align="start" spacing={2} mt={5}>
                <Text fontSize="xs" color="#bf616a">error: {t('githubContributions.unavailable')}</Text>
                <Text fontSize="2xs" color="#81a1c1">{t('githubContributions.retry')}</Text>
              </VStack>
            )}

            <Flex mt={4} pt={3} borderTop="1px dashed" borderColor="#4c566a" justify="space-between" gap={3} flexWrap="wrap">
              <Text fontSize="2xs" color="#616e88"># {t('githubContributions.hourlySync')}</Text>
              <Link href={githubUrl} isExternal fontSize="2xs" color="#88c0d0" _hover={{ color: '#8fbcbb' }}>
                github.com/{username} ↗
              </Link>
            </Flex>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default GithubContributionsSection
