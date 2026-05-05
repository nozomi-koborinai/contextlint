---
title: 新しいルールの追加
description: contextlint に新しいルールを実装するためのステップごとの手順。
---

contextlint に新しいルールを追加する際の手順を、ID 採番から `schema.json` 更新までステップごとに解説します。各ルールは `packages/core/src/rules/<rule-id>.ts` に 1 ファイルずつ配置され、Zod schema をオプションの単一情報源として持ちます。

## 1. ID の採番

新しいルールはまずカテゴリを決め、その中で **次に空いている連番** を 3 桁ゼロ埋めで割り当てます。

| Prefix | カテゴリ | 検証対象 |
|--------|---------|---------|
| TBL | Table | テーブル内容（必須カラム、空セル、許可値、パターン、列間制約、ファイル間 ID 一意性） |
| SEC | Section | セクション見出し（存在、順序） |
| STR | Structure | プロジェクトレベルのファイル存在 |
| REF | Reference | リンク、アンカー、ID 参照、安定度の整合性、ゾーン依存、画像参照 |
| CHK | Checklist | チェックリストの完了状態 |
| CTX | Context | コンテンツ品質（プレースホルダ検出、用語一貫性） |
| GRP | Graph | ドキュメント依存グラフ（トレーサビリティ、循環参照、孤立ドキュメント） |

たとえば TBL カテゴリに新しいルールを追加する場合、既存の TBL-001〜TBL-006 の次として **TBL-007** を採番します。

ルール ID 形式は `<PREFIX>-<3桁>`（ドキュメント・ログ表示用）とし、registry 上のキーは小文字連結 `<prefix><3桁>`（例: `tbl007`）になります。

## 2. ルールファイルの作成

`packages/core/src/rules/<id>.ts` を作成します。たとえば `TBL-007` なら `packages/core/src/rules/tbl-007.ts` です。

最小骨格は以下の通りです。

```typescript
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { globMatch } from "../utils/glob-match.js";

export const tbl007Schema = z.object({
  // ルール固有のオプション
  files: z.string().optional(),
}).strict();

export type Tbl007Options = z.infer<typeof tbl007Schema>;

export function tbl007(options: Tbl007Options): Rule {
  const isMatch = options.files ? globMatch(`**/${options.files}`) : null;

  return {
    id: "TBL-007",
    description: "Short English description of what this rule checks",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      // テーブルやセクションを走査して context.report() で違反を報告する
    },
  };
}
```

## 3. Zod schema の定義

各ルールは **Zod schema を単一情報源** とします。手書きの interface を書かず、`z.infer<typeof xxxSchema>` で型を導出してください。

- スキーマ名は `<prefix><number>Schema`（例: `tbl007Schema`）
- 末尾に `.strict()` を付けて未知のフィールドを拒否
- 正規表現を受け取る場合は `utils/regex-string.ts` の `regexString` を使い、設定ロード時にパターン不正を検出
- ファイルマッチ用の `files?: string` オプションを受け取るルールは、変数名 `isMatch`、フォールバック `null`、`**/${options.files}` プレフィックスの規約に従う

registry 側で `schema.parse(options)` が走るため、ルール本体の中で `as` キャストや手動バリデーションは不要です。

## 4. registry への登録

`packages/core/src/registry.ts` を編集して、新しいルールを登録します。

```typescript
import { tbl007, tbl007Schema } from "./rules/tbl-007.js";

const registry = {
  // ... 既存ルール ...
  tbl007: defineRule(tbl007Schema, tbl007),
};
```

`defineRule` は schema と factory を組にして、`resolveRule` から `schema.parse()` 経由で呼べるようにします。`Zod` の検証エラーは自動的にユーザー向けメッセージ（ルール名 + フィールドパス付き）に変換されます。

## 5. `schema.json` の更新

リポジトリ直下の `schema.json` は `contextlint.config.json` のエディタ自動補完用 JSON Schema です。新しいルールを追加したら、対応するエントリを `properties.rules.items.oneOf` に **必ず追加** してください。

エントリの形式は既存ルール（TBL-001 など）に倣います。

```json
{
  "type": "object",
  "description": "TBL-007: Short description.",
  "properties": {
    "rule": { "const": "tbl007" },
    "options": {
      "type": "object",
      "description": "Options for TBL-007.",
      "properties": {
        // Zod schema と一致するフィールド
      },
      "required": ["..."],
      "additionalProperties": false
    }
  },
  "required": ["rule", "options"],
  "additionalProperties": false
}
```

CI 上では `packages/core/src/schema.test.ts` が registry と `schema.json` の整合性を検証します。エントリ追加を忘れたり、登録から外した古いエントリが残っていたりするとテストが失敗します。

## 6. テストの追加

ルールファイルと同じディレクトリに `<id>.test.ts` を作成します（例: `packages/core/src/rules/tbl-007.test.ts`）。

テストは `bun:test` で記述し、**正常系・違反検出・オプションごとの挙動** に加えて、**日本語・韓国語・中国語** のテストフィクスチャを必ず含めてください。CJK 要件の詳細は [テストの書き方](/ja/docs/contributing/writing-tests/) を参照してください。

## 7. ドキュメントの追加

ユーザー向けドキュメントを以下の各言語ごとに追加・更新します。

- `packages/site/src/content/docs/ja/docs/rules/<id>.md`（日本語）
- `packages/site/src/content/docs/en/docs/rules/<id>.md`（英語）
- `packages/site/src/content/docs/ko/docs/rules/<id>.md`（韓国語）
- `packages/site/src/content/docs/zh/docs/rules/<id>.md`（中国語）

各ルール page は次の構成で書きます。

1. 概要（何を検出するか）
2. なぜ必要か（どんな問題を防ぐか）
3. オプション（フィールド表）
4. 違反例と修正後（Bad → Good）
5. 設定例（`contextlint.config.json` 抜粋）
6. 関連ルール

加えて、`Rules` カテゴリの index（各言語の `rules/index.md`）に新しいルールへのリンクを追加します。CLI / 設定 / READMEに影響する変更を入れた場合は、リポジトリ直下の `README.md` / `README.ja.md` / `README.zh.md` / `README.ko.md` も **すべて** 更新してください。一言語だけ更新するのは避けてください。

## 8. 動作確認

最後に、リポジトリルートで以下を実行してすべて通ることを確認します。

```bash
bun test
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

`schema.test.ts` が通れば registry と `schema.json` の整合性も保たれています。

## コミットと Pull Request

Conventional Commits 形式でコミットします。新規ルール追加は通常 `feat:` プレフィックスです。

```text
feat: add TBL-007 rule for <what it validates>
```

ルールを 1 つ追加するごとに、ルール本体・registry 登録・`schema.json` 更新・テスト・ドキュメント追加を 1 つの PR にまとめると、レビューが容易です。

## 関連

- [テストの書き方](/ja/docs/contributing/writing-tests/) — テスト規約と CJK 要件
- [Rules](/ja/docs/rules/) — 既存ルールの一覧（実装の参考）
