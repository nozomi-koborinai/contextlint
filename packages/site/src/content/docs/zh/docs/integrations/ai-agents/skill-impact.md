---
title: contextlint-impact Skill
description: 使用 Context Graph 将文件变更或删除的影响范围分类为直接和间接的 Skill 的作用与行为。
---

`contextlint-impact` 是分析 **文件的变更或删除如何向整个文档图波及** 的 Skill。当 AI 接收到「修改 design.md 会破坏什么？」「删除 FR-101 安全吗？」之类的请求时会自动启动。

## 为什么有这个 Skill

文档越多，对一个文件的改动越会波及到意想不到的地方。

- `grep` 能找到 **直接的提及**，但无法捕捉 **间接的引用链**
- 当达到 100 文件规模时，在人脑中追踪 transitive 依赖已不现实
- AI 的批量编辑如果不感知影响范围，会把引用断裂散布到 doc 图各处

contextlint 内置了 `@contextlint/core` 的 Context Graph 引擎。`contextlint-impact` 把这个引擎翻译为「碰这个文件会破坏什么？」这样简单的提问。

## 启动条件

用户提出以下类型的请求时会启动。无需明示 Skill 名。

- 「修改 design.md 会破坏什么？」「删除 FR-101 安全吗？」
- 「想知道依赖关系」「这个 doc 被其他什么引用？」
- 「想重构但影响范围呢？」

即使请求中不出现「contextlint」名字，只要在影响范围、依赖关系、删除安全性之类的语境中也会启动。

## 行为流程

### 1. 设置确认

确认 `contextlint.config.json` 是否存在，以及跨文件规则（REF-001 / GRP-002）是否启用。这些未启用时图会变成「只有节点的扁平列表」，影响分析将失去意义。

未设置时会引导使用 [contextlint-init Skill](/zh/docs/integrations/ai-agents/skill-init/)。

### 2. 识别目标

用户的请求可能包含文件路径，也可能包含 ID（如 `FR-101`）。

| 用户输入 | 目标 |
| --- | --- |
| `design.md` | 文件 `design.md` |
| `删除 FR-101...` | ID `FR-101` → 解析到定义所在文件后再分析 |
| 「想重构 API 的认证部分」 | 不明确 → 向用户确认「哪个文件？」 |

ID 指定时，先通过 `grep -rn 'FR-101' . --include='*.md'` 等定位定义所在文件，以该文件为起点进行影响分析。

### 3. 执行影响分析

```sh
npx contextlint impact <target-file> --format json
```

通过 JSON 输出，让 Skill 能结构化地处理结果。在 MCP 可用的环境下，直接调用 `impact-analysis` 工具，省略 JSON 解析。

### 4. 输出的解读

JSON 包含以下内容。

- **direct** — 直接引用目标文件的文件
- **transitive** — 间接可达的文件（引用链）
- 影响范围内存在的 **lint 违规** — 成为编辑后运行 `contextlint-fix` 的动机

输出为空时，目标文件可能是 doc 图上的 **orphan**。Skill 会说明「图上是孤立的，但不保证来自代码、构建配置、README 的引用」。

### 5. 结构化摘要呈现

不是扁平的文件列表，而是分开呈现 direct / transitive / 注意事项。

```
Impact analysis for `design.md`:

DIRECT (5 files reference this directly):
  - requirements.md
  - overview.md
  - api/auth.md
  - api/users.md
  - testing.md

TRANSITIVE (12 more files affected indirectly):
  - architecture.md (via overview.md)
  - migrations/2026-01.md (via api/users.md)
  - ...

HIGHLIGHTS:
  - api/auth.md 被 8 个文件引用是 hub → 波及风险高
  - 影响范围内检测到 3 件 lint 违规（建议编辑后运行 contextlint-fix）

RECOMMENDATIONS:
  - 先更新 direct，确认 transitive 是否仍有意义
  - cascade 较大，考虑将变更拆分为多个 PR
```

如果只是扁平列表「从哪里下手」会不清楚，因此带回带优先级的推荐，例如「先更新 direct」。

### 6. 基于观察的额外推荐

| 观察 | 推荐 |
| --- | --- |
| transitive 超过 10 件 | 拆分 PR 到可审查的粒度 |
| 目标是 hub（被引用很多） | 提议向后兼容的变更（deprecate-then-remove） |
| 目标是 orphan | 删除前先确认来自代码、构建配置、README 的引用 |
| 影响范围内有 lint 违规 | 编辑后执行 `contextlint-fix` |
| 检测到循环引用 | 提议先启用 `grp002` → 解除循环 |

## 边缘情况

- **没有 `contextlint.config.json`** — 引导使用 `contextlint-init`，不执行影响分析。
- **REF-001 / GRP-002 未启用** — 图会接近为空，发出警告并提议启用。
- **目标文件不存在** — 询问用户是 typo 还是已删除。
- **目标是循环的一部分** — 说明不解除循环就读 transitive 会产生误解。
- **影响范围超过 100 件** — 切换到按集群的 tree 显示而非扁平列表。可以提议通过 `contextlint slice` 缩小到更窄的范围。
- **MCP 服务器可用** — 优先使用 `impact-analysis` 工具，省略 JSON 解析。

## 相关

- 影响范围内的违规可使用 [contextlint-fix Skill](/zh/docs/integrations/ai-agents/skill-fix/) 修复。
- Context Graph 的概念和机制请参考 [Concepts → Context Graph](/zh/docs/concepts/context-graph/)。
- 如果想以编程方式调用相同功能，可以直接使用 `@contextlint/core` 的 Context Graph API（`buildContextGraph`、`classifyImpact` 等）。
