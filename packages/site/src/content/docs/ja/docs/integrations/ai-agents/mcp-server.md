---
title: MCP サーバー
description: "@contextlint/mcp-server のセットアップと、AI ホストから呼び出せる 5 つのツールの仕様。"
---

`@contextlint/mcp-server` は contextlint の機能を [Model Context Protocol](https://modelcontextprotocol.io/) 経由で AI ホストに公開するサーバーです。Claude Desktop、Cursor、Cline、Codex などの MCP 対応ホストに登録すると、AI が会話の中で lint 実行・グラフ参照・影響分析を呼び出せるようになります。

## インストール

```bash
npm install -D @contextlint/mcp-server
```

`npx @contextlint/mcp-server` でも実行できるため、グローバルインストールやプロジェクト内インストールはホスト側の設定スタイルに合わせて選んでください。

## ホスト別のセットアップ

MCP サーバーは stdio で通信するシンプルなコマンドです。各ホストの設定ファイルに同じ形式のエントリを追加します。

### Claude Desktop

`claude_desktop_config.json`（macOS では `~/Library/Application Support/Claude/claude_desktop_config.json`）を編集します。

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

### Cursor

`.cursor/mcp.json`（プロジェクト固有）または `~/.cursor/mcp.json`（ユーザー全体）に同じ形式で追加します。

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

### その他のホスト

Cline、Codex、Windsurf など、MCP に対応するホストはおおむね同じ形式の設定ファイルを採用しています。`command` と `args` を上記と揃えれば動作します。

## 提供する 5 つのツール

MCP サーバーは以下のツールを公開しています。AI は会話の中で必要に応じてこれらを呼び出します。

| ツール | 用途 |
| --- | --- |
| `lint` | Markdown 文字列を直接渡してルール検証する |
| `lint-files` | glob パターンと設定ファイルを使って複数ファイルを検証する |
| `context-graph` | ドキュメント依存グラフを構築して返す |
| `context-slice` | クエリ（ID / キーワード / ファイルパス）に関連するファイル群を最小セットで抽出する |
| `impact-analysis` | 指定ファイルの変更によって直接・間接に影響を受けるファイルを分類して返す |

### lint

その場で渡した Markdown コンテンツを、明示したルール構成で検証します。設定ファイル不要のアドホック検証に向いています。

| 入力 | 型 | 概要 |
| --- | --- | --- |
| `content` | string | 検証対象の Markdown |
| `rules` | object[] | 適用するルール（`rule` と任意の `options`） |

### lint-files

glob パターンに一致するファイルを `contextlint.config.json` の設定で検証します。CLI の `npx contextlint` と同じ挙動を MCP 経由で呼び出せます。

| 入力 | 型 | 概要 |
| --- | --- | --- |
| `patterns` | string[]（任意） | glob パターン。省略時は config の `include`、それも無ければ `["**/*.md"]` |
| `configPath` | string（任意） | 設定ファイルへのパス。省略時は親ディレクトリを遡って自動検出 |
| `cwd` | string（任意） | 作業ディレクトリ |

### context-graph

ドキュメント間の依存グラフを構築して返します。`format: "json"` を指定すると構造化された JSON、省略時は人間が読めるサマリ形式になります。AI に「リポジトリの全体像を把握させる」用途で有用です。

### context-slice

ID（例: `REQ-101`）、キーワード、ファイルパスを `query` に渡すと、それに関連するファイルの最小セットを返します。`depth` で辿る深さを制御できます（デフォルト 2）。AI コンテキストに無関係なファイルを送らずに済むため、トークン消費を抑えながら正確な参照を渡せます。

### impact-analysis

ファイルが変更された場合に影響を受けるドキュメントを **直接（直接参照されている）** と **間接（参照の連鎖で到達できる）** に分類して返します。リファクタや削除前の安全性確認に使います。

## 設定ファイルとの関係

`lint-files` / `context-graph` / `context-slice` / `impact-analysis` はいずれも `contextlint.config.json` を参照します。設定ファイルが見つからない場合はエラーを返すので、まずは [contextlint-init Skill](/ja/docs/integrations/ai-agents/skill-init/) または [Quick Start — 手動](/ja/docs/get-started/quick-start-manual/) でセットアップを済ませてください。

## CLI との関係

MCP サーバーと CLI は同じ `@contextlint/core` の `lintFiles` パイプラインを使っています。出力フォーマットはどちらも揃えてあるため、AI が MCP で得た結果と人間が CLI で得る結果は一致します。
