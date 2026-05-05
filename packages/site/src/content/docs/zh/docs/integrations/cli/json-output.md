---
title: JSON 输出
description: 通过 --format json 输出机器可读的格式，以及在 CI 中的应用示例。
---

指定 `--format json` 时，contextlint 会向标准输出写出机器可读的 JSON，而不是面向人类的文本。可用于在 CI 中生成注释、为编辑器扩展提供反馈、导入到自定义报告工具等。

## 基本

```bash
npx contextlint --format json
```

## 输出格式

`lint`（默认）子命令的 JSON 输出是违规的扁平数组。

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  },
  {
    "file": "docs/design.md",
    "line": 24,
    "severity": "warning",
    "message": "Empty cell in column \"Status\"",
    "ruleId": "TBL-002"
  }
]
```

各元素的字段如下。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `file` | string | 发现违规的文件相对路径 |
| `line` | number | 违规位置的行号（从 1 开始） |
| `severity` | `"error"` / `"warning"` | 严重程度 |
| `message` | string | 违规说明 |
| `ruleId` | string | 带连字符的规则 ID（如：`TBL-001`） |

没有违规时输出空数组 `[]`。

## 在 CI 中的应用

JSON 输出可用于生成 GitHub Actions 注释，或 Slack / Discord 通知的负载。

### 内置的 GitHub Actions

仓库自带的 Composite Action 通过 `--format json` 执行 contextlint，并将结果转换为 PR 的内联注释。配置示例请参考 [CI/CD → GitHub Actions](/zh/docs/integrations/ci-cd/)。

### 用自己的脚本处理

使用 `jq` 等工具统计违规数的简单示例。

```bash
npx contextlint --format json | jq 'length'
# => 2
```

也可以按规则统计件数。

```bash
npx contextlint --format json | jq 'group_by(.ruleId) | map({rule: .[0].ruleId, count: length})'
```

## 图相关子命令的 JSON 输出

`impact` / `slice` / `graph` 也接受 `--format json`，但输出结构与 lint 不同。各子命令的输出示例请参考 [Concepts](/zh/docs/concepts/)。
