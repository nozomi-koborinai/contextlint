---
title: pre-commit / 本地钩子
description: 从 Husky / lint-staged / pre-commit framework 调用 contextlint 的本地钩子配置。
---

从本地的 git 钩子调用 contextlint 后，包含违规的 commit 根本不会进入仓库。可以在 CI 检测出违规之前，于 commit 的瞬间在本地反馈。下面介绍 3 种代表性的方法。

## 速度的前提

contextlint 数秒即可完成，所以即使在 `pre-commit` 阶段执行也不会影响体感。但在文件数较多的仓库中，可以根据目的选择配置，例如仅限定为变更文件，或将包含跨文件规则的完整 lint 交给 CI。

## Husky

[Husky](https://typicode.github.io/husky/) 是 npm 生态中使用最广泛的 git 钩子管理工具。

将 Husky 安装到 `package.json` 之后，创建 `.husky/pre-commit`。

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx contextlint
```

照此使用每次 commit 都会 lint 整个仓库。如果想只限于变更过的文件，请与下面的 lint-staged 组合使用。

## lint-staged

使用 [lint-staged](https://github.com/lint-staged/lint-staged)，可以仅对 git stage 完毕的文件执行 lint。

将配置添加到 `package.json`。

```json
{
  "lint-staged": {
    "*.md": "contextlint"
  }
}
```

从 `.husky/pre-commit` 调用 `npx lint-staged`。

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

但 contextlint 的 REF-001、REF-002、TBL-006、GRP-\* 等 **跨文件规则** 不看整个仓库就无法判定，所以仅传递 stage 完毕的文件可能引发误检（或漏检）。通过 lint-staged 执行时，要么使用不依赖跨文件规则的配置，要么以 CI 进行最终检查为前提使用，这样比较安全。

## pre-commit framework

[pre-commit](https://pre-commit.com/) 是基于 Python 的通用钩子框架，可以跨多种语言使用。在 `.pre-commit-config.yaml` 中以本地钩子注册。

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: \.md$
        pass_filenames: false
```

指定 `pass_filenames: false` 是因为 contextlint 假设对整个仓库运行。如果想通过 CLI 参数限定文件，可以改为 `pass_filenames: true` 仅传递变更文件。但要注意与 lint-staged 同样，跨文件规则的检测可能会变化。

## 选择哪种方法

| 视角 | Husky | Husky + lint-staged | pre-commit framework |
| --- | --- | --- | --- |
| 安装 | 仅 npm | 仅 npm | 仅 Python |
| 限定为变更文件 | 不可 | 可 | 可 |
| 多语言项目 | 依赖 npm 生态 | 依赖 npm 生态 | 易于跨语言 |
| 跨文件规则的准确性 | 完整 | 有限 | 有限 |

如果想正确评估跨文件规则，需要对整个仓库运行，因此本地钩子不限定，CI 进行完整 lint 的配置较为稳妥。

## 与 CI 的组合

本地钩子负责「commit 时的早期发现」，CI 负责「合并前的最终检查」，两者职责分明。同时启用两者，可以达到

- 立即检测本地的失误 commit
- 即使钩子被 skip，也能在 CI 中拦截

的双重防护。CI 的集成方法请参考 [GitHub Actions](/zh/docs/integrations/ci-cd/github-actions/)。
