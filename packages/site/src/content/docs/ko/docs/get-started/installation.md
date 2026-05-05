---
title: 설치
description: contextlint를 프로젝트에 설치하는 두 가지 방법.
---

contextlint는 **두 가지 설치 방법**을 제공합니다. AI 호스트(Claude Code / Cursor / Codex 등)를 사용하고 계시다면 **Skill 경유가 가장 빠릅니다**. 그 외에는 **CLI 경유**로 수동 설정합니다.

## Skill 경유 (권장)

[agentskills.io](https://agentskills.io) 호환 AI 호스트를 사용하고 계시다면, `gh skill install` 한 번으로 완료됩니다.

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

그 후, AI에게 다음과 같이 부탁하시면 됩니다.

> contextlint를 설정해 줘

AI가 리포지토리의 구조를 분석하고, 문서 배치·스타일(ADR 형식 / 사양서 형식 / 테이블 중심 / 등)을 읽어내어, 프로젝트에 맞는 `contextlint.config.json`을 자동 생성합니다. 21개의 규칙 중에서 직접 선택하실 필요가 없습니다.

**지원하는 AI 호스트:**

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 그 외 [agentskills.io](https://agentskills.io) 사양에 따른 호스트

**전제 조건:** GitHub CLI(`gh`)가 설치되어 있어야 합니다. 미설치 상태라면 [GitHub CLI 공식 사이트](https://cli.github.com/)를 참조해 주십시오.

## CLI 경유 (수동)

AI 호스트를 사용하지 않거나, 설정을 완전히 직접 관리하시고자 할 경우에는 `@contextlint/cli` 패키지를 직접 설치합니다.

### 패키지 매니저별

contextlint는 npm 레지스트리에서 배포됩니다. 프로젝트의 패키지 매니저에 맞춰 아래 중 하나를 실행해 주십시오.

```bash
# bun
bun add -D @contextlint/cli

# pnpm
pnpm add -D @contextlint/cli

# yarn
yarn add -D @contextlint/cli

# npm
npm install -D @contextlint/cli
```

개발 의존성(`-D` 또는 `--save-dev`)으로 추가하시기를 권장합니다. 프로덕션 빌드에는 필요하지 않기 때문입니다.

### 글로벌 설치 (선택 사항)

여러 프로젝트에서 자주 사용하시는 경우 글로벌 설치도 가능합니다.

```bash
# bun
bun add -g @contextlint/cli

# npm
npm install -g @contextlint/cli
```

다만, 프로젝트별로 의존 버전을 고정하시고자 할 경우에는 **프로젝트 내 설치(`-D`) 쪽이 더 안전합니다**. CI 환경에서도 동일한 동작을 보장할 수 있습니다.

### 동작 확인

설치 후, 버전을 표시할 수 있다면 성공입니다.

```bash
npx contextlint --version
```

## 다음 단계

- [Quick Start — AI 연동](/ko/docs/get-started/quick-start-ai/) — Skill에서 `init`을 실행하여 가장 빠르게 설정을 완료합니다
- [Quick Start — 수동](/ko/docs/get-started/quick-start-manual/) — `contextlint init`의 대화형 모드로 설정 파일을 만듭니다
