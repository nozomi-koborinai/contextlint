---
title: Agent Skills
description: 用于从 agentskills.io 兼容主机调用 contextlint 的 Skill 一览，以及 gh skill install 的使用方法。
---

contextlint 公开了符合 [agentskills.io](https://agentskills.io) 规范的 3 个 Skill。Skill 是告诉 AI「希望它做什么」的单元，内部组合了命令执行、文件遍历和推理的工作流。在 AI 主机端启动 Skill 后，无需人类逐步指示即可获得期望的成果。

## 提供的 Skill

| Skill | 用途 | 详细 |
| --- | --- | --- |
| `contextlint-init` | 对仓库的初始设置。从 doc 结构扫描、规则推断到 CLI 安装 | [contextlint-init](/zh/docs/integrations/ai-agents/skill-init/) |
| `contextlint-fix` | 通过机械修复和手动确认两种方式解决检测到的违规 | [contextlint-fix](/zh/docs/integrations/ai-agents/skill-fix/) |
| `contextlint-impact` | 使用 Context Graph 进行文件变更的影响范围分析 | [contextlint-impact](/zh/docs/integrations/ai-agents/skill-impact/) |

## 安装

需要 GitHub CLI v2.90 或更高版本。如果未安装，请参考 [GitHub CLI 官网](https://cli.github.com/)。

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
gh skill install nozomi-koborinai/contextlint contextlint-fix
gh skill install nozomi-koborinai/contextlint contextlint-impact
```

最初仅有 `contextlint-init` 就足够。`init` 完成仓库设置后，再根据需要添加 `fix` 或 `impact`。

## 语法

```
gh skill install OWNER/REPO SKILL
gh skill install OWNER/REPO SKILL@VERSION
gh skill install OWNER/REPO SKILL --agent claude-code --scope user
```

| 选项 | 概述 |
| --- | --- |
| `OWNER/REPO` | 公开 Skill 的 GitHub 仓库 |
| `SKILL` | 仓库内 `skills/<name>/SKILL.md` 的 `<name>` 部分 |
| `@VERSION` | 版本标签（可选） |
| `--agent` | 目标主机（如 `claude-code` 等，因主机而异） |
| `--scope` | `user`（用户全局）/ `repo`（仅当前仓库） |

此外还可使用 `gh skill update`、`gh skill search`、`gh skill publish`。

## 支持的主机

只要主机支持 agentskills.io 规范，相同的 Skill 都能工作。

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 其他符合 [agentskills.io](https://agentskills.io) 规范的主机

各主机的注册步骤和支持版本请参考 agentskills.io 和各主机的文档。

## Skill 的启动方式

Skill 安装后，只需告诉 AI 主机「希望做的事」就会自动调用。无需直接指定 Skill 名。

例如，下面这样的请求会启动 `contextlint-init`。

> 帮我配置 contextlint
>
> 我想引入 Markdown 的 linter
>
> 引入文档完整性检查

`contextlint-fix` 在「修一下 lint」「修复坏掉的链接」「contextlint 报错了」等请求时启动；`contextlint-impact` 在「修改 design.md 会破坏什么？」「这个 doc 删除安全吗？」等请求时启动。各 Skill 的启动条件和行为详细，分别在各自的独立页面解说。

## 与 MCP 服务器的区别

| 视角 | Skills | [MCP 服务器](/zh/docs/integrations/ai-agents/mcp-server/) |
| --- | --- | --- |
| 抽象级别 | 高（工作流单元） | 低（工具单元） |
| 向 AI 的传达方式 | 自然语言请求 | 工具调用 |
| 分发 | GitHub 仓库的 `skills/<name>/SKILL.md` | npm 包 |
| 项目特定配置 | 不需要（Skill 自动推断） | 需要 `contextlint.config.json` |

两者可以一起使用。`contextlint-fix` Skill 内部如果可用 MCP 的 `lint` 工具会优先使用，Skills 和 MCP 是相互补充的关系。

## 为什么推荐通过 Skill 使用

contextlint 拥有 21 个规则和 7 个类别。手动阅读全部并选择合适的配置负担很重，所以让 `contextlint-init` Skill **观察仓库的实际情况后建议配置**。人类只需做最终确认，初始设置的工作量大幅减少。
