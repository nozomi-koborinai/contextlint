---
title: CLI
description: contextlint 命令的子命令一览，以及 CLI 集成页面的目录。
---

`@contextlint/cli` 包提供的 `contextlint` 命令，无论在本地开发还是 CI 中都可以作为同一个执行入口。配置文件自动检测、watch 模式以及机器可读的 JSON 输出，都通过一个二进制文件提供。

安装方法请参考 [Get Started → 安装](/zh/docs/get-started/installation/)。本页介绍安装后的使用入口。

## 子命令一览

| 子命令 | 用途 |
| --- | --- |
| `contextlint`（默认） | 检查 Markdown 文档 |
| `contextlint init` | 通过交互式生成 `contextlint.config.json` |
| `contextlint compile` | 将文档和规则转换为 Claude Code 用的 SKILL.md |
| `contextlint impact <file>` | 分析指定文件的更改会影响哪些文档 |
| `contextlint slice <query>` | 提取与查询相关的最小文档集 |
| `contextlint graph` | 显示文档依赖图 |

各子命令的参数和选项请参考 [命令](/zh/docs/integrations/cli/commands/)。

## 本节的构成

- [命令](/zh/docs/integrations/cli/commands/) — `lint` / `init` / `compile` 的行为和使用方法
- [标志参考](/zh/docs/integrations/cli/flags/) — `--config` / `--format` / `--watch` / `--cwd` 等的一览
- [watch 模式](/zh/docs/integrations/cli/watch-mode/) — 检测文件变更并自动重新检查
- [JSON 输出](/zh/docs/integrations/cli/json-output/) — `--format json` 的格式与在 CI 中的应用

## 验证安装

安装后，可以通过以下命令确认版本。

```bash
npx contextlint --version
```

即使没有配置文件，`--version` 和 `--help` 也可以执行，但执行 lint 需要 `contextlint.config.json`。配置文件的创建方法请参考 [Configuration](/zh/docs/configuration/)。
