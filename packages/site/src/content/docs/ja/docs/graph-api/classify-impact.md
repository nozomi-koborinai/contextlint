---
title: classifyImpact
description: 影響範囲を直接的・推移的に分類する。
---

## 概要

指定したファイルの変更で影響を受けるファイルを、**直接参照**（1 ホップ）と **推移的参照**（2 ホップ以上）に分類して返します。直接参照には参照回数も付与されます。

## なぜ必要か

[`getImpactSet`](/ja/docs/graph-api/get-impact-set/) はフラットなリストを返すため、「直接見直す必要があるファイル」と「念のため確認すべきファイル」を区別できません。`classifyImpact` は影響を 2 段階に分け、推移的参照には経由した直接ファイル（`via`）も付けるため、レビュー優先度や経路の可視化に使えます。

MCP の `impact-analysis` ツールはこの関数の結果をそのまま整形して返しています。

## シグネチャ

```typescript
function classifyImpact(
  graph: ContextGraph,
  filePath: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
};
```

## 引数

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph` で構築したグラフ |
| `filePath` | `string` | ✓ | 影響範囲を調べたいファイルのパス |

## 戻り値

オブジェクトを返します。

- `directlyAffected` — `filePath` を直接参照しているファイル。`references` は同一ソース内の参照回数（同じファイルを複数箇所からリンクしている場合の合計）。ファイルパス順にソート
- `transitivelyAffected` — 直接ではないが、間接的に到達するファイル。`via` は経路上で最も近い「直接影響を受けたファイル」。ファイルパス順にソート

## 使用例

```typescript
import { buildContextGraph, classifyImpact, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const impact = classifyImpact(graph, "docs/architecture.md");

console.log(`直接影響: ${impact.directlyAffected.length} 件`);
for (const item of impact.directlyAffected) {
  console.log(`  - ${item.file} (${item.references} 参照)`);
}

console.log(`推移的影響: ${impact.transitivelyAffected.length} 件`);
for (const item of impact.transitivelyAffected) {
  console.log(`  - ${item.file} (経由: ${item.via})`);
}
```

## 関連関数

- [`getImpactSet`](/ja/docs/graph-api/get-impact-set/) — 分類なしのフラットなリスト版
- [`buildContextGraph`](/ja/docs/graph-api/build-context-graph/) — 入力となるグラフを構築
- [`formatContextGraphSummary`](/ja/docs/graph-api/format-context-graph-summary/) — グラフ全体のサマリー
