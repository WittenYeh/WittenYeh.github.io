import hljs from 'highlight.js'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'

const terminalBlockLanguages = new Set(['command', 'output'])

export const markdown = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, language) {
      // These pseudo-languages use ProjectDocs' paired terminal presentation.
      if (terminalBlockLanguages.has(language)) return code
      const resolvedLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      return hljs.highlight(code, {
        language: resolvedLanguage,
        ignoreIllegals: true,
      }).value
    },
  }),
)

export const addCodeLanguageLabels = (html) =>
  html.replace(
    /<pre><code class="hljs language-([^"]+)">/g,
    (openingTag, language) => terminalBlockLanguages.has(language)
      ? openingTag
      : `<pre data-language="${language}"><code class="hljs language-${language}">`,
  )

const copyIcon = [
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
  '<rect x="9" y="9" width="11" height="11" rx="2"></rect>',
  '<path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>',
  '</svg>',
].join('')

export const addCodeBlockTools = (html) =>
  html.replace(/<pre([^>]*)><code/g, (_openingTag, attributes) => {
    const language = attributes.match(/\sdata-language="([\w.+#-]+)"/)?.[1]
    const languageLabel = language
      ? `<span class="code-language-label">${language}</span>`
      : ''
    return [
      `<pre${attributes}><span class="code-block-tools">`,
      `<button type="button" class="code-copy-button" aria-label="Copy code to clipboard" title="Copy code">${copyIcon}</button>`,
      languageLabel,
      '</span><code',
    ].join('')
  })
