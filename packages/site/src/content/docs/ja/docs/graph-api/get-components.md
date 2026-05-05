---
title: getComponents
description: 連結成分（ドキュメントのクラスタ）を取得する。
---

## 概要

グラフを無向グラフとみなして連結成分（connected components）を抽出します。BFS で互いに到達可能なノードをグルーピングし、ドキュメントの「クラスタ」を返します。

## なぜ必要か

巨大なリポジトリでも、実際にはドキュメント群が独立した複数のクラスタに分かれていることが多くあります。`getComponents` を使うと、どのドキュメント群がまとまった文脈を成しているか、孤立したクラスタが存在するかを把握できます。

どこからも参照されておらず、何も参照していない孤立ドキュメント（要素 1 個の成分）の検出にも有用です（→ [GRP-003](/ja/docs/rules/grp-003/) ルールで自動検出可）。

## シグネチャ

```typescript
function getComponents(graph: ContextGraph): string[][];
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |

## 戻り値

`string[][]` を返します。各成分はファイルパスの配列で、内部はアルファベット順にソートされます。成分そのものも先頭ファイルパスで決定論的にソートされます。

## 使用例

```typescript
import { buildContextGraph, getComponents, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const components = getComponents(graph);

console.log(`${components.length} 個のクラスタを検出`);

for (const [index, component] of components.entries()) {
  console.log(`\nクラスタ ${index + 1}: ${component.length} ファイル`);
  for (const file of component) {
    console.log(`  - ${file}`);
  }
}

// 孤立ドキュメントを抽出
const orphans = components.filter((c) => c.length === 1).flat();
console.log(`孤立ドキュメント: ${orphans.length} 件`);
```

## 関連関数

- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`topologicalSort`](/ja/docs/graph-api/topological-sort/) — 依存順に並べる版（有向）
- [`getContextSlice`](/ja/docs/graph-api/get-context-slice/) — クエリ起点で関連ドキュメントを取得
