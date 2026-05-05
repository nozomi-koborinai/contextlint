---
title: Graph API
description: 用于通过程序操作文档依赖图的 API。
---

`@contextlint/core` 公开了一组函数，用于从已解析的文档构建依赖图，并获取影响范围、相关文档、依赖顺序等信息。Graph API 是 **直接通过程序调用这些功能的 programmatic interface**。

它不是用于 lint 的接口，而是用于在脚本或工具中处理文档之间关系的接口。MCP 的 `context-graph` / `context-slice` / `impact-analysis` 工具内部也调用此 API（→ [AI Agents](/zh/docs/integrations/ai-agents/)）。

关于设计思想以及 Context Graph 为何存在,请参阅 [Context Graph](/zh/docs/concepts/context-graph/)。本类别专注于 **API 的使用方式**。

## 本类别构成

- [`buildContextGraph`](/zh/docs/graph-api/build-context-graph/) — 从已解析的文档构建依赖图
- [`getImpactSet`](/zh/docs/graph-api/get-impact-set/) — 获取因某文件变更而受影响的文件列表
- [`getContextSlice`](/zh/docs/graph-api/get-context-slice/) — 提取与查询相关的最小文档集
- [`topologicalSort`](/zh/docs/graph-api/topological-sort/) — 按依赖顺序排列文件
- [`getComponents`](/zh/docs/graph-api/get-components/) — 获取连通分量(文档的聚类)
- [`classifyImpact`](/zh/docs/graph-api/classify-impact/) — 将影响范围分类为直接和推移
- [`formatContextGraphSummary`](/zh/docs/graph-api/format-context-graph-summary/) — 格式化图的可读摘要
