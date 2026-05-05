---
title: 命令
description: contextlint / contextlint init / contextlint compile 的行为和使用方法。
---

本页介绍日常使用的 3 个子命令 `lint`（默认）/ `init` / `compile` 的行为。图相关子命令（`impact` / `slice` / `graph`）的详细信息请参考 [Concepts](/zh/docs/concepts/)。

## `contextlint`（lint，默认）

不带参数执行时，会验证所有匹配配置文件 `include` 模式（或 CLI 传入的 glob）的 Markdown 文件。

```bash
# 按 include 模式 lint
npx contextlint

# 指定特定文件 / glob 进行 lint（覆盖 include）
npx contextlint "docs/**/*.md"

# 显式指定配置文件路径
npx contextlint --config contextlint.config.json
```

验证目标的判定逻辑（CLI 参数 → `include` → 默认值的顺序）请参考 [include 模式](/zh/docs/configuration/include-patterns/)。

### 退出码

| 代码 | 含义 |
| --- | --- |
| `0` | 没有违规，或仅有 warning |
| `1` | 存在 1 件以上 error |
| `2` | 配置文件不存在 / 解析错误等运行时错误 |

如果希望在 CI 中阻止 PR 合并，将退出码 `1` 视为失败即可，error 发生时 job 就会失败。

## `contextlint init`

通过交互式生成 `contextlint.config.json`。只需依次选择语言、include 模式、规则类别，就会输出已自动配置无需额外选项的规则（zero-config rules）的配置文件。

```bash
npx contextlint init
```

交互的步骤如下 4 步。

1. **语言选择** — 英语 / 日语 / 中文 / 韩语
2. **输入 include 模式** — 可用逗号分隔指定多个（留空时默认 `**/*.md`）
3. **选择规则类别** — 从 TBL / SEC / STR / REF / CHK / CTX / GRP 通过复选框多选
4. **现有文件覆盖确认** — 仅在已存在 `contextlint.config.json` 时

生成的配置文件只包含无需额外选项的规则，请根据需要手动添加各规则的 `options`。详细信息请参考 [配置文件](/zh/docs/configuration/config-file/) 和 [Rules](/zh/docs/rules/)。

如果使用 AI 主机，也可以使用 `contextlint-init` Skill（AI 会分析仓库结构并选择规则）。详细信息请参考 [Get Started → 安装](/zh/docs/get-started/installation/)。

## `contextlint compile`

从文档和已启用的规则确定性地生成 `SKILL.md` 文件。设计目的是作为 Claude Code 的自定义技能使用。

```bash
# 生成 SKILL.md
npx contextlint compile

# 不写入而预览将生成的内容
npx contextlint compile --dry-run

# 覆盖输出目录
npx contextlint compile --outdir .claude/skills/my-skill
```

执行 `compile` 需要 `contextlint.config.json` 中包含 `compile` 部分。如果没有 `compile` 部分而执行，会以错误退出。配置写法和流水线机制请参考 [Concepts → Context Compiler](/zh/docs/concepts/)。
