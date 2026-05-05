---
title: getContextSlice
description: 提取与查询相关的最小文档集。
---

## 概述

接收文件路径或 ID 作为查询,通过 BFS 提取与之相关的最小文档集。沿出边方向(某文件所引用的文档侧)展开,扩展至深度上限。

## 为什么需要

当 AI 代理或人类处理特定主题时,有时希望传递的不是整个仓库,而是 **仅相关的文档**。`getContextSlice` 通过切出查询的近邻,帮助控制上下文窗口和读者的认知负担。

查询的解释方式有以下两种。

- 当查询与图中的文件路径一致时 — 以该文件为起点沿出边遍历
- 不一致时 — 将其作为表格单元格的值在所有文档中查找,以所有匹配到的文件为起点

## 签名

```typescript
function getContextSlice(
  graph: ContextGraph,
  documents: Map<string, ParsedDocument>,
  query: string,
  maxDepth?: number,
): string[];
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |
| `documents` | `Map<string, ParsedDocument>` | ✓ | 与构建图时相同的文档 Map。ID 查询遍历表格时需要 |
| `query` | `string` | ✓ | 文件路径或 ID 字符串 |
| `maxDepth` | `number` | — | BFS 的最大深度。默认 `2` |

## 返回值

返回 `string[]`。它包含查询的起点文件以及从该起点在 `maxDepth` 步以内可达的文件,按字母顺序排序。如果找不到与查询匹配的文件,则返回空数组。

## 使用示例

```typescript
import { buildContextGraph, getContextSlice, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

// 按文件路径切片
const slice = getContextSlice(graph, documents, "docs/specs/auth.md");
console.log(slice);

// 按 ID 切片(从表格单元格搜索)
const reqSlice = getContextSlice(graph, documents, "REQ-AUTH-01", 3);
console.log(reqSlice);
```

## 相关函数

- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`getImpactSet`](/zh/docs/graph-api/get-impact-set/) — 沿反方向(被引用一侧)遍历的版本
- [`getComponents`](/zh/docs/graph-api/get-components/) — 按连通分量为单位获取聚类
