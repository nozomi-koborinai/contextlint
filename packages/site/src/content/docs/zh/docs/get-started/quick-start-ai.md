---
title: 快速开始 — AI 集成
description: 通过 Claude Code / Cursor / Codex 等 AI 宿主以最短路径配置 contextlint。
---

如果你的 AI 宿主兼容 [agentskills.io](https://agentskills.io),通过 Skill 集成是最快的方式。三步即可完成,直至跑通 lint。

## 1. 安装 Skill

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

`contextlint-init` Skill 将注册为 AI 宿主可用的技能。`contextlint-fix` 与 `contextlint-impact` 也可以用相同方式安装,但起步阶段只装 `contextlint-init` 就足够了。

## 2. 让 AI 进行配置

打开 AI 宿主,在当前仓库下这样提问:

> 帮我配置 contextlint

AI 会启动 `contextlint-init` Skill,依次执行以下步骤:

1. 在仓库内检测文档位置(不仅是 `docs/`,还包括 `specs/`、`adr/`、`decisions/` 等)
2. 推断文档风格(ADR 形式 / 规格书形式 / 表格中心 / 大量占位符 等)
3. 提出适合该项目的规则组合
4. 确认后,安装 `@contextlint/cli` 并生成 `contextlint.config.json`

无需让人手动从 21 条规则中挑选。

## 3. 运行 lint

配置文件就绪后,AI 会自动运行首轮 lint 并展示结果。如果存在违规,可以继续让 `contextlint-fix` Skill 提出修复建议。

如果想手动运行,可以使用下面的命令获得相同的结果:

```bash
npx contextlint
```

至此,AI 集成的初始化即告完成。

## 支持的 AI 宿主

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 其他遵循 [agentskills.io](https://agentskills.io) 规范的宿主

## 后续步骤

- [首次运行 lint](/zh/docs/get-started/your-first-lint/) — 如何阅读 lint 输出,以及常见的违规模式
- 想手动配置请参阅 [快速开始 — 手动](/zh/docs/get-started/quick-start-manual/)
