---
title: Agent Skills
description: agentskills.io 호환 호스트에서 contextlint를 호출하기 위한 Skill 목록과 gh skill install 사용법.
---

contextlint는 [agentskills.io](https://agentskills.io) 명세에 따른 3가지 Skill을 공개하고 있습니다. Skill은 AI에게 "무엇을 해주었으면 하는지"를 전달하는 단위로, 내부적으로 명령어 실행, 파일 탐색, 추론을 조합한 워크플로를 기술합니다. AI 호스트에서 Skill을 시작하면 사람이 절차를 일일이 지시하지 않아도 기대한 결과를 얻을 수 있습니다.

## 제공 중인 Skill

| Skill | 용도 | 상세 |
| --- | --- | --- |
| `contextlint-init` | 저장소로의 초기 셋업. 문서 구조를 scan하고 규칙 추론, CLI install까지 | [contextlint-init](/ko/docs/integrations/ai-agents/skill-init/) |
| `contextlint-fix` | 검출된 위반을 기계적 수정과 수동 확인 양쪽으로 해결 | [contextlint-fix](/ko/docs/integrations/ai-agents/skill-fix/) |
| `contextlint-impact` | Context Graph를 활용한 파일 변경의 영향 범위 분석 | [contextlint-impact](/ko/docs/integrations/ai-agents/skill-impact/) |

## 설치

GitHub CLI v2.90 이상이 필요합니다. 미설치 시는 [GitHub CLI 공식 사이트](https://cli.github.com/)를 참조해 주세요.

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
gh skill install nozomi-koborinai/contextlint contextlint-fix
gh skill install nozomi-koborinai/contextlint contextlint-impact
```

처음에는 `contextlint-init`만으로 충분합니다. `init`이 저장소 셋업을 끝낸 후, 필요에 따라 `fix`나 `impact`를 추가해 주세요.

## 구문

```
gh skill install OWNER/REPO SKILL
gh skill install OWNER/REPO SKILL@VERSION
gh skill install OWNER/REPO SKILL --agent claude-code --scope user
```

| 옵션 | 개요 |
| --- | --- |
| `OWNER/REPO` | Skill을 공개하고 있는 GitHub 저장소 |
| `SKILL` | 저장소 내 `skills/<name>/SKILL.md`의 `<name>` 부분 |
| `@VERSION` | 버전 태그(선택) |
| `--agent` | 대상 호스트(`claude-code` 등 호스트별로 다름) |
| `--scope` | `user`(사용자 전체) / `repo`(저장소만) |

그 외에 `gh skill update`, `gh skill search`, `gh skill publish`를 사용할 수 있습니다.

## 대응 호스트

agentskills.io 명세를 지원하는 호스트라면 동일한 Skill이 동작합니다.

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- 그 외 [agentskills.io](https://agentskills.io) 명세를 따른 호스트

호스트별 등록 절차와 대응 버전은 agentskills.io와 각 호스트의 문서를 참조해 주세요.

## Skill의 시작 방법

Skill은 설치 후 AI 호스트에 "해주었으면 하는 것"을 전달하기만 하면 자동으로 호출됩니다. Skill 이름을 직접 지정할 필요는 없습니다.

예를 들어 다음과 같은 의뢰로 `contextlint-init`이 시작됩니다.

> contextlint를 설정해 줘
>
> Markdown 린터를 도입하고 싶어
>
> 문서의 정합성 체크를 도입해 줘

`contextlint-fix`는 "lint 고쳐줘", "끊어진 링크 고쳐줘", "contextlint가 에러를 내고 있어" 등의 의뢰로, `contextlint-impact`는 "design.md를 바꾸면 뭐가 망가져?", "이 doc를 삭제해도 괜찮아?" 등의 의뢰로 시작됩니다. 각 Skill의 시작 조건과 동작의 자세한 내용은 각 개별 페이지에서 설명합니다.

## MCP 서버와의 차이

| 관점 | Skills | [MCP 서버](/ko/docs/integrations/ai-agents/mcp-server/) |
| --- | --- | --- |
| 추상도 | 높음(워크플로 단위) | 낮음(도구 단위) |
| AI에게 전달 방법 | 자연어 의뢰 | 도구 호출 |
| 배포 | GitHub 저장소의 `skills/<name>/SKILL.md` | npm 패키지 |
| 프로젝트 고유 설정 | 불필요(Skill이 자동 추론) | `contextlint.config.json` 필요 |

양쪽은 병용할 수 있습니다. `contextlint-fix` Skill은 내부에서 MCP의 `lint` 도구를 사용할 수 있으면 그쪽을 우선하는 등, Skills와 MCP는 상호 보완적으로 동작합니다.

## 왜 Skill 경유를 권장하는가

contextlint는 21개 규칙과 7가지 카테고리를 가지고 있습니다. 손으로 모두 읽고 적절한 구성을 선택하는 작업은 무겁기 때문에, `contextlint-init` Skill이 **저장소의 실태를 보고 구성을 제안**하는 흐름으로 만들었습니다. 사람은 최종 확인만 하면 되며, 초기 셋업에 드는 노력이 크게 줄어듭니다.
