---
title: 사양 주도 개발 리포지터리
description: 요구사항 → 사양 → 구현의 추적성과 안정도 관리를 강제하는 contextlint 설정 예시.
---

이 레시피는 요구사항・사양・설계를 SSOT (Single Source of Truth)로서 Markdown으로 관리하고, 거기에서 AI 또는 엔지니어가 코드를 생성하는 **사양 주도 개발 (SDD: Spec Driven Development)** 을 실천하는 리포지터리를 위한 설정 예시입니다.

요구사항 ID의 추적성, 안정도 라벨의 일관성, zone 단위의 책임 분계를 contextlint로 강제합니다.

## 어떤 프로젝트에 적합한가

- `docs/zones/<feature>/`와 같이 **책무 단위 (zone)로 문서를 분할**하고 있다
- 요구사항 테이블이 `ID` / `내용` / `안정도`와 같은 컬럼을 가지며, `REQ-AUTH-01`과 같은 ID로 식별한다
- 요구사항 ID가 사양・설계・테스트 문서에서 반복적으로 참조된다
- 요구사항은 `draft` → `review` → `stable`과 같은 라이프사이클로 관리한다
- AI 에이전트에게 문서를 편집시킬 기회가 있어, 참조 깨짐이 발생하기 쉽다

[contextlint 소개 글](https://www.koborin.ai/ja/tech/contextlint-introduction/)에서 설명하는 SDD의 계층 구조 (`foundation/` / `standards/` / `zones/`)를 전제로 하고 있지만, 더 단순한 `docs/specs/` 1계층 프로젝트에서도 ID와 zone의 glob을 조정하면 그대로 사용하실 수 있습니다.

## 권장 구성 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    {
      "rule": "tbl001",
      "options": {
        "files": "**/requirements.md",
        "requiredColumns": ["ID", "내용", "안정도"]
      }
    },
    {
      "rule": "tbl002",
      "options": {
        "files": "**/requirements.md",
        "columns": ["ID", "안정도"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/requirements.md",
        "column": "안정도",
        "values": ["draft", "review", "stable"]
      }
    },
    {
      "rule": "tbl004",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "pattern": "^REQ-[A-Z]+-\\d{2,3}$"
      }
    },
    {
      "rule": "tbl006",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "idPattern": "^REQ-"
      }
    },
    {
      "rule": "sec001",
      "options": {
        "files": "**/requirements.md",
        "sections": ["업무 가치", "요구사항"]
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md", "**/test_*.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-[A-Z]+-\\d+$"
      }
    },
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "안정도",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md"]
      }
    },
    {
      "rule": "ref004",
      "options": {
        "zonesDir": "docs/zones",
        "dependencySection": "외부 Zone 연계"
      }
    },
    { "rule": "grp002" },
    {
      "rule": "ctx001",
      "options": {
        "files": "**/zones/**/*.md"
      }
    },
    {
      "rule": "ctx002",
      "options": {
        "glossary": "docs/foundation/glossary.md",
        "termColumn": "용어",
        "aliasColumn": "별칭",
        "files": "docs/zones/**/*.md"
      }
    }
  ]
}
```

## 각 규칙을 선택한 이유

### TBL 계열 — 요구사항 테이블의 구조 보장

요구사항 테이블은 SDD의 핵심이므로, 구조가 깨지면 후속 규칙 (`ref002` / `ref003` / `grp001` 등)도 모두 의미를 잃습니다. 다음 순서로 「상자에서 내용물까지」를 보장합니다.

| 규칙 | 보장하는 내용 |
| --- | --- |
| [TBL-001 필수 컬럼](/ko/docs/rules/tbl-001/) | `ID` / `내용` / `안정도` 컬럼이 존재한다 |
| [TBL-002 빈 셀](/ko/docs/rules/tbl-002/) | `ID`와 `안정도` 셀이 비어 있지 않다 |
| [TBL-003 허용값](/ko/docs/rules/tbl-003/) | `안정도` 컬럼이 `draft` / `review` / `stable` 중 하나 |
| [TBL-004 셀 패턴](/ko/docs/rules/tbl-004/) | `ID`가 `REQ-AUTH-01`과 같은 명명 규칙을 따른다 |
| [TBL-006 파일 간 ID 고유성](/ko/docs/rules/tbl-006/) | 프로젝트 전체에서 요구사항 ID가 고유하다 |

`tbl004`의 `pattern`은 `^REQ-[A-Z]+-\\d{2,3}$`와 같이, zone 명 (대문자 영문자)을 포함한 구조를 강제합니다. zone 명을 포함하지 않는 평탄한 ID 체계 (`REQ-001`)를 사용하시는 경우에는, `pattern`을 `^REQ-\\d+$`로 변경해 주십시오.

### SEC-001 — 업무 가치와 요구사항 섹션의 존재

요구사항 문서는 「**왜** 이 요구사항이 있는가」(업무 가치)와 「**무엇을** 실현하는가」(요구사항 본체) 양쪽이 갖추어져 있어야 이해관계자에 대한 설명 가능성이 담보됩니다. `업무 가치`만 작성하고 요구사항 테이블을 잊거나, 그 반대도 발생할 수 있으므로, 기계적으로 강제합니다.

[SEC-001 필수 섹션](/ko/docs/rules/sec-001/)을 `**/requirements.md`로 좁혀서 적용하고 있습니다.

### REF-002 — 요구사항 ID의 크로스 파일 추적성

요구사항 ID가 사양・설계・테스트로부터 참조되지 않는 채로 남아 있으면, 그 요구사항은 구현까지 도달하지 못한 가능성이 있습니다. 반대로, 정의되지 않은 ID가 사양서에서 참조되고 있다면, 그것은 복사・붙여넣기 실수이거나 오래된 ID의 잔존입니다. 양방향의 추적성을 하나의 규칙으로 검증합니다.

[REF-002 ID의 정의와 참조](/ko/docs/rules/ref-002/)는 **프로젝트 스코프** 규칙으로, `include` 대상 모든 문서에서 ID를 추출합니다. `references`에서 `spec_*.md` / `design_*.md` / `test_*.md`를 열거하고, 각각이 정의 측의 요구사항 ID를 참조하고 있는지 확인합니다.

`idPattern`에는 zone 명을 포함한 엄격한 버전 (`^REQ-[A-Z]+-\\d+$`)을 지정하여, 헤더 행의 샘플이나 `REQ-`로 시작하는 설명 텍스트를 잘못 ID로 인식하지 않도록 합니다.

### REF-003 — 안정도의 정합성

`stable`인 사양서가 `draft`인 요구사항을 참조하고 있다는 상태는 「요구사항이 확정되지 않았는데 사양이 확정되어 있다」는 모순을 의미합니다. 데모나 이해관계자 리뷰에서 요구사항이 변경되었을 때, 그 영향이 사양에 어디까지 파급되는지를 파악하기 위해서도, 안정도의 방향성을 지키는 가치가 있습니다.

[REF-003 안정도의 정합성](/ko/docs/rules/ref-003/)은 요구사항의 안정도를 사양 측 행 (이 가지는 안정도)과 비교하여, `stable` → `draft`와 같은 부정합을 warning으로 보고합니다.

### REF-004 — Zone 간 의존의 명시화

zone은 책임 분계의 단위이므로, `auth` zone에서 `payment` zone으로의 의존이 있다면 「`auth`는 `payment`에 의존한다」는 설계 의도가 명확해질 필요가 있습니다. 구현상으로는 zone을 가로지르는 링크를 물리적으로 작성하는 것 자체는 가능하므로, 그 의도가 `overview.md`에 선언되어 있는지를 검증합니다.

[REF-004 zone 의존](/ko/docs/rules/ref-004/)은 각 zone의 `overview.md`의 `외부 Zone 연계` 섹션을 의존 선언으로 읽어 들입니다. `dependencySection`의 기본값은 `Dependencies`이지만, 한국어 문서이기 때문에 명시적으로 `외부 Zone 연계`를 지정하고 있습니다.

### GRP-002 — 그래프 전체의 순환 방지

요구사항 → 사양 → 설계 → 테스트의 방향으로 참조가 확장되는 구조를 전제로 하고 있으므로, 참조 그래프는 DAG여야 합니다. zone을 가로지르는 순환 참조나, 요구사항과 사양이 양방향으로 링크되는 패턴을 조기에 검출합니다.

[GRP-002 순환 참조](/ko/docs/rules/grp-002/)를 채택하고 있습니다. GRP-001 (추적성 체인)은 요구사항 → 사양 → 테스트의 단계 구조를 ID 단위로 검증하는 강력한 규칙이지만, zone과 단계의 조합이 많아지면 `chain` 구성이 비대해지므로, 우선은 GRP-002로 순환의 유무만 보장하고, 필요에 따라 단계를 추가하시는 것을 권장합니다.

### REF-001 / REF-005 — 링크와 앵커의 보호

zone을 가로지르는 Markdown 링크, 용어집 (foundation)으로의 상속 링크, 사양서에서 요구사항서로의 참조 링크 등, SDD의 정합성은 무수한 링크에 의해 지탱됩니다. 파일 존재 (REF-001)와 앵커 (REF-005) 양쪽을 보장합니다.

### CTX-001 — 플레이스홀더 검출 (zone 이하로 한정)

zone 내 사양서에서 `TBD`나 `TODO`를 남긴 채 `안정도: stable`이 되는 일이 없도록, `docs/zones/**/*.md`로 좁혀서 플레이스홀더를 검출합니다. `foundation/`이나 `standards/`의 문서에는 적용하지 않습니다 (이들은 초기 구축 단계에서 TBD를 포함할 수 있기 때문).

[CTX-001 플레이스홀더 검출](/ko/docs/rules/ctx-001/)을 `files: "**/zones/**/*.md"`로 좁히고 있습니다.

### CTX-002 — 용어집과의 일관성

SDD에서는 `foundation/glossary.md`를 「유비쿼터스 언어」로서 운영하므로, 각 zone의 문서가 용어집의 정식 표기를 사용하고 있는지를 검증합니다. AI가 생성한 초안에는 별칭 (alias)이 섞이기 쉬우므로, 결정론적인 검출이 효과적입니다.

[CTX-002 용어 일관성](/ko/docs/rules/ctx-002/)은 glossary.md의 `용어` 컬럼을 정식 표기, `별칭` 컬럼을 alias로 참조합니다. glossary.md는 다음과 같은 구성을 상정하고 있습니다.

```markdown
# 용어집

