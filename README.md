# WittenYeh.github.io

基于 [TermHub](https://github.com/H-Freax/TermHub) 定制的学术主页，部署目标为：

<https://wittenyeh.github.io/>

页面包含 About、Research、Publications、Projects、Experience、News、CV、Benchmarks 和 Contact。个人资料目前使用空数据与通用占位图，不包含模板原有的示例人物或虚构成果。

## 本地预览

需要 Node.js 20 或更新版本：

```bash
npm ci
npm run dev
```

提交前建议运行：

```bash
npm run benchmarks:style
npm run validate
npm run lint
npm run build
```

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

### 姓名、学校、邮箱和社交链接

编辑 `content/site.json`：

- `name`：姓名及论文作者名变体。
- `title`、`tagline`：主页标题和一句话简介。
- `terminal`：终端用户名、轮换短语、技能和时区。
- `contact`：邮箱和所在地。
- `social`：GitHub、Google Scholar、LinkedIn 等链接。
- `features`：控制页面是否显示在导航栏。

### 头像

将头像放进 `content/images/`，然后修改 `content/site.json` 的 `avatar`，例如：

```json
"avatar": "profile.jpg"
```

当前的 `content/images/avatar.svg` 是通用占位图，可以直接替换。

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
---

项目简介。

- 项目亮点一
- 项目亮点二
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

以后每次更新只需：

```bash
git add .
git commit -m "Update academic homepage"
git push origin main
```

GitHub Actions 会安装依赖、构建并发布 `dist/`。可在仓库的 Actions 页面查看部署状态。

## 模板更新

本站基于 TermHub，许可证为 GPL-3.0-only。若要同步上游模板更新，建议先建立独立分支并提交自己的改动，再执行：

```bash
git remote add termhub-upstream https://github.com/H-Freax/TermHub.git
git fetch termhub-upstream
git merge termhub-upstream/main
```

模板升级可能与本站新增的 Research、CV、Benchmarks 等路由冲突，合并后必须重新执行完整构建检查。
