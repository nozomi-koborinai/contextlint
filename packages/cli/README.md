# @contextlint/cli

CLI for [contextlint](https://contextlint.dev) — a semantic linter for structured Markdown documents.

Catches broken cross-references, missing required sections, empty table cells, leftover placeholders, circular dependency references, and other doc-integrity issues that grep alone can't see.

## Installation

```bash
npm install -D @contextlint/cli
```

## Usage

```bash
npx contextlint                       # Lint files matched by config
npx contextlint "docs/**/*.md"        # Override include via CLI args
npx contextlint --config path/to/config.json
npx contextlint --format json         # Machine-readable output (CI / editors)
```

## Subcommands

| Command | Purpose |
| --- | --- |
| `contextlint` | Lint structured Markdown documents (default) |
| `contextlint init` | Generate `contextlint.config.json` interactively |
| `contextlint impact <file>` | Analyze the impact of changing a document |
| `contextlint slice <query>` | Extract the minimal set of related documents |
| `contextlint graph` | Show the document dependency graph |
| `contextlint compile` | Compile docs + config into a `SKILL.md` for AI agents |

## Watch mode

```bash
npx contextlint --watch     # Re-lint on file changes
```

## Configuration

Create `contextlint.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "grp002" }
  ]
}
```

`$schema` enables autocomplete in VS Code, Cursor, and JetBrains. `include` defines default file patterns (CLI args override). When neither is set, `**/*.md` is used.

See the [main repository](https://github.com/nozomi-koborinai/contextlint) for the full list of rules and configuration options.

## See also

- Project: <https://contextlint.dev>
- Agent Skills: `gh skill install nozomi-koborinai/contextlint contextlint-fix` (also `contextlint-init`, `contextlint-impact`)
- VS Code / Cursor extension: `contextlint-vscode`
- MCP server: `@contextlint/mcp-server`
- LSP server (other editors): `@contextlint/lsp-server`

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
