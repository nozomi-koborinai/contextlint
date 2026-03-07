# contextlint

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
| REF-003 | 依赖关系中的稳定性顺序必须一致 | `stabilityColumn`, `stabilityOrder`, `definitions`, `references` |
| REF-004 | 跨区域链接必须在概要文件中声明 | `zonesDir`, `dependencySection`? |
| REF-005 | 锚点片段必须指向目标文件中存在的标题 | `files`? |
| REF-006 | 图片引用必须指向存在的文件 | `exclude`? |

### 清单规则

| ID | 说明 | 配置项 |
| --- | --- | --- |
| CHK-001 | 清单中的所有项目必须已勾选 | `section`?, `files`? |

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
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } }
  ]
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

## CI 集成

### GitHub Actions

```yaml
- run: npx @contextlint/cli
```

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

## 包结构

| 包名 | 说明 |
| --- | --- |
| `@contextlint/core` | 规则引擎和 Markdown 解析器 |
| `@contextlint/cli` | CLI 入口（`contextlint` 命令） |
| `@contextlint/mcp-server` | AI 工具集成的 MCP 服务器 |

## 许可证

[MIT](LICENSE)
