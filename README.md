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

仓库所有者已授权文档更新自动发布：凡涉及项目文档或仓库文档的修改，在完整检查通过后，应立即只暂存本次相关文件，并运行统一部署脚本提交和发布，无需再次等待部署指令。该授权不包括工作区中的无关改动。

## 去哪里修改主页内容

主页内容位于 `content/`。

| 内容 | 文件 |
| --- | --- |
| 姓名、标题、邮箱、社交链接、栏目开关 | `content/site.json` |
| 个人简介 | `content/about.md` |
| 学校、职位、教育和工作经历 | `content/experience.json` |
| 研究方向 | `content/research.json` |
| 论文列表 | `content/publications/*.md` |
| 项目磁贴和上游文档来源 | `content/project-docs/<project-slug>/project.json` |
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

### 项目磁贴、README 与文档

每个项目在 `content/project-docs/<project-slug>/project.json` 中登记一次。`slug` 与目录名一致。`card` 控制 Projects 磁贴的分类、标签、简介、缩略图和亮点，`repository` 指向公开 GitHub 仓库。下面沿用 ARTEA 的字段。

```json
{
  "slug": "artea",
  "title": "ARTEA",
  "description": "Theory-Guided Hierarchical Graph Index for High-Performance ANN Search.",
  "repository": "https://github.com/NTU-Siqiang-Group/Artea",
  "card": {
    "category": "data",
    "date": "2026-08-01",
    "tags": ["Graph Index", "Vector Search"],
    "featuredImage": "/images/logos/artea.webp"
  }
}
```

| 上游仓库中的文件 | 本站生成的内容 |
| --- | --- |
| 根目录 `README.md` | 独立的 `/projects/<project-slug>/` 概览页，磁贴显示 Overview |
| `docs/` 及子目录中的 `.md` 或 `.markdown` 文件 | 每个文件生成一个章节，磁贴的 Documentation 入口指向第一章 |
| 仅有根 README | 磁贴和概览页 |
| 没有 README，`docs/` 也没有 Markdown | 项目磁贴及 GitHub 链接 |

文档保留子目录层次。例如 `docs/tutorial/Quick_Start.md` 发布在 `/projects/<project-slug>/docs/tutorial/quick-start/`。`docs/index.md` 或 `docs/README.md` 优先作为第一章，其他文件按路径排序。Markdown 互链指向站内对应页面，其他仓库相对链接指向同一 Git 提交中的文件。仓库内引用的栅格图片随网站发布。可选的 `imageAssets` 将某张上游图片的 Git blob SHA 映射到本站已有的优化图片，上游修改图片后会使用新版本。

`npm run dev` 和 `npm run build` 启动时读取上游默认分支，对每个项目固定一次提交，再根据同一份内容生成网页、导航和 sitemap。上游的新提交在主页仓库的下一次构建部署后上线，也可以手动运行 Pages 工作流触发更新。GitHub 请求失败会中止构建，成功抓取到的源文件缓存于忽略提交的 `.cache/project-docs/`。

```bash
npm run projects:sync
PROJECT_DOCS_OFFLINE=1 npm run check
```

本地缓存也供 `npm run deploy -- --dry-run` 使用。在新工作区先运行一次 `npm run projects:sync`。如需保留改名前的项目地址，在 `project.json` 的 `legacySlugs` 中列出先前的 slug。终端示例、代码块和公开 API 的文档排版约定见 `AGENTS.md`。

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
