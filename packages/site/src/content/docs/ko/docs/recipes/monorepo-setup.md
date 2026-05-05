---
title: 모노레포
description: 여러 패키지의 문서를 하나의 설정으로 일괄 검증하는 contextlint 설정 예시.
---

이 레시피는 여러 패키지가 같은 리포지터리에서 개발되는 **모노레포**를 위한 설정 예시입니다. bun workspace / pnpm workspace / yarn workspace / Nx / Turborepo 등, 워크스페이스 관리 도구의 차이에 의존하지 않고 사용하실 수 있습니다.

## 어떤 프로젝트에 적합한가

- 루트 직하에 `packages/` 또는 `apps/`와 같은 형태로 여러 패키지가 나열되어 있다
- 각 패키지가 독자적으로 `docs/` 또는 `README.md`를 가진다
- 리포지터리 최상단에 횡단적인 문서 (`docs/architecture.md` 등)도 있다
- 문서의 정합성 규칙을 **패키지마다 따로 설정하고 싶지 않다** (하나의 설정으로 일괄 통제하고 싶다)

CLI에서 개별 패키지의 문서만을 검증하시는 운영에도 대응할 수 있습니다. `include` 패턴의 조립이 핵심이 됩니다.

## 권장 구성 (`contextlint.config.json`)