## 용어

| 용어     | 별칭         |
| -------- | ------------ |
| 데이터베이스 | DB, database |
| 요구사항     | requirement  |
```

### 이 레시피에서 채택하지 않은 규칙

| 규칙 | 채택하지 않는 이유 |
| --- | --- |
| SEC-002 | requirements.md는 순서 고정의 필요성이 약한 케이스가 많다 (템플릿성이 강하면 추가해도 무방) |
| TBL-005 | TBL-003 / TBL-004로 안정도와 ID는 충분히 제약 가능. `안정도=stable`일 때 승인자 컬럼을 필수로 하는 등의 운영이 있다면 추가 |
| GRP-001 / GRP-003 | zone과 단계가 많아지면 `chain` 설정이 비대해진다. 프로젝트가 안정된 후에 추가 |
| STR-001 | `docs/foundation/glossary.md` 등의 필수화는 CTX-002의 `glossary` 지정으로 실질적으로 강제됨 |

## 운영상의 주의점

### 기존 리포지터리에 도입

SDD 문서가 다수 존재하는 상태에서 이 레시피를 통째로 적용하시면, 요구사항 ID 패턴 위반이나 zone 의존 선언 누락으로 위반이 대량 발생합니다. 다음 순서로 단계적으로 도입하시는 것이 현실적입니다.

1. **TBL-001 / TBL-002 / TBL-003 / TBL-004** — 요구사항 테이블의 구조를 가장 먼저 다지기
2. **TBL-006** — ID 중복 해소
3. **REF-001 / REF-005** — 링크와 앵커 복구
4. **REF-002** — 추적성 위반 정리 (warning은 단계적으로 해소)
5. **REF-003 / REF-004 / GRP-002** — 구조적 정합성
6. **CTX-001 / CTX-002** — 문맥 품질 마무리

각 단계에서 커밋을 분리하시면, 리뷰와 되돌림이 수월해집니다. warning을 한 번에 없애려 하지 마시고, 우선은 error만 0건으로 만드는 운영을 권장합니다.

### AI 에이전트와의 연계

AI 에이전트에게 문서 편집을 맡기시는 경우, 편집 후에 MCP 경유로 `lint-files`를 실행시키거나, Claude Code Hooks로 `npx contextlint`를 자동 실행시키시면, AI 자체가 위반을 검출하여 수정할 수 있습니다. 자세한 내용은 [AI Agents 통합](/ko/docs/integrations/ai-agents/)을 참고해 주십시오.

### CI에서의 게이트

요구사항・사양 변경은 PR 기반으로 진행하는 것이 일반적이므로, `pull_request` 트리거에 `docs/**`를 경로 필터로 지정하시면 효율적입니다. 구체적인 워크플로 예시는 [CI 연동 패턴](/ko/docs/recipes/ci-integration-patterns/)을 참고해 주십시오.

### chain 검증의 추가 (GRP-001)

요구사항 → 사양 → 테스트 계획과 같은 명확한 단계 구조가 있고, 각 단계의 망라성을 강제하시려는 경우 GRP-001을 추가하실 수 있습니다. 그 경우의 `chain` 설정 예시는 [GRP-001 추적성 체인](/ko/docs/rules/grp-001/) 페이지를 참고해 주십시오.
