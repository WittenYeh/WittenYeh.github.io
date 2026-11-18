import assert from 'node:assert/strict'
import test from 'node:test'
import { projectCard } from './project-docs.mjs'
import { renderProject } from './render-project.mjs'

const config = {
  slug: 'example', title: 'Example', description: 'An example project.',
  repository: 'https://github.com/owner/example', card: { category: 'data', tags: [] },
}
const revision = 'a'.repeat(40)

function render(files) {
  const entries = Object.keys(files).map((path) => ({ path, mode: '100644', type: 'blob' }))
  return renderProject(config, { entries, revision }, (entry) => Buffer.from(files[entry.path]), () => '/images/chart.png')
}

test('cards survive absent, empty and non-Markdown docs directories', async () => {
  for (const files of [{}, { 'docs/.gitkeep': '' }, { 'docs/plot.png': 'image' }]) {
    const project = await render(files)
    assert.deepEqual(project.chapters, [])
    assert.deepEqual(projectCard(project).extraLinks.map((link) => link.label), ['GitHub'])
  }
  const project = await render({ 'ReadMe.MD': '# Example', 'notes/guide.md': '# Notes', 'docs/plot.png': '' })
  assert.deepEqual(project.chapters.map((page) => page.route), ['projects/example'])
  assert.deepEqual(projectCard(project).extraLinks.map((link) => link.label), ['Overview', 'GitHub'])
})

test('docs-only projects retain nested pages and distinct routes for colliding names', async () => {
  const project = await render({
    'docs/other/Guide.md': '# One', 'docs/other/guide.md': '# Two',
    'docs/api/guide.markdown': '# Three', 'docs/README.md': '# Contents',
  })
  const routes = project.chapters.map((page) => page.route)
  assert.equal(routes[0], 'projects/example/docs/readme')
  assert.equal(new Set(routes).size, 4)
  assert.ok(routes.includes('projects/example/docs/api/guide'))
  assert.deepEqual(projectCard(project).extraLinks[0], { label: 'Documentation', url: '/' + routes[0] + '/' })
})

test('rendered chapters share internal links, GitHub anchors and commit-pinned resources', async () => {
  const project = await render({
    'README.md': '# Example\n\n[Guide](docs/guide/Setup.md#installation) · [Contents](docs/)',
    'docs/index.md': '# Topics',
    'docs/guide/Setup.md': [
      '# Setup', '## Installation', '[Overview](../../README.md)', '[Source](../../src/main.cpp)',
      '<img src="../../plot.png" alt="Chart">', '[Website](https://example.com)',
      '<script>discardMe()</script>', '```cpp\nint main();\n```', '```json\n{"value": true}\n```',
    ].join('\n\n'),
    'plot.png': '', 'src/main.cpp': '',
  })
  const overview = project.chapters[0]
  const setup = project.chapters.find((page) => page.file.endsWith('Setup.md'))
  assert.match(overview.body, /href="\/projects\/example\/docs\/guide\/setup\/#user-content-installation"/)
  assert.match(overview.body, /href="\/projects\/example\/docs\/index\/"/)
  assert.equal(setup.headingId, 'user-content-setup')
  for (const signal of ['id="user-content-installation"', 'href="/projects/example/"', '/blob/' + revision + '/src/main.cpp',
    'src="/images/chart.png"', 'href="https://example.com"', 'data-language="cpp"', 'data-language="json"',
    'hljs-keyword', 'code-copy-button']) assert.ok(setup.body.includes(signal), signal)
  assert.doesNotMatch(setup.body, /discardMe/)
})
