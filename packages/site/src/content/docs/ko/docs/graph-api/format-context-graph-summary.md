---
title: formatContextGraphSummary
description: 그래프의 사람이 읽기 쉬운 요약을 정렬한다.
---

## 개요

`ContextGraph`를 받아, 진입점(어디로부터도 참조되지 않는 노드)과 피참조 수가 많은 상위 노드를 정리한 여러 행의 문자열을 반환합니다.

## 왜 필요한가

그래프 전체를 살펴볼 때, 노드와 변의 원시 데이터만으로는 구조를 파악하기 어려운 상황이 있습니다. `formatContextGraphSummary`는 **어떤 파일이 기점이며, 어떤 파일에 참조가 집중되어 있는지** 를 한눈에 확인할 수 있는 형식으로 정렬합니다.

MCP의 `context-graph` 도구가 반환하는 요약도 이 함수의 출력을 그대로 사용하고 있습니다.

## 시그니처

```typescript
function formatContextGraphSummary(graph: ContextGraph): string;
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |

## 반환값

`string`을 반환합니다. 줄바꿈으로 구분된 다음 섹션을 포함합니다.

- 1행째 — 노드 수와 변 수의 요약
- `Entry points (no incoming refs)` — 입차수 0의 파일 목록
- `Most connected (by incoming refs)` — 입차수가 많은 상위 5 파일

## 사용 예시

```typescript
import { buildContextGraph, formatContextGraphSummary, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(formatContextGraphSummary(graph));
```

출력 예시:

```text
Document Graph: 12 files, 27 edges

Entry points (no incoming refs):
  - docs/index.md
  - docs/getting-started.md

Most connected (by incoming refs):
  - docs/glossary.md (8 in, 0 out)
  - docs/architecture.md (5 in, 3 out)
  - docs/api.md (3 in, 4 out)
```

## 관련 함수

- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`classifyImpact`](/ko/docs/graph-api/classify-impact/) — 특정 파일의 영향 범위를 상세하게 분류
- [`getComponents`](/ko/docs/graph-api/get-components/) — 클러스터 단위로 구조를 파악
