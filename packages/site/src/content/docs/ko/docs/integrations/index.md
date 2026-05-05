---
title: Integrations
description: contextlint를 에디터, AI 도구, CI에 통합하는 방법.
---

contextlint는 단독 CLI로 동작할 뿐 아니라, 개발 흐름의 세 레이어(편집 중, AI 경유, CI)에 각각 통합할 수 있습니다. 이 카테고리에서는 각 통합 대상의 셋업 방법과 동작을 설명합니다.

## 통합 레이어

| 레이어 | 통합 대상 | 피드백 시점 |
| --- | --- | --- |
| 편집 중 | 에디터(LSP) | 저장/입력할 때마다 즉시 |
| AI 경유 | AI 도구(MCP / Skills) | AI가 문서를 조작할 때 |
| 실행 시 | CLI | 수동 실행 / watch 모드 |
| 머지 전 | CI/CD | PR / push 시점 |

각 레이어는 독립적으로 동작하므로, 목적에 따라 필요한 것만 도입할 수 있습니다.

## 이 카테고리의 구성

- [CLI](/ko/docs/integrations/cli/) — `contextlint` 명령어, 서브커맨드, 플래그, watch 모드, JSON 출력
- [Editors (LSP)](/ko/docs/integrations/editors/) — Language Server Protocol을 통한 에디터 통합
- [AI Agents](/ko/docs/integrations/ai-agents/) — MCP 서버와 Agent Skills
- [CI/CD](/ko/docs/integrations/ci-cd/) — GitHub Actions와 JSON 출력을 활용한 파이프라인 연동
