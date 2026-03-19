# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

基于规则的结构化 Markdown 文档检查工具。
确定性地、在数秒内检测断裂引用、重复 ID、缺失章节和结构性问题，
CI 友好。

## 为什么选择 contextlint？

在 AI 驱动开发的时代，SDD（Spec Driven Development：规格驱动开发）
等方法论正在兴起——首先用 Markdown 编写规格文档，
然后让 AI 基于这些文档生成实现。
随着项目采用文档驱动的工作流程，
相互关联的 Markdown 文件数量不断增长：
需求定义、设计决策、API 规格、ADR、RFC 等等。

这些文档形成了一个依赖关系图。某个 ID 引用另一个 ID，
文件之间通过链接关联，状态的稳定性向下游传播。
当这个图谱出现问题时（删除的需求、拼写错误的 ID、缺失的章节），
其影响是无声的。

contextlint 为结构化 Markdown 提供**确定性的静态验证**。
无需 AI，零成本，CI 友好。

> contextlint 专注于**内容语义和跨文件完整性**。
> 对于 Markdown 语法、格式和样式，
> 请配合使用 [markdownlint](https://github.com/DavidAnson/markdownlint)——
> 两者互为补充。

## 快速开始

安装：

```bash
npm install -D @contextlint/cli
```

创建 `contextlint.config.json`：

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

运行：

```bash
npx contextlint
```

contextlint 会自动从当前目录或父目录中检测
`contextlint.config.json`。`include` 字段定义默认的文件模式，
CLI 参数可覆盖它。两者都未指定时，使用 `**/*.md`。

输出示例：

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

> 添加 `$schema` 可在 VS Code、Cursor、JetBrains 等编辑器中启用自动补全。

## 规则列表

### 表格规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| TBL-001 | 表格中必须存在必需列 | `requiredColumns`, `section`?, `files`? |
| TBL-002 | 关键列不能有空单元格 | `columns`?, `files`? |
| TBL-003 | 列值必须在允许的集合内 | `column`, `values`, `files`? |
| TBL-004 | 单元格值必须匹配正则表达式 | `column`, `pattern`, `files`? |
| TBL-005 | 跨列条件约束验证 | `when`, `then`, `section`?, `files`? |
| TBL-006 | 指定文件间 ID 必须唯一 | `files`, `column`, `idPattern`? |

### 章节 / 结构规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| SEC-001 | 文档中必须存在必需章节 | `sections`, `files`? |
| SEC-002 | 章节必须按指定顺序排列 | `order`, `level`?, `section`?, `files`? |
| STR-001 | 项目中必须存在必需文件 | `files` |

### 引用规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| REF-001 | Markdown 链接目标必须存在 | `exclude`? |
| REF-002 | ID 的定义与引用必须保持一致 | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | 依赖关系中的稳定性顺序必须一致 | `stabilityColumn`, `stabilityOrder`, `definitions`, `references`, `idColumn`?, `idPattern`? |
| REF-004 | 跨区域链接必须在概要文件中声明 | `zonesDir`, `dependencySection`? |
| REF-005 | 锚点片段必须指向目标文件中存在的标题 | `files`? |
| REF-006 | 图片引用必须指向存在的文件 | `exclude`? |

### 清单规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| CHK-001 | 清单中的所有项目必须已勾选 | `section`?, `files`? |

### 上下文规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| CTX-001 | 章节必须包含有意义的内容，而非占位符 | `section`?, `placeholders`?, `files`? |
| CTX-002 | 术语必须与词汇表定义一致 | `glossary`, `termColumn`, `aliasColumn`?, `section`?, `files`? |

### 图规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| GRP-001 | 每个 ID 必须在文档链的所有阶段中可追溯 | `chain`, `idPattern`? |
| GRP-002 | 文档引用图必须无环（检测循环引用） | `files`?, `exclude`? |
| GRP-003 | 每个文档必须至少有一个被引用 | `files`?, `entryPoints`? |

## 配置参考

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",

  // 默认文件模式（CLI 未指定文件时使用）
  "include": ["docs/**/*.md"],

  "rules": [
    // TBL-001: 表格中必须存在必需列
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status", "Description"], "files": "**/requirements.md" } },

    // TBL-002: 关键列不能有空单元格
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"], "files": "**/requirements.md" } },

    // TBL-003: 列值必须在允许的集合内
    { "rule": "tbl003", "options": { "column": "Status", "values": ["draft", "review", "stable"], "files": "**/requirements.md" } },

    // TBL-004: 单元格值必须匹配正则表达式
    { "rule": "tbl004", "options": { "column": "ID", "pattern": "^[A-Z]+-[A-Z]+-\\d{2}$", "files": "**/requirements.md" } },

    // TBL-005: 当某列满足条件时，另一列必须满足约束
    { "rule": "tbl005", "options": { "when": { "column": "Status", "equals": "Done" }, "then": { "column": "Date", "notEmpty": true } } },

    // TBL-006: 所有匹配文件中 ID 必须唯一
    { "rule": "tbl006", "options": { "files": "**/requirements.md", "column": "ID" } },

    // SEC-001: 文档中必须存在必需章节
    { "rule": "sec001", "options": { "sections": ["Overview", "Requirements"], "files": "**/overview.md" } },

    // SEC-002: 章节必须按指定顺序排列
    //   基本 — 在整个文件中检查顺序：
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"] } },
    //   指定 level — 按父标题分组，独立检查各组：
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"], "level": 3, "files": "**/spec.md" } },
    //   指定 section — 仅检查特定父分组：
    { "rule": "sec002", "options": { "order": ["Endpoints", "Error Handling"], "level": 3, "section": "API" } },

    // STR-001: 项目中必须存在必需文件
    { "rule": "str001", "options": { "files": ["docs/overview.md", "docs/requirements.md"] } },

    // CHK-001: 清单中的所有项目必须已勾选
    { "rule": "chk001", "options": { "section": "Review Checklist", "files": "docs/reviews/*.md" } },

    // CTX-001: 章节必须包含有意义的内容，而非占位符
    { "rule": "ctx001", "options": { "section": "Overview", "files": "docs/**/*.md" } },

    // REF-001: 相对路径的 Markdown 链接必须指向存在的文件
    { "rule": "ref001", "options": { "exclude": ["_references/**"] } },

    // REF-002: 已定义的 ID 必须被引用；被引用的 ID 必须存在
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/design.md", "**/overview.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-"
      }
    },

    // REF-003: 项目的稳定性不能超过其依赖项目的稳定性
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Status",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/design.md"]
      }
    },

    // REF-004: 跨区域链接必须在区域概要中声明
    { "rule": "ref004", "options": { "zonesDir": "docs/zones" } },

    // REF-005: 锚点片段必须指向目标文件中存在的标题
    { "rule": "ref005", "options": { "files": "docs/**/*.md" } },

    // REF-006: 图片引用必须指向存在的文件
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } },

    // GRP-001: 每个 ID 必须在文档链的所有阶段中可追溯
    {
      "rule": "grp001",
      "options": {
        "chain": [
          { "stage": "Requirements", "files": "**/requirements.md", "idColumn": "ID" },
          { "stage": "Design", "files": "**/design.md", "refColumn": "Requirement" },
          { "stage": "Test", "files": "**/test-plan.md", "refColumn": "Covers" }
        ],
        "idPattern": "^REQ-\\d{3}$"
      }
    },

    // GRP-002: 文档引用图必须无环（检测循环引用）
    { "rule": "grp002", "options": { "files": "docs/**/*.md", "exclude": ["CHANGELOG.md"] } },
    // GRP-003: 每个文档必须至少有一个被引用
    { "rule": "grp003", "options": { "files": "docs/**/*.md", "entryPoints": ["README.md", "index.md"] } }
  ],

  // 上下文编译器：为 Claude Code 生成 SKILL.md
  "compile": {
    "skill": {
      "name": "my-project",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  }
}
```

## 使用场景

这些规则设计为通用用途。以下是一些示例：

- **SDD（规格驱动开发）** — 验证规格文档是否引用了现有需求，
  以及文件间的 ID 是否一致
- **ADR（架构决策记录）** — 确保所有 ADR 包含必需章节
  （Status、Context、Decision），并且状态转换是有效的
- **RFC（评审请求）** — 检查 RFC 文档是否包含必需标题，
  以及提案间的交叉引用是否完整
- **任何结构化 Markdown 项目** — 在 CI 中自动检测断裂链接、
  重复 ID 和缺失文件

## 命令

### Lint（默认）

```bash
contextlint [files...]              # 检查结构化 Markdown 文档
contextlint --format json           # 机器可读的输出
contextlint --watch                 # 文件变更时自动重新运行
```

### 影响分析（Impact Analysis）

```bash
contextlint impact <file>           # 变更影响分析 + 受影响文件 lint
contextlint impact docs/req.md --format json
```

### 上下文切片（Context Slice）

```bash
contextlint slice <query>           # 提取相关文档
contextlint slice docs/req.md --depth 3
```

### 文档图（Document Graph）

```bash
contextlint graph                   # 显示文档依赖图
contextlint graph --format json
```

### 编译（Compile）

```bash
contextlint compile                 # 为 Claude Code 生成 SKILL.md
contextlint compile --dry-run       # 预览而不写入
contextlint compile --outdir .claude/skills/my-skill
```

## CLI 选项

| 选项 | 说明 |
| ---- | --- |
| `[files...]` | 要检查的文件或 glob 模式（覆盖配置中的 `include`） |
| `--config <path>` | `contextlint.config.json` 的路径 |
| `--format <format>` | 输出格式：`human`（默认）或 `json` |
| `--cwd <path>` | 工作目录 |

### JSON 输出

使用 `--format json` 获取机器可读的输出（适用于 CI 和编辑器集成）：

```bash
npx contextlint --format json
```

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  }
]
```

