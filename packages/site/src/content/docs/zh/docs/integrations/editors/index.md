---
title: Editors (LSP)
description: 将 contextlint Language Server 集成到编辑器中，编辑过程中显示诊断、悬停信息和 Quick Fix。
---

:::note
仅在 VS Code / Cursor 上验证过。Neovim / Helix / JetBrains / VSCodium 在符合 LSP 规范的通用配置下应该也能工作，但目前未经过验证。
:::

contextlint 自带 Language Server Protocol（LSP）实现 `@contextlint/lsp-server`。集成到支持 LSP 的编辑器中后，在打开 Markdown 文件期间，会即时 lint 编辑过程中的差异，并在编辑器内接收诊断、悬停信息和 Quick Fix。

## 可以做什么

- **诊断（Diagnostics）** — 21 个规则的所有违规会以内联形式显示在编辑器对应行上
- **悬停** — 将光标放在违规处会显示规则 ID 和消息
- **Quick Fix** — 部分规则可一键自动修复
  - `CHK-001`: 将清单项目标记为已勾选
  - `TBL-002`: 在空单元格中插入 `TODO`
- **跨文件规则的即时反映** — `REF-001` / `REF-002` / `TBL-006` / `GRP-*` 等跨文件规则也会使用整个工作区的缓存，在编辑过程中评估

配置文件使用与 CLI / MCP 相同的 `contextlint.config.json`，无需为编辑器单独准备配置文件。

## 安装

```bash
# bun
bun add -D @contextlint/lsp-server

# npm
npm install -D @contextlint/lsp-server
```

LSP 服务器提供名为 `contextlint-lsp` 的二进制文件。多数编辑器以 `npx contextlint-lsp` 形式启动该二进制文件。

## VS Code

VS Code 用扩展 `contextlint-vscode` 以 VSIX 形式分发。Marketplace 公开为后续计划。

请从 GitHub Release 下载 `contextlint-vscode-*.vsix`。

```bash
code --install-extension contextlint-vscode-VERSION.vsix
```

或者通过 Extensions 视图手动安装。

1. 打开 Extensions 视图
2. 从 **Views and More Actions...** 选择 **Install from VSIX...**
3. 指定下载的 `.vsix` 文件

安装后，打开 Markdown 文件会自动启动 LSP，使用最近的 `contextlint.config.json` 显示诊断。无需额外配置。

## Cursor

Cursor 兼容 VS Code，所以可以直接安装 `contextlint-vscode` 的 VSIX。步骤与 VS Code 相同。

```bash
cursor --install-extension contextlint-vscode-VERSION.vsix
```

## 通用 LSP 设置

对于支持 LSP 的编辑器，只要有以下信息就可以集成。

| 项目 | 值 |
| --- | --- |
| 启动命令 | `npx contextlint-lsp` |
| 协议 | LSP（stdio） |
| 目标文件类型 | `markdown` |
| 根目录的判定 | `contextlint.config.json` 的存在，否则 `.git` |
| 配置文件 | 自动检测工作区直下或父级目录的 `contextlint.config.json` |

`contextlint-lsp` 通过 `process.stdin` / `process.stdout` 通信 LSP。不支持单文件（项目外的独立文件），仅对找到 `contextlint.config.json` 的工作区运行。

### Neovim（[nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)）

```lua
local configs = require('lspconfig.configs')
local util = require('lspconfig.util')

if not configs.contextlint then
  configs.contextlint = {
    default_config = {
      cmd = { 'npx', 'contextlint-lsp' },
      filetypes = { 'markdown' },
      root_dir = util.root_pattern('contextlint.config.json', '.git'),
      single_file_support = false,
    },
  }
end

require('lspconfig').contextlint.setup({})
```

### Helix（`~/.config/helix/languages.toml`）

```toml
[language-server.contextlint]
command = "npx"
args = ["contextlint-lsp"]

[[language]]
name = "markdown"
language-servers = ["contextlint"]
```

### JetBrains IDE（[LSP4IJ](https://plugins.jetbrains.com/plugin/23257-lsp4ij)）

1. 从 Marketplace 安装 **LSP4IJ** 插件
2. 在 **Settings → Languages & Frameworks → Language Servers → Add** 中按以下方式配置:
   - **Name**: `contextlint`
   - **Command**: `npx contextlint-lsp`
   - **Mapping → File name patterns**: `*.md`

## 已知限制

- **不监视外部的文件变更。** 当通过 `git pull` 或编辑器外部脚本变更文件时，LSP 的工作区缓存不会自动更新。重新加载编辑器窗口（VS Code / Cursor 中按 `Cmd+R` / `Ctrl+R`）即可重建缓存。
- **Quick Fix 当前仅支持 2 个规则（`CHK-001` / `TBL-002`）。** 其他规则仅提供诊断和悬停。
