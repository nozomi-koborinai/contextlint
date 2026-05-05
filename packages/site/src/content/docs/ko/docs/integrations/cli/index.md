---
title: CLI
description: contextlint 명령어의 서브커맨드 목록과 CLI 통합 페이지의 목차.
---

`@contextlint/cli` 패키지가 제공하는 `contextlint` 명령어는 로컬 개발에서도 CI에서도 동일한 실행 체계로 사용할 수 있습니다. 설정 파일 자동 감지, watch 모드, 기계 판독 가능한 JSON 출력까지 하나의 바이너리로 처리합니다.

설치 방법은 [Get Started → 설치](/ko/docs/get-started/installation/)를 참조해 주세요. 이 페이지에서는 설치 후의 사용 입구를 안내합니다.

## 서브커맨드 목록

| 서브커맨드 | 용도 |
| --- | --- |
| `contextlint`(기본값) | Markdown 문서를 lint |
| `contextlint init` | 대화식으로 `contextlint.config.json` 생성 |
| `contextlint compile` | 문서와 규칙을 Claude Code용 SKILL.md로 변환 |
| `contextlint impact <file>` | 지정 파일의 변경이 영향을 미치는 문서를 분석 |
| `contextlint slice <query>` | 쿼리에 관련된 문서의 최소 세트를 추출 |
| `contextlint graph` | 문서 의존 그래프를 표시 |

각 서브커맨드의 인수와 옵션은 [명령어](/ko/docs/integrations/cli/commands/)를 참조해 주세요.

## 이 섹션의 구성

- [명령어](/ko/docs/integrations/cli/commands/) — `lint` / `init` / `compile`의 동작과 사용법
- [플래그 레퍼런스](/ko/docs/integrations/cli/flags/) — `--config` / `--format` / `--watch` / `--cwd` 등의 목록
- [watch 모드](/ko/docs/integrations/cli/watch-mode/) — 파일 변경을 감지해 자동으로 재 lint
- [JSON 출력](/ko/docs/integrations/cli/json-output/) — `--format json`의 형식과 CI 활용

## 동작 확인

설치 후 다음 명령어로 버전을 확인할 수 있습니다.

```bash
npx contextlint --version
```

설정 파일이 없어도 `--version`이나 `--help`는 실행할 수 있지만, lint 실행에는 `contextlint.config.json`이 필요합니다. 설정 파일 작성법은 [Configuration](/ko/docs/configuration/)을 참조해 주세요.
