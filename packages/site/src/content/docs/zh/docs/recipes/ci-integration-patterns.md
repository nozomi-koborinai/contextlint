---
title: CI 集成模式
description: 在 GitHub Actions / GitLab CI / pre-commit / PR 门禁中执行 contextlint 的配置示例。
---

本食谱汇总了将 contextlint 集成到 CI / CD 流水线的代表性模式。`pull_request` 中的门禁、`push` 中的快照校验、本地的 pre-commit hook，三者各自适用的执行方式不同。

不涉及配置文件 (`contextlint.config.json`) 的内容。配置示例请参考其他食谱（[ADR 风格的仓库](/zh/docs/recipes/adr-style-repo-setup/) / [规格驱动开发的仓库](/zh/docs/recipes/spec-driven-development-setup/) / [Monorepo](/zh/docs/recipes/monorepo-setup/)）。

## 适用于哪类项目

- 希望在 **合并前** 对文档完整性进行门禁
- 希望保证本地与 CI 使用相同的规则、得到相同的结果（确定性校验的活用）
- 希望对 PR 的差异行输出 **inline annotation**
- 希望对 `main` 分支也另外取得快照

contextlint 执行迅速（数秒），无需 API key 或外部 service 联动，因此可在 CI 上轻松运行。

## 推荐配置 (GitHub Actions)

使用官方 Composite Action 是最便捷的方式。在仓库顶层放置 `.github/workflows/contextlint.yml`：

```yaml
name: contextlint

on:
  pull_request:
    paths:
      - "**/*.md"
      - "contextlint.config.json"
  push:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'   # optional (省略时自动检测)
        #   files: 'docs/**/*.md'                # optional (通过 CLI 参数覆盖 include)
        #   version: 'latest'                    # optional (希望固定版本时填 'v0.9.0' 等)
```

仅此即可在一步内完成 `bun setup` → `@contextlint/cli` 执行 → `--format json` 输出 → 在 PR 差异上输出行级 inline annotation。

## 选择各项配置的理由

### 采用 Composite Action

官方 Composite Action (`nozomi-koborinai/contextlint/.github/actions/contextlint`) 内部执行如下操作：

1. 用 `oven-sh/setup-bun@v2` 设置 bun
2. 带 `--format json` 执行 `bunx @contextlint/cli@<version>`
3. 将 JSON 输出转换为 GitHub Actions 的 `::error` / `::warning` workflow command，在 PR 差异上输出注释
4. 若 error 至少 1 件则以 exit code 1 让 job 失败

自行实现相同功能需要 JSON 解析与注释转换。除需固定版本的情形外，使用此 Composite Action 最为便捷。

### `paths` 过滤器

通过 `pull_request: paths`，仅对 `**/*.md` 与 `contextlint.config.json` 有变更的 PR 执行。仅修改代码的 PR 不必每次跑 contextlint，可节省 CI 额度。

不过即使在 monorepo 中文档仅存在于特定的 `packages/*/docs/` 下，也推荐不要将 `paths` 收紧到 `packages/*/docs/**/*.md`，而是保持 `**/*.md`。理由有两点：

1. 避免 **将来在其他位置追加文档时遗漏** 的风险
2. 必须 **将配置文件的变更也包含在 `paths` 中**，结果较宽的 glob 更易管理

### 同时使用 `push: main`

仅 `pull_request` 无法捕获"合并到 main 的瞬间发生破坏"的情形（squash merge / fork PR / 直接 push）。通过同时使用 `push: main`，可使 main 的当前状态始终保持已校验。

### 版本固定

若保持 `version: 'latest'`，新规则或默认行为变更会立即反映到 CI。重视稳定性时，建议改为 `version: 'v0.9.0'` 这样的显式 tag 指定，并通过 Renovate / Dependabot 进行更新管理。

## 应用到其他 CI 系统

### GitLab CI

GitLab CI 没有相当于 Composite Action 的机制，因此直接调用 CLI。

```yaml
contextlint:
  image: oven/bun:latest
  rules:
    - changes:
        - "**/*.md"
        - "contextlint.config.json"
  script:
    - bunx @contextlint/cli@latest --format json > contextlint.json || true
    - |
      if [ -s contextlint.json ]; then
        cat contextlint.json
        # 若包含 error 则 exit 1
        if jq -e 'any(.[]; .severity == "error")' contextlint.json > /dev/null; then
          exit 1
        fi
      fi
  artifacts:
    when: always
    paths:
      - contextlint.json
```

GitLab CI 没有 GitHub Actions 那样 workflow command 形式的 inline annotation，因此采用通过 `artifacts` 留存 JSON、在 Merge Request 评审中参考的运维方式。

### CircleCI

