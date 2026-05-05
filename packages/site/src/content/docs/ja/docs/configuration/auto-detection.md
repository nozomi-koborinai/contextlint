---
title: 設定ファイルの自動検出
description: findConfig による親ディレクトリの走査。
---

contextlint は CLI 実行時、現在のディレクトリから親ディレクトリへ向かって `contextlint.config.json` を自動検出します。設定ファイルのパスを毎回指定する必要はありません。

## 挙動

1. CLI を実行したディレクトリ（cwd）で `contextlint.config.json` を探す
2. 見つからなければ、1 つ上の親ディレクトリへ
3. ファイルシステムのルート（`/`）まで遡り続ける
4. 見つかったらその場所を「リポジトリルート」として扱う

## モノレポでの挙動

bun workspace や pnpm workspace のモノレポでも同じ挙動です。各 package 内で実行しても、リポジトリトップの `contextlint.config.json` が見つかります。

```text
my-monorepo/
├── contextlint.config.json    ← ここに置く
├── packages/
│   ├── api/
│   │   └── docs/
│   │       └── README.md
│   └── web/
│       └── docs/
│           └── README.md
```

`packages/api/` で `npx contextlint` を実行しても、`my-monorepo/contextlint.config.json` が読み込まれます。glob パターンは設定ファイルが置かれているディレクトリ（この例だと `my-monorepo/`）を起点に解釈されます。

## 設定ファイルが見つからない場合

設定ファイルが見つからなかった場合、contextlint はデフォルト設定で動作します。ルールがない状態なので何も検出しませんが、実行はエラーにはなりません。

CI などで「設定ファイルが必須」と明示したい場合は、`--config` フラグで明示的にパスを指定するのが確実です。

```bash
npx contextlint --config ./contextlint.config.json
```
