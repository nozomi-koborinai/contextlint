---
title: MCP 服务器
description: "@contextlint/mcp-server 的设置，以及可从 AI 主机调用的 5 个工具的规范。"
---

`@contextlint/mcp-server` 是通过 [Model Context Protocol](https://modelcontextprotocol.io/) 将 contextlint 功能暴露给 AI 主机的服务器。注册到 Claude Desktop、Cursor、Cline、Codex 等支持 MCP 的主机后，AI 就能在对话中调用 lint 执行、图引用和影响分析。

## 安装

```bash
npm install -D @contextlint/mcp-server
```

也可以通过 `npx @contextlint/mcp-server` 执行，因此可以根据主机的配置方式选择全局安装或项目内安装。

## 各主机的设置

MCP 服务器是通过 stdio 通信的简单命令。在各主机的配置文件中添加相同格式的条目。

### Claude Desktop

编辑 `claude_desktop_config.json`（macOS 上为 `~/Library/Application Support/Claude/claude_desktop_config.json`）。

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

### Cursor

在 `.cursor/mcp.json`（项目特定）或 `~/.cursor/mcp.json`（用户全局）中以相同格式添加。

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

### 其他主机

Cline、Codex、Windsurf 等支持 MCP 的主机大致采用相同格式的配置文件。只要将 `command` 和 `args` 写成上述形式即可工作。

## 提供的 5 个工具

MCP 服务器公开了以下工具。AI 在对话中根据需要调用这些工具。

| 工具 | 用途 |
| --- | --- |
| `lint` | 直接传入 Markdown 字符串进行规则验证 |
| `lint-files` | 使用 glob 模式和配置文件验证多个文件 |
| `context-graph` | 构建并返回文档依赖图 |
| `context-slice` | 提取与查询（ID / 关键字 / 文件路径）相关的最小文件集 |
| `impact-analysis` | 对指定文件的变更，分类返回直接和间接受影响的文件 |

### lint

对当场传入的 Markdown 内容，使用明确指定的规则配置进行验证。适合无需配置文件的临时验证。

| 输入 | 类型 | 概述 |
| --- | --- | --- |
| `content` | string | 验证目标的 Markdown |
| `rules` | object[] | 应用的规则（`rule` 和可选的 `options`） |

### lint-files

使用 `contextlint.config.json` 的配置验证匹配 glob 模式的文件。可以通过 MCP 调用与 CLI 的 `npx contextlint` 相同的行为。

| 输入 | 类型 | 概述 |
| --- | --- | --- |
| `patterns` | string[]（可选） | glob 模式。省略时使用配置的 `include`，无则使用 `["**/*.md"]` |
| `configPath` | string（可选） | 配置文件的路径。省略时从父目录向上自动检测 |
| `cwd` | string（可选） | 工作目录 |

### context-graph

构建并返回文档间的依赖图。指定 `format: "json"` 时为结构化的 JSON，省略时为人类可读的摘要格式。在让 AI「掌握仓库整体情况」时很有用。

### context-slice

将 ID（如：`REQ-101`）、关键字、文件路径传入 `query`，会返回与之相关的最小文件集。可通过 `depth` 控制遍历深度（默认 2）。可以避免向 AI 上下文发送无关文件，在节省 token 消耗的同时传递准确的引用。

### impact-analysis

当文件被变更时，将受影响的文档分类为 **直接（被直接引用）** 和 **间接（通过引用链可到达）** 并返回。用于重构或删除前的安全确认。

## 与配置文件的关系

`lint-files` / `context-graph` / `context-slice` / `impact-analysis` 都会引用 `contextlint.config.json`。如果找不到配置文件会返回错误，所以请先通过 [contextlint-init Skill](/zh/docs/integrations/ai-agents/skill-init/) 或 [Quick Start — 手动](/zh/docs/get-started/quick-start-manual/) 完成设置。

## 与 CLI 的关系

MCP 服务器和 CLI 使用相同的 `@contextlint/core` 的 `lintFiles` 流水线。输出格式两者一致，因此 AI 通过 MCP 得到的结果与人类通过 CLI 得到的结果一致。
