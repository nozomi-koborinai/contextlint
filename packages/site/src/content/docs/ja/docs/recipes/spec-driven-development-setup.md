---
title: 仕様駆動開発のリポジトリ
description: 要件 → 仕様 → 実装のトレーサビリティと安定度管理を強制する contextlint 設定例。
---

このレシピは、要件・仕様・設計を SSOT (Single Source of Truth) として Markdown で管理し、そこから AI またはエンジニアがコードを生成する **仕様駆動開発 (SDD: Spec Driven Development)** を実践するリポジトリ向けの設定例です。

要件 ID のトレーサビリティ、安定度ラベルの一貫性、ゾーン (zone) 単位の責任分界を contextlint で強制します。

## どんなプロジェクトに向くか

- `docs/zones/<feature>/` のように **責務単位 (zone) でドキュメントを分割** している
- 要件テーブルが `ID` / `内容` / `安定度` のような列を持ち、`REQ-AUTH-01` のような ID で識別する
- 要件 ID が仕様・設計・テストドキュメントから繰り返し参照される
- 要件は `draft` → `review` → `stable` のようなライフサイクルで管理する
- AI エージェントにドキュメントを編集させる機会があり、参照崩れが発生しやすい

[contextlint の紹介記事](https://www.koborin.ai/ja/tech/contextlint-introduction/) で説明されている SDD の階層構造 (`foundation/` / `standards/` / `zones/`) を前提にしていますが、より単純な `docs/specs/` 1 階層のプロジェクトでも、ID と zone の glob を調整すればそのまま使えます。

## 推奨構成 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    {
      "rule": "tbl001",
      "options": {
        "files": "**/requirements.md",
        "requiredColumns": ["ID", "内容", "安定度"]
      }
    },
    {
      "rule": "tbl002",
      "options": {
        "files": "**/requirements.md",
        "columns": ["ID", "安定度"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/requirements.md",
        "column": "安定度",
        "values": ["draft", "review", "stable"]
      }
    },
    {
      "rule": "tbl004",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "pattern": "^REQ-[A-Z]+-\\d{2,3}$"
      }
    },
    {
      "rule": "tbl006",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "idPattern": "^REQ-"
      }
    },
    {
      "rule": "sec001",
      "options": {
        "files": "**/requirements.md",
        "sections": ["業務価値", "要件"]
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md", "**/test_*.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-[A-Z]+-\\d+$"
      }
    },
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "安定度",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md"]
      }
    },
    {
      "rule": "ref004",
      "options": {
        "zonesDir": "docs/zones",
        "dependencySection": "外部Zone連携"
      }
    },
    { "rule": "grp002" },
    {
      "rule": "ctx001",
      "options": {
        "files": "**/zones/**/*.md"
      }
    },
    {
      "rule": "ctx002",
      "options": {
        "glossary": "docs/foundation/glossary.md",
        "termColumn": "用語",
        "aliasColumn": "別名",
        "files": "docs/zones/**/*.md"
      }
    }
  ]
}
```

## 各ルールを選んだ理由

### TBL 系 — 要件テーブルの構造保証

要件テーブルは SDD の中核なので、構造が壊れると後続のルール (`ref002` / `ref003` / `grp001` など) もすべて意味を失います。次の順序で「箱から中身まで」 を保証します。

| ルール | 保証する内容 |
| --- | --- |
| [TBL-001 必須カラム](/ja/docs/rules/tbl-001/) | `ID` / `内容` / `安定度` の列が存在する |
| [TBL-002 空セル](/ja/docs/rules/tbl-002/) | `ID` と `安定度` のセルが空でない |
| [TBL-003 許可値](/ja/docs/rules/tbl-003/) | `安定度` 列が `draft` / `review` / `stable` のいずれか |
| [TBL-004 セルパターン](/ja/docs/rules/tbl-004/) | `ID` が `REQ-AUTH-01` のような命名規則 |
| [TBL-006 ファイル間 ID 一意性](/ja/docs/rules/tbl-006/) | プロジェクト全体で要件 ID がユニーク |

`tbl004` の `pattern` は `^REQ-[A-Z]+-\\d{2,3}$` のように、zone 名 (大文字英字) を含めた構造を強制しています。zone 名を含めないフラットな ID 体系 (`REQ-001`) を使う場合は、`pattern` を `^REQ-\\d+$` に変えてください。

### SEC-001 — 業務価値と要件セクションの存在

要件ドキュメントは「**なぜ** この要件があるか」 (業務価値) と「**何を** 実現するか」 (要件本体) の両方が揃っていることが、ステークホルダーへの説明可能性を担保します。`業務価値` だけ書いて要件テーブルを忘れる、その逆もあるため、機械的に強制します。

[SEC-001 必須セクション](/ja/docs/rules/sec-001/) を `**/requirements.md` に絞って適用しています。

### REF-002 — 要件 ID のクロスファイルトレーサビリティ

要件 ID が仕様・設計・テストから参照されないままになっていれば、その要件は実装まで届いていない可能性があります。逆に、定義されていない ID が仕様書から参照されていれば、それはコピペミスか古い ID の残存です。両方向のトレーサビリティを 1 つのルールで検証します。

[REF-002 ID の定義と参照](/ja/docs/rules/ref-002/) は **プロジェクトスコープ** のルールで、`include` 対象すべてのドキュメントから ID を抽出します。`references` で `spec_*.md` / `design_*.md` / `test_*.md` を列挙し、それぞれが定義側の要件 ID を参照しているかを確認します。

`idPattern` には zone 名を含む厳密版 (`^REQ-[A-Z]+-\\d+$`) を指定し、ヘッダー行のサンプルや `REQ-` で始まる解説テキストを誤って ID として拾わないようにします。

### REF-003 — 安定度の整合性

`stable` な仕様書が `draft` な要件を参照している、という状態は「要件が確定していないのに仕様が固まっている」 という矛盾を意味します。デモやステークホルダーレビューで要件が変わったとき、その影響が仕様にどこまで波及するかを把握するためにも、安定度の方向性は守る価値があります。

[REF-003 安定度の整合性](/ja/docs/rules/ref-003/) は要件の安定度を仕様側の行 (が持つ安定度) と比較し、`stable` → `draft` のような不整合を warning で報告します。

### REF-004 — Zone 間依存の明示化

zone は責任分界の単位なので、`auth` zone から `payment` zone への依存があれば「`auth` は `payment` に依存する」 という設計意図が明確になっている必要があります。実装上は zone をまたぐリンクを物理的に書くこと自体は可能なので、その意図が `overview.md` に宣言されているかを検証します。

[REF-004 ゾーン依存](/ja/docs/rules/ref-004/) は各 zone の `overview.md` の `外部Zone連携` セクションを依存宣言として読み取ります。`dependencySection` のデフォルトは `Dependencies` ですが、日本語ドキュメントなので明示的に `外部Zone連携` を指定しています。

### GRP-002 — グラフ全体の循環防止

要件 → 仕様 → 設計 → テストの方向で参照が広がる構造を前提にしているため、参照グラフは DAG であるべきです。zone をまたぐ循環参照や、要件と仕様が双方向にリンクし合うパターンを早期に検出します。

[GRP-002 循環参照](/ja/docs/rules/grp-002/) を採用しています。GRP-001 (トレーサビリティチェーン) は要件 → 仕様 → テストの段階構造を ID 単位で検証する強力なルールですが、zone と段階の組み合わせが多いと `chain` の構成が肥大化するため、まずは GRP-002 で循環の有無だけを保証し、必要に応じて段階追加するのが推奨です。

### REF-001 / REF-005 — リンクとアンカーの保護

zone をまたぐ Markdown リンク、用語集 (foundation) への継承リンク、仕様書から要件書への参照リンクなど、SDD の整合性は無数のリンクに支えられています。ファイル存在 (REF-001) とアンカー (REF-005) の両方を保証します。

### CTX-001 — プレースホルダ検出 (zone 配下に限定)

zone 内の仕様書で `TBD` や `TODO` を残したまま `安定度: stable` にすることがないように、`docs/zones/**/*.md` に絞ってプレースホルダを検出します。`foundation/` や `standards/` のドキュメントには適用しません (これらは初期構築段階で TBD を含むことがあるため)。

[CTX-001 プレースホルダ検出](/ja/docs/rules/ctx-001/) を `files: "**/zones/**/*.md"` で絞り込んでいます。

### CTX-002 — 用語集との一貫性

SDD では `foundation/glossary.md` を「ユビキタス言語」 として運用するため、各 zone のドキュメントが用語集の正式表記を使っているかを検証します。AI が生成した下書きには別名 (alias) が混入しがちなので、決定論的な検出が効きます。

[CTX-002 用語一貫性](/ja/docs/rules/ctx-002/) は glossary.md の `用語` カラムを正式表記、`別名` カラムを alias として参照します。glossary.md は次のような構成を想定しています。

```markdown
# 用語集

