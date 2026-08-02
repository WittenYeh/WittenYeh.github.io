# WittenYeh.github.io

基于 [TermHub](https://github.com/H-Freax/TermHub) 定制的学术主页，部署目标为：

<https://wittenyeh.github.io/>

首页包含 About、News、Experience 和 Selected Publications；独立页面包含 Publications、Projects、CV 和 Benchmarks。

## 本地预览

需要 Node.js 20 或更新版本：

```bash
npm ci
npm run dev
```

提交前建议运行：

```bash
npm run check
```

Codex 和其他代码 Agent 在修改仓库前必须阅读根目录的英文规范 [`AGENTS.md`](AGENTS.md)。该文件概括了内容结构、安全约束、项目文档扩展方式和统一部署流程。

## 去哪里修改主页内容

主页内容位于 `content/`。

| 内容 | 文件 |
| --- | --- |
| 姓名、标题、邮箱、社交链接、栏目开关 | `content/site.json` |
| 个人简介 | `content/about.md` |
| 学校、职位、教育和工作经历 | `content/experience.json` |
| 研究方向 | `content/research.json` |
| 论文列表 | `content/publications/*.md` |
| 项目列表 | `content/projects/*.md` |
| 最新动态 | `content/news.json` |
| CV 页面说明 | `content/cv.json` |
| Benchmark 入口卡片 | `content/benchmarks.json` |
| 头像和内容图片 | `content/images/` |

`content/research.json` 中的 `sectionTitle` 控制首页研究项目栏目的标题，并会自动同步到 SEO 内容。

### 姓名、学校、邮箱和社交链接

编辑 `content/site.json`：

- `name`：姓名及论文作者名变体。
- `title`：网站标题。
- `terminal`：终端用户名、轮换短语、技能和时区。
- `contact`：邮箱和所在地。
- `social`：GitHub、Google Scholar、LinkedIn 等链接。
- `githubContributions`：首页 GitHub contribution wall 的用户名、公开 API 和自动刷新间隔。
- `features`：控制页面是否显示在导航栏。

### GitHub contribution wall

首页的 `githubContributions` section 会在浏览器中读取公开 GitHub contribution 数据，因此新增 contribution 不需要修改、提交或重新部署本站仓库。默认每小时重新检查一次，并把最近一次成功结果缓存在浏览器中；数据源暂时不可用时会显示缓存结果。

配置位于 `content/site.json`：

```json
"githubContributions": {
  "username": "WittenYeh",
  "apiBaseUrl": "https://github-contributions-api.jogruber.de/v4",
  "year": "last",
  "refreshMinutes": 60
}
```

在 `sections` 中加入、移除或移动 `githubContributions` 即可显示、隐藏或调整位置。该组件只读取公开数据；不要把 GitHub Personal Access Token 写入 `content/site.json` 或任何前端环境变量。

### 头像

将头像放进 `content/images/`，然后修改 `content/site.json` 的 `avatar`，例如：

```json
"avatar": "profile.jpg"
```

当前头像为 `content/images/mikasa.jpg`，可以直接替换该文件，或在 `site.json` 中改用其他文件名。

### 个人简介

将个人简介写入 `content/about.md`。正文位于 YAML frontmatter 后面：

```markdown
---
journeyPhases: []
version:
  current: ""
  history: []
---

Write your English biography here.
```

### Experience

首页 Experience 列表使用 `content/experience.json` 中的 `timeline`，每条经历只需维护一次：

- `title`：职位或学位名称。
- `company`：学校、学院或机构。
- `companyUrl`：对应学校、学院或机构官网；首页校徽会链接到这里。
- `start`、`end`：使用 `YYYY-MM`；当前经历的 `end` 填写 `Present`。
- `summary`：首页 Experience 时间线中的说明。

首页 Experience 列表和构建生成的 SEO 内容都会自动从这份数据同步。

### 论文

每篇论文使用一个 Markdown 文件：

```markdown
---
id: paper-id
title: "Paper title"
authors: [Author One, Author Two]
venue: Conference Name
venueType: conference
year: 2026
status: published
links:
  paper: "https://..."
  code: "https://..."
---

Write the abstract here.
```

可用的 `venueType`：`conference`、`workshop`、`demo`、`preprint`。

### 项目

每个项目也是一个 Markdown 文件：

```markdown
---
title: Project name
category: data
date: 2026-01-01
tags: [Graph, Database, Benchmark]
link: "https://..."
isOpenSource: true
featuredImage: /images/projects/project-name-preview.webp
---

项目简介。

- 项目亮点一
- 项目亮点二
```

`featuredImage` 是 Projects 列表中的预览缩略图，也支持点击放大。图片应保存在 `content/images/projects/`（可复用 `content/images/logos/` 中已有的优化 Logo），并使用 `/images/...` 路径引用；`npm run validate` 会检查文件是否存在。

### 为项目添加 README 或多页文档

项目文档使用统一的内容驱动结构。不要为单个项目创建专用 React 组件；所有项目共用 `src/components/ProjectDocs.tsx`，路由、侧边栏、上一章/下一章、SEO 页面和 sitemap 均根据内容配置自动生成。

若项目暂时只需要展示 GitHub README，仍然使用同一套结构，但只登记一个章节：

```text
content/project-docs/<project-slug>/
├── project.json
└── readme.md
```

在 `project.json` 的 `chapters` 中仅添加 `readme.md`，并把 `shortTitle` 设置为 `README`。项目会发布在 `/projects/<project-slug>/`，侧边栏只有一个 README 入口；以后需要正式文档时，只需继续添加章节文件和配置，无需新增组件或路由。GitHub README 中的仓库相对链接必须改为完整 URL，图片应保存到 `content/images/projects/<project-slug>/` 并使用 `/images/projects/<project-slug>/...` 引用，以保证构建和部署不依赖外部仓库。

每个带文档的项目使用以下目录：

```text
content/project-docs/<project-slug>/
├── project.json
├── welcome.md
├── module-one.md
└── module-two.md
```

`<project-slug>` 必须使用小写 kebab-case，并与 `project.json` 中的 `slug` 完全一致。`project.json` 示例：

```json
{
  "slug": "my-project",
  "title": "My Project",
  "description": "A short project description.",
  "repository": "https://github.com/user/my-project",
  "repositoryLabel": "View repository",
  "updated": "2026-08-01",
  "badges": [
    { "label": "Python 3.10+", "colorScheme": "blue" }
  ],
  "hero": {
    "type": "ascii",
    "ariaLabel": "My Project",
    "lines": ["ASCII art line 1", "ASCII art line 2"]
  },
  "chapters": [
    {
      "slug": "welcome",
      "title": "Welcome & Usage",
      "shortTitle": "Welcome",
      "file": "welcome.md",
      "description": "Install and use the project.",
      "hideTitle": true
    },
    {
      "slug": "implementation",
      "title": "Implementation",
      "file": "implementation.md",
      "description": "How the main module works."
    }
  ]
}
```

编写规则：

1. `chapters` 数组顺序就是侧边栏和上一篇/下一篇的顺序。
2. 第一章发布在 `/projects/<project-slug>/`；后续章节发布在 `/projects/<project-slug>/<chapter-slug>/`。
3. 章节的 `slug` 和 Markdown 文件名必须使用小写 kebab-case，并且在项目内唯一。
4. 每个 Markdown 文件只写一个小章节的正文；页面标题和说明来自 `project.json`，正文建议从 `##` 开始。
5. 目录中的每个 Markdown 文件都必须在 `chapters` 中登记；缺失文件、重复 slug、未登记文件会使 `npm run validate` 或构建失败。
6. `hero` 是可选配置。若某一章设置 `hideTitle: true`，该项目必须提供 `hero`；页面会隐藏可见的大标题并在相同位置显示 ASCII 字符画，同时保留屏幕阅读器可访问的 `h1`。
7. 在 `content/projects/<project-slug>.md` 的 `extraLinks` 中加入文档入口：

```yaml
extraLinks:
  - label: Documentation
    url: /projects/my-project
```

新增项目文档不需要修改 `App.tsx`、模板组件或 SEO 脚本。完成后运行：

```bash
npm run validate
npm run lint
npm run build
```

## 更新 CV

1. 将 PDF 保存为 `public/cv.pdf`。
2. 在 `content/cv.json` 中把 `available` 改为 `true`。
3. 如需更换文件名，同时修改 JSON 文件中的 `file`。

## 更新 GDSE benchmark

交互结果位于 `public/gdse-benchmarks/`，构建时会原样发布到：

```text
https://wittenyeh.github.io/gdse-benchmarks/
```

更新步骤：

1. 将新生成的 Plotly HTML 文件复制到 `public/gdse-benchmarks/`。
2. 在 `content/benchmarks.json` 中增加、删除或调整入口卡片。
3. 执行 `npm run benchmarks:style`，为所有图表重新加入 TermHub 导航、Nord 外壳和响应式布局。
4. 执行 `npm run build`，检查 `dist/gdse-benchmarks/` 中是否包含全部结果。

不要手工修改生成图表中约 4.8 MB 的内嵌 Plotly 代码；应重新生成 HTML，然后运行样式脚本。

## 发布到 GitHub Pages

仓库的 `.github/workflows/pages.yml` 已将 Vite 基路径设置为 `/`，适用于用户主页仓库 `WittenYeh.github.io`。

首次启用时，在 GitHub 打开：

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

仓库根目录提供统一部署命令。它会依次执行完整校验、提交已暂存的文件、推送 `main`、等待 GitHub Pages workflow，并将线上路由和项目图片与本地 `dist/` 进行哈希对比。

只做本地检查、不提交或联网：

```bash
npm run deploy -- --dry-run
```

更新并部署时，建议只暂存本次任务涉及的文件：

```bash
git add <changed-files>
npm run deploy -- --message "Update academic homepage"
```

只有确认工作区内全部改动都属于本次部署时，才使用：

```bash
npm run deploy -- --all --message "Update academic homepage"
```

若工作区干净，直接运行 `npm run deploy` 会验证并部署当前 `HEAD`。脚本仅允许从 `main` 发布；任何未暂存文件、冲突、校验失败、Pages workflow 失败或线上文件不一致都会停止流程。公开仓库可直接查询 GitHub API；如果遇到 API rate limit，可设置 `GITHUB_TOKEN`。

在受限的 Codex 环境中，只需对 `npm run deploy` 申请一次可复用授权；该调用内部已经包含 `git push`、GitHub Actions 状态轮询和线上 HTTP 校验，不应再逐项申请。

## SEO 与搜索引擎收录

网站构建时会自动生成搜索引擎可直接读取的静态内容、独立页面 metadata 和 canonical URL：

- 首页 metadata 与 `ProfilePage` / `Person` JSON-LD：`index.html`
- Sitemap：`public/sitemap.xml`
- 爬虫规则：`public/robots.txt`
- 静态 SEO 页面生成逻辑：`scripts/generate-seo.mjs`
- 构建产物 SEO 校验：`scripts/validate-build.mjs`

姓名、简介、经历、研究项目、News 和论文仍然只需修改 `content/` 中对应文件；运行 `npm run build` 时，静态 SEO 内容会自动同步。

部署后，在 Google Search Console 中验证 `https://wittenyeh.github.io/`，并提交：

```text
https://wittenyeh.github.io/sitemap.xml
```

Google 提供的 HTML 验证文件可以直接放在 `public/`，验证 meta tag 也可以加入 `index.html`。

## 模板更新

本站基于 TermHub，许可证为 GPL-3.0-only。若要同步上游模板更新，建议先建立独立分支并提交自己的改动，再执行：

```bash
git remote add termhub-upstream https://github.com/H-Freax/TermHub.git
git fetch termhub-upstream
git merge termhub-upstream/main
```

模板升级可能与本站新增的 Research、CV、Benchmarks 等路由冲突，合并后必须重新执行完整构建检查。
