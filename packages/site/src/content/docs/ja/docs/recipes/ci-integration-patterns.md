---
title: CI 連携パターン
description: GitHub Actions / GitLab CI / pre-commit / PR ゲートで contextlint を実行するための設定例。
---

このレシピは、contextlint を CI / CD パイプラインに組み込むための代表的なパターンを集めたものです。`pull_request` でのゲート、`push` でのスナップショット検証、ローカルの pre-commit hook、それぞれで適切な実行方法が異なります。

設定ファイル (`contextlint.config.json`) の中身については扱いません。設定例は他のレシピ ([ADR スタイルのリポジトリ](/ja/docs/recipes/adr-style-repo-setup/) / [仕様駆動開発のリポジトリ](/ja/docs/recipes/spec-driven-development-setup/) / [モノレポ](/ja/docs/recipes/monorepo-setup/)) を参照してください。

## どんなプロジェクトに向くか

- ドキュメントの整合性を **マージ前** にゲートしたい
- ローカルでも CI でも同じルール、同じ結果になることを保証したい (決定論的な検証の活用)
- PR の差分行に対して **inline annotation** を出したい
- `main` ブランチに対するスナップショットも別途取りたい

contextlint は実行が高速 (数秒) で API キーや外部 service 連携が不要なため、CI 上で気軽に走らせられます。

## 推奨構成 (GitHub Actions)

公式の Composite Action を使うのが最短です。リポジトリトップに `.github/workflows/contextlint.yml` を置きます。

```yaml
name: contextlint

on:
  pull_request:
    paths:
      - "**/*.md"
      - "contextlint.config.json"
  push:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'   # optional (省略時は自動検出)
        #   files: 'docs/**/*.md'                # optional (CLI 引数で include を上書き)
        #   version: 'latest'                    # optional (バージョン固定したい場合は 'v0.9.0' 等)
```

これだけで、`bun setup` → `@contextlint/cli` の実行 → `--format json` 出力 → PR 差分への行レベル inline annotation までを 1 ステップで実行します。

## 各設定を選んだ理由

### Composite Action の採用

公式 Composite Action (`nozomi-koborinai/contextlint/.github/actions/contextlint`) は、内部で次のことを行います。

1. `oven-sh/setup-bun@v2` で bun をセットアップ
2. `bunx @contextlint/cli@<version>` を `--format json` 付きで実行
3. JSON 出力を GitHub Actions の `::error` / `::warning` workflow command に変換し、PR 差分上にアノテーションを出す
4. error が 1 件以上あれば exit code 1 で job を失敗させる

自前で同じことを書こうとすると JSON のパースとアノテーション変換が必要になります。バージョン固定が必要なケース以外は、この Composite Action を使うのが手軽です。

### `paths` フィルタ

`pull_request: paths` で `**/*.md` と `contextlint.config.json` の変更があった PR でのみ実行します。コードだけを変更した PR で contextlint を毎回回す必要はないので、CI クレジットを節約できます。

ただし、モノレポでドキュメントが特定の `packages/*/docs/` だけにある場合でも、`paths` を `packages/*/docs/**/*.md` まで絞り込まずに `**/*.md` のままにしておくのが推奨です。理由は次の 2 つです。

1. **将来的に他の場所でドキュメントが追加された際に取りこぼす** リスクを避ける
2. **設定ファイルの変更も `paths` に含める** 必要があり、結局広めの glob のほうが管理しやすい

### `push: main` の併用

`pull_request` だけでは「main にマージされた瞬間に何かが壊れる」 ケース (squash merge / fork PR / 直接 push) を捕捉できません。`push: main` を併用しておくと、main の現在状態が常に検証された状態に保たれます。

### バージョン固定

`version: 'latest'` のままにすると、新しいルールやデフォルト挙動の変更が即座に CI に反映されます。安定性を重視するなら `version: 'v0.9.0'` のような明示的なタグ指定にし、Renovate / Dependabot で更新管理することをおすすめします。

## 他の CI システムへの応用

### GitLab CI

GitLab CI では Composite Action 相当の仕組みがないため、CLI を直接呼び出します。

```yaml
contextlint:
  image: oven/bun:latest
  rules:
    - changes:
        - "**/*.md"
        - "contextlint.config.json"
  script:
    - bunx @contextlint/cli@latest --format json > contextlint.json || true
    - |
      if [ -s contextlint.json ]; then
        cat contextlint.json
        # error が含まれていれば exit 1
        if jq -e 'any(.[]; .severity == "error")' contextlint.json > /dev/null; then
          exit 1
        fi
      fi
  artifacts:
    when: always
    paths:
      - contextlint.json
```

GitLab CI には GitHub Actions のような workflow command 形式の inline annotation はないので、`artifacts` で JSON を残し、Merge Request のレビューで参照する運用になります。

### CircleCI

