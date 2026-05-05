---
title: ルール単位のスコープ指定
description: files オプションで特定のファイル群にだけルールを適用する。
---

特定のルールを「ある glob にマッチするファイルだけに適用したい」場合、ルールの `files` オプションを使います。

## 基本

```json
{
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    }
  ]
}
```

この設定では SEC-001（必須セクション）を `decisions/*.md` にだけ適用します。他のファイルは SEC-001 の対象外です。

## 構文

`files` オプションは glob パターン（文字列 1 つ）を受け取ります。内部で `**/${files}` として展開されるので、相対パスで書くだけで深い階層もマッチします。

```json
{ "rule": "sec001", "options": { "files": "decisions/*.md" } }
```

これは `**/decisions/*.md` 相当で、リポジトリ内のどこにある `decisions/` ディレクトリでもマッチします。

## 使いどころ

- **ADR フォルダにのみ ADR テンプレートを強制** — `decisions/*.md` で `Context / Decision / Consequences` を必須にする
- **仕様書フォルダにのみ仕様書テンプレートを強制** — `specs/*.md` で `概要 / API / 例` を必須にする
- **新規ディレクトリだけ厳しく、レガシーディレクトリは緩く** — 段階的に整合性チェックを導入する

## include との関係

[include](/ja/docs/configuration/include-patterns/) は **検証対象ファイル全体** を絞ります。`files` は include で決まった対象の中で、**個別ルールが適用される範囲** を絞ります。両者は併用できます。

## 対応ルール

TBL-001 〜 TBL-005、SEC-001、SEC-002、REF-\* 系、CTX-001、CTX-002 でサポートされています。各ルールの詳細は [Rules](/ja/docs/rules/) を参照してください。
