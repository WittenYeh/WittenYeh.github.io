import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import { cacheDirectory, readProjectConfigs } from './project-docs.mjs'
import { renderProject } from './render-project.mjs'

const root = resolve(import.meta.dirname, '..')
const cache = cacheDirectory(root)
const offline = process.env.PROJECT_DOCS_OFFLINE === '1'

function writeAtomically(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  writeFileSync(temporary, data)
  renameSync(temporary, path)
}

async function request(url, headers = {}) {
  const result = await fetch(url, { headers, signal: AbortSignal.timeout(60_000) })
  if (!result.ok) {
    const detail = await result.text()
    throw new Error(`GitHub returned HTTP ${result.status} for ${url}: ${detail.slice(0, 250)}`, { cause: result.status })
  }
  return result
}

async function repositorySource(repository, cachedPath) {
  const name = new URL(repository).pathname.slice(1)
  const cached = existsSync(cachedPath) && JSON.parse(readFileSync(cachedPath, 'utf8'))
  if (offline) {
    if (!cached) throw new Error(`No cached documentation for ${repository}. Run npm run projects:sync online first.`)
    return cached
  }
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const json = async (path) => (await request(`https://api.github.com/repos/${name}/${path}`, headers)).json()
  let head
  try {
    head = await json('commits/HEAD')
  } catch (error) {
    if (error.cause === 409 && /Git Repository is empty/i.test(error.message)) return { revision: '', entries: [] }
    throw error
  }
  if (cached?.revision === head.sha) return cached

  // The recursive API signals truncation on large trees. Visit each subtree
  // explicitly in that case so a partial listing never removes published pages.
  async function tree(sha) {
    const listing = await json(`git/trees/${sha}?recursive=1`)
    if (!listing.truncated) return listing.tree
    const direct = await json(`git/trees/${sha}`)
    if (direct.truncated) throw new Error(`GitHub truncated a single tree in ${repository} (${sha})`)
    const entries = [...direct.tree]
    for (const directory of direct.tree.filter((entry) => entry.type === 'tree')) {
      const children = await tree(directory.sha)
      for (const child of children) entries.push({ ...child, path: `${directory.path}/${child.path}` })
    }
    return entries
  }
  const entries = (await tree(head.commit.tree.sha)).map(({ path, mode, type, sha }) => ({ path, mode, type, sha }))
  return { revision: head.sha, updated: head.commit.committer.date.slice(0, 10), entries }
}

async function syncProject(config) {
  const cachedPath = resolve(cache, 'refs', new URL(config.repository).pathname.slice(1) + '.json')
  const source = await repositorySource(config.repository, cachedPath)
  const assets = new Map()
  const readBlob = async (entry) => {
    const path = resolve(cache, 'blobs', entry.sha)
    if (!existsSync(path)) {
      if (offline) throw new Error(`Missing cached file ${config.repository}/${entry.path}. Run npm run projects:sync online.`)
      const raw = config.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')
      const url = `${raw}/${source.revision}/${entry.path.split('/').map(encodeURIComponent).join('/')}`
      const response = await request(url)
      writeAtomically(path, Buffer.from(await response.arrayBuffer()))
    }
    return readFileSync(path)
  }
  const imageUrl = (entry) => {
    if (config.imageAssets?.[entry.sha]) return config.imageAssets[entry.sha]
    const localUrl = `/images/projects/${config.slug}/${basename(entry.path)}`
    const localPath = resolve(root, 'content', localUrl.slice(1))
    if (existsSync(localPath)) {
      const bytes = readFileSync(localPath)
      const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
      if (entry.sha === hash) return localUrl.split('/').map(encodeURIComponent).join('/')
    }
    const url = `/images/projects/${config.slug}/upstream/${entry.sha}${extname(entry.path).toLowerCase()}`
    assets.set(url, entry)
    return url
  }
  const project = await renderProject(config, source, readBlob, imageUrl)
  for (const entry of assets.values()) await readBlob(entry)
  project.assets = [...assets].map(([url, entry]) => ({ url, sha: entry.sha }))
  if (!offline) writeAtomically(cachedPath, JSON.stringify(source))
  console.log(`${config.slug} @ ${source.revision.slice(0, 12) || 'empty repository'}: ${project.chapters.some((page) => !page.slug) ? 'README' : 'no README'}, ${project.chapters.filter((page) => page.slug).length} docs chapter(s)`)
  return project
}

const projects = []
for (const config of readProjectConfigs(root)) projects.push(await syncProject(config))
writeAtomically(resolve(cache, 'site.json'), JSON.stringify(projects))
