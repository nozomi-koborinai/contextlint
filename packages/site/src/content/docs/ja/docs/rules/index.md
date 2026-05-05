---
title: Rules
description: contextlint の 21 個のルールリファレンス。
---

contextlint には **21 個のルール** があり、7 つのカテゴリに分類されています。各ルールは ID で `contextlint.config.json` の `rules` 配列に登録します。

## カテゴリ

| Prefix | カテゴリ | 検証する内容 |
|--------|---------|-------------|
| **TBL** | Table | テーブルの内容: 必須カラム、空セル、許可値、パターン、列間制約、ファイル間 ID 一意性 |
| **SEC** | Section | セクション見出しの存在と順序 |
| **STR** | Structure | プロジェクトレベルのファイル存在 |
| **REF** | Reference | リンク、アンカー、ファイル間 ID 参照、安定度の整合性、ゾーン依存、画像参照 |
| **CHK** | Checklist | チェックリストの完了状態 |
| **CTX** | Context | プレースホルダ検出、用語の一貫性 |
| **GRP** | Graph | ドキュメント依存グラフ: トレーサビリティチェーン、循環参照、孤立ドキュメント |

## 全 21 ルール

### TBL — テーブル (6)

- [TBL-001 必須カラム](/ja/docs/rules/tbl-001/)
- [TBL-002 空セル](/ja/docs/rules/tbl-002/)
- [TBL-003 許可値](/ja/docs/rules/tbl-003/)
- [TBL-004 セルパターン](/ja/docs/rules/tbl-004/)
- [TBL-005 列間制約](/ja/docs/rules/tbl-005/)
- [TBL-006 ファイル間 ID 一意性](/ja/docs/rules/tbl-006/)

### SEC — セクション (2)

- [SEC-001 必須セクション](/ja/docs/rules/sec-001/)
- [SEC-002 セクション順序](/ja/docs/rules/sec-002/)

### STR — 構造 (1)

- [STR-001 ファイル存在](/ja/docs/rules/str-001/)

### REF — 参照 (6)

- [REF-001 リンク切れ](/ja/docs/rules/ref-001/)
- [REF-002 ID の定義と参照](/ja/docs/rules/ref-002/)
- [REF-003 安定度の整合性](/ja/docs/rules/ref-003/)
- [REF-004 ゾーン依存](/ja/docs/rules/ref-004/)
- [REF-005 アンカー](/ja/docs/rules/ref-005/)
- [REF-006 画像参照](/ja/docs/rules/ref-006/)

### CHK — チェックリスト (1)

- [CHK-001 未完了アイテム](/ja/docs/rules/chk-001/)

### CTX — コンテキスト品質 (2)

- [CTX-001 プレースホルダ検出](/ja/docs/rules/ctx-001/)
- [CTX-002 用語一貫性](/ja/docs/rules/ctx-002/)

### GRP — グラフ (3)

- [GRP-001 トレーサビリティチェーン](/ja/docs/rules/grp-001/)
- [GRP-002 循環参照](/ja/docs/rules/grp-002/)
- [GRP-003 孤立ドキュメント](/ja/docs/rules/grp-003/)

## 各ルール page の構成

1. **概要** — 何を検出するか
2. **なぜ必要か** — どんな問題を防ぐか
3. **オプション** — 設定可能なフィールド
4. **違反例と修正後** — Bad → Good
5. **関連ルール**

## 設定方法

各ルールは `contextlint.config.json` の `rules` 配列に登録します。

```json
{
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

ルール ID は `<prefix><number>` 形式（3 桁ゼロ埋め）。詳細は [Configuration](/ja/docs/configuration/) を参照してください。
