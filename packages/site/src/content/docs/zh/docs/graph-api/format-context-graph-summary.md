---
title: formatContextGraphSummary
description: 格式化图的可读摘要。
---

## 概述

接收 `ContextGraph`,返回汇总入口点(没有任何文件引用的节点)和被引用次数较多的前 N 个节点的多行字符串。

## 为什么需要

在审视整个图时,仅凭节点和边的原始数据有时难以把握结构。`formatContextGraphSummary` 会将其格式化为可一目了然地确认 **哪些文件是起点、哪些文件被集中引用** 的形式。

MCP 的 `context-graph` 工具返回的摘要也是直接使用此函数的输出。

## 签名

```typescript
function formatContextGraphSummary(graph: ContextGraph): string;
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |

## 返回值

返回 `string`。包含以换行分隔的以下部分。

- 第 1 行 — 节点数和边数的摘要
- `Entry points (no incoming refs)` — 入度 0 的文件列表
- `Most connected (by incoming refs)` — 入度最多的前 5 个文件

## 使用示例

```typescript
import { buildContextGraph, formatContextGraphSummary, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(formatContextGraphSummary(graph));
```

输出示例:

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

## 相关函数

- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`classifyImpact`](/zh/docs/graph-api/classify-impact/) — 详细分类某特定文件的影响范围
- [`getComponents`](/zh/docs/graph-api/get-components/) — 以聚类为单位把握结构
