---
title: Contributing
description: 为 contextlint 贡献代码的方式与开发相关规约。
---

contextlint 是一个开源项目,欢迎以新增规则、修复 bug、改进文档等方式参与贡献。本类别汇总了参与 contextlint 开发所需的仓库环境搭建、规则添加流程,以及测试规约。

## 本类别构成

- [开发环境搭建](/zh/docs/contributing/development-setup/) — bun workspace 的结构与各 package 的职责,以及构建、测试、类型检查命令
- [新增规则](/zh/docs/contributing/adding-a-new-rule/) — 从 ID 编号到 Zod schema、registry 注册、`schema.json` 更新的完整步骤
- [测试编写](/zh/docs/contributing/writing-tests/) — `bun:test` 的使用方式,以及 CJK 语言测试 fixture 必需的原因

## 贡献流程

1. Fork 仓库,按 1 个 Issue / 1 个特性对应 1 个 branch 的方式创建分支
2. 按 [开发环境搭建](/zh/docs/contributing/development-setup/) 在本地运行起来
3. 根据变更内容,遵循对应 page 的规约进行实现、测试与文档更新
4. 以 Conventional Commits 格式(`feat:`、`fix:`、`docs:` 等)提交,然后创建 Pull Request

代码、注释、文档、提交信息均使用英文撰写。GitHub 上的 Issue / PR / 评审评论也以英文为标准。
