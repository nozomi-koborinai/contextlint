---
title: getContextSlice
description: クエリに関連する最小限のドキュメント集合を抽出する。
---

## 概要

ファイルパスまたは ID をクエリとして受け取り、それに関連するドキュメントの最小集合を BFS で抽出します。出辺を辿る方向（あるファイルが参照しているドキュメント側）に展開し、深さ上限まで広げます。

## なぜ必要か

AI エージェントや人間が特定のトピックを扱うとき、リポジトリ全体ではなく **関連するドキュメントだけ** を渡したいことがあります。`getContextSlice` はクエリの近傍を切り出すことで、コンテキストウィンドウや読み手の認知負荷を抑えます。

クエリ解釈は次の 2 通りです。

- クエリがグラフ上のファイルパスと一致する場合 — そのファイルを起点に出辺を辿る
- 一致しない場合 — テーブルのセル値として全ドキュメントを走査し、一致したファイルすべてを起点とする

## シグネチャ

```typescript
function getContextSlice(
  graph: ContextGraph,
  documents: Map<string, ParsedDocument>,
  query: string,
  maxDepth?: number,
): string[];
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |
| `documents` | `Map<string, ParsedDocument>` | ✓ | グラフ構築時と同じドキュメント Map。ID クエリでテーブル走査するために必要 |
| `query` | `string` | ✓ | ファイルパスまたは ID 文字列 |
| `maxDepth` | `number` | — | BFS の最大深さ。デフォルト `2` |

## 戻り値

`string[]` を返します。クエリの起点ファイルとそこから `maxDepth` ステップ以内で到達できるファイルの配列で、アルファベット順にソートされます。クエリに一致するファイルが見つからない場合は空配列を返します。

## 使用例

```typescript
import { buildContextGraph, getContextSlice, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

// ファイルパスで切り出す
const slice = getContextSlice(graph, documents, "docs/specs/auth.md");
console.log(slice);

// ID で切り出す（テーブルセルから検索）
const reqSlice = getContextSlice(graph, documents, "REQ-AUTH-01", 3);
console.log(reqSlice);
```

## 関連関数

- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`getImpactSet`](/ja/docs/graph-api/get-impact-set/) — 逆方向（参照されている側）を辿る版
- [`getComponents`](/ja/docs/graph-api/get-components/) — 連結成分単位でクラスタを取得
