// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

import type { TemplateConfig } from '../types'
import theme from '../../theme'
import {
  ArticlesPage,
  BenchmarksPage,
  CvPage,
  ExperiencePage,
  GuideDocsPage,
  GuideLandingPage,
  NewsPage,
  ProjectDocsPage,
  ProjectsPage,
  PublicationsPage,
  ResearchPage,
} from '../../routing/pageModules'

import Layout from '../../components/Layout'
import Home from '../../components/Home'

import Navbar from '../../components/Navbar'
import HeroSection from '../../components/about/HeroSection'
import Footer from '../../components/about/Footer'
import NewsTimeline from '../../components/about/NewsTimeline'
import AccomplishmentsTerminal from '../../components/AccomplishmentsTerminal'

import BioSection from '../../components/sections/BioSection'
import SkillsSection from '../../components/sections/SkillsSection'
import JourneySection from '../../components/sections/JourneySection'
import MentorshipSection from '../../components/sections/MentorshipSection'
import SelectedPublicationsSlot from '../../components/sections/SelectedPublicationsSlot'
import TalksSection from '../../components/sections/TalksSection'
import TeachingSection from '../../components/sections/TeachingSection'
import ContactSection from '../../components/sections/ContactSection'
import GithubContributionsSection from '../../components/sections/GithubContributionsSection'

const terminalTemplate: TemplateConfig = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Nord-inspired terminal aesthetic with monospace typography',
  theme,
  layout: Layout,
  pages: {
    home: Home,
    research: ResearchPage,
    publications: PublicationsPage,
    projects: ProjectsPage,
    articles: ArticlesPage,
    experience: ExperiencePage,
    news: NewsPage,
    cv: CvPage,
    benchmarks: BenchmarksPage,
    guide: GuideLandingPage,
    guideDocs: GuideDocsPage,
    projectDocs: ProjectDocsPage,
  },
  slots: {
    navbar: Navbar,
    hero: HeroSection,
    footer: Footer,
    newsDisplay: NewsTimeline,
    accomplishments: AccomplishmentsTerminal,
    bio: BioSection,
    skills: SkillsSection,
    journey: JourneySection,
    mentorship: MentorshipSection,
    selectedPublications: SelectedPublicationsSlot,
    talks: TalksSection,
    teaching: TeachingSection,
    contact: ContactSection,
    githubContributions: GithubContributionsSection,
  },
}

export default terminalTemplate
