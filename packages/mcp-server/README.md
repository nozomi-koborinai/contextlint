# @contextlint/mcp-server

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [contextlint](https://contextlint.dev) — a semantic linter for structured Markdown documents.

Lets AI agents (Claude Code, Cursor Agent, Cline, Windsurf, and others) lint, analyze, and verify Markdown documents during a conversation.

## Installation

```bash
npm install -D @contextlint/mcp-server
```

## Setup

Add to your MCP host config (e.g. `.cursor/mcp.json`, `claude_desktop_config.json`, or your editor's MCP settings):

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

For Claude Desktop on macOS, the config lives at `~/Library/Application Support/Claude/claude_desktop_config.json`.

## Available tools

| Tool | Purpose |
| --- | --- |
| `lint` | Lint Markdown content directly with specified rules |
| `lint-files` | Lint files matching glob patterns using a config file |
| `context-graph` | Build and return the document dependency graph |
| `context-slice` | Extract the minimal set of documents relevant to a query |
| `impact-analysis` | Analyze which documents are affected by changes to a file |

## See also

- Project: <https://contextlint.dev>
- CLI: `@contextlint/cli`
- Agent Skills (alternative for AI integration): `gh skill install nozomi-koborinai/contextlint contextlint-fix` (also `contextlint-init`, `contextlint-impact`)

## License

[Apache 2.0](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
