---
title: contextlint-impact Skill
description: Context Graph を使ってファイル変更や削除の影響範囲を直接・間接に分類する Skill の役割と挙動。
---

`contextlint-impact` は **ファイルの変更や削除がドキュメントグラフ全体にどう波及するか** を分析する Skill です。AI が「design.md 変更したら何壊れる？」「FR-101 削除して大丈夫？」のような依頼を受け取ったときに自動で起動します。

## なぜこの Skill があるか

ドキュメントが多くなるほど、1 ファイルへの変更は思わぬ場所に波及します。

- `grep` は **直接の言及** を見つけるが、**間接の参照連鎖** は捉えられない
- 100 ファイル規模になると、人間の頭の中で transitive な依存を辿ることは現実的でなくなる
- AI による一括編集は、影響範囲の認識なしに進むと参照壊れを doc グラフに散らばす

contextlint には `@contextlint/core` の Context Graph エンジンが内蔵されています。`contextlint-impact` はこのエンジンを「このファイル触ったら何が壊れる？」というシンプルな問いに翻訳して提供します。

## 起動条件

ユーザーが次のような依頼をしたときに起動します。Skill 名を明示する必要はありません。

- 「design.md 変更したら何壊れる？」「FR-101 削除して大丈夫？」
- 「依存関係知りたい」「この doc は他の何から参照されてる？」
- 「リファクタしたいけど影響範囲は？」

「contextlint」という名前が出てこない依頼でも、影響範囲・依存関係・削除安全性などの文脈で起動します。

## 挙動の流れ

### 1. セットアップの確認

`contextlint.config.json` の存在と、cross-file ルール（REF-001 / GRP-002）が有効かを確認します。これらが無効だとグラフが「ノードだけのフラットなリスト」になり、impact 分析が意味を持たないためです。

未セットアップの場合は [contextlint-init Skill](/ja/docs/integrations/ai-agents/skill-init/) を案内します。

### 2. ターゲットの特定

ユーザーの依頼にはファイルパスが含まれることもあれば、ID（`FR-101` など）が含まれることもあります。

| ユーザー入力 | ターゲット |
| --- | --- |
| `design.md` | ファイル `design.md` |
| `FR-101 削除して...` | ID `FR-101` → 定義先のファイルへ解決してから分析 |
| 「API の認証部分を refactor したい」 | 不明確 → ユーザーに「どのファイル？」を確認 |

ID 指定の場合、まず `grep -rn 'FR-101' . --include='*.md'` などで定義箇所のファイルを特定し、そのファイルを起点に impact 分析を行います。

### 3. impact 分析の実行

```sh
npx contextlint impact <target-file> --format json
```

JSON 出力にすることで、Skill が結果を構造的に処理できます。MCP が利用可能な環境では `impact-analysis` ツールを直接呼び、JSON パースを省略します。

### 4. 出力の解釈

JSON には以下が含まれます。

- **direct** — 対象ファイルを直接参照しているファイル
- **transitive** — 間接的に到達できるファイル（参照の連鎖）
- 影響範囲内に存在する **lint 違反** — 編集後に `contextlint-fix` を走らせる動機付けになる

出力が空の場合、対象ファイルが doc グラフ上の **orphan** である可能性があります。Skill は「グラフ上は孤立しているが、コード・ビルド設定・README からの参照までは保証しない」旨を伝えます。

### 5. 構造化サマリの提示

平坦なファイルリストではなく、direct / transitive / 注意点を分けて提示します。

```
Impact analysis for `design.md`:

DIRECT (5 files reference this directly):
  - requirements.md
  - overview.md
  - api/auth.md
  - api/users.md
  - testing.md

TRANSITIVE (12 more files affected indirectly):
  - architecture.md (via overview.md)
  - migrations/2026-01.md (via api/users.md)
  - ...

HIGHLIGHTS:
  - api/auth.md は 8 ファイルから参照されている hub → 波及リスク高
  - 影響範囲内で 3 件の lint 違反を検出（編集後に contextlint-fix を推奨）

RECOMMENDATIONS:
  - direct を先に更新し、transitive がまだ意味を持つかを確認する
  - cascade が大きいので、変更を複数 PR に分割することも検討
```

平坦なリストだと「どこから手を付けるか」が見えづらいため、「先に direct を更新する」のような優先順位付きの推奨をセットで返します。

### 6. 観察に応じた追加推奨

| 観察 | 推奨 |
| --- | --- |
| transitive が 10 件超 | PR を分割して review 可能な粒度に |
| 対象が hub（被参照が多い） | 後方互換のある変更（deprecate-then-remove）を提案 |
| 対象が orphan | コード・ビルド設定・README からの参照を確認してから削除 |
| 影響範囲内に lint 違反 | 編集後に `contextlint-fix` を実行 |
| 循環参照を検出 | `grp002` の有効化 → 循環解消を先に行うことを提案 |

## エッジケース

- **`contextlint.config.json` がない** — `contextlint-init` を案内し、impact 実行は行いません。
- **REF-001 / GRP-002 が未有効** — グラフが空に近くなるため警告し、有効化を提案します。
- **対象ファイルが存在しない** — タイポか既に削除済みかを確認するためユーザーに尋ねます。
- **対象が循環の一部** — 循環を解消してから impact を読まないと transitive が誤解を招く旨を伝えます。
- **影響範囲が 100 件超** — フラットリストではなくクラスタ別の tree 表示に切り替えます。`contextlint slice` でより狭い範囲に絞ることも提案できます。
- **MCP サーバー利用可能** — `impact-analysis` ツールを優先して JSON パースを省略します。

## 関連

- 影響範囲内の違反は [contextlint-fix Skill](/ja/docs/integrations/ai-agents/skill-fix/) で修正できます。
- Context Graph の概念と仕組みは [Concepts → Context Graph](/ja/docs/concepts/context-graph/) を参照してください。
- プログラマティックに同じ機能を呼び出したい場合は、`@contextlint/core` の Context Graph API（`buildContextGraph`、`classifyImpact` など）を直接利用できます。
