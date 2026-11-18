import bodies from 'virtual:project-doc-bodies'
import { projectDocConfigs } from './projectDocMetadata'

const projects = projectDocConfigs.map((project) => ({
  ...project,
  chapters: project.chapters.map((chapter) => ({
    ...chapter,
    path: '/' + chapter.route + '/',
    body: bodies[chapter.route],
  })),
}))

export const getProjectDocs = (slug: string) =>
  projects.find((project) => project.slug === slug || project.legacySlugs?.includes(slug))
