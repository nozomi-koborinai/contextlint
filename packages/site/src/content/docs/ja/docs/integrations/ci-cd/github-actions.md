---
title: GitHub Actions
description: contextlint を GitHub Actions のワークフローに組み込む 2 つの方法。
---

contextlint は GitHub Actions と相性の良い 2 つの統合方法を提供しています。**公式の Composite Action** を使う方法と、`npx` で直接実行する方法です。最低限の設定で PR ごとに lint を走らせることができ、違反時はジョブが失敗します。

## 公式の Composite Action

リポジトリには `nozomi-koborinai/contextlint` 配下に Composite Action が含まれています。`--format json` で contextlint を実行し、PR にインラインアノテーションを付ける処理まで Action 側で完結します。

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

| 入力 | 概要 |
| --- | --- |
| `config` | 設定ファイルへのパス。省略時は親ディレクトリを遡って自動検出 |
| `files` | 検証対象の glob。省略時は config の `include` を使用 |
| `version` | 利用する `@contextlint/cli` のバージョン。省略時は `latest` |

`paths` を指定するとドキュメント変更があった PR でだけ走るので、CI 時間を抑えられます。

## 直接実行する場合

Composite Action を使わずに、シンプルに `npx` で実行することもできます。Node.js 環境があれば追加のセットアップは不要です。

```yaml
name: contextlint
on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli
```

設定ファイルがリポジトリにあれば `npx @contextlint/cli` だけで lint が走ります。違反があると非ゼロ終了するので、ジョブが自動的に失敗扱いになります。

## 既存パッケージマネージャーで実行する

リポジトリで bun / pnpm / yarn を使っているなら、`devDependencies` に `@contextlint/cli` を含めた上で `bun run` などから呼ぶ方が依存解決が早くなります。

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bunx contextlint
```

依存ロックがバージョンを固定するため、CI で実行されるバージョンと開発機で実行されるバージョンが一致します。

## アノテーション

Composite Action はインラインアノテーションを自動で付けますが、直接実行する構成でも JSON 出力をスクリプトで処理することで同等のことが可能です。

```yaml
- run: npx contextlint --format json | tee contextlint.json
- run: node ./scripts/annotate.js contextlint.json
```

JSON の構造は [JSON 出力](/ja/docs/integrations/cli/json-output/) を参照してください。

## 並列ジョブとの組み合わせ

contextlint は `markdownlint` や `eslint` と並列に走らせても問題ありません。両者は責務が分かれているため、結果も干渉しません。

```yaml
jobs:
  contextlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli

  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx markdownlint-cli2 "**/*.md"
```

contextlint と markdownlint の責務の違いは [意味的リンターと構文リンター](/ja/docs/concepts/semantic-vs-syntax/) を参照してください。

## SKILL.md の同期

`contextlint compile` は決定論的なので、CI 上で `--dry-run` を走らせると「リポジトリの SKILL.md がドキュメントの最新状態と同期しているか」を検証できます。

```yaml
- run: npx contextlint compile --dry-run
```

差分があれば非ゼロ終了するので、SKILL.md の更新忘れを CI で検知できます。
