---
title: getImpactSet
description: 获取因某文件变更而受影响的文件列表。
---

## 概述

获取引用了指定文件的文件,涵盖直接引用和推移引用两种情况。通过沿图的反向边进行 BFS 实现,变更目标文件本身会从结果中排除。

## 为什么需要

在变更或删除文档之前,有时需要了解它会影响哪些其他文档。`getImpactSet` 以扁平列表的形式返回"如果改动这个文件,需要重新检查哪些地方"。

如果想区分直接引用和推移引用,请使用 [`classifyImpact`](/zh/docs/graph-api/classify-impact/)。

## 签名

```typescript
function getImpactSet(
  graph: ContextGraph,
  filePath: string,
): string[];
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |
| `filePath` | `string` | ✓ | 想要查询影响范围的文件路径。必须与 `graph.nodes` 中的键一致 |

## 返回值

返回 `string[]`。它是直接或推移引用了 `filePath` 的文件路径数组,按字母顺序排序。结果中不包含 `filePath` 本身。如果该文件不存在于图中,或没有任何文件引用它,则返回空数组。

## 使用示例

```typescript
import { buildContextGraph, getImpactSet, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const affected = getImpactSet(graph, "docs/architecture.md");

if (affected.length === 0) {
  console.log("没有受影响的文件");
} else {
  console.log(`${affected.length} 个文件会受到影响:`);
  for (const file of affected) {
    console.log(`  - ${file}`);
  }
}
```

## 相关函数

- [`classifyImpact`](/zh/docs/graph-api/classify-impact/) — 区分直接和推移返回的版本
- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`getContextSlice`](/zh/docs/graph-api/get-context-slice/) — 沿反方向(某文件所引用的一侧)遍历的版本
