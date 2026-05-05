---
title: 設定ファイル
description: contextlint.config.json の構造と各フィールドの概要。
---

contextlint の設定ファイルは `contextlint.config.json` という名前で、リポジトリ直下に配置します。JSON 形式です。

## 最小例

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" }
  ]
}
```

## フィールド

| フィールド | 型 | 必須 | 概要 |
|-----------|------|------|------|
| `$schema` | string | 推奨 | エディタの自動補完用 |
| `include` | string[] | 任意 | 検証対象の glob パターン。詳細は [include パターン](/ja/docs/configuration/include-patterns/) |
| `rules` | object[] | 必須 | 有効化するルールの配列。各ルールの仕様は [Rules](/ja/docs/rules/) |

## $schema

`$schema` を指定すると、VS Code / Cursor / JetBrains などのエディタで設定ファイル編集時に自動補完とインライン検証が有効になります。リリース版に固定したい場合は、URL の `main` を `v1.0.0` のようなタグ名に置き換えてください。

## バリデーション

設定ファイルは Zod schema で実行時にバリデーションされます。フィールドの型が不正だったり、未知のルール ID を指定したりすると、起動時にユーザー向けのエラーメッセージが表示されます。
