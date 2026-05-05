---
title: contextlint-fix Skill
description: 검출된 위반을 기계적 수정과 사람의 판단 경계를 의식하며 해결하는 Skill의 역할과 동작.
---

`contextlint-fix`는 contextlint가 검출한 위반을 **수정**하기 위한 Skill입니다. AI가 "lint 고쳐줘", "끊어진 링크 고쳐줘"와 같은 의뢰를 받았을 때 자동으로 시작됩니다.

## 왜 이 Skill이 있는가

문서의 정합성은 리팩터링, 파일명 변경, AI에 의한 일괄 편집 등을 계기로 조용히 무너집니다. CI에서 위반이 나와도 사람이 손으로 한 건씩 수정하는 것은 부담이 크고, 뒤로 미루기 쉽습니다.

`contextlint-fix`는 이 마찰을 없애지만, **의미가 있는 변경을 임의로 쓰지 않는다**는 설계를 엄수하고 있습니다. 수정은 다음 두 가지로 분류되며, 처리 방법이 달라집니다.

- **기계적 수정**(타이포, 제목 추가, 빈 셀 메우기 등) — 자동으로 적용
- **의미적 판단**(참조 삭제, 값의 날조, 체크리스트 완료 표시, 그래프 절단 등) — 반드시 사용자에게 확인

"AI가 조용히 의미를 바꿨다"는 사태를 일으키지 않는 것이, 이 Skill의 가장 중요한 제약입니다.

## 시작 조건

사용자가 다음과 같은 의뢰를 했을 때 시작됩니다. Skill 이름을 명시할 필요는 없습니다.

- "lint 고쳐줘", "lint 에러를 수정해 줘", "contextlint가 에러를 내고 있으니 고쳐줘"
- "끊어진 링크 고쳐줘", "문서 정리해 줘", "커밋 전 docs 클린업"

contextlint라는 이름을 꺼내지 않고 "문서의 정합성을 고쳐줘" 같은 의뢰로도 시작됩니다.

## 동작 흐름

### 1. 셋업 확인

`contextlint.config.json`과 `@contextlint/cli`가 사용 가능한지 가장 먼저 확인합니다. 미셋업 상태인 경우 [contextlint-init Skill](/ko/docs/integrations/ai-agents/skill-init/)의 사용을 안내하고, 그 시점에서 정지합니다.

### 2. lint 실행

```sh
npx contextlint --format json
```

`--format json`으로 기계 판독 가능한 출력을 얻고, 후속 단계에서 위반을 한 건씩 처리합니다. MCP 서버를 사용할 수 있는 환경에서는 `lint` 도구를 직접 호출하여 JSON 파싱을 생략합니다.

### 3. 규칙 카테고리별 수정 전략

| 규칙 접두사 | 자동 수정 | 사람에게 확인 |
| --- | --- | --- |
| **REF-\*** | 타이포로 판정 가능한 링크 대상 ID를 정정 | 참조 대상이 정말로 존재하지 않는 경우(삭제된 것인지 개명인지) |
| **SEC-\*** | 부족한 섹션을 `<!-- TODO -->` 첨부로 추가 | — |
| **TBL-\*** | 빈 셀에 `TODO` 삽입 | 허용 값 위반(값의 날조는 하지 않음) |
| **STR-\*** | 부족한 파일을 placeholder 첨부로 작성 | — |
| **CHK-\*** | — | 체크박스를 임의로 채우지 않음 |
| **CTX-\*** | — | placeholder의 해소는 사람의 판단이 필요 |
| **GRP-\*** | — | 순환 참조나 orphan 해소는 파일 간 파급이 있어 확인 필수 |

골격 만들기는 Skill의 책무, 내용을 채우는 것은 사람의 책무라는 선을 그어 두었습니다. 예를 들어 섹션 부족은 제목을 추가한 다음 본문에 `<!-- TODO -->`를 남기므로, 형식은 만족하지만 "미완료" 시그널은 남습니다.

### 4. 재 lint로 확인

수정 후 `npx contextlint`를 다시 실행하여 남은 위반을 0으로 만들 수 있었는지 확인합니다. 0에 도달할 수 없는 경우, 남아 있는 것은 사람의 판단이 필요한 항목뿐이어야 합니다.

### 5. 요약 제시

Skill은 마지막에 "자동으로 고친 것"과 "사람에게 확인이 필요한 것"을 나누어 제시합니다.

```
Done:
  - typo'd cross-refs in design.md를 3건 수정
  - adr/0005.md에 Consequences 섹션을 추가(TODO placeholder)

Needs your attention:
  ? FR-101이 design.md에서 참조되고 있지만 정의를 찾을 수 없음 — 참조를 지울지, 요구사항을 정의할지
  ? architecture.md와 overview.md의 순환 참조 — 어느 쪽을 source of truth로 삼을지
```

결정은 사람에게 남기고, Skill은 판단 재료를 정리하는 역할에 충실합니다.

## 대량 위반 시의 동작

50건을 넘는 위반이 검출된 경우는 모두 일괄 처리하지 않고, 카테고리별 요약을 제시한 다음 "전부의 자동 수정을 진행할지 / 일부로 좁힐지"를 사용자에게 물어봅니다. AI가 대량으로 파일을 다시 쓰면 사람이 변경 리뷰에 곤란하기 때문에, 적용의 입자도를 선택할 수 있도록 만들었습니다.

## 엣지 케이스

- **`@contextlint/cli` 미설치** — `contextlint-init` 사용을 안내하거나, `npm install -D @contextlint/cli` 실행을 제안합니다.
- **cross-file 규칙의 결과가 비어 있음** — `include` 패턴이 cross-ref 대상 파일을 덮고 있는지 확인합니다. include가 좁으면 REF-002나 TBL-006이 암묵적으로 스킵됩니다.
- **MCP 서버 사용 가능** — CLI의 JSON 파싱보다 MCP의 `lint` 도구를 우선합니다.

## 관련

- 수정 대상의 셋업이 미완료인 경우는 [contextlint-init Skill](/ko/docs/integrations/ai-agents/skill-init/).
- 위반의 출처와 수정의 파급 범위를 사전에 파악하고 싶은 경우는 [contextlint-impact Skill](/ko/docs/integrations/ai-agents/skill-impact/).
- 각 규칙의 명세는 [Rules](/ko/docs/rules/)를 참조해 주세요.
