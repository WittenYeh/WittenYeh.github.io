import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const benchmarkDir = resolve(root, 'public', 'gdse-benchmarks')
const marker = 'data-termhub-benchmark'

const head = `<head data-termhub-benchmark>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#2e3440" />
  <title>GDSE Benchmark Result</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #2e3440; color: #eceff4; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; }
    .termhub-benchmark-nav { min-height: 60px; padding: 14px clamp(16px, 4vw, 56px); background: #3b4252; border-top: 3px solid #88c0d0; border-bottom: 1px solid #4c566a; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .termhub-benchmark-nav a { color: #88c0d0; text-decoration: none; font-size: 14px; }
    .termhub-benchmark-nav a:hover { color: #a3be8c; }
    .termhub-benchmark-nav span { color: #9099ab; font-size: 12px; }
    body > div { width: min(100%, 1280px); margin: 0 auto; padding: clamp(18px, 4vw, 44px); overflow: hidden; }
    .plotly-graph-div { width: 100% !important; max-width: 1200px !important; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 18px 50px rgba(0, 0, 0, .28); }
    @media (max-width: 640px) {
      .termhub-benchmark-nav { align-items: flex-start; flex-direction: column; gap: 6px; }
      body > div { padding: 12px; }
      .plotly-graph-div { min-height: 520px; }
    }
  </style>
</head>`

const nav = `<body>
  <header class="termhub-benchmark-nav">
    <a href="../benchmarks">$ cd ~/benchmarks</a>
    <span>GDSE · interactive result</span>
  </header>`

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#2e3440" />
  <meta http-equiv="refresh" content="0; url=../benchmarks" />
  <title>GDSE Benchmarks</title>
  <style>
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #2e3440; color: #eceff4; font: 14px/1.6 "SFMono-Regular", Consolas, monospace; }
    main { width: min(90vw, 640px); padding: 32px; border: 1px solid #4c566a; border-top: 3px solid #88c0d0; border-radius: 8px; background: #3b4252; }
    a { color: #88c0d0; }
  </style>
</head>
<body>
  <main>
    <p>$ cd ~/benchmarks</p>
    <p>Opening the integrated GDSE benchmark index…</p>
    <p><a href="../benchmarks">Continue to benchmark results →</a></p>
  </main>
</body>
</html>
`

let changed = 0
for (const file of readdirSync(benchmarkDir).filter(name => name.endsWith('.html') && name !== 'index.html')) {
  const path = resolve(benchmarkDir, file)
  let html = readFileSync(path, 'utf8')
  if (html.includes(marker)) continue

  const original = html
  html = html.replace('<head><meta charset="utf-8" /></head>', head)
  html = html.replace('<body>', nav)
  html = html.replaceAll('style="height:600px; width:1000px;"', 'style="height:600px; width:100%;"')
  html = html.replaceAll('"width":1000,"height":600', '"autosize":true,"height":600')
  html = html.replaceAll('"plot_bgcolor":"white","paper_bgcolor":"white"', '"plot_bgcolor":"#eceff4","paper_bgcolor":"#eceff4"')

  if (html === original || !html.includes(marker)) {
    throw new Error(`Could not apply TermHub shell to ${file}`)
  }

  writeFileSync(path, html)
  changed += 1
}

writeFileSync(resolve(benchmarkDir, 'index.html'), indexHtml)

console.log(`TermHub benchmark styling ready (${changed} file${changed === 1 ? '' : 's'} updated).`)
