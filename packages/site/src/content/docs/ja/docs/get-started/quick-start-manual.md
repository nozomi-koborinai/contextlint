---
title: Quick Start — 手動
description: CLI を直接使って contextlint を手動でセットアップする。
---

AI ホストを使っていない、または設定を完全に自分で管理したい場合の手順です。3 つのコマンドで lint 実行までたどり着けます。

## 1. インストール

最短は次のコマンドです。

```bash
npm install -D @contextlint/cli
```

bun / pnpm / yarn の場合は [インストール](/ja/docs/get-started/installation/) を参照してください。

## 2. 対話モードで設定ファイルを作る

`contextlint init` を実行すると、対話モードでプロジェクトに合わせた `contextlint.config.json` を作成できます。

```bash
npx contextlint init
```

質問に答えていくと、リポジトリ直下に次のような設定ファイルが生成されます。

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "grp002" }
  ]
}
```

設定ファイルの各フィールドの意味は [Configuration](/ja/docs/configuration/) で詳細に説明します。後から手動で編集して構いません。

## 3. lint を実行する

```bash
npx contextlint
```

contextlint は現在のディレクトリから親ディレクトリへ向かって `contextlint.config.json` を探し、見つかった設定ファイルの `include` に従って Markdown を検証します。CLI の引数で対象ファイルを指定すれば、設定ファイルの `include` を上書きできます。

```bash
npx contextlint "specs/**/*.md"
```

## 次のステップ

- [はじめての lint 実行](/ja/docs/get-started/your-first-lint/) — 出力の読み方とよくある違反パターン
- AI ホストから設定したい場合は [Quick Start — AI 連携](/ja/docs/get-started/quick-start-ai/)
