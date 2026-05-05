---
title: AI Agents
description: contextlint를 AI 에이전트에서 호출하기 위한 두 가지 통합 경로(MCP / Skills).
---

contextlint는 AI 에이전트에서 사용하기 위한 두 가지 통합 경로를 제공합니다. Claude Code, Cursor Agent, Cline, Codex, Gemini CLI, GitHub Copilot 등의 호스트에서 문서 정합성 체크를 대화 안에 통합할 수 있습니다.

## 두 가지 통합 경로

| 경로 | 프로토콜 | 주요 호스트 | 배포 형태 |
| --- | --- | --- | --- |
| **MCP 서버** | Model Context Protocol | Claude Desktop / Cursor / Cline / Codex 등 | `@contextlint/mcp-server` 패키지 |
| **Agent Skills** | [agentskills.io](https://agentskills.io) 명세 | Claude Code / Cursor Agent / Codex / Gemini CLI / GitHub Copilot 등 | GitHub 저장소에서 `gh skill install` |

두 경로는 경합하지 않으며 목적에 따라 구분해 사용합니다. MCP는 **AI가 contextlint의 기능을 직접 호출**하기 위한 프로토콜이고, Skills는 **AI에게 "무엇을 해주었으면 하는지"를 말로 전달하기 위한 워크플로**입니다.

## 어느 쪽을 선택할까

- **"AI에게 lint를 실행시키고 싶다", "문서 그래프를 참조시키고 싶다"** → [MCP 서버](/ko/docs/integrations/ai-agents/mcp-server/)
- **"AI에게 contextlint 셋업을 맡기고 싶다", "위반을 자동 수정시키고 싶다", "변경 영향을 분석시키고 싶다"** → [Skills](/ko/docs/integrations/ai-agents/skills/)

호스트가 양쪽을 모두 지원하는 경우(Claude Code 등)는 병용할 수 있습니다. Skill이 내부에서 MCP 도구를 호출하는 경우도 있습니다.

## 이 섹션의 구성

- [MCP 서버](/ko/docs/integrations/ai-agents/mcp-server/) — `@contextlint/mcp-server`의 셋업과 제공하는 5가지 도구
- [Agent Skills](/ko/docs/integrations/ai-agents/skills/) — `gh skill install`의 사용법과 대응 호스트 목록
- [contextlint-init Skill](/ko/docs/integrations/ai-agents/skill-init/) — 저장소로의 초기 셋업을 맡기기
- [contextlint-fix Skill](/ko/docs/integrations/ai-agents/skill-fix/) — 검출된 위반의 수정을 맡기기
- [contextlint-impact Skill](/ko/docs/integrations/ai-agents/skill-impact/) — 파일 변경의 영향 범위를 분석시키기

## 관련

- 가장 짧은 셋업 절차는 [Quick Start — AI 연동](/ko/docs/get-started/quick-start-ai/)을 참조해 주세요. 이 섹션에서는 각 Skill / 도구의 **상세 명세와 사용 시기**를 다룹니다.
