/// <reference types="vite/client" />

declare module 'virtual:project-doc-metadata' {
  const projects: import('./data/projectDocMetadata').ProjectDocConfig[]
  export default projects
}

declare module 'virtual:project-doc-bodies' {
  const bodies: Record<string, string>
  export default bodies
}

declare module 'virtual:project-index' {
  const index: import('./data/projectPages').ProjectIndexItem[]
  export default index
}

declare module '*.md' {
  const content: Record<string, unknown> & { body: string }
  export default content
}
