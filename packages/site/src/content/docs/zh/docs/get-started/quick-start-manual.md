---
title: 快速开始 — 手动
description: 直接使用 CLI 手动配置 contextlint。
---

适用于不使用 AI 宿主、或希望完全自主管理配置的场景。三条命令即可跑通 lint。

## 1. 安装

最快捷的方式如下:

```bash
npm install -D @contextlint/cli
```

如果使用 bun / pnpm / yarn,请参阅 [安装](/zh/docs/get-started/installation/)。

## 2. 通过交互模式生成配置文件

执行 `contextlint init` 即可在交互模式下生成贴合项目的 `contextlint.config.json`。

```bash
npx contextlint init
```

依次回答提示后,仓库根目录会生成类似下面的配置文件:

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "grp002" }
  ]
}
```

配置文件各字段的含义会在 [Configuration](/zh/docs/configuration/) 中详细说明。生成后也可以手动编辑。

## 3. 运行 lint

```bash
npx contextlint
```

contextlint 会从当前目录向父目录逐级查找 `contextlint.config.json`,并按所找到的配置文件中的 `include` 来检查 Markdown。也可以通过 CLI 参数直接指定目标文件,从而覆盖配置文件中的 `include`。

```bash
npx contextlint "specs/**/*.md"
```

## 后续步骤

- [首次运行 lint](/zh/docs/get-started/your-first-lint/) — 如何阅读输出与常见的违规模式
- 希望从 AI 宿主进行配置请参阅 [快速开始 — AI 集成](/zh/docs/get-started/quick-start-ai/)
