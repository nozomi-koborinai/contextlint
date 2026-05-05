---
title: GitHub Actions
description: 将 contextlint 集成到 GitHub Actions 工作流的 2 种方法。
---

contextlint 提供与 GitHub Actions 兼容的 2 种集成方法。使用 **官方 Composite Action** 的方法和通过 `npx` 直接执行的方法。可以以最小的配置在每个 PR 执行 lint，违规时任务会失败。

## 官方 Composite Action

仓库 `nozomi-koborinai/contextlint` 下包含 Composite Action。Action 端会通过 `--format json` 执行 contextlint 并完成向 PR 添加内联注释的处理。

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # 可选
        #   files: 'docs/**/*.md'              # 可选
        #   version: 'latest'                  # 可选
```

| 输入 | 概述 |
| --- | --- |
| `config` | 配置文件路径。省略时从父目录向上自动检测 |
| `files` | 验证目标的 glob。省略时使用配置的 `include` |
| `version` | 使用的 `@contextlint/cli` 版本。省略时为 `latest` |

指定 `paths` 后，仅在文档变更的 PR 上运行，可以减少 CI 时间。

## 直接执行的情况

也可以不使用 Composite Action，而通过 `npx` 简单执行。只要有 Node.js 环境，无需额外设置。

```yaml
name: contextlint
on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli
```

只要仓库中有配置文件，`npx @contextlint/cli` 就能执行 lint。违规时以非零退出，任务会自动判定为失败。

## 使用现有包管理器执行

如果仓库使用 bun / pnpm / yarn，把 `@contextlint/cli` 加入 `devDependencies` 后从 `bun run` 等调用，依赖解析会更快。

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bunx contextlint
```

依赖锁会固定版本，因此 CI 上执行的版本与开发机上执行的版本一致。

## 注释

Composite Action 会自动添加内联注释，但即使是直接执行的配置，通过脚本处理 JSON 输出也能实现同等效果。

```yaml
- run: npx contextlint --format json | tee contextlint.json
- run: node ./scripts/annotate.js contextlint.json
```

JSON 的结构请参考 [JSON 输出](/zh/docs/integrations/cli/json-output/)。

## 与并行任务的组合

contextlint 与 `markdownlint` 或 `eslint` 并行运行也没有问题。两者职责分明，结果不会互相干扰。

```yaml
jobs:
  contextlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli

  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx markdownlint-cli2 "**/*.md"
```

contextlint 与 markdownlint 的职责区别请参考 [语义 linter 与语法 linter](/zh/docs/concepts/semantic-vs-syntax/)。

## SKILL.md 的同步

`contextlint compile` 是确定性的，因此在 CI 上运行 `--dry-run` 可以验证「仓库的 SKILL.md 是否与文档的最新状态保持同步」。

```yaml
- run: npx contextlint compile --dry-run
```

存在差异时以非零退出，可以让 CI 检测出 SKILL.md 的更新遗漏。
