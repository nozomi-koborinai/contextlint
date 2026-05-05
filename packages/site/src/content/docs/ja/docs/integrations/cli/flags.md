---
title: フラグリファレンス
description: contextlint コマンドで使えるフラグの一覧と用途。
---

CLI の各サブコマンドで使えるフラグ（オプション）の一覧です。サブコマンドごとに利用可能なフラグが異なります。

## 共通フラグ

すべてのサブコマンドで利用できます。

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--config <path>` | パス | （自動検出） | 使用する `contextlint.config.json` のパスを明示する |
| `--cwd <path>` | パス | カレントディレクトリ | 作業ディレクトリ。glob とパスの解決基準になる |
| `--help` | — | — | ヘルプメッセージを表示する |
| `--version` | — | — | バージョンを表示する |

`--config` を省略すると、`--cwd` から親ディレクトリへ向かって `contextlint.config.json` を探索します。挙動の詳細は [設定ファイルの自動検出](/ja/docs/configuration/auto-detection/) を参照してください。

## `lint`（デフォルト）

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `[files...]` | glob 配列 | — | 検証対象のファイル / glob パターン。設定の `include` を上書きする |
| `--format <format>` | `human` / `json` | `human` | 出力形式 |
| `--watch` | — | — | ファイル変更を検知して自動で再 lint する |

`--format` の挙動は [JSON 出力](/ja/docs/integrations/cli/json-output/) を、`--watch` は [watch モード](/ja/docs/integrations/cli/watch-mode/) を参照してください。

## `init`

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--cwd <path>` | パス | カレントディレクトリ | 設定ファイルの出力先ディレクトリ |

引数なしで実行する対話モード以外のオプションはありません。

## `compile`

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--outdir <path>` | パス | 設定の `compile.outdir`（または `.claude/skills/contextlint`） | SKILL.md の出力ディレクトリ |
| `--dry-run` | — | — | 書き込みせずに、生成内容のサマリーだけを表示する |

## `impact`

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `<file>` | パス（必須） | — | 影響を分析する起点ファイル |
| `--format <format>` | `human` / `json` | `human` | 出力形式 |

## `slice`

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `<query>` | パス / ID（必須） | — | 関連ドキュメントを抽出するクエリ |
| `--depth <depth>` | 0 以上の整数 | `2` | グラフ探索の最大深度 |
| `--format <format>` | `human` / `json` | `human` | 出力形式 |

## `graph`

| フラグ | 値 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--format <format>` | `human` / `json` | `human` | 出力形式 |
