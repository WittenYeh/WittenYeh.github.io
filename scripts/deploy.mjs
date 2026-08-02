#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadProjectDocs } from './project-docs.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPOSITORY = 'WittenYeh/WittenYeh.github.io'
const REMOTE = 'origin'
const BRANCH = 'main'
const WORKFLOW = 'pages.yml'
const BASE_URL = 'https://wittenyeh.github.io'
const WORKFLOW_TIMEOUT_MS = 10 * 60 * 1000
const LIVE_TIMEOUT_MS = 3 * 60 * 1000
const POLL_INTERVAL_MS = 10 * 1000

const usage = `Usage:
  npm run deploy -- --dry-run
  npm run deploy -- --message "Commit message"
  npm run deploy -- --all --message "Commit message"
  npm run deploy

Options:
  --dry-run       Run all local checks without committing, pushing, or using the network.
  --message, -m   Commit the currently staged changes with this message.
  --all           Stage every worktree change after checks. Requires --message.
  --help, -h      Show this help.

Without --message, the worktree must be clean and the current HEAD is deployed.
Prefer staging exact paths before running this script. Use --all only when every
worktree change belongs to the deployment.`

const fail = (message) => {
  throw new Error(message)
}

const parseArgs = (args) => {
  const options = { dryRun: false, stageAll: false, message: undefined }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--all') options.stageAll = true
    else if (argument === '--help' || argument === '-h') {
      console.log(usage)
      process.exit(0)
    } else if (argument === '--message' || argument === '-m') {
      const message = args[index + 1]
      if (!message || message.startsWith('-')) fail(`${argument} requires a commit message`)
      options.message = message.trim()
      if (!options.message) fail(`${argument} requires a non-empty commit message`)
      index += 1
    } else {
      fail(`Unknown option: ${argument}\n\n${usage}`)
    }
  }

  if (options.stageAll && !options.message) fail('--all requires --message')
  if (options.dryRun && (options.stageAll || options.message)) {
    fail('--dry-run cannot be combined with --all or --message')
  }
  return options
}

const run = (command, args, { capture = false, allowFailure = false } = {}) => {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })

  if (result.error) fail(`Failed to run ${command}: ${result.error.message}`)
  if (result.status !== 0 && !allowFailure) {
    const details = capture ? (result.stderr || result.stdout).trim() : ''
    fail(`${command} ${args.join(' ')} failed${details ? `: ${details}` : ''}`)
  }
  return result
}

const output = (command, args) => run(command, args, { capture: true }).stdout.trim()

const hasGitDiff = (args) => {
  const result = run('git', ['diff', '--quiet', ...args], { capture: true, allowFailure: true })
  if (result.status === 0) return false
  if (result.status === 1) return true
  fail(`Unable to inspect git diff: ${(result.stderr || result.stdout).trim()}`)
}

const ensureRepositoryState = () => {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (!Number.isInteger(nodeMajor) || nodeMajor < 20) fail(`Node.js 20 or newer is required; found ${process.versions.node}`)

  if (!existsSync(resolve(ROOT, 'package.json')) || !existsSync(resolve(ROOT, '.git'))) {
    fail(`Run this script from the ${REPOSITORY} checkout`)
  }

  const branch = output('git', ['branch', '--show-current'])
  if (branch !== BRANCH) fail(`Deployment is restricted to ${BRANCH}; current branch is ${branch || '<detached>'}`)

  const remoteUrl = output('git', ['remote', 'get-url', REMOTE])
  if (!/(?:github\.com[:/])WittenYeh\/WittenYeh\.github\.io(?:\.git)?$/.test(remoteUrl)) {
    fail(`${REMOTE} does not point to ${REPOSITORY}: ${remoteUrl}`)
  }

  const conflicts = output('git', ['diff', '--name-only', '--diff-filter=U'])
  if (conflicts) fail(`Resolve merge conflicts before deployment:\n${conflicts}`)
}