리포지터리 루트에 하나만 배치합니다.

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": [
    "docs/**/*.md",
    "packages/*/docs/**/*.md",
    "packages/*/README.md",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  "rules": [
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "ctx001" },
    {
      "rule": "sec001",
      "options": {
        "files": "packages/*/README.md",
        "sections": ["Installation", "Usage"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/changelog.md",
        "column": "Status",
        "values": ["unreleased", "released", "deprecated"]
      }
    },
    { "rule": "grp002" }
  ]
}
```

`include`의 각 glob은 **루트 설정 파일로부터의 상대 경로**로 해석됩니다. `packages/api` 내에서 `npx contextlint`를 실행하셔도, 루트 설정이 자동 감지되어 같은 glob이 사용됩니다 (자세한 내용은 [설정 파일 자동 감지](/ko/docs/configuration/auto-detection/)를 참고).

## 각 규칙을 선택한 이유

### include 패턴의 조립 방법

모노레포에서는 검증 대상을 「어떤 단위로 포함할 것인가」가 가장 중요한 설계 판단입니다. 3가지 전형적인 조합을 제시합니다.

| 용도 | include 패턴 | 검증 대상 |
| --- | --- | --- |
| 각 패키지의 `docs/`만 | `packages/*/docs/**/*.md` | 패키지가 가지는 상세 문서 |
| 각 패키지의 `README.md`도 포함 | 위 + `packages/*/README.md` | 공개 문서 전체 |
| 루트 횡단 문서도 포함 | 위 + `docs/**/*.md` | 리포지터리 전체의 아키텍처 문서 |

이 레시피에서는 3가지 모두를 포함하고 있습니다. **`*/` (1계층만)와 `**/` (재귀)의 사용 구분**에 주의해 주십시오.

- `packages/*/docs/**/*.md` — `packages/api/docs/...`에는 매칭되지만 `packages/api/sub/sub/docs/...`에는 매칭되지 않음
- `packages/**/docs/**/*.md` — 어느 계층에 있는 `docs/`이든 매칭됨 (Nx와 같은 nested workspaces에서 유용)

`!**/node_modules/**`와 `!**/dist/**`의 부정 패턴은, 의존 패키지의 문서나 빌드 산출물을 잘못 가져오지 않게 하기 위한 **보험**입니다. `include`의 긍정 패턴이 이미 충분히 좁혀져 있다면 불필요하지만, glob의 동작을 의식하지 않고 추가・변경하는 개발자가 여러 명 있는 경우에 효과를 발휘합니다.

### REF-001 / REF-005 — 패키지 간 링크 보호

모노레포에서는 `packages/api/docs/architecture.md`에서 `packages/web/docs/api-contract.md`로의 횡단 링크가 발생하기 쉽고, 이름 변경 시마다 조용히 깨집니다. 링크 (REF-001)와 앵커 (REF-005) 양쪽을 보호합니다.

이들 규칙은 `include` 대상 Markdown 파일 전체를 보고 해결하므로, 다른 패키지의 문서라도 같은 설정으로 검증할 수 있습니다.

### GRP-002 — 패키지 간 순환 참조

`api`의 docs가 `web`을 참조하고, `web`의 docs가 `api`를 참조하는 형태는 단기적으로는 흔하지만, 의존 관계로서는 건전하지 않습니다 (한 방향으로 정리해야 함). [GRP-002 순환 참조](/ko/docs/rules/grp-002/)로 참조 그래프가 DAG임을 보장합니다.

모노레포에서는 순환 참조가 패키지 단위 의존 관계 (`package.json`의 dependencies)에 그대로 반영되는 경우가 많아, 문서 측에서 먼저 검출하시면 설계를 재검토하기 수월해집니다.

### SEC-001 — README 템플릿의 통일

`packages/*/README.md`에는, 최소한 `Installation` / `Usage` 섹션이 있으면, 신규 사용자가 각 패키지를 읽기 시작할 때의 인지 비용이 낮아집니다.

[SEC-001 필수 섹션](/ko/docs/rules/sec-001/)을 `packages/*/README.md`로 좁혀서 적용합니다. 섹션 명은 팀의 관행에 맞춰 변경하시면 됩니다 (`개요` / `사용법`과 같은 한국어 제목도 무방).

### CTX-001 — 플레이스홀더 검출 (전체)

여러 패키지가 나열된 리포지터리에서는, 특정 패키지에서 TODO나 TBD가 남아 있는 경우가 많습니다. 전역적으로 검출하면 릴리스 직전에 미완성 부분을 도출할 수 있습니다.

`files`로 좁히지 않고 `include`의 대상 전체에 적용합니다.

### TBL-003 — changelog의 상태 제약

각 패키지가 `CHANGELOG.md` 또는 `changelog.md`를 가지고 있는 경우, `Status` 컬럼이 `unreleased` / `released` / `deprecated`와 같이 정해진 값으로 운영되는 케이스가 많습니다. 표기 흔들림 (`WIP` / `done` / `pending` 등)을 방지합니다.

`changelog.md`를 가지지 않는 패키지에서는 이 규칙은 아무것도 검출하지 않으므로 무해합니다.

### 이 레시피에서 채택하지 않은 규칙

| 규칙 | 채택하지 않는 이유 |
| --- | --- |
| TBL-006 | 패키지마다 ID 체계가 다른 경우 적용이 어렵다. 각 패키지에서 독립된 ID를 사용하신다면 불필요 |
| REF-002 / REF-003 | 요구사항 ID의 추적성은 모노레포가 아닌 feature 단위로 운영하는 편이 자연스럽다 |
| REF-004 | zone 구조를 가지는 모노레포는 소수파 |
| GRP-001 / GRP-003 | 패키지마다 의존 그래프의 형태가 다르므로, 획일적인 chain 검증은 제외 |
| STR-001 | 각 패키지에 필요한 파일은 package.json의 `files` 필드로 관리되는 경우가 많다 |

요구사항 관리를 수행하시는 모노레포라면, [사양 주도 개발 리포지터리](/ko/docs/recipes/spec-driven-development-setup/) 레시피와 조합하여 사용하시는 것을 검토해 주십시오.

## 운영상의 주의점

### 개별 패키지만 lint하시고 싶을 경우

CLI 인수로 glob을 전달하시면, 설정 파일의 `include`를 덮어쓸 수 있습니다.

```bash
# packages/api만 lint
npx contextlint "packages/api/**/*.md"
```

다만 `include`를 덮어쓰면 프로젝트 스코프 규칙 (REF-001 / REF-005 / GRP-002 등)은 **지정한 glob 내에 한정되어** 평가됩니다. `packages/api`에서 `packages/web`으로의 링크를 검증하시려면, 인수로 범위를 좁히지 마시고 전체를 lint하시거나, `packages/api/**/*.md`와 `packages/web/**/*.md`를 함께 기재해 주십시오.

자세한 내용은 [include 패턴](/ko/docs/configuration/include-patterns/)의 우선순위 섹션을 참고해 주십시오.

### CI에서의 경로 필터와 매트릭스

모노레포에서는 `docs` 관련 변경이 있는 패키지만을 CI에서 검증하고 싶어지는 경우가 있지만, contextlint는 **프로젝트 스코프 규칙** (REF-001 / REF-002 / GRP-002 등)을 가지고 있으므로, 대상을 좁히면 참조 대상 존재 검증이 깨집니다.

권장은 다음 중 하나입니다.

1. **항상 리포지터리 전체를 lint** — `pull_request: paths: ["**/*.md"]`와 같은 필터로 「Markdown이 변경된 PR에서만 실행」하는 것은 무방하지만, 실행 시에는 전체를 본다
2. **CLI의 서브셋 지정은 사용하지 않는다** — 모노레포에서는 `npx contextlint`를 인수 없이 실행한다

실행 시간이 길어지는 경우에만, 각 패키지의 디렉터리만을 include에 열거하는 독립된 설정 파일을 CI용으로 별도로 준비하는 운영으로 전환합니다. 구체적인 워크플로 예시는 [CI 연동 패턴](/ko/docs/recipes/ci-integration-patterns/)을 참고해 주십시오.

### 패키지마다의 차별화

「`apps/`는 템플릿 강제를 엄격하게, `packages/`의 internal lib는 느슨하게」와 같은 차별화는, 각 규칙의 `files` 옵션으로 실현할 수 있습니다.

```json
{
  "rule": "sec001",
  "options": {
    "files": "apps/*/README.md",
    "sections": ["Overview", "Setup", "Deployment"]
  }
}
```

`files`로 적용 범위를 좁혀도, 규칙이 평가되는 문서 집합 (= `include`)은 전체 그대로입니다. 자세한 내용은 [규칙 단위 스코프 지정](/ko/docs/configuration/per-file-rule-scoping/)을 참고해 주십시오.

### 하위 디렉터리에서 실행되었을 때의 동작

bun workspace / pnpm workspace와 같은 환경에서, `packages/api/` 디렉터리에서 `npx contextlint`를 실행하시면, 설정 파일은 상위 디렉터리를 거슬러 올라가 자동 감지됩니다. glob은 루트 (= 설정 파일의 위치)를 기점으로 해석되므로, 하위 디렉터리에서 실행하셔도 결과는 동일합니다.

자세한 내용은 [설정 파일 자동 감지](/ko/docs/configuration/auto-detection/)를 참고해 주십시오.
