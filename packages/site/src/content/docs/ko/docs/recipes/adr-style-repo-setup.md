---
title: ADR 스타일 리포지터리
description: Architecture Decision Records를 템플릿 기반으로 운영하기 위한 contextlint 설정 예시.
---

이 레시피는 소프트웨어 아키텍처의 결정 사항을 **ADR (Architecture Decision Records)** 로 Markdown에 남기는 리포지터리를 위한 설정 예시입니다. `Context / Decision / Consequences`와 같이 통일된 템플릿을 철저히 지키고, ADR 간의 상호 참조가 깨지지 않도록 유지하는 것을 목적으로 합니다.

## 어떤 프로젝트에 적합한가

- `decisions/` 또는 `docs/adr/`와 같은 디렉터리에 ADR을 모아 놓고 있다
- 각 ADR이 `## Context` / `## Decision` / `## Consequences`와 같은 공통 템플릿을 가진다
- ADR이 다른 ADR을 「보완하는 / 대체하는」 형태로 상호 참조한다
- ADR 파일 수가 늘어나서 템플릿 일탈이나 참조 끊어짐을 육안으로 추적할 수 없게 되어 가고 있다

새롭게 문서 정합성 검사를 도입하시려는 리포지터리의 경우, `include` 대상이 `decisions/` 이하에 한정되기 때문에 **부수적인 영향을 읽어 내기가 쉽다**는 것이 이 구성의 이점입니다.

## 권장 구성 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["decisions/**/*.md"],
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    },
    {
      "rule": "sec002",
      "options": {
        "files": "decisions/*.md",
        "order": ["Context", "Decision", "Consequences"],
        "level": 2
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "grp002" },
    {
      "rule": "tbl003",
      "options": {
        "column": "Status",
        "values": ["proposed", "accepted", "deprecated", "superseded"]
      }
    },
    { "rule": "ctx001" }
  ]
}
```

`include`를 `decisions/` 이하로 한정함으로써, README나 그 외의 운영 문서를 잘못 검출하지 않게 됩니다. `decisions/index.md`와 같은 목차 파일도 같은 계층에 배치하는 것을 상정하고 있습니다.

## 각 규칙을 선택한 이유

### SEC-001 / SEC-002 — 템플릿 강제

ADR의 템플릿은 「존재하는가 여부」뿐만 아니라 「어떤 순서로 나열되는가」가 독자의 인지 비용에 직결됩니다. `Decision` 앞에 `Consequences`가 와 버리면, 결론을 읽기 전에 영향만 먼저 제시되는 형태가 되어, 리뷰하기 어려운 문서가 됩니다.

- [SEC-001 필수 섹션](/ko/docs/rules/sec-001/)으로 `Context` / `Decision` / `Consequences`의 존재를 강제
- [SEC-002 섹션 순서](/ko/docs/rules/sec-002/)로 나열 순서를 강제 (`level: 2`로 `##` 제목으로 한정하여, 본문 중의 다른 레벨 제목은 무시)

`files: "decisions/*.md"`를 지정함으로써, `decisions/index.md`나 `decisions/template.md`와 같은 특수 파일만 제외하시려는 경우에는, 별도로 glob을 좁히거나 제외용 하위 디렉터리를 만드는 운영을 하시면 됩니다.

### REF-001 / REF-005 — 상호 참조 보호

ADR은 「ADR-005를 ADR-012가 대체한다」와 같이 서로 참조하는 구조가 되기 쉽습니다. 이름 변경이나 삭제로 링크가 깨져도 markdownlint는 검출하지 않기 때문에, 파일 단위와 앵커 단위 양쪽으로 검증합니다.

- [REF-001 링크 끊어짐](/ko/docs/rules/ref-001/) — 참조 대상 파일이 존재하는가
- [REF-005 앵커](/ko/docs/rules/ref-005/) — `#decision`과 같은 앵커 프래그먼트가 제목과 일치하는가

REF-005를 넣지 않는 구성도 많지만, ADR에서는 「`ADR-012#decision`을 읽어라」와 같은 깊은 링크가 빈번하게 등장하기 때문에 채택하고 있습니다.

### GRP-002 — supersede 관계의 순환 방지

「ADR-012가 ADR-005를 대체하고, 다시 ADR-018이 ADR-012를 대체한다」와 같은 연쇄는 건전하지만, 파일의 양방향 링크를 너무 많이 작성하면 결과적으로 A → B → A와 같은 **순환 참조**가 발생할 수 있습니다. 순환 참조는 GRP-001 (추적성 체인)이나 GRP-003 (고립 문서)을 무너뜨리는 원인이 되기도 하므로, 조기에 검출해 두는 가치가 있습니다.

- [GRP-002 순환 참조](/ko/docs/rules/grp-002/) — 링크 그래프가 DAG임을 보장

ADR은 시간 축에 따른 대체 관계를 가지므로, 본래는 DAG여야 합니다.

### TBL-003 — Status 값의 제약

