---
title: JSON 출력
description: --format json에 의한 기계 판독 가능한 출력 형식과 CI 활용 예.
---

`--format json`을 지정하면 contextlint는 사람용 텍스트가 아니라 기계 판독 가능한 JSON을 표준 출력으로 작성합니다. CI에서의 어노테이션 생성, 에디터 확장의 피드백, 자체 리포팅 도구로의 통합 등에 사용합니다.

## 기본

```bash
npx contextlint --format json
```

## 출력 형식

`lint`(기본값) 서브커맨드의 JSON 출력은 위반의 평탄한 배열입니다.

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  },
  {
    "file": "docs/design.md",
    "line": 24,
    "severity": "warning",
    "message": "Empty cell in column \"Status\"",
    "ruleId": "TBL-002"
  }
]
```

각 요소의 필드는 다음과 같습니다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `file` | string | 위반이 발견된 파일의 상대 경로 |
| `line` | number | 위반 위치의 행 번호(1부터 시작) |
| `severity` | `"error"` / `"warning"` | 중요도 |
| `message` | string | 위반 설명 |
| `ruleId` | string | 하이픈이 포함된 규칙 ID(예: `TBL-001`) |

위반이 없는 경우 빈 배열 `[]`이 출력됩니다.

## CI 활용

JSON 출력은 GitHub Actions의 어노테이션이나 Slack / Discord 알림 페이로드 생성에 사용할 수 있습니다.

### 내장된 GitHub Actions

저장소에 동봉된 Composite Action은 `--format json`으로 contextlint를 실행하고, 결과를 PR의 인라인 어노테이션으로 변환합니다. 설정 예시는 [CI/CD → GitHub Actions](/ko/docs/integrations/ci-cd/)를 참조해 주세요.

### 자체 스크립트로 처리

`jq` 등으로 위반 수를 집계하는 간단한 예입니다.

```bash
npx contextlint --format json | jq 'length'
# => 2
```

규칙별 건수도 출력할 수 있습니다.

```bash
npx contextlint --format json | jq 'group_by(.ruleId) | map({rule: .[0].ruleId, count: length})'
```

## 그래프 계열 서브커맨드의 JSON 출력

`impact` / `slice` / `graph`도 `--format json`을 지원하지만 출력 구조는 lint와 다릅니다. 각 서브커맨드의 출력 예는 [Concepts](/ko/docs/concepts/)를 참조해 주세요.
