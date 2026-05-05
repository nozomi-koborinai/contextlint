---
title: topologicalSort
description: 문서를 의존 순서대로 정렬한다.
---

## 개요

Kahn의 알고리즘으로 문서 그래프를 위상 정렬합니다. 의존 대상이 없는 파일(입차수 0)부터 먼저 정렬되며, 참조를 받고 있는 파일이 후속에 위치합니다.

## 왜 필요한가

문서를 처리하는 순서가 의존 관계를 따라야 하는 상황에 사용합니다. 예를 들면 용어집 → 사양 → ADR 순으로 읽고 싶다, 빌드 순서를 결정하고 싶다, 마이그레이션 가이드를 상류부터 정렬하고 싶다, 같은 사례입니다.

그래프에 순환 참조가 포함되는 경우, 순환에 속하는 노드는 결과에 포함되지 않습니다. 반환값의 길이가 노드 총수보다 짧으면 순환이 있다는 신호입니다 (→ 순환 검출은 [GRP-002](/ko/docs/rules/grp-002/) 규칙으로).

## 시그니처

```typescript
function topologicalSort(graph: ContextGraph): string[];
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |

## 반환값

`string[]`을 반환합니다. 의존 순서대로 정렬된 파일 경로의 배열이며, 입차수 0의 노드가 선두가 됩니다. 동일한 차수 내의 순서는 결정론적으로 알파벳 순서로 정렬됩니다. 순환에 속하는 노드는 생략됩니다.

## 사용 예시

```typescript
import { buildContextGraph, topologicalSort, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const ordered = topologicalSort(graph);

if (ordered.length < graph.nodes.length) {
  const missing = graph.nodes.length - ordered.length;
  console.warn(`${missing} 노드가 순환 참조에 포함되어 있습니다`);
}

for (const file of ordered) {
  console.log(file);
}
```

## 관련 함수

- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`getComponents`](/ko/docs/graph-api/get-components/) — 연결 컴포넌트별로 나눠서 다루고 싶은 경우
- [`getImpactSet`](/ko/docs/graph-api/get-impact-set/) — 특정 파일로부터의 영향 범위만 알고 싶은 경우
