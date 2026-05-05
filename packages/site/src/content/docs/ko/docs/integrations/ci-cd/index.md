---
title: CI/CD
description: contextlint를 CI 파이프라인이나 로컬 훅에 통합하는 방법.
---

contextlint는 Node.js 환경이 있다면 임의의 CI에서 동작시킬 수 있습니다. `@contextlint/cli` 패키지는 의존이 가볍고 서브초로 완료되므로, PR마다 실행해도 CI 시간에 큰 영향을 주지 않습니다. 머지 전에 문서 정합성을 보장하는 용도와, 커밋 전에 로컬에서 빠르게 검출하는 용도 어느 쪽에든 통합할 수 있습니다.

## 통합 시점

| 시점 | 주요 도구 | 용도 |
| --- | --- | --- |
| 로컬 훅 | pre-commit / Husky / lint-staged | 커밋 전의 마지막 안전망 |
| 푸시 시 | GitHub Actions / GitLab CI / CircleCI | PR 리뷰 전 문서 정합성 보장 |

에디터 통합([Editors (LSP)](/ko/docs/integrations/editors/))과 AI 통합([AI Agents](/ko/docs/integrations/ai-agents/))이 "쓰고 있는 순간"의 피드백을 담당하는 데 비해, CI/CD는 "머지 전"의 최종 체크를 담당합니다. 세 레이어를 조합함으로써, 문서의 정합성이 무너진 상태가 저장소에 남지 않는 환경을 만들 수 있습니다.

## 이 섹션의 구성

- [GitHub Actions](/ko/docs/integrations/ci-cd/github-actions/) — 공식 Composite Action과 직접 실행 샘플
- [pre-commit / 로컬 훅](/ko/docs/integrations/ci-cd/pre-commit/) — Husky / lint-staged / pre-commit framework와의 연동

## 설정 파일의 취급

CI 상에서 contextlint를 실행하는 경우, `contextlint.config.json`은 저장소에 커밋해 둡니다. 러너가 저장소를 checkout한 시점에서 `npx contextlint`가 자동으로 설정 파일을 검출하기 때문에, CLI에 추가 인수를 전달할 필요는 없습니다.

설정 파일의 명세는 [Configuration](/ko/docs/configuration/)을 참조해 주세요.

## 종료 코드와 출력 형식

`contextlint`는 위반이 1건 이상 있으면 비제로로 종료하므로, CI 잡을 그대로 실패로 처리할 수 있습니다. 리뷰 코멘트나 어노테이션을 첨부하고 싶은 경우는 `--format json`으로 기계 판독 가능한 출력을 얻어 주세요.

```bash
npx contextlint --format json
```

JSON 출력의 구조와 필드는 [Integrations → CLI → JSON 출력](/ko/docs/integrations/cli/json-output/)을 참조해 주세요.
