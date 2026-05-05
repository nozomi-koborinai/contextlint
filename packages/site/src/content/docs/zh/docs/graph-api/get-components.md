---
title: getComponents
description: 获取连通分量(文档的聚类)。
---

## 概述

将图视为无向图,提取连通分量(connected components)。通过 BFS 将彼此可达的节点分组,返回文档的"聚类"。

## 为什么需要

即使是巨大的仓库,实际上文档群往往分为多个独立的聚类。使用 `getComponents` 可以了解哪些文档群构成了完整的上下文,以及是否存在孤立的聚类。

它也有助于检测既未被任何文件引用、也未引用任何文件的孤立文档(元素数为 1 的分量)(→ 可使用 [GRP-003](/zh/docs/rules/grp-003/) 规则自动检测)。

## 签名

```typescript
function getComponents(graph: ContextGraph): string[][];
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |

## 返回值

返回 `string[][]`。每个分量都是文件路径的数组,内部按字母顺序排序。分量自身也按起首文件路径以确定性方式排序。

## 使用示例

```typescript
import { buildContextGraph, getComponents, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const components = getComponents(graph);

console.log(`检测到 ${components.length} 个聚类`);

for (const [index, component] of components.entries()) {
  console.log(`\n聚类 ${index + 1}: ${component.length} 个文件`);
  for (const file of component) {
    console.log(`  - ${file}`);
  }
}

// 提取孤立文档
const orphans = components.filter((c) => c.length === 1).flat();
console.log(`孤立文档: ${orphans.length} 个`);
```

## 相关函数

- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`topologicalSort`](/zh/docs/graph-api/topological-sort/) — 按依赖顺序排列的版本(有向)
- [`getContextSlice`](/zh/docs/graph-api/get-context-slice/) — 以查询为起点获取相关文档
