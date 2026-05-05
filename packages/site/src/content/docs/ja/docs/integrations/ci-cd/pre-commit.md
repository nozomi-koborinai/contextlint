---
title: pre-commit / ローカルフック
description: Husky / lint-staged / pre-commit framework から contextlint を呼び出すローカルフック設定。
---

ローカルの git フックから contextlint を呼ぶと、違反を含んだコミットがそもそもリポジトリに入らなくなります。CI で違反を検出する前に、コミットの瞬間にローカルでフィードバックを返せます。代表的な 3 つの方法を扱います。

## 速度の前提

contextlint は数秒で完了するため、`pre-commit` 段階で走らせても体感に影響しません。ただしファイル数が多いリポジトリでは、変更ファイルだけに絞ったり、cross-file ルールを含む完全な lint は CI に任せたりするなど、目的に合わせて構成を選ぶと良いでしょう。

## Husky

[Husky](https://typicode.github.io/husky/) は最も広く使われている npm エコシステムの git フック管理ツールです。

`package.json` に Husky をインストールしたあと、`.husky/pre-commit` を作成します。

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx contextlint
```

このまま使うとコミットごとにリポジトリ全体を lint します。変更されたファイルだけに絞りたい場合は次の lint-staged と組み合わせてください。

## lint-staged

[lint-staged](https://github.com/lint-staged/lint-staged) を使うと、git stage 済みのファイルだけに lint を走らせることができます。

`package.json` に設定を追加します。

```json
{
  "lint-staged": {
    "*.md": "contextlint"
  }
}
```

`.husky/pre-commit` から `npx lint-staged` を呼びます。

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

ただし contextlint の REF-001、REF-002、TBL-006、GRP-\* のような **cross-file ルール** はリポジトリ全体を見ないと判定できないため、stage 済みファイルだけに渡すと誤検知（または検知漏れ）が起きる可能性があります。lint-staged 経由で走らせる場合は、cross-file ルールに依存しない構成にするか、CI に最終チェックを任せる前提で使うのが安全です。

## pre-commit framework

[pre-commit](https://pre-commit.com/) は Python ベースの汎用フックフレームワークで、複数の言語をまたいで使えます。`.pre-commit-config.yaml` にローカルフックとして登録します。

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

`pass_filenames: false` を指定するのは、contextlint がリポジトリ全体に対して走ることを前提にしているためです。CLI 引数でファイルを限定したい場合は `pass_filenames: true` に変えて、変更ファイルだけ渡すこともできます。ただし lint-staged と同様、cross-file ルールでは検知が変わる可能性に注意してください。

## どの方法を選ぶか

| 観点 | Husky | Husky + lint-staged | pre-commit framework |
| --- | --- | --- | --- |
| インストール | npm のみ | npm のみ | Python のみ |
| 変更ファイルに絞る | 不可 | 可能 | 可能 |
| 多言語プロジェクト | npm エコシステムに依存 | npm エコシステムに依存 | 言語を横断しやすい |
| cross-file ルールの正確性 | 完全 | 限定的 | 限定的 |

cross-file ルールを正しく評価したい場合はリポジトリ全体に対して走らせる必要があるため、ローカルフックでは絞らず、CI で完全な lint を行う構成が無難です。

## CI との組み合わせ

ローカルフックは「コミット時の早期発見」、CI は「マージ前の最終チェック」と役割が分かれます。両方を有効にしておくと、

- ローカルでミスったコミットを即座に検出
- フックを skip された場合でも CI でブロック

の二段構えになります。CI の組み込み方は [GitHub Actions](/ja/docs/integrations/ci-cd/github-actions/) を参照してください。
