---
title: topologicalSort
description: ドキュメントを依存順に並べる。
---

## 概要

Kahn のアルゴリズムでドキュメントグラフをトポロジカルソートします。依存先のないファイル（入次数 0）から先に並び、参照を受けているファイルが後続に来ます。

## なぜ必要か

ドキュメントを処理する順序が依存関係に従うべき場面に使います。たとえば用語集 → スペック → ADR の順に読みたい、ビルド順を決めたい、移行ガイドを上流から並べたい、といったケースです。

グラフに循環参照が含まれる場合、循環に属するノードは結果に含まれません。返り値の長さがノード総数より短ければ循環があるサインです（→ 循環の検出は [GRP-002](/ja/docs/rules/grp-002/) ルールで）。

## シグネチャ

```typescript
function topologicalSort(graph: ContextGraph): string[];
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |

## 戻り値

`string[]` を返します。依存順に並んだファイルパスの配列で、入次数 0 のノードが先頭になります。同じ次数内の順序は決定論的にアルファベット順で揃います。循環に属するノードは省略されます。

## 使用例

```typescript
import { buildContextGraph, topologicalSort, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const ordered = topologicalSort(graph);

if (ordered.length < graph.nodes.length) {
  const missing = graph.nodes.length - ordered.length;
  console.warn(`${missing} ノードが循環参照に含まれています`);
}

for (const file of ordered) {
  console.log(file);
}
```

## 関連関数

- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`getComponents`](/ja/docs/graph-api/get-components/) — 連結成分ごとに分けて扱いたい場合
- [`getImpactSet`](/ja/docs/graph-api/get-impact-set/) — 特定ファイルからの影響範囲のみを知りたい場合
