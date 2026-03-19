# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [中文](README.zh.md) | [한국어](README.ko.md)

構造化された Markdown ドキュメントのためのルールベースのリンター。
リンク切れ、重複 ID、セクションの不足、構造上の問題を
決定論的に、数秒で、CI フレンドリーに検出します。

## なぜ contextlint なのか？

AI 主導の開発が主流になりつつある現代、
仕様書をまず Markdown で書き、
それを元に AI が実装を生成する
「SDD（Spec Driven Development：仕様駆動開発）」のような手法が
注目を集めています。
プロジェクトがドキュメント駆動のワークフローを採用するにつれ、
要件定義、設計の意思決定、API 仕様、ADR、RFC など、
互いに関連し合う Markdown ファイルの数は増大していきます。

これらのドキュメントは依存関係のグラフを形成します。
ある ID が別の ID を参照し、ファイル間がリンクされ、
ステータスの安定性が下流へと伝播していきます。
このグラフが崩れたとき（要件の削除、ID のタイポ、
セクションの欠落など）、その影響は表面化しにくいものです。

contextlint は、構造化された Markdown に対して
**決定論的な静的検証** を提供します。
AI 不要、コストゼロ、CI との相性も抜群です。

> contextlint は **コンテンツの意味的な整合性** や
> **ファイル間の整合性** に特化しています。
> Markdown の構文、フォーマット、スタイルについては、
> contextlint と併せて
> [markdownlint](https://github.com/DavidAnson/markdownlint)
> を使用してください。互いに補完し合う関係にあります。

## クイックスタート

インストール：

```bash
npm install -D @contextlint/cli
```

`contextlint.config.json` を作成：

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

実行：

```bash
npx contextlint
```

contextlint は現在のディレクトリまたは親ディレクトリから
`contextlint.config.json` を自動検出します。`include` フィールドで
デフォルトの対象ファイルを指定でき、CLI 引数で上書きできます。
どちらも指定がない場合は `**/*.md` が使用されます。

出力例：

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

> `$schema` を追加すると、VS Code・Cursor・JetBrains 等のエディタで
> 自動補完が有効になります。

## ルール一覧

### テーブルに関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| TBL-001 | テーブルに必須カラムが存在すること | `requiredColumns`, `section`?, `files`? |
| TBL-002 | 主要なカラムに空のセルがないこと | `columns`?, `files`? |
| TBL-003 | カラムの値が指定のセットに含まれること | `column`, `values`, `files`? |
| TBL-004 | セルの値が正規表現にマッチすること | `column`, `pattern`, `files`? |
| TBL-005 | カラム間の条件付き制約の検証 | `when`, `then`, `section`?, `files`? |
| TBL-006 | 指定ファイル間で ID がユニークであること | `files`, `column`, `idPattern`? |

### セクション / 構造に関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| SEC-001 | ドキュメント内に必須セクションが存在すること | `sections`, `files`? |
| SEC-002 | セクションが指定された順序で並んでいること | `order`, `level`?, `section`?, `files`? |
| STR-001 | プロジェクト内に必須ファイルが存在すること | `files` |

### 参照に関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| REF-001 | Markdown のリンク先が実在すること | `exclude`? |
| REF-002 | ID の定義と参照の整合性が取れていること | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | 依存関係における安定性の順序が守られていること | `stabilityColumn`, `stabilityOrder`, `definitions`, `references`, `idColumn`?, `idPattern`? |
| REF-004 | ゾーン間リンクが概要ファイルで宣言されていること | `zonesDir`, `dependencySection`? |
| REF-005 | アンカーフラグメントがリンク先の見出しと一致すること | `files`? |
| REF-006 | 画像参照が実在するファイルを指していること | `exclude`? |

### チェックリストに関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| CHK-001 | チェックリストの全項目がチェック済みであること | `section`?, `files`? |

### コンテキストに関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| CTX-001 | セクションにプレースホルダーではない実質的な内容があること | `section`?, `placeholders`?, `files`? |
| CTX-002 | 用語が用語集の定義と一致していること | `glossary`, `termColumn`, `aliasColumn`?, `section`?, `files`? |

### グラフに関するルール

| ID | 説明 | 設定項目 |
| --- | --- | --- |
| GRP-001 | すべての ID がドキュメントチェーンの全ステージで追跡可能であること | `chain`, `idPattern`? |
| GRP-002 | ドキュメント参照グラフが非循環であること（循環参照の検出） | `files`?, `exclude`? |
| GRP-003 | すべてのドキュメントに少なくとも 1 つの被参照があること | `files`?, `entryPoints`? |

## 設定リファレンス

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",

  // デフォルトの対象ファイルパターン（CLI でファイル指定がない場合に使用）
  "include": ["docs/**/*.md"],

  "rules": [
    // TBL-001: テーブルに必須カラムが存在すること
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status", "Description"], "files": "**/requirements.md" } },

    // TBL-002: キーとなるカラムに空のセルがないこと
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"], "files": "**/requirements.md" } },

    // TBL-003: カラムの値が許可されたセット内にあること
    { "rule": "tbl003", "options": { "column": "Status", "values": ["draft", "review", "stable"], "files": "**/requirements.md" } },

    // TBL-004: セルの値が正規表現パターンにマッチすること
    { "rule": "tbl004", "options": { "column": "ID", "pattern": "^[A-Z]+-[A-Z]+-\\d{2}$", "files": "**/requirements.md" } },

    // TBL-005: あるカラムが条件を満たすとき、別のカラムが制約を満たすこと
    { "rule": "tbl005", "options": { "when": { "column": "Status", "equals": "Done" }, "then": { "column": "Date", "notEmpty": true } } },

    // TBL-006: 指定された全ファイル間で ID がユニーク（一意）であること
    { "rule": "tbl006", "options": { "files": "**/requirements.md", "column": "ID" } },

    // SEC-001: ドキュメント内に必須セクションが存在すること
    { "rule": "sec001", "options": { "sections": ["Overview", "Requirements"], "files": "**/overview.md" } },

    // SEC-002: セクションが指定された順序で並んでいること
    //   基本 — ファイル全体で順序をチェック：
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"] } },
    //   level 指定 — 上位見出しごとにグループ化し、各グループを独立チェック：
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"], "level": 3, "files": "**/spec.md" } },
    //   section 指定 — 特定の親グループのみチェック：
    { "rule": "sec002", "options": { "order": ["Endpoints", "Error Handling"], "level": 3, "section": "API" } },

    // STR-001: プロジェクト内に必須ファイルが存在すること
    { "rule": "str001", "options": { "files": ["docs/overview.md", "docs/requirements.md"] } },

    // CHK-001: チェックリストの全項目がチェック済みであること
    { "rule": "chk001", "options": { "section": "Review Checklist", "files": "docs/reviews/*.md" } },

    // CTX-001: セクションにプレースホルダーではない実質的な内容があること
    { "rule": "ctx001", "options": { "section": "Overview", "files": "docs/**/*.md" } },

    // REF-001: 相対パスの Markdown リンクが実在するファイルを指していること
    { "rule": "ref001", "options": { "exclude": ["_references/**"] } },

    // REF-002: 定義された ID が参照されていること、また参照されている ID が実在すること
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/design.md", "**/overview.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-"
      }
    },

    // REF-003: 依存先アイテムの安定性（Status）を上回る安定性を持っていないこと
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Status",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/design.md"]
      }
    },

    // REF-004: ゾーンをまたぐリンクが、そのゾーンの概要（overview）で宣言されていること
    { "rule": "ref004", "options": { "zonesDir": "docs/zones" } },

    // REF-005: アンカーフラグメントがリンク先ファイルの見出しと一致すること
    { "rule": "ref005", "options": { "files": "docs/**/*.md" } },

    // REF-006: 画像参照が実在するファイルを指していること
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } },

    // GRP-001: すべての ID がドキュメントチェーンの全ステージで追跡可能であること
    {
      "rule": "grp001",
      "options": {
        "chain": [
          { "stage": "Requirements", "files": "**/requirements.md", "idColumn": "ID" },
          { "stage": "Design", "files": "**/design.md", "refColumn": "Requirement" },
          { "stage": "Test", "files": "**/test-plan.md", "refColumn": "Covers" }
        ],
        "idPattern": "^REQ-\\d{3}$"
      }
    },

    // GRP-002: ドキュメント参照グラフが非循環であること（循環参照の検出）
    { "rule": "grp002", "options": { "files": "docs/**/*.md", "exclude": ["CHANGELOG.md"] } },
    // GRP-003: すべてのドキュメントに少なくとも 1 つの被参照があること
    { "rule": "grp003", "options": { "files": "docs/**/*.md", "entryPoints": ["README.md", "index.md"] } }
  ],

  // コンテキストコンパイラ: Claude Code 用の SKILL.md を生成
  "compile": {
    "skill": {
      "name": "my-project",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  }
}
```

## ユースケース

これらのルールは汎用的に設計されています。

- **SDD（仕様駆動開発）** —
  仕様書が既存の要件を参照しているか、
  ファイル間で ID に矛盾がないかを検証する
- **ADR（アーキテクチャ決定記録）** —
  すべての ADR に必須セクション
  （Status、Context、Decision）が含まれているか、
  ステータスの遷移が正しいかをチェックする
- **RFC（コメント要請）** —
  RFC ドキュメントに必要な見出しが含まれているか、
  提案間の相互参照が壊れていないかを確認する
- **あらゆる構造化 Markdown プロジェクト** —
  CI でリンク切れ、重複 ID、
  ファイルの不足などを自動的に検出する

## コマンド

### Lint（デフォルト）

```bash
contextlint [files...]              # 構造化 Markdown ドキュメントをチェック
contextlint --format json           # 機械可読な出力
contextlint --watch                 # ファイル変更時に自動再実行
```

### 影響分析（Impact Analysis）

```bash
contextlint impact <file>           # 変更影響分析 + 影響範囲の lint
contextlint impact docs/req.md --format json
```

### コンテキストスライス（Context Slice）

```bash
contextlint slice <query>           # 関連ドキュメントの抽出
contextlint slice docs/req.md --depth 3
```

### ドキュメントグラフ（Document Graph）

```bash
contextlint graph                   # ドキュメント依存グラフの表示
contextlint graph --format json
```

### コンパイル（Compile）

```bash
contextlint compile                 # Claude Code 用の SKILL.md を生成
contextlint compile --dry-run       # 書き込みせずにプレビュー
contextlint compile --outdir .claude/skills/my-skill
```

## CLI オプション

| オプション | 説明 |
| ---------- | --- |
| `[files...]` | チェック対象のファイルまたは glob パターン（設定の `include` を上書き） |
| `--config <path>` | `contextlint.config.json` のパス |
| `--format <format>` | 出力形式: `human`（デフォルト）または `json` |
| `--cwd <path>` | 作業ディレクトリ |

### JSON 出力

`--format json` を指定すると、機械可読な出力が得られます（CI やエディタ連携に便利です）：

```bash
npx contextlint --format json
```

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  }
]
```

