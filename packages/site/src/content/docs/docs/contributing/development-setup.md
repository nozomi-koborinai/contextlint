---
title: Development setup
description: Repository layout and commands for running contextlint locally.
---

contextlint is a monorepo built on [bun workspace](https://bun.sh/docs/install/workspaces). This page walks through the steps from cloning the repository to a state where you can run build, test, typecheck, and lint locally.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Bun](https://bun.sh/) | `1.3.x` or later | Package manager and test runner |
| Node.js | `22` or later | Runtime (CLI / MCP / LSP all run on Node) |
| Git | — | Repository operations |

The `packageManager` field pins the Bun version, so using Bun is recommended.

## Clone and install dependencies

```bash
git clone https://github.com/nozomi-koborinai/contextlint.git
cd contextlint
bun install
```

`bun install` sets up every package in the workspace at once: `@contextlint/core`, `@contextlint/cli`, `@contextlint/mcp-server`, `@contextlint/lsp-server`, `contextlint-vscode`, and the site.

## Repository layout

contextlint lives under `packages/` with the following structure.

| Package | Role |
|---------|------|
| `@contextlint/core` | Rule engine, Markdown table parser, Context Graph API |
| `@contextlint/cli` | Entry point for the `contextlint` command |
| `@contextlint/mcp-server` | MCP server for AI tool integration (5 tools) |
| `@contextlint/lsp-server` | LSP server for editor integration |
| `contextlint-vscode` | VS Code / Cursor extension |
| `site` | The `contextlint.dev` landing page and documentation (Astro) |

For the overall architecture, see [Architecture](https://github.com/nozomi-koborinai/contextlint/blob/main/docs/architecture.md).

### Separation between core and consumers

The lint pipeline (`lintFiles`), config loading (`findConfig` / `loadConfig`), and result formatting (`formatFileResults` / `formatContentResults`) all live in `@contextlint/core`. `@contextlint/cli` and `@contextlint/mcp-server` simply import them — **never reimplement the pipeline or config handling on the consumer side**.

`lintFiles` is intentionally designed as a synchronous API (`globSync` + `readFileSync`). Do not make it asynchronous.

## Main commands

Run these from the repository root.

| Command | What it does |
|---------|--------------|
| `bun run --filter '*' build` | Build every package with `tsc` |
| `bun test` | Run every package's tests with `bun:test` |
| `bun run --filter '*' typecheck` | Type-check every package |
| `npx eslint .` | Lint TypeScript with ESLint |
| `bunx markdownlint-cli2 "README*.md"` | Markdown-lint the README files |

To build a single package, change the `--filter` value to its package name (for example, `bun run --filter '@contextlint/core' build`).

## TypeScript and ESLint settings

contextlint uses strict settings. Follow these rules when writing code.

- **`strict` + `noUncheckedIndexedAccess`** — array and object indexed access returns `T | undefined`.
- **`verbatimModuleSyntax`** — always use `import type` when importing types only.
- **ESM** — every package is `"type": "module"`.
- **No `any`** — implicit `any` (such as the result of `JSON.parse`) is also caught by `no-unsafe-assignment`.
- **No `!` non-null assertion** — narrow types with guards such as `if (!x) throw new Error(...)`.
- **No `as` casts** — in rule implementations, options are already validated by the Zod schema's `parse`, so `as` is unnecessary.

ESLint is configured in `eslint.config.mjs`. TypeScript uses two configs: per-package `tsconfig.json` (build only, excludes tests) and `tsconfig.eslint.json` (lint only, includes tests).

## Verifying the setup

To check that the setup is correct, run the following and confirm everything passes.

```bash
bun run --filter '*' build
bun test
bun run --filter '*' typecheck
npx eslint .
```

Once these pass, you are ready to add new rules or fix bugs.

## Next steps

- [Adding a new rule](/docs/contributing/adding-a-new-rule/) — workflow for implementing a rule
- [Writing tests](/docs/contributing/writing-tests/) — testing conventions and the CJK requirement
