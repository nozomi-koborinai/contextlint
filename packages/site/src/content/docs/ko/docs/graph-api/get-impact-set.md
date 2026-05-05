---
title: getImpactSet
description: 어떤 파일의 변경으로 영향받는 파일 목록을 조회한다.
---

## 개요

지정한 파일을 참조하고 있는 파일을, 직접 참조와 간접 참조 양쪽에 걸쳐 조회합니다. 그래프의 역방향 변을 따라가는 BFS이며, 변경 대상 파일 자신은 결과에서 제외됩니다.

## 왜 필요한가

문서를 변경·삭제하기 전에, 그것이 다른 어떤 문서에 영향을 미치는지 파악하고자 하는 상황이 있습니다. `getImpactSet`은 "이 파일을 변경하면, 어디를 다시 봐야 하는지" 를 평탄한 목록으로 반환합니다.

직접 참조와 간접 참조를 구별하고자 하실 경우에는 [`classifyImpact`](/ko/docs/graph-api/classify-impact/)를 사용해 주십시오.

## 시그니처

```typescript
function getImpactSet(
  graph: ContextGraph,
  filePath: string,
): string[];
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |
| `filePath` | `string` | ✓ | 영향 범위를 조사하고자 하는 파일의 경로. `graph.nodes`의 키와 일치해야 합니다 |

## 반환값

`string[]`을 반환합니다. `filePath`를 직접 또는 간접적으로 참조하고 있는 파일 경로의 배열로, 알파벳 순서로 정렬됩니다. `filePath` 자신은 포함되지 않습니다. 그래프 상에 해당 파일이 존재하지 않거나, 누구도 참조하고 있지 않은 경우에는 빈 배열을 반환합니다.

## 사용 예시

```typescript
import { buildContextGraph, getImpactSet, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const affected = getImpactSet(graph, "docs/architecture.md");

if (affected.length === 0) {
  console.log("영향받는 파일은 없습니다");
} else {
  console.log(`${affected.length} 파일이 영향을 받습니다:`);
  for (const file of affected) {
    console.log(`  - ${file}`);
  }
}
```

## 관련 함수

- [`classifyImpact`](/ko/docs/graph-api/classify-impact/) — 직접적·간접적으로 분류해서 반환하는 버전
- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`getContextSlice`](/ko/docs/graph-api/get-context-slice/) — 역방향 (어떤 파일이 참조하는 측)을 따라가는 버전
