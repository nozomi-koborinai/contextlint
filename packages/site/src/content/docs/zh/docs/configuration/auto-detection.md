---
title: 配置文件的自动检测
description: findConfig 的父目录遍历。
---

contextlint 在 CLI 执行时，会从当前目录向父目录方向自动检测 `contextlint.config.json`。无需每次都指定配置文件路径。

## 行为

1. 在执行 CLI 的目录（cwd）中查找 `contextlint.config.json`
2. 未找到时，向上一级父目录继续查找
3. 一直回溯到文件系统根目录（`/`）
4. 找到后将该位置视为「仓库根目录」

## monorepo 中的行为

bun workspace 或 pnpm workspace 等 monorepo 也是同样的行为。即使在各个 package 内执行，也会找到位于仓库顶层的 `contextlint.config.json`。

```text
my-monorepo/
├── contextlint.config.json    ← 放置在此处
├── packages/
│   ├── api/
│   │   └── docs/
│   │       └── README.md
│   └── web/
│       └── docs/
│           └── README.md
```

即使在 `packages/api/` 中执行 `npx contextlint`，加载的也是 `my-monorepo/contextlint.config.json`。glob 模式以放置配置文件的目录（本例中为 `my-monorepo/`）为起点进行解析。

## 未找到配置文件时

未找到配置文件时，contextlint 会以默认配置运行。由于没有任何规则，不会检测出任何问题，但执行本身不会报错。

如果在 CI 等环境中希望明确「配置文件必须存在」，最稳妥的做法是通过 `--config` 标志显式指定路径。

```bash
npx contextlint --config ./contextlint.config.json
```
