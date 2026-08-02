import React from 'react'
import { Box, Container, VStack, HStack, Text, Link, Image, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { withBase } from '@/utils/asset'

const Footer: React.FC = () => {
  const { t } = useTranslation()
  const { siteOwner, siteConfig } = useLocalizedData()
  const footerBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box
      as="footer"
      w="full"
      bg={footerBg}
      py={[6, 8]}
      mt={[6, 8]}
      borderTop="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container maxW="7xl" px={[4, 6, 8]}>
        <VStack spacing={[3, 4]} textAlign="center">
          {/* Logo */}
          <Link
            href="/"
            _hover={{ opacity: 0.85, transform: 'translateY(-1px)' }}
            transition="all 0.2s"
          >
            <Image
              src={withBase(`images/${siteConfig.avatar}`)}
              alt={`${siteOwner.name.display} logo`}
              h={["48px", "56px"]}
              w={["48px", "56px"]}
              borderRadius="full"
              objectFit="cover"
            />
          </Link>

          <HStack
            spacing={1}
            color={textColor}
            fontSize={["xs", "sm"]}
          >
            <Text>{t('footer.adaptedFrom')}</Text>
            <Link
              href="https://github.com/H-Freax/TermHub"
              isExternal
              color="cyan.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              TermHub
            </Link>
          </HStack>

          <Text
            fontSize={["2xs", "xs"]}
            color={textColor}
          >
            © {new Date().getFullYear()} {siteOwner.name.display || t('hero.defaultName')}
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}

export default Footer
