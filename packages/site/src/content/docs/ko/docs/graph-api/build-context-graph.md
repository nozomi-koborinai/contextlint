---
title: buildContextGraph
description: 파싱된 문서로부터 의존 관계 그래프를 구축한다.
---

## 개요

파싱된 문서의 Map으로부터, 문서 간의 의존 관계를 나타내는 그래프를 구축합니다. 각 문서의 상대 링크와 이미지 참조를 변(edge)으로 수집하고, 노드(node)에는 입차수와 출차수를 부여합니다.

## 왜 필요한가

Graph API의 다른 함수(`getImpactSet`, `topologicalSort`, `classifyImpact` 등)는 모두, 이 함수가 반환하는 `ContextGraph`를 입력으로 받습니다. 그래프 조작의 출발점이 되는 함수입니다.

변은 소스 파일의 상대 링크에서 해결되며, 해결된 대상이 `documents` Map에 존재하는 경우에만 추가됩니다. 앵커 프래그먼트(`#section`)는 제거되고, 자기 참조는 무시됩니다. 출력은 결정론적이며, 노드·변 모두 파일 경로로 정렬됩니다.

## 시그니처

```typescript
function buildContextGraph(
  documents: Map<string, ParsedDocument>,
): ContextGraph;
```

관련 타입은 다음과 같습니다.

```typescript
interface GraphNode {
  filePath: string;
  inDegree: number;
  outDegree: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "link" | "image";
  line: number;
}

interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## 인수

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `documents` | `Map<string, ParsedDocument>` | ✓ | 파일 경로를 키, `parseDocument`의 결과를 값으로 하는 Map. 키는 상대 경로든 절대 경로든 무방하지만, `lintFiles`와 마찬가지로 상대 경로를 권장합니다 |

## 반환값

`ContextGraph`를 반환합니다.

- `nodes` — 각 파일 경로와 그 입차수·출차수. 파일 경로로 정렬됨
- `edges` — `source`로부터 `target`으로의 유향 변. `type`은 링크인지 이미지 참조인지를 나타냅니다. 소스·타깃·행 번호로 정렬됨

## 사용 예시

```typescript
import { loadDocuments } from "@contextlint/core";
import { buildContextGraph } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(`${graph.nodes.length} 파일, ${graph.edges.length} 변`);

for (const edge of graph.edges) {
  console.log(`${edge.source} → ${edge.target} (${edge.type}, line ${edge.line})`);
}
```

## 관련 함수

- [`getImpactSet`](/ko/docs/graph-api/get-impact-set/) — 그래프를 사용하여 영향 범위를 조회
- [`topologicalSort`](/ko/docs/graph-api/topological-sort/) — 그래프를 의존 순서대로 정렬
- [`formatContextGraphSummary`](/ko/docs/graph-api/format-context-graph-summary/) — 그래프 요약을 정렬
