---
title: MCP 서버
description: "@contextlint/mcp-server의 셋업과 AI 호스트에서 호출 가능한 5가지 도구의 명세."
---

`@contextlint/mcp-server`는 contextlint의 기능을 [Model Context Protocol](https://modelcontextprotocol.io/) 경유로 AI 호스트에 공개하는 서버입니다. Claude Desktop, Cursor, Cline, Codex 등 MCP 대응 호스트에 등록하면, AI가 대화 중에 lint 실행, 그래프 참조, 영향 분석을 호출할 수 있게 됩니다.

## 설치

```bash
npm install -D @contextlint/mcp-server
```

`npx @contextlint/mcp-server`로도 실행할 수 있으므로 글로벌 설치든 프로젝트 내 설치든 호스트의 설정 스타일에 맞춰 선택해 주세요.

## 호스트별 셋업

MCP 서버는 stdio로 통신하는 단순한 명령어입니다. 각 호스트의 설정 파일에 동일한 형식의 항목을 추가합니다.

### Claude Desktop

`claude_desktop_config.json`(macOS에서는 `~/Library/Application Support/Claude/claude_desktop_config.json`)을 편집합니다.

```json
{
  "mcpServers": {
    "contextlint": {
      "command": "npx",
      "args": ["@contextlint/mcp-server"]
    }
  }
}
```

### Cursor

`.cursor/mcp.json`(프로젝트 고유) 또는 `~/.cursor/mcp.json`(사용자 전체)에 같은 형식으로 추가합니다.

```json
{
  "mcpServers": {
    "contextlint": {
      "command": "npx",
      "args": ["@contextlint/mcp-server"]
    }
  }
}
```

### 그 외 호스트

Cline, Codex, Windsurf 등 MCP에 대응하는 호스트들은 대체로 같은 형식의 설정 파일을 채택하고 있습니다. `command`와 `args`를 위와 동일하게 맞추면 동작합니다.

## 제공하는 5가지 도구

MCP 서버는 다음 도구를 공개합니다. AI는 대화 중 필요에 따라 이들을 호출합니다.

| 도구 | 용도 |
| --- | --- |
| `lint` | Markdown 문자열을 직접 전달하여 규칙 검증 |
| `lint-files` | glob 패턴과 설정 파일을 사용해 여러 파일을 검증 |
| `context-graph` | 문서 의존 그래프를 구축하여 반환 |
| `context-slice` | 쿼리(ID / 키워드 / 파일 경로)에 관련된 파일 군을 최소 세트로 추출 |
| `impact-analysis` | 지정 파일의 변경에 의해 직접 / 간접으로 영향을 받는 파일을 분류하여 반환 |

### lint

그 자리에서 전달한 Markdown 콘텐츠를, 명시한 규칙 구성으로 검증합니다. 설정 파일이 필요 없는 임시 검증에 적합합니다.

| 입력 | 타입 | 개요 |
| --- | --- | --- |
| `content` | string | 검증 대상 Markdown |
| `rules` | object[] | 적용할 규칙(`rule`과 임의의 `options`) |

### lint-files

glob 패턴에 일치하는 파일을 `contextlint.config.json`의 설정으로 검증합니다. CLI의 `npx contextlint`와 동일한 동작을 MCP 경유로 호출할 수 있습니다.

| 입력 | 타입 | 개요 |
| --- | --- | --- |
| `patterns` | string[] (선택) | glob 패턴. 생략 시는 config의 `include`, 그것도 없으면 `["**/*.md"]` |
| `configPath` | string(선택) | 설정 파일 경로. 생략 시는 부모 디렉터리를 거슬러 올라 자동 감지 |
| `cwd` | string(선택) | 작업 디렉터리 |

### context-graph

문서 간의 의존 그래프를 구축하여 반환합니다. `format: "json"`을 지정하면 구조화된 JSON, 생략 시는 사람이 읽을 수 있는 요약 형식이 됩니다. AI에게 "저장소의 전체상을 파악시키는" 용도로 유용합니다.

### context-slice

ID(예: `REQ-101`), 키워드, 파일 경로를 `query`에 전달하면 그에 관련된 파일의 최소 세트를 반환합니다. `depth`로 따라가는 깊이를 제어할 수 있습니다(기본값 2). AI 컨텍스트에 무관한 파일을 보내지 않아도 되므로, 토큰 소비를 억제하면서 정확한 참조를 전달할 수 있습니다.

### impact-analysis

파일이 변경되었을 때 영향을 받는 문서를 **직접(직접 참조되고 있음)**과 **간접(참조 연쇄로 도달 가능)**으로 분류하여 반환합니다. 리팩터링이나 삭제 전 안전성 확인에 사용합니다.

## 설정 파일과의 관계

`lint-files` / `context-graph` / `context-slice` / `impact-analysis`는 모두 `contextlint.config.json`을 참조합니다. 설정 파일을 찾을 수 없는 경우 에러를 반환하므로, 먼저 [contextlint-init Skill](/ko/docs/integrations/ai-agents/skill-init/) 또는 [Quick Start — 수동](/ko/docs/get-started/quick-start-manual/)으로 셋업을 마쳐 주세요.

## CLI와의 관계

MCP 서버와 CLI는 같은 `@contextlint/core`의 `lintFiles` 파이프라인을 사용합니다. 출력 포맷도 양쪽 모두 일치시켜 두었기 때문에, AI가 MCP에서 얻은 결과와 사람이 CLI에서 얻은 결과는 일치합니다.
