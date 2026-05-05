# contextlint for VS Code and Cursor

In-editor diagnostics, hover info, and Quick Fixes for structured Markdown documents — powered by [contextlint](https://contextlint.dev) and `@contextlint/lsp-server`.

Works with VS Code, Cursor, Windsurf, VSCodium, and any IDE that runs VS Code extensions.

## Install from VSIX

Download `contextlint-vscode-*.vsix` from the [GitHub Releases](https://github.com/nozomi-koborinai/contextlint/releases) for the version you want, then install it manually.

In VS Code or Cursor:

1. Open the Extensions view.
2. Select **Views and More Actions...** → **Install from VSIX...**.
3. Choose the downloaded `.vsix` file.

From the command line:

```bash
code --install-extension contextlint-vscode-VERSION.vsix
```

After installation, open a workspace containing `contextlint.config.json` and
edit a Markdown file. Diagnostics for all 21 rules, hover info, and supported
Quick Fixes will be provided through the contextlint language server.

## Other editors

For Neovim, Helix, JetBrains IDEs, and other LSP-compatible clients,
install [`@contextlint/lsp-server`](https://www.npmjs.com/package/@contextlint/lsp-server)
and follow the
[editor setup guide](https://github.com/nozomi-koborinai/contextlint#lsp-server)
in the main repository.

## See also

- Project: <https://contextlint.dev>
- LSP server (other editors): `@contextlint/lsp-server`

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
