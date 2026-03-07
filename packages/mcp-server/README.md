# @contextlint/mcp-server

[MCP](https://modelcontextprotocol.io/) server for
[contextlint](https://github.com/nozomi-koborinai/contextlint) —
a rule-based linter for structured Markdown documents.

Allows AI tools like Claude and Cursor to lint Markdown
documents during a conversation.

## Installation

```bash
npm install -D @contextlint/mcp-server
```

## Setup

Add to your `mcp.json`
(e.g. `.cursor/mcp.json` or `claude_desktop_config.json`):

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

## Available tools

| Tool | Description |
| ---- | ----------- |
| `lint` | Lint Markdown content directly with specified rules |
| `lint-files` | Lint files matching glob patterns using a config file |

See the
[main repository](https://github.com/nozomi-koborinai/contextlint)
for the full list of rules and configuration options.

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
