---
title: contextlint-init Skill
description: 对仓库进行 contextlint 初始设置的 Skill 的作用与行为。
---

`contextlint-init` 是用于 **对仓库进行 contextlint 初始设置** 的 Skill。当 AI 接收到「帮我配置 contextlint」「准备 lint 环境」之类的请求时会自动启动。

## 为什么有这个 Skill

contextlint 在 7 个类别下共有 21 个规则。让人类初次接触时全部读完并判断「自己仓库该启用什么」负担很大，结果可能放弃引入。

`contextlint-init` 通过 **实际扫描仓库结构后建议配置** 来消除这道门槛。不需要人类从 21 个里手动选择，而是让 AI 观察文档的布局、风格和引用模式，推断出适合该项目的规则集。

## 启动条件

用户提出以下类型的请求时会启动。无需明示 Skill 名。

- 「帮我配置 contextlint」「引入 contextlint」
- 「我想引入 Markdown 的 linter」「引入文档完整性检查」
- 「准备 lint 环境」「lint setup」

即使不出现 contextlint 名字，只要传入「文档完整性检查」之类的语境也会启动。

## 行为流程

Skill 按以下步骤依次执行。

### 1. 检测既有设置

首先确认仓库根目录或父目录是否存在 `contextlint.config.json`。如果找到，则向用户提示以下选项。

| 选项 | 行为 |
| --- | --- |
| `overwrite` | 从头重新生成 |
| `add` | 保留现有配置，基于新扫描结果建议添加规则 |
| `skip` | 什么都不做 |

之所以不擅自覆盖既有设置，是为了不破坏过去调优过的配置或 CI 通过的前提。

### 2. 包管理器检测

按优先级从锁文件判定。

| 锁文件 | 管理器 |
| --- | --- |
| `bun.lock` / `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` | npm |
| （无） | 回退到 npm |

### 3. 文档布局检测

不写死 `docs/`，而是实际遍历 `documentation/`、`specs/`、`adr/`、`decisions/`、`requirements/`、`architecture/`、`notes/` 等典型布局并确认。提取聚集了 3 个以上 Markdown 的目录作为「doc 集群」候选，并优先目录名与文档语境匹配的目录。`README.md` 和 `CHANGELOG.md` 等项目元数据虽会检测到，但默认不纳入 lint 对象。

如果是 monorepo，也会检测 `packages/*/docs/` 之类的布局，并将其全部纳入 include。

### 4. 文档内容采样

从检测到的各集群中抽取 3〜5 个文件读取内容，寻找以下信号。为了不浪费上下文，不会读取所有文件。

| 观察到的模式 | 建议规则 |
| --- | --- |
| `[link](file.md#anchor)` 形式的相互引用 | REF-001 |
| 拥有 `ID` 列的表格 | TBL-001 + TBL-002 |
| 相同的标题三元组（如：`## Context` / `## Decision` / `## Consequences`） | SEC-001 |
| 大量使用清单 | CHK-001 |
| 频繁出现的 `TODO`、`TBD`、`<pending>` 等占位符 | CTX-001 |
| 文件间存在大量双向引用 | GRP-002 |

REF-001 和 GRP-002 作为 **始终启用** 的基线提案。因为不论仓库种类，断链检测和循环引用检测都有用。

### 5. 配置提案与人工确认

将抽取的配置作为 `contextlint.config.json` 的草稿提示出来，并为每个规则附上「为什么提案」的一行依据。例如「在 ADR 目录中观察到 Context/Decision/Consequences 的反复出现，因此提案 SEC-001」这样基于观察的具体说明。

不会擅自写入配置，必须经过用户确认。这是为了应对 AI 观察出错的情况，或用户有意排除特定规则的情况。

### 6. 安装与首次 lint 执行

用户批准后，使用检测到的包管理器安装 `@contextlint/cli`，并写入 `contextlint.config.json`。然后执行一次 `npx contextlint`，可视化当前的违规情况。让用户在安装完成的瞬间就能看到「目前哪里有什么问题」。

### 7. 可选的附加产出

CI 和 README 的变更会影响整个团队，所以分别单独获得许可后再写入。

- **GitHub Actions 工作流** — 生成 `.github/workflows/contextlint.yml`（pull_request 触发，执行 `npx contextlint`）
- **README 部分** — 添加表明「正在使用 contextlint」的简短块

各项均为可选，未确认前不会执行。

## 边缘情况

- **只有 README.md 的仓库** — contextlint 的真正价值在于跨文件完整性，所以建议在结构化文档齐备后再引入。
- **多个锁文件并存** — 采用最近修改时间较新的，或向用户确认。
- **父目录已存在配置** — 假设是 monorepo，尊重上层配置，不在同层重复创建。
- **GitHub Actions 以外的 CI** — 在 GitLab CI、CircleCI 等上不生成 `.github/workflows/`，仅说明「通过 `npx contextlint` 可在任意 CI 中集成同等验证」。

## 相关

- 最快的设置步骤请参考 [Quick Start — AI 集成](/zh/docs/get-started/quick-start-ai/)。
- 检测到的违规修复可交给 [contextlint-fix Skill](/zh/docs/integrations/ai-agents/skill-fix/)。
- 完成的配置文件结构请参考 [配置文件](/zh/docs/configuration/config-file/)。
