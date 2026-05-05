---
title: 安装
description: 将 contextlint 安装到项目中的两种方式。
---

contextlint 提供 **两种安装方式**。如果你正在使用 AI 宿主(Claude Code / Cursor / Codex 等),通过 **Skill 安装最为快捷**;否则可以通过 **CLI** 手动配置。

## 通过 Skill 安装(推荐)

如果你使用的 AI 宿主兼容 [agentskills.io](https://agentskills.io),只需一条 `gh skill install` 命令即可完成。

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

之后,只要这样向 AI 提出请求即可:

> 帮我配置 contextlint

AI 会分析仓库结构,识别文档的存放位置和风格(ADR 形式 / 规格书形式 / 表格中心 / 等等),自动生成适合该项目的 `contextlint.config.json`。无需在 21 条规则中手动挑选。

**支持的 AI 宿主:**

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 其他遵循 [agentskills.io](https://agentskills.io) 规范的宿主

**前置条件:** 已安装 GitHub CLI(`gh`)。如未安装,请参考 [GitHub CLI 官方网站](https://cli.github.com/)。

## 通过 CLI 安装(手动)

如果你不使用 AI 宿主,或希望完全自主管理配置,可以直接安装 `@contextlint/cli` 包。

### 按包管理器安装

contextlint 通过 npm registry 发布。请根据项目使用的包管理器执行下列命令之一:

```bash
# bun
bun add -D @contextlint/cli

# pnpm
pnpm add -D @contextlint/cli

# yarn
yarn add -D @contextlint/cli

# npm
npm install -D @contextlint/cli
```

推荐作为开发依赖(`-D` 或 `--save-dev`)安装,因为生产构建并不需要它。

### 全局安装(可选)

如果会在多个项目中频繁使用,也可以全局安装。

```bash
# bun
bun add -g @contextlint/cli

# npm
npm install -g @contextlint/cli
```

不过,如果希望按项目锁定依赖版本,**项目内安装(`-D`)更为稳妥**。这样能在 CI 环境中保证一致的行为。

### 验证安装

安装完成后,如果可以输出版本号,即表示安装成功。

```bash
npx contextlint --version
```

## 后续步骤

- [快速开始 — AI 集成](/zh/docs/get-started/quick-start-ai/) — 通过 Skill 执行 `init`,以最短路径完成配置
- [快速开始 — 手动](/zh/docs/get-started/quick-start-manual/) — 用 `contextlint init` 的交互模式生成配置文件
