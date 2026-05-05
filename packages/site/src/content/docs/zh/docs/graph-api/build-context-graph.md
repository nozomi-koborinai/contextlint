---
title: buildContextGraph
description: 从已解析的文档构建依赖图。
---

## 概述

从已解析文档的 Map 构建表示文档之间依赖关系的图。该函数将每个文档的相对链接和图片引用收集为边(edge),并为节点(node)附加入度和出度。

## 为什么需要

Graph API 的其他函数(`getImpactSet`、`topologicalSort`、`classifyImpact` 等)都将此函数返回的 `ContextGraph` 作为输入。它是图操作的起点。

边由源文件的相对链接解析而来,仅当解析目标存在于 `documents` Map 中时才会被添加。锚点片段(`#section`)会被去除,自引用会被忽略。输出是确定性的,节点和边都按文件路径排序。

## 签名

```typescript
function buildContextGraph(
  documents: Map<string, ParsedDocument>,
): ContextGraph;
```

相关类型如下。

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

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `documents` | `Map<string, ParsedDocument>` | ✓ | 以文件路径为键、`parseDocument` 的结果为值的 Map。键可以是相对路径或绝对路径,但与 `lintFiles` 一样推荐使用相对路径 |

## 返回值

返回 `ContextGraph`。

- `nodes` — 各文件路径及其入度、出度。已按文件路径排序
- `edges` — 从 `source` 指向 `target` 的有向边。`type` 表示是链接还是图片引用。已按源、目标、行号排序

## 使用示例

```typescript
import { loadDocuments } from "@contextlint/core";
import { buildContextGraph } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(`${graph.nodes.length} 个文件,${graph.edges.length} 条边`);

for (const edge of graph.edges) {
  console.log(`${edge.source} → ${edge.target} (${edge.type}, line ${edge.line})`);
}
```

## 相关函数

- [`getImpactSet`](/zh/docs/graph-api/get-impact-set/) — 使用图获取影响范围
- [`topologicalSort`](/zh/docs/graph-api/topological-sort/) — 按依赖顺序排列图
- [`formatContextGraphSummary`](/zh/docs/graph-api/format-context-graph-summary/) — 格式化图的摘要
