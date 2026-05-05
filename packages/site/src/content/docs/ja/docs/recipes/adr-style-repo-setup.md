---
title: ADR スタイルのリポジトリ
description: Architecture Decision Records をテンプレート駆動で運用するための contextlint 設定例。
---

このレシピは、ソフトウェアアーキテクチャの決定事項を **ADR (Architecture Decision Records)** として Markdown で残しているリポジトリ向けの設定例です。`Context / Decision / Consequences` のような統一テンプレートを徹底し、ADR 同士の相互参照が壊れないように維持することを目的とします。

## どんなプロジェクトに向くか

- `decisions/` または `docs/adr/` のようなディレクトリに ADR を集約している
- 各 ADR が `## Context` / `## Decision` / `## Consequences` のような共通テンプレートを持つ
- ADR が他の ADR を「補足する / 置き換える」 形で相互参照する
- ADR ファイル数が増えてきて、テンプレート逸脱や参照切れを目視で追えなくなりつつある

新規にドキュメント整合性チェックを導入するリポジトリにとって、`include` の対象が `decisions/` 配下に閉じているため **副作用が読みやすい** のがこの構成の利点です。

## 推奨構成 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["decisions/**/*.md"],
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    },
    {
      "rule": "sec002",
      "options": {
        "files": "decisions/*.md",
        "order": ["Context", "Decision", "Consequences"],
        "level": 2
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "grp002" },
    {
      "rule": "tbl003",
      "options": {
        "column": "Status",
        "values": ["proposed", "accepted", "deprecated", "superseded"]
      }
    },
    { "rule": "ctx001" }
  ]
}
```

`include` を `decisions/` 以下に限定することで、README やその他の運用ドキュメントを誤検出しません。`decisions/index.md` のような目次ファイルも同じ階層に置く想定です。

## 各ルールを選んだ理由

### SEC-001 / SEC-002 — テンプレートの強制

ADR のテンプレートは「あるかどうか」 だけでなく「どの順番で並ぶか」 が読み手の認知コストに直結します。`Decision` の前に `Consequences` が来てしまうと、結論を読む前に影響だけが先に提示される形になり、レビューしづらいドキュメントになります。

- [SEC-001 必須セクション](/ja/docs/rules/sec-001/) で `Context` / `Decision` / `Consequences` の存在を強制
- [SEC-002 セクション順序](/ja/docs/rules/sec-002/) で並び順を強制 (`level: 2` で `##` 見出しに限定し、本文中の他のレベルの見出しは無視)

`files: "decisions/*.md"` を指定することで、`decisions/index.md` や `decisions/template.md` のような特殊ファイルだけを除外したい場合は、別途 glob を絞るか除外用の subdirectory を作る運用にします。

### REF-001 / REF-005 — 相互参照の保護

ADR は「ADR-005 を ADR-012 が置き換える」 のように相互に参照し合う構造になりがちです。リネームや削除でリンクが壊れても markdownlint は検出しないため、ファイル単位とアンカー単位の両方で検証します。

- [REF-001 リンク切れ](/ja/docs/rules/ref-001/) — 参照先ファイルが存在するか
- [REF-005 アンカー](/ja/docs/rules/ref-005/) — `#decision` のようなアンカーフラグメントが見出しと一致するか

REF-005 を入れない構成も多いですが、ADR では「`ADR-012#decision` を読め」 のような深いリンクが頻出するため採用しています。

### GRP-002 — supersede 関係の循環防止

「ADR-012 が ADR-005 を置き換え、さらに ADR-018 が ADR-012 を置き換える」 のような連鎖は健全ですが、ファイルの双方向リンクを書きすぎると、結果として A → B → A のような **循環参照** ができてしまうことがあります。循環参照は GRP-001 (トレーサビリティチェーン) や GRP-003 (孤立ドキュメント) を破綻させる原因にもなるため、早期に検出しておく価値があります。

- [GRP-002 循環参照](/ja/docs/rules/grp-002/) — リンクグラフが DAG であることを保証

ADR は時系列的な置き換え関係を持つので、本来であれば DAG であるべきです。

### TBL-003 — Status 値の制約