CircleCI では `bun` を含む image を選ぶか、`oven-sh/bun-orb` を使います。

```yaml
version: 2.1

jobs:
  contextlint:
    docker:
      - image: oven/bun:latest
    steps:
      - checkout
      - run:
          name: Run contextlint
          command: bunx @contextlint/cli@latest

workflows:
  docs:
    jobs:
      - contextlint
```

`paths` フィルタ相当は CircleCI 標準にはないので、必要なら `path-filtering` orb を使うか、すべての commit で実行します。

### npm / pnpm 環境

`@contextlint/cli` は **bun 専用ではなく** npm から install できる通常の CLI です。bun を使わず npm / pnpm / yarn 環境で運用したい場合は、各パッケージマネージャの dlx 相当で実行できます。

```yaml
# pnpm
- run: pnpm dlx @contextlint/cli

# npm (devDependency 経由)
- run: npm install
- run: npx contextlint

# yarn
- run: yarn dlx @contextlint/cli
```

`devDependencies` に追加して `npm install` 後に `npx contextlint` を実行する形が、依存ロックの観点では最も確実です。

## ローカルの pre-commit hook

CI でゲートする以前に、ローカルでもコミット前に lint を走らせたい場合は [pre-commit](https://pre-commit.com/) または [husky](https://typicode.github.io/husky/) と [lint-staged](https://github.com/lint-staged/lint-staged) の組み合わせを使います。

### pre-commit (Python ベース)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: '\.(md)$'
        pass_filenames: false
```

`pass_filenames: false` を指定するのがポイントです。**contextlint はプロジェクトスコープのルールを持つため、変更されたファイルだけを引数で渡すと REF-001 / GRP-002 等のクロスファイル検証が崩れます。** 全体を毎回検証する想定で動かしてください。

### husky + lint-staged

`package.json`:

```json
{
  "lint-staged": {
    "*.md": "npx contextlint"
  }
}
```

ただし lint-staged はデフォルトで「変更されたファイルだけ」 を引数として渡します。プロジェクトスコープのルールを使っている場合は、`lint-staged` の代わりに husky の `pre-commit` フックで `npx contextlint` を直接呼ぶ運用にしてください。

```bash
# .husky/pre-commit
#!/bin/sh
npx contextlint
```

## 終了コードと CI ゲート

contextlint の終了コードは [CLI フラグリファレンス](/ja/docs/integrations/cli/flags/) に詳細がありますが、CI ゲートに関係する範囲だけ要約します。

| コード | 意味 | CI 動作 |
| --- | --- | --- |
| `0` | 違反なし、または warning のみ | 成功 |
| `1` | error が 1 件以上 | 失敗 (PR ゲート発動) |
| `2` | 設定ファイル不在 / パースエラー | 失敗 (CI 設定ミス扱い) |

**warning は CI を fail させません。** 「warning も止めたい」 場合は CLI の出力を grep するか、JSON 出力を jq で評価して exit code を変える wrapper を書く必要があります。

## 運用上の注意点

### Composite Action のキャッシュ

公式 Composite Action は内部で `bunx @contextlint/cli@<version>` を実行するため、毎回 npm レジストリから fetch されます。実行時間が気になる場合は、`actions/setup-bun` のあとに `actions/cache` で `~/.bun/install/cache` をキャッシュするステップを追加すると改善します。ほとんどのプロジェクトでは `latest` バージョンの fetch も数秒以内なので、デフォルトで十分速いです。

### Fork PR でのアノテーション

GitHub Actions では fork からの PR では default GITHUB_TOKEN の権限が制限されており、inline annotation が表示されないことがあります。Composite Action はアノテーション失敗で job を落とさず、stdout に同じ内容を出力するため、PR の checks タブから log で違反を確認できます。

### 段階導入

既存リポジトリで warning も含めて 100 件以上の違反が出る状態でいきなり PR ゲートを有効化すると、最初の数 PR で「無関係な箇所も全部直さないとマージできない」 状態になります。次のいずれかの手段で段階導入してください。

1. **`push: main` だけで先に運用を開始** — PR ゲートはせず、main の状態を可視化するだけ
2. **`continue-on-error: true` を job に追加** — Action は実行するが job は落とさない (アノテーションだけが出る)
3. **`include` を絞って徐々に拡大** — 最初は新しいディレクトリだけ検証、レガシーディレクトリは外す

3 つ目の方法は [include パターン](/ja/docs/configuration/include-patterns/) で否定パターンを使えば実装できます。

### 関連ドキュメント

- [CLI コマンド](/ja/docs/integrations/cli/commands/) — `lint` のサブコマンドとフラグ
- [CLI フラグリファレンス](/ja/docs/integrations/cli/flags/) — `--config` / `--format` / `--cwd` の詳細
- [CI/CD 統合](/ja/docs/integrations/ci-cd/) — このカテゴリの公式統合方法 (Composite Action の API リファレンス)
