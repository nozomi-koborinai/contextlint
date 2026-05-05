---
title: Recipes
description: 针对典型文档运维模式的 contextlint 配置示例。
---

Recipes 类别针对常见的文档运维模式，汇总了 **可直接使用的 `contextlint.config.json`** 以及选择该配置的意图。

[Configuration](/zh/docs/configuration/) 处理各个字段的规范，[Rules](/zh/docs/rules/) 处理各条规则的规范，而 Recipes 则聚焦于 **如何组合多条规则**。

## 本类别的构成

- [ADR 风格的仓库](/zh/docs/recipes/adr-style-repo-setup/) — 以模板驱动方式运维 Architecture Decision Records 的配置
- [规格驱动开发的仓库](/zh/docs/recipes/spec-driven-development-setup/) — 包含需求 → 规格 → 实现的可追溯性与稳定度管理的配置
- [Monorepo](/zh/docs/recipes/monorepo-setup/) — 以一份配置统一校验多个 package 的文档
- [CI 集成模式](/zh/docs/recipes/ci-integration-patterns/) — GitHub Actions / GitLab CI / pre-commit / PR 门禁的执行示例

## 食谱的阅读方式

每个食谱按以下结构编写：

1. **适用于哪类项目** — 设想的规模、是否使用模板、运维阶段
2. **推荐配置 (`contextlint.config.json`)** — 可直接复制使用的完整配置
3. **选择各条规则的理由** — 采用或不采用该规则的意图
4. **运维上的注意事项** — 引入到既有仓库的步骤、阶段性迁移、CI 中的门禁方式

## 配置无法决定时

若对规则类别或模板犹豫不决，先用 [`contextlint init`](/zh/docs/integrations/cli/commands/) 通过对话方式生成基础配置，再参考食谱进行扩展，是最快的引入步骤。
