---
title: 首次运行 lint
description: 如何阅读 contextlint 的输出,以及常见的违规模式。
---

配置就绪后,就可以实际运行一次 lint 了。

## 运行

```bash
npx contextlint
```

`contextlint.config.json` 中 `include` 所指定的 glob 模式所匹配的所有 Markdown 文件都会被检查。

## 如何阅读输出

存在违规时,会以下面的形式显示:

```text
docs/requirements.md
  line 12  error    Link target "./api.md" does not exist  REF-001
  line 24  warning  Empty cell in column "Status"          TBL-002

docs/architecture.md
  line 5   error    Required section "Decision" is missing  SEC-001

2 errors, 1 warning in 2 files
```

每条违规由以下要素构成:

- **文件路径** — 检测到违规的文件
- **line** — 违规所在的行号
- **error / warning** — 严重级别
- **消息** — 具体问题
- **规则 ID** — 对应的规则(详见 [Rules](/zh/docs/rules/))

没有违规时显示如下:

```text
No issues found.
```

在 CI 中运行时,这种状态会以 exit code 0 正常结束;若存在违规,则以 exit code 1 退出,因此可以作为 PR 的检查门禁使用。

## 常见的违规模式

### REF-001 — 链接断裂

文件链接或文件内的锚点(`#section-name`)无法解析时触发。

- 引用目标的文件被重命名或移动
- 锚点链接所引用的章节被删除或改名
- 相对路径写错

### SEC-001 — 必需章节缺失

配置文件中要求必需的章节,在目标文件中不存在时触发。

- ADR 模板要求 `Context / Decision / Consequences`,但新的 ADR 漏掉了一个
- 规格书模板要求 `概述 / API / 示例`,但只写了概述

### TBL-002 — 表格空单元格

配置中标记"不能为空"的列出现空单元格时触发。

- 在需求表格中,新增了一行但 `Status` 列为空

其他规则请参阅 [Rules](/zh/docs/rules/)。共有 21 条规则,每条都对其检测内容与配置方式做了独立说明。

## 修复违规

使用 `contextlint-fix` Skill,AI 会一次性给出违规的修复建议。Skill 的安装方式请参阅 [快速开始 — AI 集成](/zh/docs/get-started/quick-start-ai/)。

如果要手动修复,可根据输出中的文件路径与行号,直接定位并修改对应位置。

## 后续步骤

- [Configuration](/zh/docs/configuration/) — `contextlint.config.json` 的详细说明
- [Rules](/zh/docs/rules/) — 21 条规则的逐条参考
- [Integrations](/zh/docs/integrations/) — 编辑器、CI、AI 集成的各类配置
