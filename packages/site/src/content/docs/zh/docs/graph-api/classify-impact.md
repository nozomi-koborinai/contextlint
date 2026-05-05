---
title: classifyImpact
description: 将影响范围分类为直接和推移。
---

## 概述

将因指定文件变更而受影响的文件,分类为 **直接引用**(1 跳)和 **推移引用**(2 跳以上)返回。直接引用还会附加引用次数。

## 为什么需要

[`getImpactSet`](/zh/docs/graph-api/get-impact-set/) 返回的是扁平列表,因此无法区分"必须直接重新检查的文件"和"为保险起见应当确认的文件"。`classifyImpact` 将影响分为两个层级,推移引用还会附加经由的直接文件(`via`),可用于审查优先级和路径的可视化。

MCP 的 `impact-analysis` 工具直接将此函数的结果格式化后返回。

## 签名

```typescript
function classifyImpact(
  graph: ContextGraph,
  filePath: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
};
```

## 参数

| 参数 | 类型 | 必需 | 说明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | 由 `buildContextGraph` 构建的图 |
| `filePath` | `string` | ✓ | 想要查询影响范围的文件路径 |

## 返回值

返回对象。

- `directlyAffected` — 直接引用了 `filePath` 的文件。`references` 是同一源文件中的引用次数(同一文件被从多个位置链接时的合计)。按文件路径排序
- `transitivelyAffected` — 不是直接引用,但间接到达的文件。`via` 是路径上最近的"直接受影响的文件"。按文件路径排序

## 使用示例

```typescript
import { buildContextGraph, classifyImpact, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const impact = classifyImpact(graph, "docs/architecture.md");

console.log(`直接影响: ${impact.directlyAffected.length} 个`);
for (const item of impact.directlyAffected) {
  console.log(`  - ${item.file} (${item.references} 次引用)`);
}

console.log(`推移影响: ${impact.transitivelyAffected.length} 个`);
for (const item of impact.transitivelyAffected) {
  console.log(`  - ${item.file} (经由: ${item.via})`);
}
```

## 相关函数

- [`getImpactSet`](/zh/docs/graph-api/get-impact-set/) — 不带分类的扁平列表版本
- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 构建作为输入的图
- [`formatContextGraphSummary`](/zh/docs/graph-api/format-context-graph-summary/) — 整个图的摘要
