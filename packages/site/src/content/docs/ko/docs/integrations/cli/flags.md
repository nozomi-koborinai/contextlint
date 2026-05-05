---
title: 플래그 레퍼런스
description: contextlint 명령어에서 사용 가능한 플래그 목록과 용도.
---

CLI의 각 서브커맨드에서 사용할 수 있는 플래그(옵션)의 목록입니다. 서브커맨드별로 사용 가능한 플래그가 다릅니다.

## 공통 플래그

모든 서브커맨드에서 사용할 수 있습니다.

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `--config <path>` | 경로 | (자동 감지) | 사용할 `contextlint.config.json`의 경로를 명시 |
| `--cwd <path>` | 경로 | 현재 디렉터리 | 작업 디렉터리. glob과 경로의 해석 기준이 됨 |
| `--help` | — | — | 도움말 메시지 표시 |
| `--version` | — | — | 버전 표시 |

`--config`를 생략하면 `--cwd`에서 부모 디렉터리로 거슬러 올라가며 `contextlint.config.json`을 탐색합니다. 동작 상세는 [설정 파일의 자동 감지](/ko/docs/configuration/auto-detection/)를 참조해 주세요.

## `lint`(기본값)

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `[files...]` | glob 배열 | — | 검증 대상 파일 / glob 패턴. 설정의 `include`를 덮어씀 |
| `--format <format>` | `human` / `json` | `human` | 출력 형식 |
| `--watch` | — | — | 파일 변경을 감지하여 자동으로 재 lint |

`--format`의 동작은 [JSON 출력](/ko/docs/integrations/cli/json-output/), `--watch`는 [watch 모드](/ko/docs/integrations/cli/watch-mode/)를 참조해 주세요.

## `init`

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `--cwd <path>` | 경로 | 현재 디렉터리 | 설정 파일의 출력 디렉터리 |

인수 없이 실행하는 대화 모드 외에 옵션은 없습니다.

## `compile`

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `--outdir <path>` | 경로 | 설정의 `compile.outdir`(또는 `.claude/skills/contextlint`) | SKILL.md의 출력 디렉터리 |
| `--dry-run` | — | — | 쓰기 없이 생성 내용의 요약만 표시 |

## `impact`

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `<file>` | 경로(필수) | — | 영향을 분석할 기점 파일 |
| `--format <format>` | `human` / `json` | `human` | 출력 형식 |

## `slice`

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `<query>` | 경로 / ID(필수) | — | 관련 문서를 추출할 쿼리 |
| `--depth <depth>` | 0 이상의 정수 | `2` | 그래프 탐색의 최대 깊이 |
| `--format <format>` | `human` / `json` | `human` | 출력 형식 |

## `graph`

| 플래그 | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `--format <format>` | `human` / `json` | `human` | 출력 형식 |
