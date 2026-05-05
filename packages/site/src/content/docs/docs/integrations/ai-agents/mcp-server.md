---
title: MCP server
description: "@contextlint/mcp-server setup and the spec of the five tools AI hosts can call."
---

`@contextlint/mcp-server` exposes contextlint's features to AI hosts via the [Model Context Protocol](https://modelcontextprotocol.io/). Once registered with an MCP-capable host (Claude Desktop, Cursor, Cline, Codex, etc.), AI can run lint, query the graph, and analyze impact mid-conversation.

## Installation

```bash
npm install -D @contextlint/mcp-server
```

`npx @contextlint/mcp-server` also works, so pick the install style — global or per-project — that matches the host's configuration conventions.

## Per-host setup

The MCP server is a simple stdio command. Each host's configuration file takes the same kind of entry.

### Claude Desktop

Edit `claude_desktop_config.json` (on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`).

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

Add the same shape of entry to `.cursor/mcp.json` (project-specific) or `~/.cursor/mcp.json` (user-wide).

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

### Other hosts

MCP-capable hosts like Cline, Codex, and Windsurf use roughly the same configuration format. Match `command` and `args` as above and they should work.

## The five tools

The MCP server exposes the following tools. AI calls them as needed during conversation.

| Tool | Purpose |
| --- | --- |
| `lint` | Validate Markdown content directly with explicit rules |
| `lint-files` | Validate multiple files via glob patterns and a config file |
| `context-graph` | Build and return the document dependency graph |
| `context-slice` | Extract the minimal set of files related to a query (ID / keyword / file path) |
| `impact-analysis` | Classify files affected directly or transitively by changes to a file |

### lint

Validates Markdown content passed inline against an explicit rule set. Useful for ad-hoc validation that doesn't need a config file.

| Input | Type | Description |
| --- | --- | --- |
| `content` | string | The Markdown to validate |
| `rules` | object[] | Rules to apply (`rule` plus optional `options`) |

### lint-files

Validates files matching glob patterns using the configuration in `contextlint.config.json`. Equivalent to running `npx contextlint`, but invokable through MCP.

| Input | Type | Description |
| --- | --- | --- |
| `patterns` | string[] (optional) | Glob patterns. Falls back to the config's `include`, then to `["**/*.md"]` |
| `configPath` | string (optional) | Path to a config file. Auto-detected from parent directories if omitted |
| `cwd` | string (optional) | Working directory |

### context-graph

Builds the document dependency graph and returns it. With `format: "json"`, the output is structured JSON; otherwise it's a human-readable summary. Useful for "give the AI an overview of the repository" use cases.

### context-slice

Pass an ID (e.g. `REQ-101`), keyword, or file path as `query`, and the tool returns the minimal set of related files. `depth` controls traversal depth (default 2). Lets you stay token-efficient while feeding precise context to AI.

### impact-analysis

Classifies the documents affected by a change to a file into **direct** (directly referencing it) and **transitive** (reachable through a chain of references). Use it before refactors or deletions to confirm safety.

## Relationship to the config file

`lint-files`, `context-graph`, `context-slice`, and `impact-analysis` all consult `contextlint.config.json`. If no config is found, they error out — set things up first with the [contextlint-init Skill](/docs/integrations/ai-agents/skill-init/) or [Quick Start — Manual](/docs/get-started/quick-start-manual/).

## Relationship to the CLI

The MCP server and the CLI share the same `lintFiles` pipeline from `@contextlint/core`. Their output formats are aligned, so what AI sees through MCP matches what humans see in the CLI.
