import { Box, Heading, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import AcademicPageShell from './AcademicPageShell'

const Contact = () => {
  const { t } = useTranslation()
  const { siteOwner } = useLocalizedData()
  const links = [
    siteOwner.contact.email && { label: t('contact.email'), value: siteOwner.contact.email, href: `mailto:${siteOwner.contact.email}` },
    siteOwner.contact.location && { label: t('contact.location'), value: siteOwner.contact.location },
    siteOwner.social.github && { label: 'GitHub', value: siteOwner.social.github, href: siteOwner.social.github },
    siteOwner.social.linkedin && { label: 'LinkedIn', value: siteOwner.social.linkedin, href: siteOwner.social.linkedin },
    siteOwner.social.googleScholar && { label: 'Google Scholar', value: siteOwner.social.googleScholar, href: siteOwner.social.googleScholar },
  ].filter(Boolean) as { label: string; value: string; href?: string }[]

  return (
    <AcademicPageShell title={t('contact.title')} command="cat content/site.json | jq .contact" status={links.length ? 'AVAILABLE' : 'PENDING'}>
      <VStack align="stretch" spacing={5}>
        <Heading size="lg">{t('contact.title')}</Heading>
        {links.length === 0 ? (
          <Text color="var(--secondary-text)">{t('common.contentPending')}</Text>
        ) : (
          <SimpleGrid columns={[1, 1, 2]} spacing={4}>
            {links.map(item => (
              <Box key={item.label} p={4} border="1px solid" borderColor="var(--border-color)" borderRadius="md" bg="var(--card-bg)">
                <Text fontSize="2xs" color="var(--secondary-text)" mb={1}>{item.label}</Text>
                {item.href ? (
                  <Link href={item.href} isExternal fontSize="sm" wordBreak="break-word">{item.value}</Link>
                ) : (
                  <Text fontSize="sm">{item.value}</Text>
                )}
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </AcademicPageShell>
  )
}

export default Contact
