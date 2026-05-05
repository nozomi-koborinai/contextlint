---
title: Graph API
description: ドキュメント依存グラフをプログラムから操作するための API。
---

`@contextlint/core` は、解析済みドキュメントから依存グラフを構築し、影響範囲・関連ドキュメント・依存順序などを取得するための関数群を公開しています。Graph API はこれらを **プログラムから直接呼び出すための programmatic interface** です。

リンターとしての利用ではなく、ドキュメント間の関係をスクリプトやツールから扱いたい場合に使います。MCP の `context-graph` / `context-slice` / `impact-analysis` ツールも内部でこの API を呼んでいます（→ [AI Agents](/ja/docs/integrations/ai-agents/)）。

設計思想や Context Graph がなぜ存在するかは [Context Graph](/ja/docs/concepts/context-graph/) を参照してください。このカテゴリは **API の使い方** に集中します。

## このカテゴリの構成

- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 解析済みドキュメントから依存グラフを構築する
- [`getImpactSet`](/ja/docs/graph-api/get-impact-set/) — あるファイルの変更で影響を受けるファイル一覧を取得する
- [`getContextSlice`](/ja/docs/graph-api/get-context-slice/) — クエリに関連する最小限のドキュメント集合を抽出する
- [`topologicalSort`](/ja/docs/graph-api/topological-sort/) — 依存順にファイルを並べる
- [`getComponents`](/ja/docs/graph-api/get-components/) — 連結成分（ドキュメントのクラスタ）を取得する
- [`classifyImpact`](/ja/docs/graph-api/classify-impact/) — 影響範囲を直接的・推移的に分類する
- [`formatContextGraphSummary`](/ja/docs/graph-api/format-context-graph-summary/) — グラフの人間可読なサマリーを整形する
