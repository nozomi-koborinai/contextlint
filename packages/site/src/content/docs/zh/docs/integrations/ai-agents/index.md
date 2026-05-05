---
title: AI Agents
description: 从 AI 代理调用 contextlint 的 2 种集成路径（MCP / Skills）。
---

contextlint 提供 2 种从 AI 代理使用的集成路径。可以从 Claude Code、Cursor Agent、Cline、Codex、Gemini CLI、GitHub Copilot 等主机将文档完整性检查融入对话之中。

## 2 种集成路径

| 路径 | 协议 | 主要主机 | 分发形态 |
| --- | --- | --- | --- |
| **MCP 服务器** | Model Context Protocol | Claude Desktop / Cursor / Cline / Codex 等 | `@contextlint/mcp-server` 包 |
| **Agent Skills** | [agentskills.io](https://agentskills.io) 规范 | Claude Code / Cursor Agent / Codex / Gemini CLI / GitHub Copilot 等 | 通过 `gh skill install` 从 GitHub 仓库 |

两者不冲突，可根据用途选择。MCP 是 **AI 直接调用 contextlint 功能** 的协议，Skills 则是 **用语言告诉 AI「希望它做什么」的工作流**。

## 选择哪个

- **「想让 AI 执行 lint」「想让它参考文档图」** → [MCP 服务器](/zh/docs/integrations/ai-agents/mcp-server/)
- **「想让 AI 完成 contextlint 的设置」「想让它自动修复违规」「想让它分析变更影响」** → [Skills](/zh/docs/integrations/ai-agents/skills/)

如果主机两者都支持（如 Claude Code），可以一起使用。Skill 内部也可能调用 MCP 工具。

## 本节的构成

- [MCP 服务器](/zh/docs/integrations/ai-agents/mcp-server/) — `@contextlint/mcp-server` 的设置和提供的 5 个工具
- [Agent Skills](/zh/docs/integrations/ai-agents/skills/) — `gh skill install` 的使用方法和支持主机一览
- [contextlint-init Skill](/zh/docs/integrations/ai-agents/skill-init/) — 让其完成对仓库的初始设置
- [contextlint-fix Skill](/zh/docs/integrations/ai-agents/skill-fix/) — 让其修复检测到的违规
- [contextlint-impact Skill](/zh/docs/integrations/ai-agents/skill-impact/) — 让其分析文件变更的影响范围

## 相关

- 最快的设置步骤请参考 [Quick Start — AI 集成](/zh/docs/get-started/quick-start-ai/)。本节专注于各 Skill / 工具的 **详细规范和适用场景**。