ADR의 `Status` 컬럼이 `proposed` / `accepted` / `deprecated` / `superseded`의 4가지 값으로 운영되는 팀이 많습니다. 템플릿 상의 예시만 작성되어 있고 실제 규칙이 암묵적으로 운영되면, `approved` / `done` / `WIP`와 같은 독자적인 값이 시간이 지나면서 섞여 들어옵니다.

- [TBL-003 허용값](/ko/docs/rules/tbl-003/) — `Status` 컬럼의 값을 4개로 고정

이 레시피는 ADR이 「헤더 부분에 메타 정보 테이블을 가진다」는 구성 (`| Status | accepted |`와 같은 세로형 테이블이 아니라, `Status` 컬럼을 가진 가로형 테이블)을 전제로 하고 있습니다. 세로형 테이블을 사용하시는 경우에는 TBL-003을 제외하고, TBL-005로 「`Field`가 `Status`인 행은 `Value`가 허용 리스트에 포함된다」는 컬럼 간 제약으로 표현하실 수 있습니다.

### CTX-001 — TBD / TODO 검출

ADR은 의사 결정의 **기록**이지 작업 중의 초안이 아니므로, `TBD`나 `TODO`를 남긴 상태로 `accepted`가 되는 일은 없습니다. 본문에 미확정 부분이 남아 있지 않은지 기계적으로 검출합니다.

- [CTX-001 플레이스홀더 검출](/ko/docs/rules/ctx-001/) — `TBD` / `TODO` / `WIP` 등의 잔존 검출

「`proposed` 단계에서는 `TBD`를 허용하고 싶다」는 경우, `section` 옵션으로 대상 섹션을 좁히거나, `proposed` 파일만 별도 디렉터리 (`decisions/draft/`)에 두고 include에서 제외해 주십시오.

### 이 레시피에서 채택하지 않은 규칙

| 규칙 | 채택하지 않는 이유 |
| --- | --- |
| TBL-001 / TBL-002 / TBL-004 / TBL-006 | ADR은 본문 중심으로, ID 테이블의 구조 검증은 중요도가 낮기 때문 |
| REF-002 / REF-003 / GRP-001 | 요구사항 → 사양 → 구현의 체인을 관리하는 용도가 아니기 때문 |
| CTX-002 | 용어집 (glossary)을 가지지 않는 ADR 전용 리포지터리에서는 과잉 |
| REF-004 | ADR은 zone 분할을 하지 않는 경우가 많기 때문 |
| STR-001 | `decisions/index.md` 하나에 의존시키지 않고 README 중심으로 운영하는 팀이 많기 때문 |

CTX-002와 REF-004는, ADR과 사양서를 같은 리포지터리에서 운영하시는 경우에는 채택하시면 좋은 규칙입니다. 그 경우에는 [사양 주도 개발 리포지터리](/ko/docs/recipes/spec-driven-development-setup/) 레시피를 참고해 주십시오.

## 운영상의 주의점

### 기존 리포지터리에 도입

ADR이 이미 수십 건 있는 상태에서 이 레시피를 통째로 적용하시면, 첫 실행 시에 대량의 위반이 출력될 가능성이 있습니다. 다음 순서로 단계적으로 도입하시는 것이 현실적입니다.

1. **`ref001`만 활성화**하여, 우선 링크 끊어짐을 수정
2. **`sec001`을 `proposed`를 제외하고 단계적으로 적용** — 기존 ADR의 템플릿 일탈을 고치는 커밋을 1건 작성
3. **`sec002`를 추가** — 순서 교체만 수정
4. **`tbl003`을 추가** — Status 값의 정리
5. **`grp002` / `ctx001` / `ref005`를 추가** — 나머지 구조적 정합성

파일 단위로 제외하시고자 할 경우에는, `include`에서 `!decisions/legacy/**`와 같은 부정 패턴을 사용하시거나, 레거시 ADR을 `decisions/archive/`와 같은 별도 디렉터리로 옮겨 include에서 제외해 주십시오.

### CI에서의 게이트

ADR은 일반적으로 PR 기반으로 추가・편집되므로, `pull_request` 트리거에 `decisions/**` 경로 필터를 붙이시면 불필요한 실행을 피하실 수 있습니다. 구체적인 워크플로 예시는 [CI 연동 패턴](/ko/docs/recipes/ci-integration-patterns/)을 참고해 주십시오.

### 템플릿 파일 제외

`decisions/template.md`와 같은 서식 템플릿을 두실 경우, SEC-001 / SEC-002의 검사를 통과시키기 위해 실체가 없는 섹션 제목만 나열된 파일이 됩니다.

- 권장: `decisions/template.md`를 `decisions/_template.md`로 변경하고 `include`를 `decisions/[!_]*.md`로 변경
- 대안: 템플릿을 별도 디렉터리 (`docs/templates/`)로 이동

`include`의 glob은 picomatch이므로, 부정 문자 클래스 (`[!_]`)로 선두가 `_`인 파일을 제외할 수 있습니다. 자세한 내용은 [include 패턴](/ko/docs/configuration/include-patterns/)을 참고해 주십시오.