在 CircleCI 中，选择包含 `bun` 的 image，或使用 `oven-sh/bun-orb`。

```yaml
version: 2.1

jobs:
  contextlint:
    docker:
      - image: oven/bun:latest
    steps:
      - checkout
      - run:
          name: Run contextlint
          command: bunx @contextlint/cli@latest

workflows:
  docs:
    jobs:
      - contextlint
```

`paths` 过滤器的等价物在 CircleCI 标准中没有，必要时使用 `path-filtering` orb，或在所有 commit 上执行。

### npm / pnpm 环境

`@contextlint/cli` **并非 bun 专用**，是可从 npm 安装的普通 CLI。若不使用 bun 而希望在 npm / pnpm / yarn 环境运维，可用各包管理器的 dlx 等价命令执行。

```yaml
# pnpm
- run: pnpm dlx @contextlint/cli

# npm（经由 devDependency）
- run: npm install
- run: npx contextlint

# yarn
- run: yarn dlx @contextlint/cli
```

加入 `devDependencies` 并在 `npm install` 后执行 `npx contextlint` 的形式，从依赖锁定的角度来看最为可靠。

## 本地的 pre-commit hook

在 CI 门禁之前，若希望本地提交前也运行 lint，可使用 [pre-commit](https://pre-commit.com/) 或 [husky](https://typicode.github.io/husky/) 与 [lint-staged](https://github.com/lint-staged/lint-staged) 的组合。

### pre-commit (Python 基础)

`.pre-commit-config.yaml`：

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: '\.(md)$'
        pass_filenames: false
```

指定 `pass_filenames: false` 是关键。**contextlint 拥有项目作用域规则，因此仅以参数传入变更的文件会破坏 REF-001 / GRP-002 等跨文件校验。** 请按每次校验整体的设想运行。

### husky + lint-staged

`package.json`：

```json
{
  "lint-staged": {
    "*.md": "npx contextlint"
  }
}
```

但 lint-staged 默认仅将"变更的文件"作为参数传递。在使用项目作用域规则的情形下，请改用 husky 的 `pre-commit` 钩子直接调用 `npx contextlint` 的运维方式，而非 `lint-staged`。

```bash
# .husky/pre-commit
#!/bin/sh
npx contextlint
```

## 退出码与 CI 门禁

contextlint 的退出码详情见 [CLI 标志参考](/zh/docs/integrations/cli/flags/)，但与 CI 门禁相关的范围归纳如下：

| 退出码 | 含义 | CI 行为 |
| --- | --- | --- |
| `0` | 无违反，或仅有 warning | 成功 |
| `1` | error 至少 1 件 | 失败（PR 门禁触发） |
| `2` | 配置文件不存在 / 解析错误 | 失败（视为 CI 配置失误） |

**warning 不会让 CI fail。** "希望 warning 也阻止"时，需要 grep CLI 输出，或编写用 jq 评估 JSON 输出并改变 exit code 的 wrapper。

## 运维上的注意事项

### Composite Action 的缓存

官方 Composite Action 内部执行 `bunx @contextlint/cli@<version>`，因此每次都会从 npm registry fetch。若在意执行时间，可在 `actions/setup-bun` 之后追加用 `actions/cache` 缓存 `~/.bun/install/cache` 的步骤予以改善。在大多数项目中，`latest` 版本的 fetch 也在数秒内，默认即足够快。

### Fork PR 中的注释

GitHub Actions 中，来自 fork 的 PR 默认 GITHUB_TOKEN 权限受限，inline annotation 可能不显示。Composite Action 不会因注释失败让 job 失败，而是将相同内容输出到 stdout，因此可从 PR 的 checks tab 通过 log 确认违反。

### 阶段性引入

在已有仓库中包括 warning 在内出现 100 件以上违反的状态下，若立即启用 PR 门禁，最初几个 PR 会陷入"不修正无关的所有地方就无法合并"的状态。请用以下任一方式分阶段引入：

1. **先仅以 `push: main` 开始运维** — 不做 PR 门禁，仅可视化 main 的状态
2. **在 job 中追加 `continue-on-error: true`** — 执行 Action 但不让 job 失败（仅显示注释）
3. **收紧 `include` 后逐步扩大** — 最初仅校验新目录，将旧目录排除

第 3 种方法在 [include 模式](/zh/docs/configuration/include-patterns/) 中使用否定模式即可实现。

### 相关文档

- [CLI 命令](/zh/docs/integrations/cli/commands/) — `lint` 的子命令与标志
- [CLI 标志参考](/zh/docs/integrations/cli/flags/) — `--config` / `--format` / `--cwd` 的详情
- [CI/CD 集成](/zh/docs/integrations/ci-cd/) — 本类别的官方集成方式（Composite Action 的 API 参考）
