---
title: Concepts
description: contextlint の設計思想と概念モデル。
---

contextlint がなぜ存在するのか、なぜ静的解析を選んだのか、なぜ 3 層のフィードバックに分けたのか。このカテゴリでは、ツールの背景にある **設計思想と概念** を解説します。

[Get Started](/ja/docs/get-started/) ではツールの使い方を、[Configuration](/ja/docs/configuration/) や [Rules](/ja/docs/rules/) ではルールの仕様を扱います。Concepts は **「なぜそうなっているのか」** に集中します。

## このカテゴリの構成

- [なぜ contextlint が存在するか](/ja/docs/concepts/why-contextlint-exists/) — AI 時代の Markdown ドキュメントが抱える整合性問題と、それに対する contextlint の立ち位置
- [意味的リンターと構文リンター](/ja/docs/concepts/semantic-vs-syntax/) — semantic linter とは何か、markdownlint との対比
- [3 層フィードバックの設計](/ja/docs/concepts/three-layer-feedback/) — LSP / MCP / CI を 3 層に分けた理由
- [Context Graph](/ja/docs/concepts/context-graph/) — ドキュメント依存グラフを基盤に据えた理由