## CI での利用

### GitHub Actions

このリポジトリには、すぐに使えるコンポジットアクションが含まれています。
`--format json` で contextlint を実行し、PR にインラインアノテーションを作成します。

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # 任意
        #   files: 'docs/**/*.md'              # 任意
        #   version: 'latest'                  # 任意
```

または直接実行：

```yaml
- run: npx @contextlint/cli
```

## ウォッチモード

ファイルの変更を検知して自動的に再検証を行います：

```bash
npx contextlint --watch
npx contextlint --watch docs/**/*.md
npx contextlint --watch --config contextlint.config.json
```

ウォッチモードはまず初回の完全なチェックを実行し、
その後ワーキングディレクトリ内の `.md` ファイルの変更を監視します。
変更を検知すると、マッチする **すべての** ファイルを再チェックし
（REF-002 や TBL-006 などのクロスファイルルールに必要）、
ターミナルをクリアして、タイムスタンプ付きの最新結果を表示します。
連続する変更は 300 ミリ秒でデバウンスされます。
Ctrl+C で終了します。

## MCP サーバー

contextlint は
[MCP](https://modelcontextprotocol.io/)（Model Context Protocol）
サーバーとして動作し、
Claude や Cursor などの AI ツールが対話中に
Markdown ドキュメントをチェックできるようになります。

```bash
npm install -D @contextlint/mcp-server
```

`mcp.json`（例：`.cursor/mcp.json` や
`claude_desktop_config.json`）に追加します：

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

利用可能なツール：

| ツール | 説明 |
| ------ | --- |
| `lint` | 指定されたルールで Markdown コンテンツを直接チェックする |
| `lint-files` | 設定ファイルを使用して、パターンに一致するファイルをチェックする |
| `context-graph` | プロジェクトのドキュメント依存関係グラフを構築して返す |
| `context-slice` | クエリに関連するドキュメントの最小セットを抽出する |
| `impact-analysis` | 指定ファイルの変更がどのドキュメントに影響するかを分析する |
| `compile-context` | ドキュメント構造を LLM 向けコンテキストテキストにコンパイルする |

## プログラマティック API

### コンテキストグラフ

`@contextlint/core` は、ドキュメント間の依存関係をプログラムから分析するための
コンテキストグラフ API を提供しています。Markdown ドキュメント同士の関係性を
把握する必要があるツールの構築に役立ちます。

```typescript
import {
  parseDocument,
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
  classifyImpact,
  compileContext,
} from "@contextlint/core";
import type { ContextGraph, GraphNode, GraphEdge } from "@contextlint/core";
```

| 関数 | 説明 |
| ---- | --- |
| `buildContextGraph(documents)` | パースされたドキュメントから依存関係グラフを構築する |
| `getImpactSet(graph, filePath)` | 指定ファイルの変更によって影響を受けるファイルを取得する（直接・間接） |
| `getContextSlice(graph, documents, query, maxDepth?)` | クエリ（ファイルパスまたは ID）に関連するファイルの最小セットを取得する |
| `topologicalSort(graph)` | ドキュメントグラフのトポロジカルソート（依存順序） |
| `getComponents(graph)` | 連結成分を取得する（関連ファイルのクラスター） |
| `classifyImpact(graph, filePath)` | 影響を直接・間接に分類する |
| `compileContext(patterns, config, cwd)` | ドキュメントと設定を SKILL.md コンテンツにコンパイルする |

使用例：

```typescript
import { readFileSync } from "node:fs";
import { parseDocument, buildContextGraph, getImpactSet } from "@contextlint/core";

