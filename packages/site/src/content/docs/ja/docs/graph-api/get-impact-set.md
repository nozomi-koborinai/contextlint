---
title: getImpactSet
description: あるファイルの変更で影響を受けるファイル一覧を取得する。
---

## 概要

指定したファイルを参照しているファイルを、直接参照と推移的参照の両方にわたって取得します。グラフの逆辺を辿る BFS で、変更対象ファイル自身は結果から除外されます。

## なぜ必要か

ドキュメントを変更・削除する前に、それが他のどのドキュメントに影響を与えるかを把握したい場面があります。`getImpactSet` は「このファイルを変えたら、どこを見直す必要があるか」をフラットなリストで返します。

直接参照と推移的参照を区別したい場合は [`classifyImpact`](/ja/docs/graph-api/classify-impact/) を使ってください。

## シグネチャ

```typescript
function getImpactSet(
  graph: ContextGraph,
  filePath: string,
): string[];
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |
| `filePath` | `string` | ✓ | 影響範囲を調べたいファイルのパス。`graph.nodes` のキーと一致している必要があります |

## 戻り値

`string[]` を返します。`filePath` を直接または推移的に参照しているファイルパスの配列で、アルファベット順にソートされます。`filePath` 自身は含まれません。グラフ上に該当ファイルが存在しない、または誰も参照していない場合は空配列を返します。

## 使用例

```typescript
import { buildContextGraph, getImpactSet, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const affected = getImpactSet(graph, "docs/architecture.md");

if (affected.length === 0) {
  console.log("影響を受けるファイルはありません");
} else {
  console.log(`${affected.length} ファイルが影響を受けます:`);
  for (const file of affected) {
    console.log(`  - ${file}`);
  }
}
```

## 関連関数

- [`classifyImpact`](/ja/docs/graph-api/classify-impact/) — 直接的・推移的を分類して返す版
- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`getContextSlice`](/ja/docs/graph-api/get-context-slice/) — 逆方向（あるファイルが参照する側）を辿る版
