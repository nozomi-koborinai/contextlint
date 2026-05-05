---
title: 入门
description: contextlint 是什么,以及它面向哪些用户。
---

举几个例子,你是否遇到过这样的情况?

- 在文档中添加了指向其他文件的链接,但链接目标在不知不觉间被重命名了。**链接已经失效,但构建和 markdownlint 都能通过**
- 同一份模板编写的设计文档,某个必需章节不知何时被遗漏了。**评审中也没人发现**
- 让 AI 生成新文档后,其中对已有文件的几处引用已经失效。**生成时人类无法察觉**

这些都是 **语法上完全正确的 Markdown**。markdownlint 通过、构建通过、CI 也是绿色。然而 **作为文档的整合性已经崩坏** — 这正是 contextlint 要解决的问题。

contextlint 是一个面向结构化 Markdown 文档的、基于规则的检查工具,用于验证文档的 **语义整合性**。它能确定性地、在数秒内检测断裂链接、缺失的必需章节、表格空单元格、ID 重复以及文档间依赖关系的崩坏等问题。

## 适用人群

contextlint 适合采用以 Markdown 为中心工作流的团队和个人。例如以下场景:

- **规格驱动开发(SDD)** — 用 Markdown 编写需求、规格、设计,再让 AI 基于这些文档生成代码的开发方式
- **ADR(Architecture Decision Records)** — 用 Markdown 记录架构决策的团队
- **文档驱动开发** — 先把设计写成文字,再进入实现的开发风格
- **大规模仓库的文档治理** — 数十至数百个 Markdown 文件相互引用的规模

## contextlint 与 markdownlint 的关系

contextlint 专注于 **内容的语义和文件间的整合性**。Markdown 的语法、格式与样式(如标题层级一致性、列表语法、表格语法等)不在它的处理范围内。这些属于 [markdownlint](https://github.com/DavidAnson/markdownlint) 的职责,推荐两者搭配使用。

| 检查维度                   | markdownlint | contextlint |
| -------------------------- | :----------: | :---------: |
| Markdown 语法              |      ✓       |      —      |
| 格式与样式                 |      ✓       |      —      |
| 表格内的数据整合性         |      —       |      ✓      |
| 必需章节是否存在           |      —       |      ✓      |
| 文件间引用整合性           |      —       |      ✓      |
| 依赖关系图验证             |      —       |      ✓      |

## 为什么选择静态分析

也可以用 LLM 来检查文档整合性,但 contextlint 坚持采用 **静态分析**。原因有以下几点:

- **可重现性** — 同样的输入得到同样的结果。不受 prompt 或 temperature 影响,可以在 CI 中稳定运行。
- **成本** — 不消耗 token。即便检查 100 个文件,成本也是零。
- **速度** — 在亚秒级完成。这种速度足以支撑编辑器集成(LSP)实现"输入时实时检测"。
- **明确性** — 错误消息固定,便于机器处理(自动修复、CI 中的过滤)。

LLM 在 **撰写** 文档时能发挥优势;**验证** 完成的文档则更适合静态分析。让两者各司其职,正是 contextlint 的设计理念。

## 三层反馈

contextlint 可以嵌入文档生命周期的 **三个时机**。

| 时机                  | 协议 | 主要工具                                                       |
| --------------------- | ---- | -------------------------------------------------------------- |
| **编写过程中**        | LSP  | VS Code / Cursor / Neovim / Helix / JetBrains                  |
| **AI 编写过程中**     | MCP  | Claude Code / Cursor Agent / Cline / Codex / Windsurf          |
| **合并之前**          | CLI  | GitHub Actions / pre-commit / Husky / lint-staged              |

从动笔的瞬间到合并,文档的整合性都能持续得到保障。

## 后续步骤

- [安装](/zh/docs/get-started/installation/)
- [快速开始 — AI 集成](/zh/docs/get-started/quick-start-ai/)
- [快速开始 — 手动](/zh/docs/get-started/quick-start-manual/)
- [首次运行 lint](/zh/docs/get-started/your-first-lint/)