## CI 集成

### GitHub Actions

本仓库包含一个即用型组合 Action。
它使用 `--format json` 运行 contextlint，并在 PR 上创建内联注释。

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # 可选
        #   files: 'docs/**/*.md'              # 可选
        #   version: 'latest'                  # 可选
```

或直接运行：

```yaml
- run: npx @contextlint/cli
```

## 监视模式

文件更改时自动重新验证：

```bash
npx contextlint --watch
npx contextlint --watch docs/**/*.md
npx contextlint --watch --config contextlint.config.json
```

监视模式首先执行一次完整检查，然后监视工作目录中 `.md` 文件的变更。
检测到变更后，会重新检查**所有**匹配的文件
（跨文件规则如 REF-002 和 TBL-006 需要此行为），
清除终端并显示带有时间戳的最新结果。
连续的快速变更会进行 300 毫秒的防抖处理。
按 Ctrl+C 退出。

## MCP 服务器

contextlint 可以作为
[MCP](https://modelcontextprotocol.io/)（Model Context Protocol）
服务器运行，使 Claude 和 Cursor 等 AI 工具能够在对话中检查
Markdown 文档。

```bash
npm install -D @contextlint/mcp-server
```

在 `mcp.json`（例如：`.cursor/mcp.json` 或
`claude_desktop_config.json`）中添加：

```json
{
  "mcpServers": {
    "contextlint": {
      "command": "npx",
      "args": ["@contextlint/mcp-server"]
    }
  }
}
```

可用工具：

| 工具 | 说明 |
| --- | --- |
| `lint` | 使用指定规则直接检查 Markdown 内容 |
| `lint-files` | 使用配置文件检查匹配模式的文件 |
| `context-graph` | 构建并返回项目的文档依赖关系图 |
| `context-slice` | 提取与给定查询相关的最小文档集 |
| `impact-analysis` | 分析指定文件的更改会影响哪些文档 |
| `compile-context` | 将文档结构编译为 LLM 上下文文本 |

## 编程式 API

### 上下文图

`@contextlint/core` 提供了上下文图 API，用于以编程方式分析
文档依赖关系。这对于构建需要理解 Markdown 文档之间关系的工具非常有用。

```typescript
import {
  parseDocument,
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
  classifyImpact,
  compileContext,
} from "@contextlint/core";
import type { ContextGraph, GraphNode, GraphEdge } from "@contextlint/core";
```

| 函数 | 说明 |
| ---- | --- |
| `buildContextGraph(documents)` | 从解析后的文档构建依赖关系图 |
| `getImpactSet(graph, filePath)` | 获取更改指定文件时受影响的所有文件（直接和间接） |
| `getContextSlice(graph, documents, query, maxDepth?)` | 获取与查询（文件路径或 ID）相关的最小文件集 |
| `topologicalSort(graph)` | 文档图的拓扑排序（依赖顺序） |
| `getComponents(graph)` | 获取连通分量（相关文件的聚类） |
| `classifyImpact(graph, filePath)` | 将影响分类为直接和间接 |
| `compileContext(patterns, config, cwd)` | 将文档和配置编译为 SKILL.md 内容 |

使用示例：

```typescript
import { readFileSync } from "node:fs";
import { parseDocument, buildContextGraph, getImpactSet } from "@contextlint/core";

