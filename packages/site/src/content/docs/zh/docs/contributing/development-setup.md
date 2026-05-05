---
title: 开发环境搭建
description: 在本地运行 contextlint 所需的仓库结构与命令。
---

contextlint 是基于 [bun workspace](https://bun.sh/docs/install/workspaces) 的 monorepo。本页介绍从 clone 仓库到能够执行构建、测试、类型检查与 lint 的完整步骤。

## 前提

| 工具 | 版本 | 用途 |
|--------|-----------|------|
| [Bun](https://bun.sh/) | `1.3.x` 及以上 | 包管理器与测试运行器 |
| Node.js | `22` 及以上 | 运行时(CLI / MCP / LSP 在 Node 上运行) |
| Git | — | 仓库操作 |

`packageManager` 字段固定了 Bun 的版本,因此推荐使用 Bun。

## 克隆与依赖安装

```bash
git clone https://github.com/nozomi-koborinai/contextlint.git
cd contextlint
bun install
```

`bun install` 会一次性完成 workspace 内所有 package(`@contextlint/core`、`@contextlint/cli`、`@contextlint/mcp-server`、`@contextlint/lsp-server`、`contextlint-vscode`、site)的安装。

## 仓库结构

contextlint 在 `packages/` 下采用如下结构。

| Package | 职责 |
|---------|------|
| `@contextlint/core` | 规则引擎、Markdown 表格解析器、Context Graph API |
| `@contextlint/cli` | `contextlint` 命令的入口 |
| `@contextlint/mcp-server` | 用于 AI 工具集成的 MCP 服务器(5 个工具) |
| `@contextlint/lsp-server` | 用于编辑器集成的 LSP 服务器 |
| `contextlint-vscode` | VS Code / Cursor 扩展 |
| `site` | `contextlint.dev` 落地页与文档(Astro) |

仓库整体架构请参见 [Architecture](https://github.com/nozomi-koborinai/contextlint/blob/main/docs/architecture.md)。

### core 与 consumer 的职责分离

lint 流水线(`lintFiles`)、配置文件加载(`findConfig` / `loadConfig`)、结果格式化(`formatFileResults` / `formatContentResults`)全部集中在 `@contextlint/core`。`@contextlint/cli` 与 `@contextlint/mcp-server` 仅 import 即可,**不允许在 consumer 一侧重新实现流水线或配置处理**。

`lintFiles` 是有意设计成同步 API(`globSync` + `readFileSync`),请勿改成异步。

## 主要命令

在仓库根目录下执行。

| 命令 | 内容 |
|---------|------|
| `bun run --filter '*' build` | 用 `tsc` 构建所有 package |
| `bun test` | 用 `bun:test` 运行所有 package 的测试 |
| `bun run --filter '*' typecheck` | 对所有 package 进行类型检查 |
| `npx eslint .` | 用 ESLint 对 TypeScript 进行 lint |
| `bunx markdownlint-cli2 "README*.md"` | 对 README 文件进行 Markdown lint |

只想构建特定 package 时,可以把 `--filter` 的值替换为 package 名(例如:`bun run --filter '@contextlint/core' build`)。

## TypeScript 与 ESLint 的配置

contextlint 采用 strict 配置。编写代码时请遵守以下规约。

- **`strict` + `noUncheckedIndexedAccess`** — 数组与对象的索引访问类型为 `T | undefined`
- **`verbatimModuleSyntax`** — 仅 import 类型时,必须加 `import type`
- **ESM** — 所有 package 都是 `"type": "module"`
- **禁用 `any`** — `JSON.parse` 的返回值等隐式 `any`,也会被 `no-unsafe-assignment` 检出
- **禁用 `!` non-null 断言** — 请用 `if (!x) throw new Error(...)` 等守卫语句来收窄类型
- **无需 `as` 强制转换** — 规则实现中,options 已通过 Zod schema 的 `parse` 完成校验,因此不使用 `as`

ESLint 的配置位于 `eslint.config.mjs`,TypeScript 则采用两套设置:per-package 的 `tsconfig.json`(用于构建,排除测试)与 `tsconfig.eslint.json`(用于 lint,包含测试)。

## 验证环境

为确认环境是否正确搭建完成,执行以下命令并确保全部通过。

```bash
bun run --filter '*' build
bun test
bun run --filter '*' typecheck
npx eslint .
```

到这里都能通过的话,就具备了开始新增规则或修复 bug 的状态。

## 下一步

- [新增规则](/zh/docs/contributing/adding-a-new-rule/) — 规则实现的步骤
- [测试编写](/zh/docs/contributing/writing-tests/) — 测试规约与 CJK 要求
