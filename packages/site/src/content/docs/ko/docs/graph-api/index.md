---
title: Graph API
description: 문서 의존 관계 그래프를 프로그래매틱하게 다루기 위한 API.
---

`@contextlint/core`는 파싱된 문서로부터 의존 관계 그래프를 구축하고, 영향 범위, 관련 문서, 의존 순서 등을 조회하기 위한 함수군을 공개하고 있습니다. Graph API는 이들을 **프로그래매틱하게 직접 호출하기 위한 programmatic interface** 입니다.

린터로서의 사용이 아니라, 문서 간의 관계를 스크립트나 도구에서 다루고자 할 때 사용합니다. MCP의 `context-graph` / `context-slice` / `impact-analysis` 도구도 내부적으로 이 API를 호출하고 있습니다 (→ [AI Agents](/ko/docs/integrations/ai-agents/)).

설계 사상이나 Context Graph가 왜 존재하는지에 대해서는 [Context Graph](/ko/docs/concepts/context-graph/)를 참조해 주십시오. 이 카테고리는 **API의 사용법** 에 집중합니다.

## 이 카테고리의 구성

- [`buildContextGraph`](/ko/docs/graph-api/build-context-graph/) — 파싱된 문서로부터 의존 관계 그래프를 구축
- [`getImpactSet`](/ko/docs/graph-api/get-impact-set/) — 어떤 파일의 변경으로 영향받는 파일 목록을 조회
- [`getContextSlice`](/ko/docs/graph-api/get-context-slice/) — 쿼리에 관련된 최소 문서 집합을 추출
- [`topologicalSort`](/ko/docs/graph-api/topological-sort/) — 의존 순서대로 파일을 정렬
- [`getComponents`](/ko/docs/graph-api/get-components/) — 연결 컴포넌트 (문서 클러스터)를 조회
- [`classifyImpact`](/ko/docs/graph-api/classify-impact/) — 영향 범위를 직접적·간접적으로 분류
- [`formatContextGraphSummary`](/ko/docs/graph-api/format-context-graph-summary/) — 그래프의 사람이 읽기 쉬운 요약을 정렬
