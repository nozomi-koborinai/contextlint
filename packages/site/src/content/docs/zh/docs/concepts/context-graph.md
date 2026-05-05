---
title: Context Graph
description: 以文档依赖图作为基础的理由与概念模型。
---

contextlint 不会逐个独立地验证文件,而是**将整个项目的文档作为一张依赖图来处理**。这就是 Context Graph。本页将说明为什么以图作为基础,以及这张图所表达的概念。

具体的 API 接口(`buildContextGraph`、`getImpactSet` 等)在 [Graph API](/zh/docs/graph-api/) 类别中处理。Concepts 集中讨论**概念模型**。

## 为什么需要图

文档不是孤立文件的集合,而是**互相引用的依赖关系网络**。

- 某个需求 ID 在另一个文件中被引用
- 规格文件通过链接引用其他文件
- 状态的稳定性沿着依赖关系向下游传播
- 章节通过锚点被其他文件引用

仅靠文件级的 lint 无法验证这些**跨文件的完整性**。例如下列问题,只有构建出图之后才能检测到。

| 问题 | 为什么需要图 |
|------|------------------|
| 重命名了需求 ID,但引用方仍保留旧 ID | 需要**同时**查看定义方和引用方 |
| `requirements.md` → `design.md` → `test.md` 的链路中断 | 需要**追踪**多个文件的引用关系 |
| `A.md` → `B.md` → `C.md` → `A.md` 的循环依赖 | 需要纵观全图来检测**环** |
| 没有任何地方引用的孤立文档 | 需要汇总所有文件的**被引用情况** |

contextlint 之所以能处理这些问题,是因为它在内部构建了以文件为 node、以引用为 edge 的**有向图**。

## Context Graph 表达的内容

Context Graph 是一种数据结构,将项目内文档的依赖关系建模为有向图。

| 构成要素 | 表达什么 |
|---------|-----------|
| **node (顶点)** | 一个 Markdown 文件 |
| **edge (边)** | 从某个文件指向另一个文件的引用(链接、ID 引用、锚点、图片) |
| **方向** | "引用方" → "被引用方" |

通过这种模型,contextlint 能回答下列问题。

- 修改这个文件时,会影响哪些文件?
- 与这个文件相关的最小文档集是什么?
- 文档之间是否存在循环依赖?
- 是否存在没有任何地方引用的孤立文档?
- 需求 → 规格 → 设计 → 测试 的可追溯链是否中断?

## 直接影响与间接影响

Context Graph 通过追溯依赖关系,可以将变更的影响范围分类为**直接 (direct)** 和**间接 (transitive)**。

```
requirements.md
    ↓ 被引用
spec.md (直接影响)
    ↓ 被引用
test-plan.md (间接影响)
```

修改 `requirements.md` 时,`spec.md` 直接受到影响,而 `test-plan.md` 经由 `spec.md` **间接**受到影响。仅靠 grep 无法追踪间接影响。通过构建 Context Graph,可以**递归地把握变更的波及范围**。

这一信息在进行重构或需求变更时,可作为判断"应当一起评审哪些文件"的依据。

## 以图为基础的意义

Context Graph 不仅仅是某一条规则(例如 GRP-001 / GRP-002 / GRP-003)的内部数据结构。它作为 **contextlint 整体的基础**,支撑着多项功能。

| 功能 | 如何使用图 |
|------|------------------|
| 文件间的引用规则 (REF-\*) | 沿着文件间的 edge 验证引用目标的存在性 |
| ID 可追溯性 (REF-002, GRP-001) | 将定义和引用映射到 node 上进行追踪 |
| 循环引用检测 (GRP-002) | 检测图中的环 |
| 孤立文档检测 (GRP-003) | 检测入度为 0 的 node |
| 影响分析 (`contextlint impact`) | 列出从指定 node 可达的 node |
| Context Slice (`contextlint slice`) | 抽取与查询相关的最小子图 |
| Context Compiler (`contextlint compile`) | 从图中分类文档的角色 (entry / hub / leaf / bridge / isolated) |

它们是各自独立的功能,但**共享同一图表示**,因此输出之间具有一致性。在某条规则中判定为"该文件依赖于 A"时,影响分析中也会反映出同样的依赖关系。

## 决定论性

Context Graph 的构建是**决定论的**。从同一组文档总是会构建出同一张图。

- 不使用 LLM
- 不参考文件的 mtime 或 git 时间戳
- 仅以文件内容作为输入

这一性质使 CI 中能获得稳定的结果,在编辑器、AI host、CI 三层反馈中也共享同一张图(详情请参阅[三层反馈的设计](/zh/docs/concepts/three-layer-feedback/))。

## 下一步

- [Graph API](/zh/docs/graph-api/) — 处理 Context Graph 的程序化 API
- [Rules](/zh/docs/rules/) — 利用 Context Graph 的各条规则 (REF-\*, GRP-\*, TBL-006)
