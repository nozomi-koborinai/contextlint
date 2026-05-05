---
title: topologicalSort
description: 按依赖顺序排列文档。
---

## 概述

使用 Kahn 算法对文档图进行拓扑排序。没有依赖目标的文件(入度 0)排在前面,被引用的文件排在后面。

## 为什么需要

适用于文档处理顺序需要遵循依赖关系的场景。例如想按 词汇表 → 规格 → ADR 的顺序阅读、想确定构建顺序、想从上游开始排列迁移指南等情况。

如果图中包含循环引用,属于循环的节点不会被包含在结果中。如果返回值的长度比节点总数短,就是存在循环的信号(→ 循环检测可使用 [GRP-002](/zh/docs/rules/grp-002/) 规则)。

## 签名

```typescript
function topologicalSort(graph: ContextGraph): string[];
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |

## 返回值

返回 `string[]`。它是按依赖顺序排列的文件路径数组,入度 0 的节点位于开头。同度内的顺序按字母顺序确定性地对齐。属于循环的节点会被省略。

## 使用示例

```typescript
import { buildContextGraph, topologicalSort, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const ordered = topologicalSort(graph);

if (ordered.length < graph.nodes.length) {
  const missing = graph.nodes.length - ordered.length;
  console.warn(`${missing} 个节点包含在循环引用中`);
}

for (const file of ordered) {
  console.log(file);
}
```

## 相关函数

- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`getComponents`](/zh/docs/graph-api/get-components/) — 想按连通分量分别处理时
- [`getImpactSet`](/zh/docs/graph-api/get-impact-set/) — 仅想知道某特定文件的影响范围时
