---
title: watch 模式
description: 通过 --watch 检测文件变更并自动重新 lint。
---

添加 `--watch` 标志后，contextlint 会在执行首次 lint 之后，持续监视工作目录中 `.md` 文件的变更。适合在编辑器打开期间实时确认违规情况。

## 启动

```bash
# 按 include 模式 watch
npx contextlint --watch

# watch 特定 glob
npx contextlint --watch "docs/**/*.md"

# 显式指定配置文件
npx contextlint --watch --config contextlint.config.json
```

按 `Ctrl+C` 退出。

## 行为

watch 模式的基本流程如下。

1. 启动时清空终端，执行首次完整 lint
2. 监视工作目录下 `.md` 文件的变更
3. 检测到变更后，重新 lint 所有匹配的文件
4. 清空终端，显示带时间戳的最新结果

连续的变更会进行 **300 毫秒的防抖处理**。即使在短时间内保存多个文件，也只会在最后一次变更后 300ms 才执行一次重新 lint。

### 为什么要重新 lint 所有文件

仅 lint 变更的文件不足以应对 REF-002（ID 引用的一致性）和 TBL-006（文件间 ID 唯一性）等 **跨文件规则**。一个文件的变更可能会在其他文件中产生 / 解决违规，因此需要对整个目标集合重新执行。

## 适用场景

| 场景 | 推荐 |
| --- | --- |
| 在编辑器中编辑 Markdown | 如果编辑器支持 LSP，[Editors (LSP)](/zh/docs/integrations/editors/) 的即时性更高 |
| 使用不支持 LSP 的编辑器 | watch 模式是有效的备选方案 |
| 想确认 AI 大量生成文档的结果 | 启用 watch 后，AI 输出后会自动重新 lint |
| CI 环境 | 不使用 watch。通过一次性执行（exit code）判断结果 |

## 终端输出

变更检测时的标题中会显示时间戳和变更文件名。

```text
[14:32:15] File changed: docs/requirements.md

docs/requirements.md
  line 12  error  Required column "Status" not found in table  TBL-001

1 error in 1 files
```

watch 模式始终以 human 格式显示（不假设与 `--format json` 同时使用）。
