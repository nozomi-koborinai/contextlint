---
title: テストの書き方
description: contextlint のテスト規約と、日本語・韓国語・中国語のフィクスチャが必須である理由。
---

contextlint のテストはすべて [`bun:test`](https://bun.sh/docs/cli/test) で記述します。各ルールにはユニットテストが必須で、特に **日本語・韓国語・中国語のテストフィクスチャ** を含めることが規約として定められています。このページでは、テストファイルの配置とテストランナーの使い方、CJK 要件の理由を解説します。

## ファイル配置

テストファイルはルール本体と同じディレクトリに、`<rule-id>.test.ts` のパターンで配置します。

```text
packages/core/src/rules/
├── tbl-001.ts
├── tbl-001.test.ts
├── tbl-002.ts
├── tbl-002.test.ts
└── ...
```

ビルド時は `tsconfig.json` の設定でテストファイルを除外しますが、ESLint と型チェック（`tsconfig.eslint.json`）の対象には含まれます。テストコードも本体コードと同じ strict 設定で書く必要があります。

## bun:test の基本

`bun:test` は `describe` / `it` / `expect` を提供します。Markdown を直接 string で渡し、`parseDocument` でパースしたうえで `runRules` を実行する、という流れが定型です。

```typescript
import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
```

テスト内で利用するパスは `"test.md"` のような仮の文字列で構いません。`files` オプションのテストではマッチさせたいパスを明示的に渡します。

## テストするべき観点

各ルールには最低限、以下の観点のテストを含めてください。

- **正常系** — 違反がない Markdown でメッセージが 0 件
- **違反検出** — 違反がある Markdown で期待通りのメッセージが出る（件数・`ruleId`・`severity`・`message` の主要部分）
- **複数違反** — 同じファイル内で複数の違反が並列に検出される
- **オプション分岐** — `section`、`files`、列名指定、許可値リストなど、各オプションが意図通り絞り込みに効く
- **CJK フィクスチャ** — 日本語・韓国語・中国語の見出し、カラム名、セル値での検証（後述）

## CJK 言語のテストフィクスチャは必須

各ルールには **日本語・韓国語・中国語** のテストフィクスチャが必須です。これは contextlint の中核的な規約です。

### なぜ必須か

contextlint は国際化された Markdown を扱うため、CJK 文字（日中韓）を含むカラム名・セクション見出し・セル値・ID が **正しくパース・比較される** ことを保証する必要があります。CJK 文字は以下の点で ASCII と挙動が異なる可能性があります。

- **正規化** — Unicode 正規化（NFC / NFD）を経由するパスで、合成文字が分解されると一致しなくなる
- **トリム** — 全角空白（U+3000）が ASCII の `trim()` で除去されない
- **正規表現** — `\w` や `\b` は ASCII 想定で、日中韓文字に対する挙動が直感に反することがある
- **比較** — テーブルヘッダーやセクション名の文字列比較が、半角・全角や見た目の似た別字で失敗する

英語のテストだけでは、これらの問題は表面化しません。CJK 言語ユーザーが contextlint を本番投入したときに初めて検出されるバグになります。それを防ぐため、**ルール実装側で言語に依存しない処理を書いていることをテストで担保** する規約になっています。

### 書き方

各ルールに、3 言語ぶん **正常系と違反検出** のペアでテストを追加します。`tbl-001.test.ts` を例にすると以下のような形です。

```typescript
it("validates required columns with Japanese column names", () => {
  const md = `
| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-01 | ユーザー認証 | draft |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  expect(runRules([rule], doc, "test.md")).toHaveLength(0);
});

it("reports missing Japanese column names", () => {
  const md = `
| ID | 要件 |
|----|------|
| REQ-01 | ユーザー認証 |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  const messages = runRules([rule], doc, "test.md");
  expect(messages).toHaveLength(1);
  expect(messages[0].message).toContain("安定度");
});
```

韓国語（`요구사항` / `안정성`）と中国語（`需求` / `稳定性`）でも同様のペアを追加してください。チェックリストルールやセクションルールであれば、見出しやチェックリスト項目の文言を CJK で書き換えたフィクスチャを用意します。

## テストの実行

リポジトリのルートで以下を実行すると、全 package のテストがまとめて走ります。

```bash
bun test
```

特定のルールに絞って実行したい場合は、ファイル名で絞り込めます。

```bash
bun test packages/core/src/rules/tbl-001.test.ts
```

テストが通った後、型チェック・ビルド・ESLint も合わせて確認することを推奨します。

```bash
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

## 関連

- [新しいルールの追加](/ja/docs/contributing/adding-a-new-rule/) — テスト追加を含むルール実装の全体フロー
- [開発環境のセットアップ](/ja/docs/contributing/development-setup/) — bun のセットアップとコマンド一覧
