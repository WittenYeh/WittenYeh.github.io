import { Box, VStack, Text, useColorModeValue, Image, HStack, Container, Link, Stack, Flex, Heading } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { withBase } from '@/utils/asset'
import DynamicIcon from '../DynamicIcon'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'

const MotionBox = motion(Box)
const MotionText = motion(Text)

interface ResearchItem {
  lab: string
  emoji: string
  advisor?: string
  focus: string
  link: string
}

interface EducationItem {
  course: string
  institution: string
  year: string
}

// Hero Section Component
interface HeroSectionProps {
  title: string
  avatar: string
  research?: ResearchItem[]
  researchLogos?: Record<string, string>
  education?: EducationItem[]
  educationLogos?: Record<string, string>
}

const HeroSection = ({ title, avatar }: HeroSectionProps) => {
  const { t } = useTranslation()
  const { about, siteOwner, siteConfig } = useLocalizedData()
  const headingColor = useColorModeValue('gray.800', 'white')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const bg = useColorModeValue('gray.50', 'gray.900')
  const dividerColor = useColorModeValue('gray.200', 'gray.700')
  const socialIconColor = useColorModeValue('gray.400', 'gray.500')
  const magnetRim = useColorModeValue(
    'linear-gradient(145deg, #ffffff 0%, #f7fafc 48%, #dfe6ee 100%)',
    'linear-gradient(145deg, #f7fafc 0%, #e2e8f0 52%, #a0aec0 100%)',
  )
  const magnetEdge = useColorModeValue('#aeb8c4', '#687386')
  const magnetShadow = useColorModeValue(
    '0 18px 24px -17px rgba(45, 55, 72, 0.48), 0 7px 12px -10px rgba(45, 55, 72, 0.34)',
    '0 19px 26px -17px rgba(0, 0, 0, 0.78), 0 8px 13px -10px rgba(0, 0, 0, 0.58)',
  )
  const subtitleCount = siteOwner.rotatingSubtitles.length
  const [subtitleIndex, setSubtitleIndex] = useState(0)

  useEffect(() => {
    setSubtitleIndex(0)
    if (subtitleCount <= 1) return

    const interval = window.setInterval(() => {
      setSubtitleIndex((current) => (current + 1) % subtitleCount)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [subtitleCount])

  const currentSubtitle = siteOwner.rotatingSubtitles[subtitleIndex] ?? ''
  const nextSubtitle = subtitleCount > 1
    ? siteOwner.rotatingSubtitles[(subtitleIndex + 1) % subtitleCount]
    : ''
  const subtitlePair = nextSubtitle ? `${currentSubtitle} → ${nextSubtitle}` : currentSubtitle
  const profileLinks = [
    { icon: 'FaEnvelope', href: siteOwner.contact.email ? `mailto:${siteOwner.contact.email}` : '', label: 'Email' },
    { icon: 'FaGithub', href: siteOwner.social.github, label: 'My GitHub' },
    { icon: 'FaGithub', href: siteOwner.social.labGithub, label: 'Lab GitHub' },
    { icon: 'FaLinkedin', href: siteOwner.social.linkedin, label: 'LinkedIn' },
    { icon: 'FaMedium', href: siteOwner.social.medium, label: 'Medium' },
    { icon: 'SiGooglescholar', href: siteOwner.social.googleScholar, label: 'Google Scholar' },
    { icon: 'SiAcm', href: siteOwner.social.acm, label: 'ACM Profile' },
    { icon: 'SiOrcid', href: siteOwner.social.orcid, label: 'ORCID' },
    { icon: 'SiZhihu', href: siteOwner.social.zhihu, label: '知乎' },
  ].filter((item) => item.href)
  const profileLinkRows = [profileLinks.slice(0, 4), profileLinks.slice(4)]
    .filter((row) => row.length > 0)

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
    <Box
      w="full"
      bg={bg}
      py={[3, 4, 6]}
      mt={[2, 3, 4]}
    >
      <Container maxW={["full", "full", "7xl"]} px={[2, 4, 8]}>
        <Stack
          direction={['column', 'column', 'row']}
          spacing={[4, 5, 8]}
          align={['center', 'center', 'flex-start']}
          justify="space-between"
        >
          <VStack
            spacing={[3, 4]}
            align={['center', 'center', 'flex-start']}
            justify="center"
            flex="1"
            minH={["auto", "auto", "220px"]}
            w="full"
          >
            <MotionText
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              as="h1"
              fontSize={["xl", "2xl", "4xl"]}
              fontWeight="bold"
              color={headingColor}
              lineHeight="shorter"
              display="flex"
              alignItems="center"
              gap={[1, 2]}
              flexWrap={["wrap", "wrap", "nowrap"]}
              textAlign={["center", "center", "left"]}
              w="full"
              sx={{ justifyContent: ["center", "center", "flex-start"] }}
            >
              <MotionText
                as="span"
                color="yellow.400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                $
              </MotionText>
              <MotionText
                as="span"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                overflow="hidden"
                whiteSpace="nowrap"
                display="inline-block"
              >
                {t('hero.greeting')}{' '}
              </MotionText>
              <MotionText
                as="span"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.6 }}
                color="cyan.400"
                fontFamily="mono"
                display="flex"
                alignItems="center"
                gap={1}
                ml={[1, 2, 3]}
              >
                <MotionText
                  as="span"
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  overflow="hidden"
                  whiteSpace="nowrap"
                >
                  {siteOwner.name.display || t('hero.defaultName')}
                </MotionText>
              </MotionText>
            </MotionText>

            <HStack
              spacing={[1, 2]}
              justify={['center', 'center', 'flex-start']}
              flexWrap="wrap"
              w="full"
            >
              <Text color="yellow.400" fontSize={["xs", "sm"]}>$</Text>
              <Text fontSize={["xs", "sm"]} color={textColor}>{t('hero.sometimesI')}</Text>
              <Box
                h={["18px", "20px", "24px"]}
                w={["250px", "280px", "320px"]}
                position="relative"
                overflow="hidden"
              >
                <AnimatePresence initial={false}>
                  <MotionText
                    key={subtitleIndex}
                    position="absolute"
                    inset={0}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    color="cyan.400"
                    fontWeight="bold"
                    fontSize={["xs", "sm"]}
                    fontFamily="mono"
                    lineHeight={["18px", "20px", "24px"]}
                    whiteSpace="nowrap"
                    textAlign={["center", "center", "left"]}
                  >
                    {subtitlePair}
                  </MotionText>
                </AnimatePresence>
              </Box>
            </HStack>

            {profileLinks.length > 0 && (
              <VStack spacing={2} align={['center', 'center', 'flex-start']} w="full">
                {profileLinkRows.map((row, rowIndex) => (
                  <HStack
                    key={rowIndex}
                    spacing={2}
                    flexWrap="wrap"
                    justify={['center', 'center', 'flex-start']}
                    w="full"
                  >
                    {row.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        isExternal={!item.href.startsWith('mailto:')}
                        aria-label={item.label}
                        color={socialIconColor}
                        border="1px solid"
                        borderColor={dividerColor}
                        borderRadius="sm"
                        px={2.5}
                        py={1.5}
                        fontFamily="mono"
                        fontSize="xs"
                        transition="all 0.2s"
                        _hover={{
                          color: 'cyan.400',
                          borderColor: 'cyan.400',
                          textDecoration: 'none',
                          transform: 'translateY(-1px)',
                        }}
                      >
                        <HStack spacing={1.5}>
                          <DynamicIcon name={item.icon} boxSize={3.5} />
                          <Text>{item.label}</Text>
                        </HStack>
                      </Link>
                    ))}
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>

          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            flexShrink={0}
          >
            <VStack spacing={[2, 3]}>
              <Box
                boxSize={["150px", "180px", "220px"]}
                position="relative"
                transform="perspective(800px) rotateZ(-2deg) rotateY(-4deg)"
                transformOrigin="center bottom"
                transition="transform 240ms ease, filter 240ms ease"
                filter="drop-shadow(0 2px 1px rgba(255, 255, 255, 0.35))"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  borderRadius: ['18px', '21px', '25px'],
                  bg: magnetEdge,
                  transform: 'translate3d(4px, 5px, -1px)',
                  boxShadow: magnetShadow,
                }}
                _hover={{
                  transform: 'perspective(800px) translateY(-5px) rotateZ(-0.35deg) rotateY(0deg)',
                  filter: 'drop-shadow(0 4px 2px rgba(255, 255, 255, 0.32))',
                  '& img': {
                    transform: 'scale(1.025)',
                  },
                  '& .magnet-gloss': {
                    opacity: 0.78,
                  },
                }}
                sx={{
                  transformStyle: 'preserve-3d',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '& img, & .magnet-gloss': {
                      transition: 'none',
                    },
                  },
                }}
              >
                <Box
                  position="relative"
                  zIndex={1}
                  w="full"
                  h="full"
                  p={["5px", "6px", "7px"]}
                  borderRadius={['18px', '21px', '25px']}
                  background={magnetRim}
                  boxShadow="inset 1px 1px 1px rgba(255, 255, 255, 0.95), inset -2px -2px 4px rgba(71, 85, 105, 0.26)"
                  overflow="hidden"
                >
                  <Image
                    src={withBase(`images/${avatar}`)}
                    alt={title}
                    w="full"
                    h="full"
                    borderRadius={['14px', '16px', '19px']}
                    objectFit="cover"
                    transition="transform 240ms ease"
                  />
                  <Box
                    className="magnet-gloss"
                    aria-hidden="true"
                    pointerEvents="none"
                    position="absolute"
                    inset={["5px", "6px", "7px"]}
                    borderRadius={['14px', '16px', '19px']}
                    background="linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.16) 24%, transparent 45%, rgba(255, 255, 255, 0.08) 100%)"
                    boxShadow="inset 0 0 0 1px rgba(255, 255, 255, 0.36)"
                    opacity={0.58}
                    transition="opacity 240ms ease"
                  />
                </Box>
              </Box>
              {((siteConfig.pets ?? []) as { name: string; emoji: string; image: string }[]).length > 0 && (
                <HStack spacing={[4, 5]} justify="center">
                  {((siteConfig.pets ?? []) as { name: string; emoji: string; image: string }[]).map((pet) => (
                    <VStack key={pet.name} spacing={2}>
                      {pet.image && (
                        <Image
                          src={pet.image}
                          alt={pet.name}
                          borderRadius="full"
                          boxSize={["40px", "50px"]}
                          objectFit="cover"
                        />
                      )}
                      <Text fontSize="sm" fontWeight="medium">{pet.name} {pet.emoji}</Text>
                    </VStack>
                  ))}
                </HStack>
              )}
            </VStack>
          </MotionBox>
        </Stack>

        <Box mt={[5, 6, 8]}>
          <Flex align="center" gap={3} mb={[3, 4]}>
            <Box h="2px" w="20px" bg="cyan.400" borderRadius="full" flexShrink={0} />
            <Heading size="md" fontWeight="semibold">
              {t('about.bio', 'About')}
            </Heading>
            <Box flex="1" h="1px" bg={dividerColor} />
          </Flex>
          <VStack align="stretch" spacing={[3, 4]} textAlign="left">
            {about.journey.split(/\n+/).filter(Boolean).map((paragraph, index) => (
              <Text key={index} fontSize={["0.875rem", "0.875rem", "1rem"]} lineHeight="tall" color={textColor}>
                {renderLinkedText(paragraph)}
              </Text>
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default HeroSection
