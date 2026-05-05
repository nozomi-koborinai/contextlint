---
title: Quick Start — AI 연동
description: Claude Code / Cursor / Codex 등의 AI 호스트에서 contextlint를 가장 빠르게 설정합니다.
---

[agentskills.io](https://agentskills.io) 호환 AI 호스트를 사용하고 계시다면, Skill 경유가 가장 빠릅니다. 3단계로 lint 실행까지 도달하실 수 있습니다.

## 1. Skill 설치

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

`contextlint-init` Skill이 AI 호스트의 사용 가능한 스킬로 등록됩니다. 같은 방식으로 `contextlint-fix`나 `contextlint-impact`도 설치하실 수 있지만, 처음에는 `contextlint-init`만으로 충분합니다.

## 2. AI에게 설정을 부탁하기

AI 호스트를 열고, 현재 리포지토리에서 다음과 같이 부탁합니다.

> contextlint를 설정해 줘

AI가 `contextlint-init` Skill을 기동하여, 다음을 순서대로 실행합니다.

1. 리포지토리 내 문서의 위치를 감지(`docs/`뿐만 아니라 `specs/`, `adr/`, `decisions/` 등도)
2. 문서 스타일을 추론(ADR 형식 / 사양서 형식 / 테이블 중심 / 플레이스홀더 다용 등)
3. 프로젝트에 맞는 규칙 구성을 제안
4. 확인 후, `@contextlint/cli`를 설치하고, `contextlint.config.json`을 생성

사람이 21개의 규칙 중에서 직접 선택하실 필요가 없습니다.

## 3. lint 실행

설정 파일이 작성되면, AI가 첫 번째 lint를 자동으로 실행하고 결과를 표시합니다. 위반이 발생한 경우, 이어서 `contextlint-fix` Skill로 수정 후보를 제안하도록 시키실 수도 있습니다.

수동으로 실행하시고자 할 경우에는 다음 명령어로 동일한 결과를 얻을 수 있습니다.

```bash
npx contextlint
```

이것으로 AI 연동 설정은 완료됩니다.

## 지원하는 AI 호스트

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 그 외 [agentskills.io](https://agentskills.io) 사양에 따른 호스트

## 다음 단계

- [첫 lint 실행](/ko/docs/get-started/your-first-lint/) — lint 출력을 읽는 법과 자주 발생하는 위반 패턴
- 수동으로 설정하시고자 할 경우에는 [Quick Start — 수동](/ko/docs/get-started/quick-start-manual/)
