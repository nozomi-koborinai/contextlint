# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![lsp-server downloads](https://img.shields.io/npm/dm/@contextlint/lsp-server.svg?label=lsp-server%20downloads)](https://www.npmjs.com/package/@contextlint/lsp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [中文](README.zh.md) | [한국어](README.ko.md)

構造化された Markdown ドキュメントのためのルールベースのリンター。
リンク切れ、重複 ID、セクションの不足、構造上の問題を
決定論的に、数秒で、CI フレンドリーに検出します。

> 📚 詳細なリファレンスとガイド: **<https://contextlint.dev>**

## なぜ contextlint なのか？

AI 主導のワークフロー（SDD: Spec Driven Development など）では、
Markdown ドキュメントが依存関係グラフを形成します。要件が ID を参照し、
設計書が仕様にリンクし、ADR が互いに参照し合う。このグラフが静かに壊れる
（要件が削除された、ID をタイプミスした、セクションが消えた）と、
読み手が読んだそのときに初めて影響が顕在化します。

contextlint は、構造化された Markdown のための
**決定論的な静的バリデーション**を提供します。AI 不要、コストゼロ、CI フレンドリー。

> contextlint は **コンテンツのセマンティクスとファイル横断の整合性**にフォーカスします。
> Markdown の syntax / formatting / style については、
> [markdownlint](https://github.com/DavidAnson/markdownlint) と
> 併用するのがおすすめです。両者は補完関係にあります。

## クイックスタート

**AI 支援セットアップ（推奨）** — Claude Code、Cursor、Codex、Gemini CLI、
GitHub Copilot など [Agent Skills](https://agentskills.io) 互換クライアント向け。
GitHub CLI **v2.90 以上**が必要です:

```sh
gh skill install nozomi-koborinai/contextlint contextlint-init
```

その後、エージェントに「contextlint をセットアップして」と指示してください。
Skill がリポジトリのレイアウトを検出し、ルールを推測し、CLI をインストールし、
`contextlint.config.json` を生成します。

**手動セットアップ**:

```bash
npm install -D @contextlint/cli
npx contextlint init
npx contextlint
```

出力例:

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

## ルール

contextlint は **21 のルール**を 7 カテゴリで提供します:

| Prefix | カテゴリ | 検証する内容 | 数 |
| --- | --- | --- | --- |
| TBL | Table | 必須カラム、空セル、許可値、パターン、列間制約、ファイル横断の ID 一意性 | 6 |
| SEC | Section | セクション見出しの存在と順序 | 2 |
| STR | Structure | プロジェクト全体でのファイル存在 | 1 |
| REF | Reference | リンク、アンカー、ID 参照、Stability 整合性、Zone 依存、画像参照 | 6 |
| CHK | Checklist | チェックリスト項目の完了状態 | 1 |
| CTX | Context | プレースホルダ検出、用語整合性 | 2 |
| GRP | Graph | トレーサビリティチェーン、循環参照、孤立ドキュメント | 3 |

各ルールの詳細は [Rules](https://contextlint.dev/ja/docs/rules/) を参照してください。

## さらに知る

`lint` 以外のコマンド（`init`, `impact`, `slice`, `graph`, `compile`,
`--watch`）は `npx contextlint --help` で一覧できます。詳細は以下のドキュメントを参照してください:

| トピック | リンク |
| --- | --- |
| Get Started | <https://contextlint.dev/ja/docs/get-started/> |
| 設定リファレンス | <https://contextlint.dev/ja/docs/configuration/> |
| ルールリファレンス（21 ルール） | <https://contextlint.dev/ja/docs/rules/> |
| CLI コマンドとフラグ | <https://contextlint.dev/ja/docs/integrations/cli/> |
| エディタ連携（LSP） | <https://contextlint.dev/ja/docs/integrations/editors/> |
| AI エージェント（MCP, Agent Skills） | <https://contextlint.dev/ja/docs/integrations/ai-agents/> |
| CI/CD 連携 | <https://contextlint.dev/ja/docs/integrations/ci-cd/> |
| Recipes（ADR / SDD / monorepo） | <https://contextlint.dev/ja/docs/recipes/> |
| Graph API（プログラム的利用） | <https://contextlint.dev/ja/docs/graph-api/> |

## パッケージ構成

| パッケージ | 説明 |
| --- | --- |
| `@contextlint/core` | ルールエンジンと Markdown パーサー |
| `@contextlint/cli` | CLI エントリーポイント（`contextlint` コマンド） |
| `@contextlint/mcp-server` | AI ツール連携用の MCP サーバー |
| `@contextlint/lsp-server` | Language Server Protocol 実装 |
| `contextlint-vscode` | VS Code / Cursor 拡張 — Marketplace 公開までは [GitHub Releases](https://github.com/nozomi-koborinai/contextlint/releases) の VSIX をインストール |

## 関連記事

- [contextlint の紹介 — 構造化 Markdown のためのリンター](https://zenn.dev/nozomi_cobo/articles/contextlint-introduction)

## ライセンス

[MIT](LICENSE)
