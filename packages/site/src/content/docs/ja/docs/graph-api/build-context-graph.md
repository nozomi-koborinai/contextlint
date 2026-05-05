---
title: buildContextGraph
description: 解析済みドキュメントから依存グラフを構築する。
---

## 概要

解析済みドキュメントの Map から、ドキュメント間の依存関係を表すグラフを構築します。各ドキュメントの相対リンクと画像参照を辺（edge）として収集し、ノード（node）には入次数と出次数を付与します。

## なぜ必要か

Graph API の他関数（`getImpactSet`、`topologicalSort`、`classifyImpact` など）はすべて、この関数が返す `ContextGraph` を入力として受け取ります。グラフ操作の起点となる関数です。

辺はソースファイルの相対リンクから解決され、解決先が `documents` Map に存在する場合のみ追加されます。アンカーフラグメント（`#section`）は除去され、自己参照は無視されます。出力は決定論的で、ノード・辺ともファイルパスでソートされます。

## シグネチャ

```typescript
function buildContextGraph(
  documents: Map<string, ParsedDocument>,
): ContextGraph;
```

関連する型は次のとおりです。

```typescript
interface GraphNode {
  filePath: string;
  inDegree: number;
  outDegree: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "link" | "image";
  line: number;
}

interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `documents` | `Map<string, ParsedDocument>` | ✓ | ファイルパスをキー、`parseDocument` の結果を値とする Map。キーは相対パスでも絶対パスでも構いませんが、`lintFiles` と同様に相対パスを推奨します |

## 戻り値

`ContextGraph` を返します。

- `nodes` — 各ファイルパスとその入次数・出次数。ファイルパスでソート済み
- `edges` — `source` から `target` への有向辺。`type` はリンクか画像参照かを示します。ソース・ターゲット・行番号でソート済み

## 使用例

```typescript
import { loadDocuments } from "@contextlint/core";
import { buildContextGraph } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(`${graph.nodes.length} ファイル、${graph.edges.length} 辺`);

for (const edge of graph.edges) {
  console.log(`${edge.source} → ${edge.target} (${edge.type}, line ${edge.line})`);
}
```

## 関連関数

- [`getImpactSet`](/ja/docs/graph-api/get-impact-set/) — グラフを使って影響範囲を取得
- [`topologicalSort`](/ja/docs/graph-api/topological-sort/) — グラフを依存順に並べる
- [`formatContextGraphSummary`](/ja/docs/graph-api/format-context-graph-summary/) — グラフのサマリーを整形
