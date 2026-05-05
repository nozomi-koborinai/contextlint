---
title: 为什么 contextlint 存在
description: AI 时代 Markdown 文档面临的完整性问题,以及 contextlint 的定位。
---

contextlint 不绑定特定的工作流程或方法论,而是面向**所有用 Markdown 管理文档的项目**所共同面临的完整性问题。本页将说明其背景中的问题,以及 contextlint 如何对其进行定位。

## 问题:文档"损坏"了却无法察觉

在多个 Markdown 文件互相引用的仓库中,完整性在不知不觉间崩坏的现象,日常都在发生。

- 文件名重命名后链接已经损坏,但构建和 markdownlint 都通过了
- 同一模板编写的设计文档中,必需章节被遗漏,但评审时也被忽略
- 重命名了需求 ID,但引用方的文件仍然保留旧 ID
- 让 AI 生成新文档,结果对现有文件的引用损坏了,但生成时没人发现

这些状态从 **Markdown 语法上来看完全正确**。markdownlint 通过、构建通过、CI 也是 green。然而**作为文档的完整性已经崩坏** — 填补这一断层的工具就是 contextlint。

## 为什么在 AI 时代显现出来

文档完整性问题本身并不新鲜。但**随着 AI 主导的软件开发普及,其影响被放大**了,这是事实。

| 变化 | 对文档的影响 |
|------|---------------------|
| 规格驱动开发 (SDD) 的普及 | 用 Markdown 编写需求、规格、设计,AI 据此生成代码。**文档损坏意味着生成的代码也损坏** |
| ADR / RFC 的运用扩大 | 越来越多的团队用 Markdown 留下设计决策,文件间的相互引用变得复杂 |
| AI 进行文档生成 / 编辑 | Markdown 的变更速度超出了人类逐一确认的能力 |
| 文档数量的增长 | 在数十至数百个文件相互引用的规模下,目视或 grep 都难以追踪 |

文档不是孤立的文件,而是通过 ID 引用、链接、稳定性传播等方式**形成依赖关系图**。当这张图崩坏时,影响难以浮出表面,会悄无声息地扩散开来。

## 为什么需要与代码 linter 同样的机制

代码有 ESLint、有类型检查,既能验证语法是否正确,也有完整的机制来验证**语义是否一致**。而在 Markdown 文档的世界里,虽然有语法和格式 linter(markdownlint),却没有验证**内容语义完整性**的标准工具。

需要一种工具,对文档履行 `eslint` 和 `tsc` 对代码所履行的职责 — 这就是 contextlint 的出发点。

## contextlint 承担的范围

contextlint 是一款专注于结构化 Markdown 文档**语义完整性**的 linter。

- Markdown 表格的内容(必需列、空单元格、允许值、模式、唯一性、跨列约束)
- 必需章节的存在与顺序
- 文件间的引用完整性(链接、ID 可追溯性、锚点、图片)
- 文档依赖图的健全性(可追溯链、循环引用、孤立文档)
- 内容质量(占位符残留、术语一致性)

反过来,**不承担**的范围也非常明确。Markdown 的语法、格式、样式(标题层级一致性、列表写法、表格语法)不在范围内。这些属于 [markdownlint](https://github.com/DavidAnson/markdownlint) 的领域。推荐两者搭配使用。详情请参阅[语义 linter 与语法 linter](/zh/docs/concepts/semantic-vs-syntax/)。

## 适用人群

contextlint 适合采用 Markdown 中心工作流程的团队和个人。具体来说包括以下场景。

- **规格驱动开发 (SDD)** — 用 Markdown 编写需求、规格、设计,然后让 AI 据此生成代码的方法
- **ADR (Architecture Decision Records)** — 用 Markdown 记录设计决策的团队
- **文档驱动开发** — 先写下设计文字再着手实现的风格
- **大规模仓库的文档维护** — 数十至数百个 Markdown 文件相互引用的规模

## 下一步

- [语义 linter 与语法 linter](/zh/docs/concepts/semantic-vs-syntax/) — 与 markdownlint 的关系与分工
- [三层反馈的设计](/zh/docs/concepts/three-layer-feedback/) — 划分为 LSP / MCP / CI 的理由
- [Context Graph](/zh/docs/concepts/context-graph/) — 以文档依赖图作为基础的理由
