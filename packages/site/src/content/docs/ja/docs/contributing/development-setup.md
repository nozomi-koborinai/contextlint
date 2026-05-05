---
title: 開発環境のセットアップ
description: contextlint をローカルで動かすためのリポジトリ構成とコマンド。
---

contextlint は [bun workspace](https://bun.sh/docs/install/workspaces) を使ったモノレポです。このページでは、リポジトリを clone してから、ビルド・テスト・型チェック・lint を実行できる状態までの手順を解説します。

## 前提

| ツール | バージョン | 用途 |
|--------|-----------|------|
| [Bun](https://bun.sh/) | `1.3.x` 以上 | パッケージマネージャ・テストランナー |
| Node.js | `22` 以上 | ランタイム（CLI / MCP / LSP は Node 上で動作） |
| Git | — | リポジトリ操作 |

`packageManager` フィールドで Bun のバージョンを固定しているため、Bun を使うのが推奨です。

## クローンと依存関係のインストール

```bash
git clone https://github.com/nozomi-koborinai/contextlint.git
cd contextlint
bun install
```

`bun install` は workspace 内のすべての package（`@contextlint/core`、`@contextlint/cli`、`@contextlint/mcp-server`、`@contextlint/lsp-server`、`contextlint-vscode`、site）を一括でセットアップします。

## リポジトリ構成

contextlint は `packages/` 配下に以下の構成で配置されています。

| Package | 役割 |
|---------|------|
| `@contextlint/core` | ルールエンジン、Markdown テーブルパーサ、Context Graph API |
| `@contextlint/cli` | `contextlint` コマンドのエントリポイント |
| `@contextlint/mcp-server` | AI ツール連携用の MCP サーバ（5 ツール） |
| `@contextlint/lsp-server` | エディタ統合用の LSP サーバ |
| `contextlint-vscode` | VS Code / Cursor 拡張機能 |
| `site` | `contextlint.dev` ランディングページとドキュメント（Astro） |

リポジトリ全体のアーキテクチャは [Architecture](https://github.com/nozomi-koborinai/contextlint/blob/main/docs/architecture.md) を参照してください。

### コアと consumer の責務分離

lint パイプライン（`lintFiles`）、設定ファイルのロード（`findConfig` / `loadConfig`）、結果のフォーマット（`formatFileResults` / `formatContentResults`）はすべて `@contextlint/core` に集約されています。`@contextlint/cli` と `@contextlint/mcp-server` はこれを import するだけで、**consumer 側でパイプラインや設定処理を再実装してはいけません**。

`lintFiles` は意図的に同期 API（`globSync` + `readFileSync`）として設計されています。非同期化しないでください。

## 主要コマンド

リポジトリのルートで実行します。

| コマンド | 内容 |
|---------|------|
| `bun run --filter '*' build` | 全 package を `tsc` でビルド |
| `bun test` | 全 package のテストを `bun:test` で実行 |
| `bun run --filter '*' typecheck` | 全 package の型チェック |
| `npx eslint .` | TypeScript を ESLint で lint |
| `bunx markdownlint-cli2 "README*.md"` | README ファイルの Markdown lint |

特定の package だけビルドしたい場合は、`--filter` の値を package 名に変えます（例: `bun run --filter '@contextlint/core' build`）。

## TypeScript と ESLint の設定

contextlint は strict 設定を採用しています。コードを書く際には以下を守ってください。

- **`strict` + `noUncheckedIndexedAccess`** — 配列やオブジェクトのインデックスアクセスは `T | undefined` 型になります。
- **`verbatimModuleSyntax`** — 型のみを import する際は `import type` を必ず付けます。
- **ESM** — すべての package は `"type": "module"` です。
- **`any` 禁止** — `JSON.parse` の結果など、暗黙の `any` も `no-unsafe-assignment` で検出されます。
- **`!` non-null assertion 禁止** — `if (!x) throw new Error(...)` のようなガードで型を絞り込んでください。
- **`as` キャスト不要** — ルール実装では Zod schema の `parse` で options が検証済みのため、`as` は使いません。

ESLint の設定は `eslint.config.mjs`、TypeScript は per-package の `tsconfig.json`（ビルド用、テスト除外）と `tsconfig.eslint.json`（lint 用、テスト含む）の二系統です。

## 動作確認

セットアップが正しく完了しているかを確認するには、以下を実行してすべて成功することを確認します。

```bash
bun run --filter '*' build
bun test
bun run --filter '*' typecheck
npx eslint .
```

ここまで通れば、新しいルールの追加やバグ修正を始められる状態です。

## 次のステップ

- [新しいルールの追加](/ja/docs/contributing/adding-a-new-rule/) — ルール実装の手順
- [テストの書き方](/ja/docs/contributing/writing-tests/) — テスト規約と CJK 要件
