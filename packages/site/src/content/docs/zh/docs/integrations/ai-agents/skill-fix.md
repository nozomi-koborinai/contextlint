---
title: contextlint-fix Skill
description: 在意识到机械修复与人工判断边界的前提下解决检测到的违规的 Skill 的作用与行为。
---

`contextlint-fix` 是用于 **修复** contextlint 检测到的违规的 Skill。当 AI 接收到「修一下 lint」「修复坏掉的链接」之类的请求时会自动启动。

## 为什么有这个 Skill

文档的完整性会因重构、文件改名、AI 批量编辑等无声地崩坏。即使 CI 报出违规，让人类逐条手动修复负担也很大，往往会被拖延。

`contextlint-fix` 消除这种摩擦，但严守 **不擅自做出有意义改动** 的设计。修复分为以下两类，处理方式不同。

- **机械修复**（typo、添加标题、空单元格的填充等） — 自动应用
- **语义判断**（删除引用、捏造值、勾选清单、切断图等） — 必须经过用户确认

不让「AI 默默改变了语义」的情况发生，是这个 Skill 最重要的约束。

## 启动条件

用户提出以下类型的请求时会启动。无需明示 Skill 名。

- 「修一下 lint」「修复 lint 错误」「contextlint 报错了帮我修」
- 「修复坏掉的链接」「整理一下文档」「commit 前清理 docs」

即使不出现 contextlint 名字，只要是「修复文档的完整性」之类的请求也会启动。

## 行为流程

### 1. 设置确认

首先确认 `contextlint.config.json` 和 `@contextlint/cli` 是否可用。未设置时会引导使用 [contextlint-init Skill](/zh/docs/integrations/ai-agents/skill-init/)，并在此处停止。

### 2. lint 执行

```sh
npx contextlint --format json
```

通过 `--format json` 获取机器可读的输出，后续步骤逐条处理违规。在 MCP 服务器可用的环境下，直接调用 `lint` 工具，省略 JSON 解析。

### 3. 按规则类别的修复策略

| 规则前缀 | 自动修复 | 用户确认 |
| --- | --- | --- |
| **REF-\*** | 修正可判定为 typo 的链接目标 ID | 引用对象确实不存在的情况（删除还是改名） |
| **SEC-\*** | 添加缺失部分（带 `<!-- TODO -->`） | — |
| **TBL-\*** | 在空单元格插入 `TODO` | 允许值违反（不捏造值） |
| **STR-\*** | 创建缺失文件（带占位符） | — |
| **CHK-\*** | — | 不擅自勾选复选框 |
| **CTX-\*** | — | 占位符的解决需要人工判断 |
| **GRP-\*** | — | 循环引用或 orphan 的解决因有跨文件波及，需要确认 |

明确划分：搭骨架是 Skill 的职责，填内容是人类的职责。例如缺失部分会添加标题，并在正文留下 `<!-- TODO -->`，既满足形式又留下「未完成」的信号。

### 4. 重新 lint 确认

修复后再次执行 `npx contextlint`，确认是否能将剩余违规降为 0。如果无法到达 0，剩余的应该都是需要人工判断的项目。

### 5. 摘要呈现

Skill 最后将「自动修复的内容」与「需要人工确认的内容」分开呈现。

```
Done:
  - typo'd cross-refs in design.md 修复 3 处
  - adr/0005.md 添加了 Consequences 部分（TODO placeholder）

Needs your attention:
  ? FR-101 在 design.md 中被引用但找不到定义 — 删除引用还是定义需求
  ? architecture.md 与 overview.md 的循环引用 — 哪个作为 source of truth
```

将决策留给人类，Skill 专注于整理判断材料。

## 大量违规时的行为

检测到超过 50 件违规时，不会一次全部处理，而是先按类别给出摘要，然后向用户询问「全部自动修复 / 还是限定为部分」。AI 大量改写文件会让人类难以审查变更，所以让用户能选择应用粒度。

## 边缘情况

- **`@contextlint/cli` 未安装** — 引导使用 `contextlint-init`，或建议执行 `npm install -D @contextlint/cli`。
- **跨文件规则结果为空** — 确认 `include` 模式是否覆盖了 cross-ref 目标的文件。include 过窄会导致 REF-002 或 TBL-006 被隐式跳过。
- **MCP 服务器可用** — 优先使用 MCP 的 `lint` 工具而非 CLI 的 JSON 解析。

## 相关

- 修复对象的设置未完成时，使用 [contextlint-init Skill](/zh/docs/integrations/ai-agents/skill-init/)。
- 想先掌握违规来源和修复的波及范围时，使用 [contextlint-impact Skill](/zh/docs/integrations/ai-agents/skill-impact/)。
- 各规则的规范请参考 [Rules](/zh/docs/rules/)。
