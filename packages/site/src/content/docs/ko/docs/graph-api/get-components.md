---
title: getComponents
description: 연결 컴포넌트 (문서 클러스터)를 조회한다.
---

## 개요

그래프를 무향 그래프로 간주하여 연결 컴포넌트(connected components)를 추출합니다. BFS로 서로 도달 가능한 노드를 그룹화하여, 문서의 "클러스터" 를 반환합니다.

## 왜 필요한가

거대한 리포지터리에서도, 실제로는 문서군이 독립된 여러 클러스터로 나뉘어 있는 경우가 많이 있습니다. `getComponents`를 사용하시면, 어떤 문서군이 통합된 문맥을 이루고 있는지, 고립된 클러스터가 존재하는지를 파악하실 수 있습니다.

어디에서도 참조되지 않으며, 무엇도 참조하지 않는 고립 문서(요소 1개의 컴포넌트) 검출에도 유용합니다 (→ [GRP-003](/ko/docs/rules/grp-003/) 규칙으로 자동 검출 가능).

## 시그니처

```typescript
function getComponents(graph: ContextGraph): string[][];
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |

## 반환값

`string[][]`을 반환합니다. 각 컴포넌트는 파일 경로의 배열이며, 내부는 알파벳 순서로 정렬됩니다. 컴포넌트 자체도 선두 파일 경로로 결정론적으로 정렬됩니다.

## 사용 예시

```typescript
import { buildContextGraph, getComponents, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const components = getComponents(graph);

console.log(`${components.length} 개의 클러스터를 검출`);

for (const [index, component] of components.entries()) {
  console.log(`\n클러스터 ${index + 1}: ${component.length} 파일`);
  for (const file of component) {
    console.log(`  - ${file}`);
  }
}

// 고립 문서를 추출
const orphans = components.filter((c) => c.length === 1).flat();
console.log(`고립 문서: ${orphans.length} 건`);
```

## 관련 함수

- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`topologicalSort`](/ko/docs/graph-api/topological-sort/) — 의존 순서대로 정렬하는 버전 (유향)
- [`getContextSlice`](/ko/docs/graph-api/get-context-slice/) — 쿼리 기점으로 관련 문서를 조회
