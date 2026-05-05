---
title: 첫 lint 실행
description: contextlint 출력을 읽는 법과 자주 발생하는 위반 패턴.
---

설정이 완료되면, 실제로 lint를 실행해 보겠습니다.

## 실행

```bash
npx contextlint
```

`contextlint.config.json`의 `include`에 작성된 glob 패턴에 해당하는 모든 Markdown 파일이 검증됩니다.

## 출력을 읽는 법

위반이 있을 경우, 다음과 같은 형식으로 표시됩니다.

```text
docs/requirements.md
  line 12  error    Link target "./api.md" does not exist  REF-001
  line 24  warning  Empty cell in column "Status"          TBL-002

docs/architecture.md
  line 5   error    Required section "Decision" is missing  SEC-001

2 errors, 1 warning in 2 files
```

각 위반은 다음 항목으로 구성됩니다.

- **파일 경로** — 위반이 발견된 파일
- **line** — 위반 위치의 행 번호
- **error / warning** — 중요도
- **메시지** — 무엇이 문제인가
- **규칙 ID** — 어떤 규칙에 해당하는가([Rules](/ko/docs/rules/)에서 자세히 참조)

위반이 없을 경우에는 다음과 같이 표시됩니다.

```text
No issues found.
```

CI에서 실행하시는 경우, 이 상태이면 exit code 0으로 정상 종료됩니다. 위반이 있으면 exit code 1로 종료되므로, PR의 게이트로 활용하실 수 있습니다.

## 자주 발생하는 위반 패턴

### REF-001 — 끊어진 링크

파일에 대한 링크나 파일 내 앵커(`#section-name`)를 해결할 수 없을 때 발생합니다.

- 참조 대상 파일이 이름 변경 / 이동되었습니다
- 앵커 링크의 참조 대상 섹션이 삭제·이름 변경되었습니다
- 상대 경로가 잘못되었습니다

### SEC-001 — 필수 섹션 누락

설정 파일에서 필수로 지정한 섹션이 대상 파일 내에 존재하지 않을 때 발생합니다.

- ADR 템플릿에 `Context / Decision / Consequences`를 필수로 지정했지만, 신규 ADR에서 하나가 빠졌습니다
- 사양서 템플릿에 `개요 / API / 예시`를 필수로 지정했지만, 개요만으로 끝나 있습니다

### TBL-002 — 테이블의 빈 셀

설정에서 「비어 있어서는 안 된다」고 지정한 컬럼의 셀이 비어 있을 때 발생합니다.

- 요구사항 테이블에서 `Status` 컬럼이 빈 채로 행이 추가되었습니다

그 외 규칙에 대해서는 [Rules](/ko/docs/rules/)를 참조해 주십시오. 21개의 규칙이 있으며, 각각이 무엇을 감지하는지·어떻게 설정하는지가 개별적으로 설명되어 있습니다.

## 위반을 수정하기

`contextlint-fix` Skill을 사용하시면, AI가 위반을 일괄로 수정 후보와 함께 제안합니다. Skill 설치는 [Quick Start — AI 연동](/ko/docs/get-started/quick-start-ai/)을 참조해 주십시오.

수동으로 수정하시는 경우에는, 출력에 표시된 파일 경로와 행 번호를 기준으로 해당 위치를 수정해 주십시오.

## 다음 단계

- [Configuration](/ko/docs/configuration/) — `contextlint.config.json`의 상세
- [Rules](/ko/docs/rules/) — 21개 규칙의 개별 레퍼런스
- [Integrations](/ko/docs/integrations/) — 에디터·CI·AI 연동 각종 설정
