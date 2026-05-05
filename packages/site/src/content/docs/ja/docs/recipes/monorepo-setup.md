---
title: モノレポ
description: 複数 package のドキュメントを 1 つの設定でまとめて検証する contextlint 設定例。
---

このレシピは、複数の package が同じリポジトリで開発される **モノレポ** 向けの設定例です。bun workspace / pnpm workspace / yarn workspace / Nx / Turborepo など、ワークスペース管理ツールの違いに依らず使えます。

## どんなプロジェクトに向くか

- ルート直下に `packages/` または `apps/` のような形で複数 package が並んでいる
- 各 package が独自に `docs/` または `README.md` を持つ
- リポジトリトップに横断的なドキュメント (`docs/architecture.md` 等) もある
- ドキュメントの整合性ルールを **package ごとにバラバラに設定したくない** (1 つの設定でまとめて統治したい)

CLI から個別 package のドキュメントだけを検証する運用にも対応できます。`include` パターンの組み立てが鍵になります。

## 推奨構成 (`contextlint.config.json`)

リポジトリルートに 1 つだけ配置します。

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": [
    "docs/**/*.md",
    "packages/*/docs/**/*.md",
    "packages/*/README.md",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  "rules": [
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "ctx001" },
    {
      "rule": "sec001",
      "options": {
        "files": "packages/*/README.md",
        "sections": ["Installation", "Usage"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/changelog.md",
        "column": "Status",
        "values": ["unreleased", "released", "deprecated"]
      }
    },
    { "rule": "grp002" }
  ]
}
```

`include` の各 glob は **ルート設定ファイルからの相対パス** として解釈されます。`packages/api` 内で `npx contextlint` を実行しても、ルートの設定が自動検出されて同じ glob が使われます (詳細は [設定ファイルの自動検出](/ja/docs/configuration/auto-detection/) を参照)。

## 各ルールを選んだ理由

### include パターンの組み立て方

モノレポでは、検証対象を「どの単位で含めるか」 が最も大事な設計判断です。3 つの典型的な組み合わせを示します。

| 用途 | include パターン | 検証対象 |
| --- | --- | --- |
| 各 package の `docs/` だけ | `packages/*/docs/**/*.md` | package が持つ詳細ドキュメント |
| 各 package の `README.md` も含める | 上記 + `packages/*/README.md` | 公開ドキュメント全体 |
| ルート横断ドキュメントも含める | 上記 + `docs/**/*.md` | リポジトリ全体のアーキテクチャドキュメント |

このレシピでは 3 つすべてを含めています。**`*/` (1 階層のみ) と `**/` (再帰) の使い分け** に注意してください。

- `packages/*/docs/**/*.md` — `packages/api/docs/...` には match するが `packages/api/sub/sub/docs/...` には match しない
- `packages/**/docs/**/*.md` — どこの階層にある `docs/` も match する (Nx のような nested workspaces で有用)

`!**/node_modules/**` と `!**/dist/**` の否定パターンは、誤って依存パッケージのドキュメントやビルド成果物を拾わないための **保険** です。`include` の肯定パターンが既に十分絞られていれば不要ですが、glob の挙動を意識せず追加変更する開発者が複数いる場合に効きます。

### REF-001 / REF-005 — package 間リンクの保護

モノレポでは `packages/api/docs/architecture.md` から `packages/web/docs/api-contract.md` への横断リンクが生じやすく、リネームのたびに静かに壊れます。リンク (REF-001) とアンカー (REF-005) を両方守ります。

これらのルールは `include` 対象の Markdown ファイル全体を見て解決するため、別 package のドキュメントでも同じ設定で検証できます。

### GRP-002 — package 間の循環参照

`api` の docs が `web` を参照し、`web` の docs が `api` を参照する形は短期的にはよくありますが、依存関係としては不健全です (一方向に整理すべき)。[GRP-002 循環参照](/ja/docs/rules/grp-002/) で参照グラフが DAG であることを保証します。

モノレポでは循環参照が package 単位の依存関係 (`package.json` の dependencies) に裏返ることが多く、ドキュメント側で先に検出できると設計の見直しがしやすくなります。

### SEC-001 — README テンプレートの統一

`packages/*/README.md` には、最低限 `Installation` / `Usage` セクションがあると、新規ユーザーが各 package を読み始める認知コストが下がります。

[SEC-001 必須セクション](/ja/docs/rules/sec-001/) を `packages/*/README.md` に絞って適用します。section 名はチームの慣行に合わせて変更してください (`概要` / `使い方` のような日本語見出しでも可)。

### CTX-001 — プレースホルダ検出 (全体)

複数 package が並ぶリポジトリでは、特定 package で TODO や TBD が残ったままになりがちです。グローバルに検出することで、リリース直前に未完成箇所を洗い出せます。

`files` を絞らずに `include` の対象全体に適用しています。

### TBL-003 — changelog のステータス制約

各 package が `CHANGELOG.md` または `changelog.md` を持っている場合、`Status` 列が `unreleased` / `released` / `deprecated` のような決まった値で運用されているケースが多いです。表記ゆれ (`WIP` / `done` / `pending` 等) を防ぎます。

`changelog.md` を持たない package では、このルールは何も検出しないので無害です。

### このレシピで採用しなかったルール

| ルール | 採用しない理由 |
| --- | --- |
| TBL-006 | package ごとに ID 体系が異なる場合は適用が難しい。各 package で独立した ID を使うなら不要 |
| REF-002 / REF-003 | 要件 ID のトレーサビリティはモノレポではなく feature 単位で運用するほうが自然 |
| REF-004 | zone 構造を持つモノレポは少数派 |
| GRP-001 / GRP-003 | package ごとに依存グラフの形が違うため、画一的な chain 検証は外す |
| STR-001 | 各 package に必要なファイルは package.json の `files` フィールドで管理されることが多い |

要件管理を行うモノレポなら、[仕様駆動開発のリポジトリ](/ja/docs/recipes/spec-driven-development-setup/) のレシピと組み合わせて使うことを検討してください。

## 運用上の注意点

### 個別 package だけ lint したい場合

CLI 引数で glob を渡すと、設定ファイルの `include` を上書きできます。

```bash
# packages/api だけを lint
npx contextlint "packages/api/**/*.md"
```

ただし `include` を上書きするとプロジェクトスコープのルール (REF-001 / REF-005 / GRP-002 等) は **指定した glob 内に閉じて** 評価されます。`packages/api` から `packages/web` へのリンクを検証したいなら、引数で範囲を絞らずに全体を lint するか、`packages/api/**/*.md` と `packages/web/**/*.md` を併記してください。

詳細は [include パターン](/ja/docs/configuration/include-patterns/) の優先順位の節を参照してください。

### CI でのパスフィルタとマトリクス

モノレポでは `docs` 関連の変更があった package だけを CI で検証したくなる場面がありますが、contextlint は **プロジェクトスコープのルール** (REF-001 / REF-002 / GRP-002 等) があるため、対象を絞ると参照先の存在検証が崩れます。

推奨は次のいずれかです。

1. **常にリポジトリ全体を lint** — `pull_request: paths: ["**/*.md"]` のようなフィルタで「Markdown が変更された PR でだけ実行」 はしてもよいが、実行時には全体を見る
2. **CLI のサブセット指定は使わない** — モノレポでは `npx contextlint` を引数なしで実行する

実行時間が長くなる場合のみ、各 package のディレクトリだけを include に列挙する独立した設定ファイルを CI 用に分けて用意する運用に切り替えます。具体的なワークフロー例は [CI 連携パターン](/ja/docs/recipes/ci-integration-patterns/) を参照してください。

### package ごとの差別化

「`apps/` はテンプレート強制を厳しく、`packages/` の internal lib は緩く」 のような差別化は、各ルールの `files` オプションで実現できます。

```json
{
  "rule": "sec001",
  "options": {
    "files": "apps/*/README.md",
    "sections": ["Overview", "Setup", "Deployment"]
  }
}
```

`files` で適用範囲を絞っても、ルールが評価されるドキュメント集合 (= `include`) は全体のままです。詳細は [ルール単位のスコープ指定](/ja/docs/configuration/per-file-rule-scoping/) を参照してください。

### サブディレクトリで実行されたときの挙動

bun workspace / pnpm workspace のような環境で、`packages/api/` ディレクトリから `npx contextlint` を実行すると、設定ファイルは親ディレクトリを遡って自動検出されます。glob はルート (= 設定ファイルの場所) を起点に解釈されるので、サブディレクトリで実行しても結果は同じです。

詳細は [設定ファイルの自動検出](/ja/docs/configuration/auto-detection/) を参照してください。
