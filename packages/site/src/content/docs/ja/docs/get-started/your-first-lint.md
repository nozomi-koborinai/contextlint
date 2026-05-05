---
title: はじめての lint 実行
description: contextlint の出力の読み方と、よくある違反パターン。
---

セットアップが完了したら、実際に lint を実行してみましょう。

## 実行

```bash
npx contextlint
```

`contextlint.config.json` の `include` に書かれた glob パターンに該当するすべての Markdown ファイルが検証されます。

## 出力の読み方

違反がある場合、次のような形式で表示されます。

```text
docs/requirements.md
  line 12  error    Link target "./api.md" does not exist  REF-001
  line 24  warning  Empty cell in column "Status"          TBL-002

docs/architecture.md
  line 5   error    Required section "Decision" is missing  SEC-001

2 errors, 1 warning in 2 files
```

各違反は次の項目で構成されます。

- **ファイルパス** — 違反が見つかったファイル
- **line** — 違反箇所の行番号
- **error / warning** — 重要度
- **メッセージ** — 何が問題か
- **ルール ID** — どのルールに該当するか（[Rules](/ja/docs/rules/) で詳細を参照）

違反がない場合は次のように表示されます。

```text
No issues found.
```

CI で実行する場合、この状態であれば exit code 0 で正常終了します。違反があれば exit code 1 で終了するため、PR のゲートとして利用できます。

## よくある違反パターン

### REF-001 — リンク切れ

ファイルへのリンクや、ファイル内のアンカー（`#section-name`）が解決できないときに発生します。

- 参照先のファイルがリネーム / 移動された
- アンカーリンクの参照先のセクションが削除・改名された
- 相対パスが間違っている

### SEC-001 — 必須セクションの欠落

設定ファイルで必須としたセクションが、対象ファイル内に存在しないときに発生します。

- ADR テンプレートに `Context / Decision / Consequences` を必須としているが、新規 ADR で 1 つ抜けている
- 仕様書テンプレートに `概要 / API / 例` を必須としているが、概要だけで終わっている

### TBL-002 — テーブルの空セル

設定で「空であってはならない」 と指定したカラムにセルが空のときに発生します。

- 要件テーブルで `Status` カラムが空のまま行が追加された

その他のルールについては [Rules](/ja/docs/rules/) を参照してください。21 個のルールがあり、それぞれ何を検出するか・どう設定するかが個別に解説されています。

## 違反を修正する

`contextlint-fix` Skill を使うと、AI が違反を一括で修正候補とともに提案します。Skill のインストールは [Quick Start — AI 連携](/ja/docs/get-started/quick-start-ai/) を参照してください。

手動で修正する場合は、出力に表示されたファイルパスと行番号を頼りに該当箇所を直してください。

## 次のステップ

- [Configuration](/ja/docs/configuration/) — `contextlint.config.json` の詳細
- [Rules](/ja/docs/rules/) — 21 個のルールの個別リファレンス
- [Integrations](/ja/docs/integrations/) — エディタ・CI・AI 連携の各種設定
