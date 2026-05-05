---
title: 三层反馈的设计
description: 将 LSP / MCP / CI 划分为三层的设计思想。
---

contextlint 将同一个 lint 引擎承载在 **LSP / MCP / CI** 这三种协议之上进行投递。我们没有锁定单一执行手段,而是特意分为三层,这是一项**为了让"文档损坏的时机"与"检测到损坏的时机"尽可能接近**的设计决策。本页将说明其原因。

三层的概要(时机与对应工具)在 [Get Started](/zh/docs/get-started/) 中已有表格。这里将集中讨论**为什么要分为三层**。

## 文档损坏的时机

文档完整性可能会在生命周期的三个环节崩坏。

| 环节 | 会发生什么 |
|------|-------------|
| **人在编写时** | 重命名、ID 变更、章节删除等编辑的副作用导致引用损坏 |
| **AI 在编写时** | AI 生成或编辑新文档时,可能损坏对现有文件的引用 |
| **多人编辑合并时** | 在 branch 合并的瞬间,独立编写的两个变更组合在一起,导致完整性崩坏 |

三层反馈正是为了对**这三个环节分别准备相应的检查点**而设计的。

## 各层的角色

| 层 | 协议 | 何时运行 | 对应工具 |
|----|----------|----------|-----------|
| **编写过程中** | LSP | 编辑器输入时 (debounce) | VS Code / Cursor / Neovim / Helix / JetBrains |
| **AI 编写过程中** | MCP | AI agent 编辑文档后立即 | Claude Code / Cursor Agent / Cline / Codex / Windsurf |
| **合并前** | CLI | PR / pre-commit / push 时 | GitHub Actions / pre-commit / Husky / lint-staged |

三者只是**检测时机**不同,**执行的引擎**完全相同。规则定义、配置文件、输出格式也全部统一,在层与层之间不会出现偏差。

## 为什么要分为三层

### 单一层要么检测得太晚,要么太早

**仅依赖 CI 的问题:**
文档不一致在 PR 提交、CI 运行之前对任何人都不可见。等到察觉时,修复已经跨越了多次提交,定位原因也代价不菲。

**仅依赖 LSP 的问题:**
编辑过程中的即时反馈非常强大,但即便如此也可能让问题穿过它,直到 PR 被合并。在缺乏最终防线的情况下,main 分支被破坏的风险依然存在。

**仅依赖 MCP 的问题:**
通过 AI agent 进行的编辑可以覆盖,但人在编辑器中直接编写的变更,以及应在 CI 中检测的副作用,无法捕获。

将三层组合起来,各自的"漏检"可以由其他层接住。

### 检测越早,修复成本越低

不一致越早被检测,越容易修复;越晚,影响范围越大。

| 检测时机 | 修复成本估算 |
|---------------|-----------------|
| 输入过程中 (LSP) | 一次按键的成本。波浪线一出现就修复 |
| AI 编辑后 (MCP) | AI 自己提出修复方案,人类只需确认 |
| PR 时 (CI) | 修复需要跨越多次提交,review 往返次数增加 |
| 合并后 | 需要在另一个 PR 中追加修复,`main` 暂时处于损坏状态 |

LSP 是"不让损坏发生",MCP 是"损坏后立即修复",CI 是"不让损坏的内容通过" — 各自角色不同,这正是同一工具以三种形式投递的意义。

### 通过承载于标准协议保留工具选择的自由

三层分别对应**开放的标准协议**。

- **LSP (Language Server Protocol)** — 不限定编辑器。VS Code / Cursor / Neovim / Helix / JetBrains 上行为一致
- **MCP (Model Context Protocol)** — 不限定 AI host。Claude Code / Cursor / Cline / Codex / Windsurf 上行为一致
- **CLI (shell 命令)** — CI / Git hook / 手动执行均可

contextlint 通过采用标准协议,**避免将用户绑定在特定环境中**。即使更换编辑器、更换 AI host、将 CI 迁移到其他服务,也能继续使用同一个 linter。

## 同一引擎承载三层的好处

三层共用同一引擎,在运维上具有重要的好处。

- **结果保持一致** — 不会出现编辑器中通过、CI 中报错这种不一致
- **配置集中在一处** — 只要将 `contextlint.config.json` 放在仓库根目录,三层都会应用相同的规则
- **新增规则立即在所有层生效** — 编写新规则当天起,在编辑器、AI、CI 上都可检测

实现层面上,lint 流水线集中在 `@contextlint/core`,`@contextlint/cli` / `@contextlint/mcp-server` / `@contextlint/lsp-server` 各自作为薄适配器调用 core。详情请参阅 [Graph API](/zh/docs/graph-api/) 以及 [Integrations](/zh/docs/integrations/) 各页面。

## 下一步

- [Context Graph](/zh/docs/concepts/context-graph/) — 三层 lint 引擎共同使用的依赖图
- [Integrations](/zh/docs/integrations/) — 各层实际接入的步骤
