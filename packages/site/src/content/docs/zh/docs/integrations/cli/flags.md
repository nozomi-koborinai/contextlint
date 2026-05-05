---
title: 标志参考
description: contextlint 命令可用标志的一览和用途。
---

CLI 各子命令可用的标志（选项）一览。每个子命令可用的标志不同。

## 共通标志

所有子命令都可以使用。

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--config <path>` | 路径 | （自动检测） | 显式指定使用的 `contextlint.config.json` 路径 |
| `--cwd <path>` | 路径 | 当前目录 | 工作目录。作为 glob 和路径的解析基准 |
| `--help` | — | — | 显示帮助信息 |
| `--version` | — | — | 显示版本 |

省略 `--config` 时，会从 `--cwd` 向父目录查找 `contextlint.config.json`。行为详细请参考 [配置文件的自动检测](/zh/docs/configuration/auto-detection/)。

## `lint`（默认）

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `[files...]` | glob 数组 | — | 验证目标的文件 / glob 模式。覆盖配置中的 `include` |
| `--format <format>` | `human` / `json` | `human` | 输出格式 |
| `--watch` | — | — | 检测文件变更并自动重新 lint |

`--format` 的行为请参考 [JSON 输出](/zh/docs/integrations/cli/json-output/)，`--watch` 请参考 [watch 模式](/zh/docs/integrations/cli/watch-mode/)。

## `init`

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--cwd <path>` | 路径 | 当前目录 | 配置文件的输出目录 |

除了无参数执行的交互模式以外，没有其他选项。

## `compile`

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--outdir <path>` | 路径 | 配置中的 `compile.outdir`（或 `.claude/skills/contextlint`） | SKILL.md 的输出目录 |
| `--dry-run` | — | — | 不写入，仅显示生成内容的摘要 |

## `impact`

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `<file>` | 路径（必需） | — | 用于分析影响的起点文件 |
| `--format <format>` | `human` / `json` | `human` | 输出格式 |

## `slice`

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `<query>` | 路径 / ID（必需） | — | 用于提取相关文档的查询 |
| `--depth <depth>` | 0 以上的整数 | `2` | 图遍历的最大深度 |
| `--format <format>` | `human` / `json` | `human` | 输出格式 |

## `graph`

| 标志 | 值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--format <format>` | `human` / `json` | `human` | 输出格式 |
