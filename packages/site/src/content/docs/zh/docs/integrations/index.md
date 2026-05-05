---
title: Integrations
description: 将 contextlint 集成到编辑器、AI 工具和 CI 中的方法。
---

contextlint 不仅可以作为独立的 CLI 运行，还可以集成到开发流程的三个层面（编辑过程中、通过 AI、CI 上）。本类别介绍每种集成方式的设置方法和行为。

## 集成的层级

| 层级 | 集成对象 | 反馈时机 |
| --- | --- | --- |
| 编辑过程中 | 编辑器（LSP） | 每次保存或输入时即时反馈 |
| 通过 AI | AI 工具（MCP / Skills） | AI 操作文档时 |
| 运行时 | CLI | 手动执行 / watch 模式 |
| 合并前 | CI/CD | PR / push 时 |

各方式独立工作，可根据目的只采用所需的部分。

## 本类别的构成

- [CLI](/zh/docs/integrations/cli/) — `contextlint` 命令、子命令、标志、watch 模式、JSON 输出
- [Editors (LSP)](/zh/docs/integrations/editors/) — 通过 Language Server Protocol 实现的编辑器集成
- [AI Agents](/zh/docs/integrations/ai-agents/) — MCP 服务器和 Agent Skills
- [CI/CD](/zh/docs/integrations/ci-cd/) — 使用 GitHub Actions 和 JSON 输出与流水线集成
