---
title: watch モード
description: --watch でファイル変更を検知して自動的に再 lint する。
---

`--watch` フラグを付けると、contextlint は初回の lint を実行したあと、ワーキングディレクトリ内の `.md` ファイルの変更を監視し続けます。エディタを開きながら違反をリアルタイムに確認したいときに使います。

## 起動

```bash
# include パターンに従って watch
npx contextlint --watch

# 特定の glob を watch
npx contextlint --watch "docs/**/*.md"

# 設定ファイルを明示
npx contextlint --watch --config contextlint.config.json
```

`Ctrl+C` で終了します。

## 挙動

watch モードの基本的な流れは次のとおりです。

1. 起動時にターミナルをクリアし、初回の完全な lint を実行
2. ワーキングディレクトリ配下の `.md` ファイル変更を監視
3. 変更を検知したら、マッチするすべてのファイルを再 lint
4. ターミナルをクリアし、タイムスタンプ付きで最新結果を表示

連続する変更は **300 ミリ秒のデバウンス** がかかります。短時間に複数のファイルを保存しても、最後の変更から 300ms 後に 1 度だけ再 lint が走ります。

### なぜ全ファイルを再 lint するのか

変更があったファイルだけを lint しても、REF-002（ID 参照の整合性）や TBL-006（ファイル間の ID 一意性）のような **クロスファイルルール** には不十分です。1 ファイルの変更が他ファイルの違反を生む / 解消することがあるため、対象セット全体に対して再実行します。

## 使いどころ

| 場面 | 推奨 |
| --- | --- |
| エディタで Markdown を編集中 | エディタが LSP に対応していれば [Editors (LSP)](/ja/docs/integrations/editors/) の方が即時性が高い |
| LSP 非対応のエディタを使っている | watch モードがフォールバック手段として有効 |
| AI に大量のドキュメントを生成させて結果を確認したい | watch を有効にしておくと、AI の出力直後に自動で再 lint される |
| CI 環境 | watch は使わない。1 回限りの実行（exit code）で結果を判定する |

## ターミナル出力

変更検知時のヘッダーに、タイムスタンプと変更ファイル名が表示されます。

```text
[14:32:15] File changed: docs/requirements.md

docs/requirements.md
  line 12  error  Required column "Status" not found in table  TBL-001

1 error in 1 files
```

watch モードでは常に human 形式で表示されます（`--format json` との併用は想定していません）。