ADR の `Status` 列が `proposed` / `accepted` / `deprecated` / `superseded` の 4 値で運用されているチームは多いです。テンプレート上の例だけ書かれていて実際のルールが暗黙化していると、`approved` / `done` / `WIP` のような独自値が時間とともに混入します。

- [TBL-003 許可値](/ja/docs/rules/tbl-003/) — `Status` 列の値を 4 つに固定

このレシピは ADR が「ヘッダー部分にメタ情報テーブルを持つ」 構成 (`| Status | accepted |` のような縦書きテーブルではなく、`Status` カラムを持つ横書きテーブル) を前提にしています。縦書きテーブルを使う場合は TBL-003 を外し、TBL-005 で 「`Field` が `Status` の行は `Value` が許可リストに含まれる」 という列間制約に置き換える形で表現できます。

### CTX-001 — TBD / TODO の検出

ADR は意思決定の **記録** であって作業中の下書きではないため、`TBD` や `TODO` を残した状態で `accepted` になることはありません。本文に未確定箇所が残っていないかを機械的に検出します。

- [CTX-001 プレースホルダ検出](/ja/docs/rules/ctx-001/) — `TBD` / `TODO` / `WIP` などの残存検出

「 `proposed` 段階では `TBD` を許容したい」 場合は、`section` オプションで対象セクションを絞るか、`proposed` ファイルだけ別ディレクトリ (`decisions/draft/`) に置いて include から除外します。

### このレシピで採用しなかったルール

| ルール | 採用しない理由 |
| --- | --- |
| TBL-001 / TBL-002 / TBL-004 / TBL-006 | ADR は本文中心で、ID テーブルの構造検証は重要度が下がるため |
| REF-002 / REF-003 / GRP-001 | 要件 → 仕様 → 実装のチェーンを管理する用途ではないため |
| CTX-002 | 用語集 (glossary) を持たない ADR 専用リポジトリでは過剰 |
| REF-004 | ADR は zone 分割しないことが多いため |
| STR-001 | `decisions/index.md` 1 つに依存させずに README 中心で運用するチームが多いため |

CTX-002 と REF-004 は、ADR と仕様書を同じリポジトリで運用する場合は採用するとよいルールです。その場合は [仕様駆動開発のリポジトリ](/ja/docs/recipes/spec-driven-development-setup/) のレシピを参照してください。

## 運用上の注意点

### 既存リポジトリへの導入

ADR がすでに数十件ある状態でこのレシピを丸ごと適用すると、初回実行で大量の violation が出る可能性があります。次の順序で段階導入するのが現実的です。

1. **`ref001` だけ有効** にして、まずリンク切れを修正
2. **`sec001` を `proposed` を除いて段階適用** — 既存 ADR のテンプレート逸脱を直すコミットを 1 つ作る
3. **`sec002` を追加** — 順序の入れ替えだけ修正
4. **`tbl003` を追加** — Status 値の整理
5. **`grp002` / `ctx001` / `ref005` を追加** — 残りの構造的整合性

ファイル単位で除外したい場合は、`include` で `!decisions/legacy/**` のような否定パターンを使うか、レガシー ADR を `decisions/archive/` のような別ディレクトリに移して include から外します。

### CI でのゲート

ADR は通常 PR ベースで追加・編集するため、`pull_request` トリガーで `decisions/**` のパスフィルタを付けると無駄な実行を避けられます。具体的なワークフロー例は [CI 連携パターン](/ja/docs/recipes/ci-integration-patterns/) を参照してください。

### テンプレートファイルの除外

`decisions/template.md` のような書式テンプレートを置く場合、SEC-001 / SEC-002 のチェックを通すために実体のないセクション見出しだけが並んだファイルになります。

- 推奨: `decisions/template.md` を `decisions/_template.md` にして `include` を `decisions/[!_]*.md` に変更
- 代替案: テンプレートを別ディレクトリ (`docs/templates/`) に移動

`include` の glob は picomatch なので、否定文字クラス (`[!_]`) で先頭が `_` のファイルを除外できます。詳細は [include パターン](/ja/docs/configuration/include-patterns/) を参照してください。
