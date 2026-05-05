---
title: getContextSlice
description: 쿼리에 관련된 최소 문서 집합을 추출한다.
---

## 개요

파일 경로 또는 ID를 쿼리로 받아, 그것에 관련된 문서의 최소 집합을 BFS로 추출합니다. 출력 변을 따라가는 방향(어떤 파일이 참조하고 있는 문서 측)으로 전개하여, 깊이 상한까지 확장합니다.

## 왜 필요한가

AI 에이전트나 사람이 특정 토픽을 다룰 때, 리포지터리 전체가 아니라 **관련된 문서만** 을 전달하고자 하는 경우가 있습니다. `getContextSlice`는 쿼리의 근방을 잘라내는 것으로, 컨텍스트 윈도우나 읽는 사람의 인지 부하를 억제합니다.

쿼리 해석은 다음 2가지 방식입니다.

- 쿼리가 그래프 상의 파일 경로와 일치하는 경우 — 해당 파일을 기점으로 출력 변을 따라간다
- 일치하지 않는 경우 — 테이블 셀 값으로 모든 문서를 주사하여, 일치한 파일 모두를 기점으로 한다

## 시그니처

```typescript
function getContextSlice(
  graph: ContextGraph,
  documents: Map<string, ParsedDocument>,
  query: string,
  maxDepth?: number,
): string[];
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |
| `documents` | `Map<string, ParsedDocument>` | ✓ | 그래프 구축 시와 동일한 문서 Map. ID 쿼리로 테이블 주사를 하기 위해 필요 |
| `query` | `string` | ✓ | 파일 경로 또는 ID 문자열 |
| `maxDepth` | `number` | — | BFS의 최대 깊이. 기본값 `2` |

## 반환값

`string[]`을 반환합니다. 쿼리의 기점 파일과 거기서 `maxDepth` 스텝 이내에 도달할 수 있는 파일의 배열로, 알파벳 순서로 정렬됩니다. 쿼리에 일치하는 파일을 찾지 못한 경우에는 빈 배열을 반환합니다.

## 사용 예시

```typescript
import { buildContextGraph, getContextSlice, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

// 파일 경로로 잘라낸다
const slice = getContextSlice(graph, documents, "docs/specs/auth.md");
console.log(slice);

// ID로 잘라낸다 (테이블 셀에서 검색)
const reqSlice = getContextSlice(graph, documents, "REQ-AUTH-01", 3);
console.log(reqSlice);
```

## 관련 함수

- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`getImpactSet`](/ko/docs/graph-api/get-impact-set/) — 역방향 (참조되고 있는 측)을 따라가는 버전
- [`getComponents`](/ko/docs/graph-api/get-components/) — 연결 컴포넌트 단위로 클러스터를 조회
