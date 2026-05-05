---
title: Recipes
description: 代表的なドキュメント運用パターンごとの contextlint 設定例。
---

Recipes カテゴリでは、よくあるドキュメント運用パターンに対して **そのまま使える `contextlint.config.json`** と、その設定を選んだ意図をまとめます。

[Configuration](/ja/docs/configuration/) が個別フィールドの仕様、[Rules](/ja/docs/rules/) が各ルールの仕様を扱うのに対し、Recipes は **複数のルールをどう組み合わせるか** に焦点を当てます。

## このカテゴリの構成

- [ADR スタイルのリポジトリ](/ja/docs/recipes/adr-style-repo-setup/) — Architecture Decision Records をテンプレート駆動で運用する設定
- [仕様駆動開発のリポジトリ](/ja/docs/recipes/spec-driven-development-setup/) — 要件 → 仕様 → 実装のトレーサビリティと安定度管理を含む設定
- [モノレポ](/ja/docs/recipes/monorepo-setup/) — 複数 package のドキュメントを 1 つの設定でまとめて検証
- [CI 連携パターン](/ja/docs/recipes/ci-integration-patterns/) — GitHub Actions / GitLab CI / pre-commit / PR ゲートでの実行例

## レシピの読み方

各レシピは次の構成になっています。

1. **どんなプロジェクトに向くか** — 想定する規模、テンプレートの有無、運用フェーズ
2. **推奨構成 (`contextlint.config.json`)** — そのままコピーして使える完全な設定
3. **各ルールを選んだ理由** — そのルールを採用した、または採用しなかった意図
4. **運用上の注意点** — 既存リポジトリへの導入手順、段階的移行、CI でのゲート方法

## 設定が決まらない場合

Rule カテゴリやテンプレートに迷う場合は、まず [`contextlint init`](/ja/docs/integrations/cli/commands/) で対話形式に基本設定を生成し、その上でレシピを参考に拡張するのが手早い導入手順です。
