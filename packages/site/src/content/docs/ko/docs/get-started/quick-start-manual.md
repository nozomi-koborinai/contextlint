---
title: Quick Start — 수동
description: CLI를 직접 사용하여 contextlint를 수동으로 설정합니다.
---

AI 호스트를 사용하지 않거나, 설정을 완전히 직접 관리하시고자 할 경우의 절차입니다. 3개의 명령어로 lint 실행까지 도달하실 수 있습니다.

## 1. 설치

가장 빠른 방법은 다음 명령어입니다.

```bash
npm install -D @contextlint/cli
```

bun / pnpm / yarn의 경우에는 [설치](/ko/docs/get-started/installation/)를 참조해 주십시오.

## 2. 대화형 모드로 설정 파일 만들기

`contextlint init`을 실행하시면, 대화형 모드로 프로젝트에 맞춘 `contextlint.config.json`을 생성하실 수 있습니다.

```bash
npx contextlint init
```

질문에 답해 가시면, 리포지토리 직하에 다음과 같은 설정 파일이 생성됩니다.

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "grp002" }
  ]
}
```

설정 파일의 각 필드의 의미는 [Configuration](/ko/docs/configuration/)에서 자세히 설명합니다. 나중에 수동으로 편집하셔도 무방합니다.

## 3. lint 실행

```bash
npx contextlint
```

contextlint는 현재 디렉터리에서 상위 디렉터리를 향해 `contextlint.config.json`을 탐색하고, 발견된 설정 파일의 `include`에 따라 Markdown을 검증합니다. CLI 인수로 대상 파일을 지정하시면, 설정 파일의 `include`를 덮어쓸 수 있습니다.

```bash
npx contextlint "specs/**/*.md"
```

## 다음 단계

- [첫 lint 실행](/ko/docs/get-started/your-first-lint/) — 출력을 읽는 법과 자주 발생하는 위반 패턴
- AI 호스트에서 설정하시고자 할 경우에는 [Quick Start — AI 연동](/ko/docs/get-started/quick-start-ai/)
