---
title: contextlint-init Skill
description: 저장소에 contextlint를 초기 셋업하는 Skill의 역할과 동작.
---

`contextlint-init`은 **저장소에 contextlint를 초기 셋업**하기 위한 Skill입니다. AI가 "contextlint를 설정해 줘", "lint 환경 정비해 줘"와 같은 의뢰를 받았을 때 자동으로 시작됩니다.

## 왜 이 Skill이 있는가

contextlint에는 21개 규칙이 7개 카테고리에 걸쳐 존재합니다. 사람이 처음 보고 모두 읽어서 "내 저장소에서 무엇을 활성화해야 하는지"를 판단하는 것은 부담이 크고, 결과적으로 도입을 포기하는 경우로 이어집니다.

`contextlint-init`은 **저장소 구조를 실제로 scan하고 나서 구성을 제안**하는 방식으로 이 벽을 없앱니다. 사람이 손으로 21개 중에서 고르는 것이 아니라, AI가 문서 배치, 스타일, 참조 패턴을 보고 프로젝트에 맞는 규칙 세트를 추론합니다.

## 시작 조건

사용자가 다음과 같은 의뢰를 했을 때 시작됩니다. Skill 이름을 명시할 필요는 없습니다.

- "contextlint를 설정해 줘", "contextlint 도입해 줘"
- "Markdown 린터를 도입하고 싶어", "문서의 정합성 체크를 도입해 줘"
- "lint 환경 정비해 줘", "lint setup"

contextlint라는 이름을 꺼내지 않고 "문서의 정합성 체크" 같은 문맥만 전달되어도 시작됩니다.

## 동작 흐름

Skill은 다음 단계를 순서대로 실행합니다.

### 1. 기존 셋업 검출

저장소 직하나 부모 디렉터리에 `contextlint.config.json`이 없는지 가장 먼저 확인합니다. 발견된 경우 사용자에게 다음 선택지를 제시합니다.

| 선택지 | 동작 |
| --- | --- |
| `overwrite` | 처음부터 재생성 |
| `add` | 기존 설정을 유지하면서 새로운 스캔 결과를 바탕으로 규칙 추가를 제안 |
| `skip` | 아무것도 하지 않음 |

기존 설정을 임의로 덮어쓰지 않는 이유는, 과거에 튜닝된 설정이나 CI를 통과하고 있는 전제를 망가뜨리지 않기 위해서입니다.

### 2. 패키지 매니저 검출

락 파일에서 우선순위에 따라 판정합니다.

| 락 파일 | 매니저 |
| --- | --- |
| `bun.lock` / `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` | npm |
| (없음) | npm으로 폴백 |

### 3. 문서 배치 검출

`docs/`로 단정짓지 않고, `documentation/`, `specs/`, `adr/`, `decisions/`, `requirements/`, `architecture/`, `notes/` 등의 전형적인 배치를 실제로 walk하여 확인합니다. 3개 이상의 Markdown이 모여 있는 디렉터리를 "문서 클러스터" 후보로 추출하고, 디렉터리명이 문서 문맥과 일치하는 것을 우선합니다. `README.md`나 `CHANGELOG.md` 같은 프로젝트 메타는 검출하긴 하지만, 기본값으로 lint 대상에 포함하지 않습니다.

monorepo의 경우는 `packages/*/docs/` 같은 배치도 검출하여 모두 include에 포함합니다.

### 4. 문서 내용 샘플링

검출된 각 클러스터에서 3~5개 파일을 발췌하여 내용을 읽고, 다음 시그널을 찾습니다. 컨텍스트를 낭비하지 않기 위해 모든 파일을 읽지는 않습니다.

| 관찰된 패턴 | 제안 규칙 |
| --- | --- |
| `[link](file.md#anchor)` 형식의 상호 참조 | REF-001 |
| `ID` 컬럼을 가진 테이블 | TBL-001 + TBL-002 |
| 같은 제목 트리플렛(예: `## Context` / `## Decision` / `## Consequences`) | SEC-001 |
| 자주 사용되는 체크리스트 | CHK-001 |
| `TODO`, `TBD`, `<pending>` 등의 placeholder | CTX-001 |
| 파일 간 양방향 참조가 많음 | GRP-002 |

REF-001과 GRP-002는 **상시 ON** 베이스라인으로 제안합니다. 끊어진 링크 검출과 순환 참조 검출은 저장소 종류와 무관하게 유용하기 때문입니다.

### 5. 설정 제안과 사람의 확인

추출한 구성을 `contextlint.config.json`의 드래프트로 제시하고, 각 규칙에 "왜 제안했는지"의 한 줄 근거를 덧붙입니다. "ADR 디렉터리에서 Context/Decision/Consequences의 반복을 관찰했기 때문에 SEC-001을 제안" 같이, 관찰에 기반한 구체적인 설명을 합니다.

설정을 임의로 쓰는 것이 아니라, 반드시 사용자의 확인을 받습니다. AI가 관찰을 잘못한 경우나, 사용자가 특정 규칙을 의도적으로 제외하고 싶은 경우에 대비하기 위해서입니다.

### 6. 설치와 최초 lint 실행

사용자가 승인하면, 검출된 패키지 매니저로 `@contextlint/cli`를 install하고 `contextlint.config.json`을 작성합니다. 이어서 `npx contextlint`를 한 번 실행하여 현재의 위반을 가시화합니다. 설치가 끝난 순간 "현재 어디에 무엇이 있는지" 알 수 있는 흐름으로 만들었습니다.

### 7. 선택적 추가 산출물

CI와 README는 변경이 팀 전체에 영향을 주기 때문에 각각 별도로 허가를 받고 작성합니다.

- **GitHub Actions 워크플로** — `.github/workflows/contextlint.yml`을 생성(pull_request 트리거, `npx contextlint` 실행)
- **README 섹션** — "contextlint를 사용 중"임을 나타내는 짧은 블록을 추가

각각은 선택사항이며, 확인 없이는 실행하지 않습니다.

## 엣지 케이스

- **README.md만 있는 저장소** — contextlint의 진가는 cross-file 정합성에 있으므로, 구조화된 문서가 갖춰진 후 도입하도록 안내합니다.
- **여러 락 파일이 공존** — 최종 갱신이 새로운 쪽을 채택하거나 사용자에게 확인합니다.
- **부모 디렉터리에 이미 설정이 존재** — monorepo를 상정하여, 상위 설정을 존중하고 같은 계층에 중복 작성하지 않습니다.
- **GitHub Actions 외의 CI** — GitLab CI, CircleCI 등에서는 `.github/workflows/`를 생성하지 않고, "`npx contextlint`로 동등한 검증을 임의의 CI에 통합 가능"하다는 것만 전달합니다.

## 관련

- 가장 짧은 셋업 절차는 [Quick Start — AI 연동](/ko/docs/get-started/quick-start-ai/)을 참조해 주세요.
- 검출된 위반의 수정은 [contextlint-fix Skill](/ko/docs/integrations/ai-agents/skill-fix/)에 맡길 수 있습니다.
- 완성된 설정 파일의 구조는 [설정 파일](/ko/docs/configuration/config-file/)을 참조해 주세요.
