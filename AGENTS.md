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