// 解析文档
const documents = new Map();
documents.set("docs/overview.md", parseDocument(readFileSync("docs/overview.md", "utf-8")));
documents.set("docs/requirements.md", parseDocument(readFileSync("docs/requirements.md", "utf-8")));
documents.set("docs/design.md", parseDocument(readFileSync("docs/design.md", "utf-8")));

// 构建图
const graph = buildContextGraph(documents);

// 如果 requirements.md 发生变更，哪些文件会受到影响？
const impacted = getImpactSet(graph, "docs/requirements.md");
// => ["docs/design.md", "docs/overview.md"]
```

## 上下文编译器

上下文编译器是一个确定性管道，将文档和配置转换为
`SKILL.md` 文件，专为
[Claude Code 自定义技能](https://docs.anthropic.com/en/docs/claude-code)
设计。相同配置 + 相同文档 = 始终相同的输出，无需 LLM。

### 工作原理

1. 加载匹配 `include` 模式的文档
2. 构建依赖关系图并对每个文档的角色进行分类
   （entry、hub、leaf、bridge、isolated）
3. 提取文档概要（大纲、表格模式、引用）
4. 用自然语言描述活跃的 lint 规则
5. 将所有内容合成为一个 SKILL.md

### 配置

在 `contextlint.config.json` 中添加 `compile` 部分：

```json
{
  "include": ["docs/**/*.md"],
  "compile": {
    "skill": {
      "name": "my-project-docs",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  },
  "rules": []
}
```

| 字段 | 说明 |
| ---- | --- |
| `skill.name` | SKILL.md 前言中的技能名称（必需） |
| `skill.description` | SKILL.md 前言中的技能描述（必需） |
| `outdir` | 输出目录（默认：`.claude/skills/contextlint`） |
| `sections.architecture` | 包含架构概览 |
| `sections.rules` | 包含活跃的 lint 规则 |
| `sections.dependencies` | 包含依赖关系图 |
| `sections.workflow` | 包含工作流指示 |

### 用法

```bash
# 生成 SKILL.md
contextlint compile

# 预览而不写入
contextlint compile --dry-run

# 指定输出目录
contextlint compile --outdir .claude/skills/my-skill
```

### CI 管道集成

添加到 CI 管道中，保持 SKILL.md 与文档同步：

```yaml
- run: npx contextlint compile --dry-run
```

## 包结构

| 包名 | 说明 |
| --- | --- |
| `@contextlint/core` | 规则引擎和 Markdown 解析器 |
| `@contextlint/cli` | CLI 入口（`contextlint` 命令） |
| `@contextlint/mcp-server` | AI 工具集成的 MCP 服务器 |

## 相关资源

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## 许可证

[MIT](LICENSE)
