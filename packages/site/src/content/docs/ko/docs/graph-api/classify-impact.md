---
title: classifyImpact
description: 영향 범위를 직접적·간접적으로 분류한다.
---

## 개요

지정한 파일의 변경으로 영향받는 파일을, **직접 참조** (1 홉)와 **간접 참조** (2 홉 이상)로 분류해서 반환합니다. 직접 참조에는 참조 횟수도 부여됩니다.

## 왜 필요한가

[`getImpactSet`](/ko/docs/graph-api/get-impact-set/)은 평탄한 목록을 반환하기 때문에, "직접 다시 봐야 하는 파일" 과 "혹시 모르니 확인해야 할 파일" 을 구별할 수 없습니다. `classifyImpact`는 영향을 2단계로 나누고, 간접 참조에는 경유한 직접 파일(`via`)도 부여하기 때문에, 리뷰 우선순위나 경로의 가시화에 사용할 수 있습니다.

MCP의 `impact-analysis` 도구는 이 함수의 결과를 그대로 정렬해서 반환하고 있습니다.

## 시그니처

```typescript
function classifyImpact(
  graph: ContextGraph,
  filePath: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
};
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `graph` | `ContextGraph` | ✓ | `buildContextGraph`로 구축한 그래프 |
| `filePath` | `string` | ✓ | 영향 범위를 조사하고자 하는 파일의 경로 |

## 반환값

객체를 반환합니다.

- `directlyAffected` — `filePath`를 직접 참조하고 있는 파일. `references`는 동일 소스 내의 참조 횟수 (동일한 파일을 여러 곳에서 링크하고 있는 경우의 합계). 파일 경로 순서로 정렬
- `transitivelyAffected` — 직접은 아니지만, 간접적으로 도달하는 파일. `via`는 경로 상에서 가장 가까운 "직접 영향을 받은 파일". 파일 경로 순서로 정렬

## 사용 예시

```typescript
import { buildContextGraph, classifyImpact, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const impact = classifyImpact(graph, "docs/architecture.md");

console.log(`직접 영향: ${impact.directlyAffected.length} 건`);
for (const item of impact.directlyAffected) {
  console.log(`  - ${item.file} (${item.references} 참조)`);
}

console.log(`간접 영향: ${impact.transitivelyAffected.length} 건`);
for (const item of impact.transitivelyAffected) {
  console.log(`  - ${item.file} (경유: ${item.via})`);
}
```

## 관련 함수

- [`getImpactSet`](/ko/docs/graph-api/get-impact-set/) — 분류 없이 평탄한 목록을 반환하는 버전
- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 입력이 되는 그래프를 구축
- [`formatContextGraphSummary`](/ko/docs/graph-api/format-context-graph-summary/) — 그래프 전체의 요약
