---
title: formatContextGraphSummary
description: グラフの人間可読なサマリーを整形する。
---

## 概要

`ContextGraph` を受け取り、エントリポイント（誰からも参照されていないノード）と被参照数の多い上位ノードをまとめた複数行の文字列を返します。

## なぜ必要か

グラフ全体を眺めるとき、ノードと辺の生データだけでは構造を把握しにくい場面があります。`formatContextGraphSummary` は **どのファイルが起点で、どのファイルに参照が集中しているか** を一目で確認できる形式に整形します。

MCP の `context-graph` ツールが返すサマリーもこの関数の出力をそのまま使っています。

## シグネチャ

```typescript
function formatContextGraphSummary(graph: ContextGraph): string;
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |

## 戻り値

`string` を返します。改行で区切られた次のセクションを含みます。

- 1 行目 — ノード数と辺数のサマリー
- `Entry points (no incoming refs)` — 入次数 0 のファイル一覧
- `Most connected (by incoming refs)` — 入次数の多い上位 5 ファイル

## 使用例

```typescript
import { buildContextGraph, formatContextGraphSummary, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(formatContextGraphSummary(graph));
```

出力例:

```text
Document Graph: 12 files, 27 edges

Entry points (no incoming refs):
  - docs/index.md
  - docs/getting-started.md

Most connected (by incoming refs):
  - docs/glossary.md (8 in, 0 out)
  - docs/architecture.md (5 in, 3 out)
  - docs/api.md (3 in, 4 out)
```

## 関連関数

- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`classifyImpact`](/ja/docs/graph-api/classify-impact/) — 特定ファイルの影響範囲を詳細に分類
- [`getComponents`](/ja/docs/graph-api/get-components/) — クラスタ単位で構造を把握
