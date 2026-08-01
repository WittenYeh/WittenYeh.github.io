// SPDX-FileCopyrightText: 2026 Yaoyao(Freax) Qian <limyoonaxi@gmail.com>
// SPDX-License-Identifier: GPL-3.0-only

import { lazy } from 'react'
import type { TemplateConfig } from '../types'
import theme from '../../theme'

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
import SelectedPublicationsSection from '../../components/sections/SelectedPublicationsSection'
import TalksSection from '../../components/sections/TalksSection'
import TeachingSection from '../../components/sections/TeachingSection'
import ContactSection from '../../components/sections/ContactSection'

const Publications = lazy(() => import('../../components/Publications'))
const Research = lazy(() => import('../../components/Research'))
const Projects = lazy(() => import('../../components/Projects'))
const Articles = lazy(() => import('../../components/Articles'))
const Experience = lazy(() => import('../../components/Experience'))
const News = lazy(() => import('../../components/News'))
const Cv = lazy(() => import('../../components/Cv'))
const Benchmarks = lazy(() => import('../../components/Benchmarks'))
const Contact = lazy(() => import('../../components/Contact'))
const GuideLanding = lazy(() => import('../../components/GuideLanding'))
const GuideDocs = lazy(() => import('../../components/GuideDocs'))

const terminalTemplate: TemplateConfig = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Nord-inspired terminal aesthetic with monospace typography',
  theme,
  layout: Layout,
  pages: {
    home: Home,
    research: Research,
    publications: Publications,
    projects: Projects,
    articles: Articles,
    experience: Experience,
    news: News,
    cv: Cv,
    benchmarks: Benchmarks,
    contact: Contact,
    guide: GuideLanding,
    guideDocs: GuideDocs,
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
    selectedPublications: SelectedPublicationsSection,
    talks: TalksSection,
    teaching: TeachingSection,
    contact: ContactSection,
  },
}

export default terminalTemplate