const ensureNoUnstagedChanges = () => {
  const unstaged = output('git', ['diff', '--name-only'])
  const untracked = output('git', ['ls-files', '--others', '--exclude-standard'])
  if (!unstaged && !untracked) return

  const details = [unstaged, untracked].filter(Boolean).join('\n')
  fail(`Unstaged or untracked files remain. Stage the intended paths explicitly, or use --all only when all changes are in scope:\n${details}`)
}

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))

const githubHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'Cache-Control': 'no-cache',
    'User-Agent': 'WittenYeh.github.io-deploy-script',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return headers
}

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: githubHeaders(), cache: 'no-store' })
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    fail(`GitHub API request failed (${response.status})${remaining === '0' ? '; set GITHUB_TOKEN to avoid the public API rate limit' : ''}: ${url}`)
  }
  return response.json()
}

const waitForPages = async (sha) => {
  const deadline = Date.now() + WORKFLOW_TIMEOUT_MS
  let lastState = ''

  while (Date.now() < deadline) {
    const query = new URLSearchParams({ branch: BRANCH, event: 'push', per_page: '20' })
    const data = await fetchJson(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW}/runs?${query}`)
    const workflowRun = data.workflow_runs?.find((candidate) => candidate.head_sha === sha)

    if (!workflowRun) {
      if (lastState !== 'waiting') console.log('Waiting for the GitHub Pages workflow to appear...')
      lastState = 'waiting'
    } else {
      const state = `${workflowRun.status}:${workflowRun.conclusion ?? ''}`
      if (state !== lastState) {
        console.log(`GitHub Pages: ${workflowRun.status}${workflowRun.conclusion ? ` (${workflowRun.conclusion})` : ''}`)
        console.log(`Workflow: ${workflowRun.html_url}`)
        lastState = state
      }
      if (workflowRun.status === 'completed') {
        if (workflowRun.conclusion !== 'success') {
          fail(`GitHub Pages deployment failed with conclusion: ${workflowRun.conclusion}\n${workflowRun.html_url}`)
        }
        return workflowRun
      }
    }

    await delay(POLL_INTERVAL_MS)
  }

  fail(`Timed out waiting for the GitHub Pages workflow for ${sha}`)
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex')

const walkFiles = (directory) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name)
    return statSync(path).isDirectory() ? walkFiles(path) : [path]
  })
}

const collectLiveTargets = () => {
  const targets = new Map()
  const routes = ['', 'publications', 'projects', 'cv', 'benchmarks']
  const projectDocs = loadProjectDocs(ROOT)
  routes.push(...projectDocs.flatMap((project) => project.chapters.map((chapter) => chapter.route)))
  routes.push(...projectDocs.flatMap((project) =>
    (project.legacySlugs ?? []).flatMap((legacySlug) =>
      project.chapters.map((chapter, chapterIndex) => chapterIndex === 0
        ? `projects/${legacySlug}`
        : `projects/${legacySlug}/${chapter.slug}`),
    ),
  ))

  for (const route of new Set(routes)) {
    const publicPath = route ? `/${route}/` : '/'
    const localPath = route ? resolve(ROOT, 'dist', route, 'index.html') : resolve(ROOT, 'dist', 'index.html')
    targets.set(publicPath, localPath)
  }

  targets.set('/404.html', resolve(ROOT, 'dist', '404.html'))
  targets.set('/robots.txt', resolve(ROOT, 'dist', 'robots.txt'))
  targets.set('/sitemap.xml', resolve(ROOT, 'dist', 'sitemap.xml'))

  const markdownImagePattern = /(?:src=["']|\]\()(?<path>\/images\/[^"')\s>]+)/g
  for (const project of projectDocs) {
    for (const chapter of project.chapters) {
      for (const match of chapter.markdown.matchAll(markdownImagePattern)) {
        const publicPath = match.groups?.path
        if (publicPath) targets.set(publicPath, resolve(ROOT, 'dist', publicPath.slice(1)))
      }
    }
  }

  const projectImagesRoot = resolve(ROOT, 'dist', 'images', 'projects')
  for (const path of walkFiles(projectImagesRoot)) {
    const publicPath = `/images/projects/${relative(projectImagesRoot, path).split('\\').join('/')}`
    targets.set(publicPath, path)
  }

  for (const [publicPath, localPath] of targets) {
    if (!existsSync(localPath)) fail(`Expected build output is missing for ${publicPath}: ${localPath}`)
  }
  return targets
}

const compareLiveTarget = async (publicPath, localPath, sha, attempt) => {
  const url = new URL(publicPath, BASE_URL)
  url.searchParams.set('deploy', sha.slice(0, 12))
  url.searchParams.set('attempt', String(attempt))

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'WittenYeh.github.io-deploy-script' },
      redirect: 'follow',
    })
    if (!response.ok) return `${publicPath} returned HTTP ${response.status}`

    const localHash = sha256(readFileSync(localPath))
    const liveHash = sha256(Buffer.from(await response.arrayBuffer()))
    return localHash === liveHash ? undefined : `${publicPath} still serves an older or different file`
  } catch (error) {
    return `${publicPath} could not be fetched: ${error.message}`
  }
}

const waitForLiveSite = async (sha) => {
  const targets = collectLiveTargets()
  const deadline = Date.now() + LIVE_TIMEOUT_MS
  let attempt = 1

  while (Date.now() < deadline) {
    const results = await Promise.all(
      [...targets].map(([publicPath, localPath]) => compareLiveTarget(publicPath, localPath, sha, attempt)),
    )
    const failures = results.filter(Boolean)
    if (failures.length === 0) {
      console.log(`Live verification passed for ${targets.size} route and asset target(s).`)
      return
    }

    console.log(`Live site has ${failures.length} target(s) still propagating; retrying in ${POLL_INTERVAL_MS / 1000}s...`)
    attempt += 1
    await delay(POLL_INTERVAL_MS)
  }

  const finalResults = await Promise.all(
    [...targets].map(([publicPath, localPath]) => compareLiveTarget(publicPath, localPath, sha, attempt)),
  )
  const failures = finalResults.filter(Boolean)
  fail(`Live verification timed out:\n${failures.join('\n')}`)
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  ensureRepositoryState()

  console.log('Running content validation, lint, and production build...')
  run('npm', ['run', 'check'])

  if (options.dryRun) {
    console.log('Dry run complete. No commit, push, or network verification was performed.')
    return
  }

  if (options.stageAll) run('git', ['add', '-A'])
  ensureNoUnstagedChanges()

  const hasStagedChanges = hasGitDiff(['--cached'])
  if (hasStagedChanges && !options.message) {
    fail('Staged changes require --message so the deployment can commit them')
  }
  if (!hasStagedChanges && options.message) {
    fail('--message was provided, but there are no staged changes to commit')
  }

  if (hasStagedChanges) {
    run('git', ['diff', '--cached', '--check'])
    run('git', ['commit', '-m', options.message])
  }

  ensureNoUnstagedChanges()
  if (hasGitDiff(['--cached'])) fail('The index is not clean after commit')

  const sha = output('git', ['rev-parse', 'HEAD'])
  console.log(`Pushing ${sha.slice(0, 12)} to ${REMOTE}/${BRANCH}...`)
  run('git', ['push', REMOTE, BRANCH])

  const workflowRun = await waitForPages(sha)
  await waitForLiveSite(sha)

  console.log('Deployment complete.')
  console.log(`Commit: ${sha}`)
  console.log(`Workflow: ${workflowRun.html_url}`)
  console.log(`Site: ${BASE_URL}/`)
}

main().catch((error) => {
  console.error(`Deployment failed: ${error.message}`)
  process.exitCode = 1
})
