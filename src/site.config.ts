// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

/**
 * Site configuration — imports from content/site.json
 *
 * Users edit content/site.json (pure JSON, no code needed).
 * This file computes derived values used by components.
 */

import siteJson from '@content/site.json'

// ═══════════════════════════════════════════════════════════════
// The config object — mirrors content/site.json
// ═══════════════════════════════════════════════════════════════

export const siteConfig = siteJson

/** Get the site config. The language argument is retained for API compatibility. */
export function getLocalizedSiteConfig(_lang?: string) {
  return siteConfig
}

// ═══════════════════════════════════════════════════════════════
// Derived values — computed automatically, do NOT edit
// ═══════════════════════════════════════════════════════════════

/** GitHub username extracted from URL */
export const githubUsername = siteConfig.social.github.split('/').pop() ?? ''

/** Selected publication IDs as a Set for fast lookup */
export const selectedPublicationIds = new Set<string>(siteConfig.selectedPublicationIds)

type HeroSocialIconConfig = {
  platform: string
  icon: string
  label: string
  color: string
}

/** Auto-generated navigation from enabled features */
export const navItems = [
  { path: '/', labelKey: 'nav.about' },
  ...(siteConfig.features.research ? [{ path: '/research', labelKey: 'nav.research' }] : []),
  ...(siteConfig.features.publications ? [{ path: '/publications', labelKey: 'nav.publications' }] : []),
  ...(siteConfig.features.projects ? [{ path: '/projects', labelKey: 'nav.projects' }] : []),
  ...(siteConfig.features.experience ? [{ path: '/experience', labelKey: 'nav.experience' }] : []),
  ...(siteConfig.features.news ? [{ path: '/news', labelKey: 'nav.news' }] : []),
  ...(siteConfig.features.cv ? [{ path: '/cv', labelKey: 'nav.cv' }] : []),
  ...(siteConfig.features.benchmarks ? [{ path: '/benchmarks', labelKey: 'nav.benchmarks' }] : []),
  ...(siteConfig.features.contact ? [{ path: '/contact', labelKey: 'nav.contact' }] : []),
  ...(siteConfig.features.articles ? [{ path: '/articles', labelKey: 'nav.articles' }] : []),
  ...(siteConfig.features.guide !== false ? [{ path: '/guide', labelKey: 'nav.guide' }] : []),
] as const

/** Hero social icons with resolved URLs from social config */
export const heroSocialIcons = ((siteConfig.heroSocialIcons ?? []) as HeroSocialIconConfig[]).map(item => ({
  icon: item.icon,
  label: item.label,
  color: item.color,
  href: (siteConfig.social as Record<string, string>)[item.platform] ?? '',
}))

/**
 * Backward-compatible `siteOwner` — components import this shape.
 */
export const siteOwner = {
  name: siteConfig.name,
  terminalUsername: siteConfig.terminal.username,
  rotatingSubtitles: siteConfig.terminal.rotatingSubtitles,
  contact: {
    email: siteConfig.contact.email,
    academicEmail: siteConfig.contact.academicEmail,
    hiringEmail: siteConfig.contact.hiringEmail,
    location: siteConfig.contact.location,
    linkedin: siteConfig.social.linkedin,
  },
  social: siteConfig.social,
  timezone: siteConfig.terminal.timezone,
  skills: siteConfig.terminal.skills,
  pets: (siteConfig.pets ?? []) as { name: string; emoji: string; image: string; title: string; description: string }[],
} as const

/** Build a siteOwner-like object for a given language */
export function getLocalizedSiteOwner(_lang?: string) {
  const cfg = siteConfig
  return {
    name: cfg.name,
    terminalUsername: cfg.terminal.username,
    rotatingSubtitles: cfg.terminal.rotatingSubtitles,
    contact: {
      email: cfg.contact.email,
      academicEmail: cfg.contact.academicEmail,
      hiringEmail: cfg.contact.hiringEmail,
      location: cfg.contact.location,
      linkedin: cfg.social.linkedin,
    },
    social: cfg.social,
    timezone: cfg.terminal.timezone,
    skills: cfg.terminal.skills,
    pets: (cfg.pets ?? []) as { name: string; emoji: string; image: string; title: string; description: string }[],
  }
}