// ドキュメントをパース
const documents = new Map();
documents.set("docs/overview.md", parseDocument(readFileSync("docs/overview.md", "utf-8")));
documents.set("docs/requirements.md", parseDocument(readFileSync("docs/requirements.md", "utf-8")));
documents.set("docs/design.md", parseDocument(readFileSync("docs/design.md", "utf-8")));

// グラフを構築
const graph = buildContextGraph(documents);

// requirements.md が変更された場合に影響を受けるファイルは？
const impacted = getImpactSet(graph, "docs/requirements.md");
// => ["docs/design.md", "docs/overview.md"]
```

## コンテキストコンパイラ

コンテキストコンパイラは、ドキュメントと設定を決定論的に
`SKILL.md` ファイルへ変換するパイプラインです。
[Claude Code カスタムスキル](https://docs.anthropic.com/en/docs/claude-code)
向けに設計されています。
同じ設定 + 同じドキュメント = 常に同じ出力。LLM は不要です。

### 仕組み

1. `include` パターンに一致するドキュメントを読み込む
2. 依存関係グラフを構築し、各ドキュメントの役割を分類する
   （entry, hub, leaf, bridge, isolated）
3. ドキュメントプロファイルを抽出する（アウトライン、テーブルスキーマ、参照）
4. アクティブな lint ルールを自然言語で記述する
5. すべてを 1 つの SKILL.md に統合する

### 設定

`contextlint.config.json` に `compile` セクションを追加します：

```json
{
  "include": ["docs/**/*.md"],
  "compile": {
    "skill": {
      "name": "my-project-docs",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  },
  "rules": []
}
```

| フィールド | 説明 |
| ---------- | --- |
| `skill.name` | SKILL.md フロントマター用のスキル名（必須） |
| `skill.description` | SKILL.md フロントマター用のスキル説明（必須） |
| `outdir` | 出力ディレクトリ（デフォルト: `.claude/skills/contextlint`） |
| `sections.architecture` | アーキテクチャ概要を含める |
| `sections.rules` | アクティブな lint ルールを含める |
| `sections.dependencies` | 依存関係グラフを含める |
| `sections.workflow` | ワークフロー指示を含める |

### 使い方

```bash
# SKILL.md を生成
contextlint compile

# 書き込みせずにプレビュー
contextlint compile --dry-run

# 出力ディレクトリを指定
contextlint compile --outdir .claude/skills/my-skill
```

### CI パイプラインでの利用

CI パイプラインに追加して、SKILL.md をドキュメントと同期させます：

```yaml
- run: npx contextlint compile --dry-run
```

## パッケージ構成

| パッケージ | 説明 |
| --- | --- |
| `@contextlint/core` | ルールエンジンと Markdown パーサー |
| `@contextlint/cli` | CLI エントリーポイント（`contextlint`コマンド） |
| `@contextlint/mcp-server` | AI ツール連携用の MCP サーバー |

## 関連記事

- [contextlint の紹介 — 構造化 Markdown のためのリンター](https://zenn.dev/nozomi_cobo/articles/contextlint-introduction)

## ライセンス

[MIT](LICENSE)
