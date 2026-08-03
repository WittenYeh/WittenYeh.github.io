# Repository Instructions for Codex and Other Coding Agents

These instructions apply to the entire repository. Read this file and `README.md` before changing anything.

## Repository Purpose

This repository builds and deploys Weitang Ye's academic homepage at <https://wittenyeh.github.io/>. It is a Vite, React, TypeScript, and Chakra UI application based on TermHub. Most site updates are content changes under `content/`; avoid changing React components when the content system already supports the requested result.

## Required Workflow

1. Inspect `git status --short --branch` before editing. Existing changes belong to the user unless the current task clearly created them.
2. Read the relevant content, loader, validator, and component before making structural changes.
3. Use `apply_patch` for text edits. Keep generated output out of commits and never edit `dist/` directly.
4. Run `npm run check` before handing off a local change. This performs content validation, linting, TypeScript compilation, the production build, SEO generation, and build-output validation.
5. Never push or deploy unless the user explicitly asks for publication. Do not amend published commits or rewrite history.

The repository owner has provided standing publication authorization for
documentation work: after completing any documentation-related change and
passing the required checks, immediately stage the files belonging to that
change and run the deployment script without waiting for a separate deployment
request. This authorization does not permit staging or publishing unrelated
worktree changes.

## Content Architecture

- Site identity and feature flags: `content/site.json`
- Biography: `content/about.md`
- Education and experience: `content/experience.json`
- Research and news: `content/research.json` and `content/news.json`
- Publications: `content/publications/*.md`
- Project cards: `content/projects/*.md`
- Project pages: `content/project-docs/<project-slug>/`
- Content images: `content/images/`
- CV and benchmark entry data: `content/cv.json` and `content/benchmarks.json`

Project pages are content-driven. Do not create a project-specific React component. Use `project.json` plus Markdown chapters under `content/project-docs/<project-slug>/`; the shared `src/components/ProjectDocs.tsx` supplies routing, sidebar navigation, previous/next navigation, theming, SEO entry points, and sitemap entries. A README-only project uses one chapter named `README` and can grow into multiple chapters later.

Keep each chapter's `description` as a concise plain-text SEO summary. When a
chapter needs a structured introduction below its title, add `overview` as a
non-empty array of list-item strings; the shared renderer and static SEO output
generate the lead sentence and unordered list.

For terminal examples in project documentation, put user input in a
<code>```command</code> fence and captured output in an immediately following
<code>```output</code> fence. The shared renderer joins, labels, and colors each
pair globally; do not interleave commands and output in one `console` block.
For ordinary code, use a standard fenced language such as `python`, `yaml`,
`toml`, `bash`, or `typescript`; the shared Markdown pipeline applies syntax
highlighting automatically.

### Public API documentation

Use a PyTorch/Sphinx-style reference layout for every project's public APIs:

1. Document only the stable package exports and their public constructors,
   properties, functions, CLI commands, and instance methods. Never present a
   private helper as an API.
2. Give every API its own level-three heading, including inherited methods that
   are public on more than one class. Do not combine two API names in one
   heading and do not compress APIs into one-row entries in a role table.
3. Put a GitHub source link immediately after the API name with this exact
   reusable Markdown convention:

   ```markdown
   ### `load_manifest` [source](https://github.com/OWNER/REPOSITORY/blob/main/PATH "View source on GitHub")
   ```

   Link to the corresponding implementation file. The shared
   `ProjectDocs.tsx` renderer recognizes the exact `View source on GitHub`
   title, styles the heading as an API separator, and displays the link as a
   GitHub logo. Do not embed an icon, raw HTML, or project-specific React code.
4. Follow the heading with a fenced prototype. Use `python` for Python APIs,
   `bash` for CLI commands, and the appropriate standard language for other
   interfaces. Keep parameter types, keyword-only markers, defaults, and return
   types synchronized with the source.
5. Add a concise one- or two-paragraph description immediately after the
   prototype. Explain the contract and important behavior rather than restating
   the API name.
6. Add a bold `Parameters` label followed by either a table or an unordered
   list. Describe every parameter, including its type, default when applicable,
   allowed values, and semantic role. Write `None.` for APIs with no parameters.
7. Add a bold `Returns` label when the return value is part of the useful
   contract. State both its type and meaning; omit it for constructors and
   mutating methods that only return `None` when that omission is clearer.
8. Keep usage examples outside individual API entries under an `Example` or
   `Examples` section. Use a short linked index when readers need an overview;
   do not duplicate full prototypes in multiple chapters.
9. Before publishing, compare every documented prototype with the current
   source and confirm that the static SEO HTML contains the headings,
   prototypes, parameters, and source links.

When renaming a project-doc slug, move its content directory and project card, update its preview asset and repository links, and list prior slugs in `project.json` under `legacySlugs`. The shared routing and SEO pipeline preserves old chapter URLs as `noindex` compatibility pages that canonicalize and redirect to the current slug.

When copying a GitHub README, pin the source commit, preserve the wording, rewrite repository-relative links to stable absolute URLs, and host important raster images under `content/images/projects/<project-slug>/`. Prefer an existing optimized site asset when it is visually equivalent. Do not silently rewrite technical claims.

## Deployment

Use the repository deployment script instead of manually chaining validation, commit, push, workflow polling, and live HTTP checks.

For local verification only:

```bash
npm run deploy -- --dry-run
```

For a scoped update, stage only the intended files and let the script commit and deploy them:

```bash
git add <changed-files>
npm run deploy -- --message "Describe the update"
```

`--all` is available only when every worktree change belongs to the task:

```bash
npm run deploy -- --all --message "Describe the update"
```

With a clean worktree, `npm run deploy` verifies and deploys the current `HEAD`. The script always runs the complete local check, restricts publication to `main`, pushes to `origin`, waits for `.github/workflows/pages.yml`, and compares live route and project-image hashes against `dist/`.

In a sandboxed Codex session, request one approval for `npm run deploy` with the reusable prefix `npm run deploy`. That single reviewed script invocation covers the required `git push`, GitHub Actions API polling, and live-site HTTP verification. Do not request separate approvals for those internal steps.

If deployment fails, preserve the worktree and commit history, report the failing command or GitHub Actions URL, and diagnose before retrying.

## Final Handoff

Report the changed behavior, validation results, commit SHA when applicable, GitHub Actions result, and live URL. Mention any remaining limitation or intentionally deferred documentation.
