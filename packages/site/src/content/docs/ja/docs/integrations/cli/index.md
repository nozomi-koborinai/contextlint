---
title: CLI
description: contextlint コマンドのサブコマンド一覧と、CLI 統合ページの目次。
---

`@contextlint/cli` パッケージが提供する `contextlint` コマンドは、ローカル開発でも CI でも同じ実行系として使えます。設定ファイルの自動検出、watch モード、機械可読な JSON 出力までを 1 つのバイナリで賄います。

インストール方法は [Get Started → インストール](/ja/docs/get-started/installation/) を参照してください。本ページではインストール後の使い方の入り口を案内します。

## サブコマンド一覧

| サブコマンド | 用途 |
| --- | --- |
| `contextlint`（デフォルト） | Markdown ドキュメントを lint する |
| `contextlint init` | 対話形式で `contextlint.config.json` を生成する |
| `contextlint compile` | ドキュメントとルールを Claude Code 向け SKILL.md に変換する |
| `contextlint impact <file>` | 指定ファイルの変更が影響するドキュメントを分析する |
| `contextlint slice <query>` | クエリに関連するドキュメントの最小セットを抽出する |
| `contextlint graph` | ドキュメント依存グラフを表示する |

各サブコマンドの引数とオプションは [コマンド](/ja/docs/integrations/cli/commands/) を参照してください。

## このセクションの構成

- [コマンド](/ja/docs/integrations/cli/commands/) — `lint` / `init` / `compile` の挙動と使い方
- [フラグリファレンス](/ja/docs/integrations/cli/flags/) — `--config` / `--format` / `--watch` / `--cwd` などの一覧
- [watch モード](/ja/docs/integrations/cli/watch-mode/) — ファイル変更を検知して自動で再 lint する
- [JSON 出力](/ja/docs/integrations/cli/json-output/) — `--format json` の形式と CI での活用

## 動作確認

インストール後は次のコマンドでバージョンを確認できます。

```bash
npx contextlint --version
```

設定ファイルがなくても `--version` や `--help` は実行できますが、lint の実行には `contextlint.config.json` が必要です。設定ファイルの作り方は [Configuration](/ja/docs/configuration/) を参照してください。