## 用語

| 用語     | 別名         |
| -------- | ------------ |
| データベース | DB, database |
| 要件     | requirement  |
```

### このレシピで採用しなかったルール

| ルール | 採用しない理由 |
| --- | --- |
| SEC-002 | requirements.md は順序固定が薄いケースが多い (テンプレート性が高ければ追加して可) |
| TBL-005 | TBL-003 / TBL-004 で安定度と ID は十分制約できる。`安定度=stable` のときに承認者列を必須にする等の運用があれば追加 |
| GRP-001 / GRP-003 | zone と段階が多くなると `chain` 設定が肥大化する。プロジェクトが安定してから追加する |
| STR-001 | `docs/foundation/glossary.md` 等の必須化は CTX-002 の `glossary` 指定で実質的に強制される |

## 運用上の注意点

### 既存リポジトリへの導入

SDD ドキュメントが多数存在する状態でこのレシピを丸ごと適用すると、要件 ID パターン違反や zone 依存の宣言漏れで違反が大量に出ます。次の順序で段階導入するのが現実的です。

1. **TBL-001 / TBL-002 / TBL-003 / TBL-004** — 要件テーブルの構造を最初に固める
2. **TBL-006** — ID の重複を解消
3. **REF-001 / REF-005** — リンクとアンカーを修復
4. **REF-002** — トレーサビリティ違反を整理 (warning は段階的に潰す)
5. **REF-003 / REF-004 / GRP-002** — 構造的な整合性
6. **CTX-001 / CTX-002** — 文脈品質の仕上げ

各ステップでコミットを分けると、レビューと差し戻しが楽になります。warning を一気に消そうとせず、まずは error だけ 0 件にする運用がおすすめです。

### AI エージェントとの連携

AI エージェントにドキュメント編集を任せる場合、編集後に MCP 経由で `lint-files` を実行させるか、Claude Code Hooks で `npx contextlint` を自動実行させると、AI 自身が違反を検出して修正できます。詳細は [AI Agents 統合](/ja/docs/integrations/ai-agents/) を参照してください。

### CI でのゲート

要件・仕様の変更は PR ベースで進めるのが普通なので、`pull_request` トリガーで `docs/**` をパスフィルタにすると効率的です。具体的なワークフロー例は [CI 連携パターン](/ja/docs/recipes/ci-integration-patterns/) を参照してください。

### chain 検証の追加 (GRP-001)

要件 → 仕様 → テスト計画のような明確な段階構造があり、各段階の網羅性を強制したい場合は GRP-001 を追加できます。その場合の `chain` 設定例は [GRP-001 トレーサビリティチェーン](/ja/docs/rules/grp-001/) のページを参照してください。
