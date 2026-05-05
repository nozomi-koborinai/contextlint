---
title: コマンド
description: contextlint / contextlint init / contextlint compile の挙動と使い方。
---

このページでは、日常的に使う 3 つのサブコマンド `lint`（デフォルト）/ `init` / `compile` の挙動を解説します。グラフ系サブコマンド（`impact` / `slice` / `graph`）の詳細は [Concepts](/ja/docs/concepts/) を参照してください。

## `contextlint`（lint、デフォルト）

引数なしで実行すると、設定ファイルの `include` パターン（または CLI で渡した glob）に該当する Markdown ファイルをすべて検証します。

```bash
# include パターンに従って lint
npx contextlint

# 特定のファイル / glob を指定して lint（include を上書き）
npx contextlint "docs/**/*.md"

# 設定ファイルのパスを明示
npx contextlint --config contextlint.config.json
```

検証対象の決定ロジック（CLI 引数 → `include` → デフォルトの順）は [include パターン](/ja/docs/configuration/include-patterns/) を参照してください。

### 終了コード

| コード | 意味 |
| --- | --- |
| `0` | 違反なし、または warning のみ |
| `1` | error が 1 件以上 |
| `2` | 設定ファイルの不在 / パースエラーなどの実行時エラー |

CI で PR をブロックしたい場合、終了コード `1` を失敗扱いにすれば error の発生で job が落ちます。

## `contextlint init`

対話形式で `contextlint.config.json` を生成します。言語・include パターン・ルールカテゴリを順に選ぶだけで、追加設定が不要なルール（zero-config rules）が自動で配置された設定ファイルが書き出されます。

```bash
npx contextlint init
```

対話のステップは次の 4 つです。

1. **言語の選択** — 英語 / 日本語 / 中国語 / 韓国語
2. **include パターンの入力** — カンマ区切りで複数指定可（空欄ならデフォルト `**/*.md`）
3. **ルールカテゴリの選択** — TBL / SEC / STR / REF / CHK / CTX / GRP からチェックボックスで複数選択
4. **既存ファイルの上書き確認** — `contextlint.config.json` がすでにある場合のみ

生成された設定ファイルは追加オプションが不要なルールだけが入った状態なので、必要に応じてルールごとの `options` を手動で追記してください。詳細は [設定ファイル](/ja/docs/configuration/config-file/) と [Rules](/ja/docs/rules/) を参照してください。

AI ホストを使っているなら、`contextlint-init` Skill を使う方法もあります（リポジトリ構造を分析してルール選択まで AI が行う）。詳細は [Get Started → インストール](/ja/docs/get-started/installation/) を参照してください。

## `contextlint compile`

ドキュメントと有効なルールから、決定論的に `SKILL.md` ファイルを生成します。Claude Code のカスタムスキルとして使う想定です。

```bash
# SKILL.md を生成
npx contextlint compile

# 書き込みせずに何が生成されるかを確認
npx contextlint compile --dry-run

# 出力ディレクトリを上書き
npx contextlint compile --outdir .claude/skills/my-skill
```

`compile` の実行には `contextlint.config.json` に `compile` セクションが必要です。`compile` セクションがない状態で実行するとエラー終了します。設定の書き方とパイプラインの仕組みは [Concepts → Context Compiler](/ja/docs/concepts/) を参照してください。
