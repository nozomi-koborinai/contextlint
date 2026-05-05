---
title: Concepts
description: contextlint 的设计思想与概念模型。
---

contextlint 为什么存在,为什么选择静态分析,为什么分为三层反馈。本类别将介绍工具背后的**设计思想与概念**。

[Get Started](/zh/docs/get-started/) 介绍工具的使用方法,[Configuration](/zh/docs/configuration/) 和 [Rules](/zh/docs/rules/) 处理规则的具体规范。Concepts 集中讨论**"为什么会这样设计"**。

## 本类别构成

- [为什么 contextlint 存在](/zh/docs/concepts/why-contextlint-exists/) — AI 时代 Markdown 文档面临的完整性问题,以及 contextlint 的定位
- [语义 linter 与语法 linter](/zh/docs/concepts/semantic-vs-syntax/) — 什么是 semantic linter,与 markdownlint 的对比
- [三层反馈的设计](/zh/docs/concepts/three-layer-feedback/) — 为什么将 LSP / MCP / CI 分为三层
- [Context Graph](/zh/docs/concepts/context-graph/) — 为什么以文档依赖图作为基础
