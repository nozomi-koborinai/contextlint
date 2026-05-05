---
title: Monorepo
description: 以一份配置统一校验多个 package 文档的 contextlint 配置示例。
---

本食谱面向多个 package 在同一仓库中开发的 **monorepo**，提供配置示例。可不依赖 bun workspace / pnpm workspace / yarn workspace / Nx / Turborepo 等工作区管理工具的差异通用使用。

## 适用于哪类项目

- 在根目录直下以 `packages/` 或 `apps/` 形式并列多个 package
- 各 package 独自持有 `docs/` 或 `README.md`
- 仓库顶层也存在横向文档（如 `docs/architecture.md`）
- **不希望按 package 分散配置** 文档完整性规则（希望通过一份配置统一治理）

也支持仅校验单个 package 文档的运维方式。`include` 模式的搭建是关键。

## 推荐配置 (`contextlint.config.json`)

只在仓库根目录放置一份。

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": [
    "docs/**/*.md",
    "packages/*/docs/**/*.md",
    "packages/*/README.md",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  "rules": [
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "ctx001" },
    {
      "rule": "sec001",
      "options": {
        "files": "packages/*/README.md",
        "sections": ["Installation", "Usage"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/changelog.md",
        "column": "Status",
        "values": ["unreleased", "released", "deprecated"]
      }
    },
    { "rule": "grp002" }
  ]
}
```

`include` 中的各 glob 被解释为 **从根配置文件出发的相对路径**。即使在 `packages/api` 内执行 `npx contextlint`，根目录的配置也会被自动检测，并使用相同的 glob（详见 [配置文件的自动检测](/zh/docs/configuration/auto-detection/)）。

## 选择各条规则的理由

### include 模式的搭建方式

在 monorepo 中，"以何种单位包含校验对象"是最重要的设计决断。下面给出 3 种典型组合：

| 用途 | include 模式 | 校验对象 |
| --- | --- | --- |
| 仅各 package 的 `docs/` | `packages/*/docs/**/*.md` | package 持有的详细文档 |
| 同时包含各 package 的 `README.md` | 上述 + `packages/*/README.md` | 全部公开文档 |
| 同时包含根目录横向文档 | 上述 + `docs/**/*.md` | 整个仓库的架构文档 |

本食谱将 3 种全部包含。请注意 **`*/`（仅一层）与 `**/`（递归）的区分使用**：

- `packages/*/docs/**/*.md` — 匹配 `packages/api/docs/...`，不匹配 `packages/api/sub/sub/docs/...`
- `packages/**/docs/**/*.md` — 匹配任何层级的 `docs/`（在 Nx 这样的 nested workspaces 中有用）

`!**/node_modules/**` 与 `!**/dist/**` 这两个否定模式是 **保险**，避免误将依赖包文档或构建产物拾取。如果 `include` 的肯定模式已足够收紧则非必需，但若有多名开发者会无意识地变更 glob，加上这道保险会有效。

### REF-001 / REF-005 — 保护 package 间链接

monorepo 中容易出现从 `packages/api/docs/architecture.md` 到 `packages/web/docs/api-contract.md` 的横向链接，每次重命名都会悄悄断裂。同时保护链接 (REF-001) 与锚点 (REF-005)。

这些规则会查看 `include` 对象的 Markdown 文件整体进行解析，因此其他 package 的文档也能用同一份配置校验。

### GRP-002 — package 间的循环引用

`api` 的 docs 引用 `web`，`web` 的 docs 又引用 `api`，这种形式短期常见，但作为依赖关系并不健全（应整理为单向）。用 [GRP-002 循环引用](/zh/docs/rules/grp-002/) 保证引用图为 DAG。

monorepo 中循环引用经常翻转为 package 单位的依赖关系（`package.json` 的 dependencies），先在文档侧检出可使设计调整更轻松。

### SEC-001 — 统一 README 模板

如果 `packages/*/README.md` 至少具备 `Installation` / `Usage` 章节，新用户开始阅读各 package 的认知成本会降低。

将 [SEC-001 必需章节](/zh/docs/rules/sec-001/) 限定在 `packages/*/README.md` 上应用。section 名请按团队惯例修改（也可使用 `概要` / `使い方` 这样的中文/日文标题）。

### CTX-001 — 占位符检测（全局）

多个 package 并列的仓库中，特定 package 容易残留 TODO 或 TBD。全局检测可在发布前夕梳理出未完成之处。

不收紧 `files`，应用于 `include` 的全部对象。

### TBL-003 — changelog 的状态约束

如果各 package 持有 `CHANGELOG.md` 或 `changelog.md`，`Status` 列以 `unreleased` / `released` / `deprecated` 这类固定值运维的情况较多。可防止表述偏差（`WIP` / `done` / `pending` 等）。

对于不持有 `changelog.md` 的 package，本规则不会检出任何内容，无害。

### 本食谱未采用的规则

| 规则 | 不采用的理由 |
| --- | --- |
| TBL-006 | 当各 package 的 ID 体系不同时难以应用。若各 package 使用独立 ID 则无需 |
| REF-002 / REF-003 | 需求 ID 的可追溯性以 feature 单位运维比 monorepo 更自然 |
| REF-004 | 持有 zone 结构的 monorepo 较少 |
| GRP-001 / GRP-003 | 因各 package 依赖图形态不同，移除画一的 chain 校验 |
| STR-001 | 各 package 所需文件多由 package.json 的 `files` 字段管理 |

如果 monorepo 中进行需求管理，请考虑与 [规格驱动开发的仓库](/zh/docs/recipes/spec-driven-development-setup/) 食谱组合使用。

## 运维上的注意事项

### 仅希望 lint 单个 package 时

通过 CLI 参数传入 glob，可覆盖配置文件的 `include`。

```bash
# 仅 lint packages/api
npx contextlint "packages/api/**/*.md"
```

但是覆盖 `include` 后，项目作用域规则（REF-001 / REF-005 / GRP-002 等）将 **限定在指定的 glob 内** 进行评估。若想校验从 `packages/api` 到 `packages/web` 的链接，请不要用参数收紧范围而是 lint 整体，或者同时列出 `packages/api/**/*.md` 与 `packages/web/**/*.md`。

详见 [include 模式](/zh/docs/configuration/include-patterns/) 中关于优先级的章节。

### CI 中的路径过滤与矩阵

monorepo 中可能希望仅在 `docs` 相关变更的 package 上 CI 校验，但 contextlint 拥有 **项目作用域规则**（REF-001 / REF-002 / GRP-002 等），收紧对象会破坏对引用目标的存在校验。

推荐以下两种之一：

1. **始终 lint 整个仓库** — `pull_request: paths: ["**/*.md"]` 这类过滤器的"仅在 Markdown 变更的 PR 上执行"是允许的，但执行时查看整体
2. **不使用 CLI 的子集指定** — monorepo 中以无参数执行 `npx contextlint`

仅当执行时间较长时，才切换为为 CI 单独准备一份将各 package 目录列入 include 的独立配置文件的运维方式。具体的工作流示例请参考 [CI 集成模式](/zh/docs/recipes/ci-integration-patterns/)。

### 按 package 差异化

"`apps/` 严格强制模板，`packages/` 内部 lib 宽松"这样的差异化可通过各规则的 `files` 选项实现。

```json
{
  "rule": "sec001",
  "options": {
    "files": "apps/*/README.md",
    "sections": ["Overview", "Setup", "Deployment"]
  }
}
```

即使用 `files` 收紧应用范围，规则评估的文档集合（即 `include`）依然保持整体不变。详见 [按规则的作用域指定](/zh/docs/configuration/per-file-rule-scoping/)。

### 在子目录执行时的行为

在 bun workspace / pnpm workspace 这样的环境中，从 `packages/api/` 目录执行 `npx contextlint`，配置文件会沿父目录向上自动检测。glob 以根目录（即配置文件所在位置）为基点解释，因此即使在子目录执行，结果也相同。

详见 [配置文件的自动检测](/zh/docs/configuration/auto-detection/)。
