# @contextlint/lsp-server

[Language Server Protocol](https://microsoft.github.io/language-server-protocol/) implementation for [contextlint](https://contextlint.dev) — a semantic linter for structured Markdown documents.

Powers in-editor diagnostics, hover info, and Quick Fixes for VS Code, Cursor, Neovim, Helix, JetBrains IDEs, and any LSP-compatible client.

## Installation

```bash
npm install -D @contextlint/lsp-server
```

## Editor setup

Most users get the LSP through the [`contextlint-vscode`](https://github.com/nozomi-koborinai/contextlint/tree/main/packages/vscode) extension (VS Code / Cursor) without installing this server directly.

For other editors, configure your LSP client to spawn `contextlint-lsp` (the binary this package installs) when editing Markdown files in a project that contains `contextlint.config.json`. See the [main repository](https://github.com/nozomi-koborinai/contextlint#lsp-server) for editor-specific setup snippets (Neovim, Helix, JetBrains).

## Features

- Real-time diagnostics for all 21 contextlint rules
- Hover info showing rule ID and message
- Quick Fixes for `CHK-001` (incomplete checklist) and `TBL-002` (empty cell)
- Workspace-wide cross-file rule detection (project-scope rules)

## See also

- Project: https://contextlint.dev
- VS Code / Cursor extension: `contextlint-vscode`

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
