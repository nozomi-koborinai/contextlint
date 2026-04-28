# contextlint for VS Code and Cursor

In-editor diagnostics for structured Markdown documents powered by
`@contextlint/lsp-server`.

## Install from VSIX

Download `contextlint-vscode-*.vsix` from the GitHub Release for the
version you want to use, then install it manually.

In VS Code or Cursor:

1. Open the Extensions view.
2. Select **Views and More Actions...**.
3. Select **Install from VSIX...**.
4. Choose the downloaded `.vsix` file.

From the command line:

```bash
code --install-extension contextlint-vscode-VERSION.vsix
```

After installation, open a workspace containing `contextlint.config.json`
and edit a Markdown file. Diagnostics, hover info, and supported Quick
Fixes will be provided through the contextlint language server.
