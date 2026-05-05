---
title: CI/CD
description: 将 contextlint 集成到 CI 流水线和本地钩子的方法。
---

contextlint 在拥有 Node.js 环境的任意 CI 上都能运行。`@contextlint/cli` 包依赖较少，亚秒级即可完成，所以即使每个 PR 都执行也不会显著影响 CI 时间。可同时用于合并前保证文档完整性，以及提交前在本地快速检测。

## 集成的时机

| 时机 | 主要工具 | 用途 |
| --- | --- | --- |
| 本地钩子 | pre-commit / Husky / lint-staged | 提交前的最后安全网 |
| 推送时 | GitHub Actions / GitLab CI / CircleCI | PR 评审前保证文档完整性 |

编辑器集成（[Editors (LSP)](/zh/docs/integrations/editors/)）和 AI 集成（[AI Agents](/zh/docs/integrations/ai-agents/)）承担「写作瞬间」的反馈，CI/CD 则承担「合并前」的最终检查。组合三个层面，可以打造文档完整性破损状态不会留在仓库中的环境。

## 本节的构成

- [GitHub Actions](/zh/docs/integrations/ci-cd/github-actions/) — 官方的 Composite Action 和直接执行的示例
- [pre-commit / 本地钩子](/zh/docs/integrations/ci-cd/pre-commit/) — 与 Husky / lint-staged / pre-commit framework 的结合

## 配置文件的处理

在 CI 上执行 contextlint 时，将 `contextlint.config.json` 提交到仓库。运行器 checkout 仓库的瞬间 `npx contextlint` 会自动检测配置文件，因此无需向 CLI 传递额外参数。

配置文件的规范请参考 [Configuration](/zh/docs/configuration/)。

## 退出码与输出格式

`contextlint` 当存在 1 件以上违规时以非零退出，因此可直接将 CI 任务视为失败。如果想添加评审评论或注释，请通过 `--format json` 获取机器可读输出。

```bash
npx contextlint --format json
```

JSON 输出的结构和字段请参考 [Integrations → CLI → JSON 输出](/zh/docs/integrations/cli/json-output/)。
