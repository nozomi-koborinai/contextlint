# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

구조화된 Markdown 문서를 위한 규칙 기반 린터.
끊어진 참조, 중복 ID, 누락된 섹션, 구조적 문제를
결정론적으로, 몇 초 만에, CI 친화적으로 감지합니다.

## 왜 contextlint인가?

AI 주도 개발이 주류가 되어가는 현대에,
사양서를 먼저 Markdown으로 작성하고
이를 바탕으로 AI가 구현을 생성하는
SDD(Spec Driven Development: 사양 주도 개발)와
같은 방법론이 주목받고 있습니다.
프로젝트가 문서 주도 워크플로우를 채택함에 따라,
상호 연관된 Markdown 파일의 수는 증가합니다:
요구사항 정의, 설계 결정, API 사양, ADR, RFC 등.

이러한 문서들은 의존 관계 그래프를 형성합니다.
특정 ID가 다른 ID를 참조하고,
파일 간에 링크가 연결되며,
상태의 안정성이 하류로 전파됩니다.
이 그래프가 깨질 때(삭제된 요구사항,
오타가 있는 ID, 누락된 섹션 등),
그 영향은 조용히 발생합니다.

contextlint는 구조화된 Markdown에 대해
**결정론적 정적 검증**을 제공합니다.
AI 불필요, 비용 제로, CI 친화적입니다.

> contextlint는 **콘텐츠의 의미적 정합성**과
> **파일 간 무결성**에 특화되어 있습니다.
> Markdown 구문, 포맷, 스타일에 대해서는
> contextlint와 함께
> [markdownlint](https://github.com/DavidAnson/markdownlint)를
> 사용해 주세요. 이 둘은 서로 보완적인 관계입니다.

## 빠른 시작

설치:

```bash
npm install -D @contextlint/cli
```

`contextlint.config.json` 생성:

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

실행:

```bash
npx contextlint
```

contextlint는 현재 디렉터리 또는 상위 디렉터리에서
`contextlint.config.json`을 자동 감지합니다. `include` 필드로
기본 대상 파일을 지정할 수 있으며, CLI 인수로 재정의할 수 있습니다.
둘 다 지정하지 않으면 `**/*.md`가 사용됩니다.

출력 예시:

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

> `$schema`를 추가하면 VS Code, Cursor, JetBrains 등의 편집기에서
> 자동 완성이 활성화됩니다.

## 규칙 목록

### 테이블 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| TBL-001 | 테이블에 필수 컬럼이 존재해야 함 | `requiredColumns`, `section`?, `files`? |
| TBL-002 | 주요 컬럼에 빈 셀이 없어야 함 | `columns`?, `files`? |
| TBL-003 | 컬럼 값이 허용된 집합에 포함되어야 함 | `column`, `values`, `files`? |
| TBL-004 | 셀 값이 정규표현식과 일치해야 함 | `column`, `pattern`, `files`? |
| TBL-005 | 컬럼 간 조건부 제약 검증 | `when`, `then`, `section`?, `files`? |
| TBL-006 | 지정 파일 간 ID가 고유해야 함 | `files`, `column`, `idPattern`? |

### 섹션 / 구조 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| SEC-001 | 문서에 필수 섹션이 존재해야 함 | `sections`, `files`? |
| SEC-002 | 섹션이 지정된 순서로 나열되어야 함 | `order`, `level`?, `section`?, `files`? |
| STR-001 | 프로젝트에 필수 파일이 존재해야 함 | `files` |

### 참조 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| REF-001 | Markdown 링크 대상이 실재해야 함 | `exclude`? |
| REF-002 | ID 정의와 참조의 정합성이 유지되어야 함 | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | 의존 관계에서 안정성 순서가 지켜져야 함 | `stabilityColumn`, `stabilityOrder`, `definitions`, `references`, `idColumn`?, `idPattern`? |
| REF-004 | 영역 간 링크가 개요 파일에서 선언되어야 함 | `zonesDir`, `dependencySection`? |
| REF-005 | 앵커 프래그먼트가 대상 파일의 제목과 일치해야 함 | `files`? |
| REF-006 | 이미지 참조가 실재하는 파일을 가리켜야 함 | `exclude`? |

### 체크리스트 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| CHK-001 | 체크리스트의 모든 항목이 체크되어야 함 | `section`?, `files`? |

### 컨텍스트 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| CTX-001 | 섹션에 플레이스홀더가 아닌 실질적인 내용이 있어야 함 | `section`?, `placeholders`?, `files`? |
| CTX-002 | 용어가 용어집 정의와 일치해야 함 | `glossary`, `termColumn`, `aliasColumn`, `section`?, `files`? |

### 그래프 규칙

| ID | 설명 | 설정 항목 |
| --- | --- | --- |
| GRP-001 | 모든 ID가 문서 체인의 전 단계에서 추적 가능해야 함 | `chain`, `idPattern`? |
| GRP-002 | 문서 참조 그래프가 비순환이어야 함 (순환 참조 감지) | `files`?, `exclude`? |
| GRP-003 | 모든 문서에 최소 하나의 수신 참조가 있어야 함 | `files`?, `entryPoints`? |

## 설정 레퍼런스

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",

  // 기본 대상 파일 패턴 (CLI에서 파일을 지정하지 않을 때 사용)
  "include": ["docs/**/*.md"],

  "rules": [
    // TBL-001: 테이블에 필수 컬럼이 존재해야 함
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status", "Description"], "files": "**/requirements.md" } },

    // TBL-002: 주요 컬럼에 빈 셀이 없어야 함
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"], "files": "**/requirements.md" } },

    // TBL-003: 컬럼 값이 허용된 집합에 포함되어야 함
    { "rule": "tbl003", "options": { "column": "Status", "values": ["draft", "review", "stable"], "files": "**/requirements.md" } },

    // TBL-004: 셀 값이 정규표현식 패턴과 일치해야 함
    { "rule": "tbl004", "options": { "column": "ID", "pattern": "^[A-Z]+-[A-Z]+-\\d{2}$", "files": "**/requirements.md" } },

    // TBL-005: 한 컬럼이 조건을 만족할 때 다른 컬럼이 제약을 만족해야 함
    { "rule": "tbl005", "options": { "when": { "column": "Status", "equals": "Done" }, "then": { "column": "Date", "notEmpty": true } } },

    // TBL-006: 지정된 모든 파일에서 ID가 고유해야 함
    { "rule": "tbl006", "options": { "files": "**/requirements.md", "column": "ID" } },

    // SEC-001: 문서에 필수 섹션이 존재해야 함
    { "rule": "sec001", "options": { "sections": ["Overview", "Requirements"], "files": "**/overview.md" } },

    // SEC-002: 섹션이 지정된 순서로 나열되어야 함
    //   기본 — 파일 전체에서 순서를 검사:
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"] } },
    //   level 지정 — 상위 제목별로 그룹화하여 각 그룹을 독립 검사:
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"], "level": 3, "files": "**/spec.md" } },
    //   section 지정 — 특정 상위 그룹만 검사:
    { "rule": "sec002", "options": { "order": ["Endpoints", "Error Handling"], "level": 3, "section": "API" } },

    // STR-001: 프로젝트에 필수 파일이 존재해야 함
    { "rule": "str001", "options": { "files": ["docs/overview.md", "docs/requirements.md"] } },

    // CHK-001: 체크리스트의 모든 항목이 체크되어야 함
    { "rule": "chk001", "options": { "section": "Review Checklist", "files": "docs/reviews/*.md" } },

    // CTX-001: 섹션에 플레이스홀더가 아닌 실질적인 내용이 있어야 함
    { "rule": "ctx001", "options": { "section": "Overview", "files": "docs/**/*.md" } },

    // REF-001: 상대 경로 Markdown 링크가 실재하는 파일을 가리켜야 함
    { "rule": "ref001", "options": { "exclude": ["_references/**"] } },

    // REF-002: 정의된 ID가 참조되어야 하며, 참조된 ID가 존재해야 함
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/design.md", "**/overview.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-"
      }
    },

    // REF-003: 의존 항목의 안정성을 초과하는 안정성을 가질 수 없음
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Status",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/design.md"]
      }
    },

    // REF-004: 영역 간 링크가 해당 영역의 개요에서 선언되어야 함
    { "rule": "ref004", "options": { "zonesDir": "docs/zones" } },

    // REF-005: 앵커 프래그먼트가 대상 파일의 제목과 일치해야 함
    { "rule": "ref005", "options": { "files": "docs/**/*.md" } },

    // REF-006: 이미지 참조가 실재하는 파일을 가리켜야 함
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } },

    // GRP-001: 모든 ID가 문서 체인의 전 단계에서 추적 가능해야 함
    {
      "rule": "grp001",
      "options": {
        "chain": [
          { "stage": "Requirements", "files": "**/requirements.md", "idColumn": "ID" },
          { "stage": "Design", "files": "**/design.md", "refColumn": "Requirement" },
          { "stage": "Test", "files": "**/test-plan.md", "refColumn": "Covers" }
        ],
        "idPattern": "^REQ-\\d{3}$"
      }
    },

    // GRP-002: 문서 참조 그래프가 비순환이어야 함 (순환 참조 감지)
    { "rule": "grp002", "options": { "files": "docs/**/*.md", "exclude": ["CHANGELOG.md"] } }
    // GRP-003: 모든 문서에 최소 하나의 수신 참조가 있어야 함
    { "rule": "grp003", "options": { "files": "docs/**/*.md", "entryPoints": ["README.md", "index.md"] } }
  ]
}
```

## 활용 사례

이러한 규칙들은 범용적으로 설계되었습니다:

- **SDD(사양 주도 개발)** — 사양서가 기존 요구사항을
  참조하고 있는지, 파일 간 ID에 모순이 없는지 검증
- **ADR(아키텍처 결정 기록)** — 모든 ADR에
  필수 섹션(Status, Context, Decision)이
  포함되어 있는지, 상태 전환이 올바른지 확인
- **RFC(의견 요청)** — RFC 문서에 필요한 제목이
  포함되어 있는지, 제안 간 상호 참조가
  깨지지 않았는지 확인
- **모든 구조화된 Markdown 프로젝트** — CI에서 끊어진 링크,
  중복 ID, 누락된 파일을 자동으로 감지

## CLI 옵션

| 옵션 | 설명 |
| ---- | --- |
| `[files...]` | 검사할 파일 또는 glob 패턴 (설정의 `include`를 재정의) |
| `--config <path>` | `contextlint.config.json` 경로 |
| `--format <format>` | 출력 형식: `human` (기본값) 또는 `json` |
| `--cwd <path>` | 작업 디렉터리 |

### JSON 출력

`--format json`을 사용하면 기계 판독 가능한 출력을 얻을 수 있습니다 (CI 및 편집기 연동에 유용합니다):

```bash
npx contextlint --format json
```

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  }
]
```

## CI 통합

### GitHub Actions

이 저장소에는 바로 사용할 수 있는 복합 액션이 포함되어 있습니다.
`--format json`으로 contextlint를 실행하고 PR에 인라인 주석을 생성합니다.

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # 선택 사항
        #   files: 'docs/**/*.md'              # 선택 사항
        #   version: 'latest'                  # 선택 사항
```

또는 직접 실행:

```yaml
- run: npx @contextlint/cli
```

## 워치 모드

파일 변경 시 자동으로 재검증을 수행합니다:

```bash
npx contextlint --watch
npx contextlint --watch docs/**/*.md
npx contextlint --watch --config contextlint.config.json
```

워치 모드는 먼저 초기 전체 검사를 실행한 후,
작업 디렉터리의 `.md` 파일 변경을 감시합니다.
변경이 감지되면 매칭되는 **모든** 파일을 재검사하고
(REF-002, TBL-006 등 크로스 파일 규칙에 필요),
터미널을 지우고 타임스탬프와 함께 최신 결과를 표시합니다.
연속적인 빠른 변경은 300밀리초 디바운스 처리됩니다.
Ctrl+C로 종료합니다.

## MCP 서버

contextlint는
[MCP](https://modelcontextprotocol.io/)(Model Context Protocol)
서버로 동작하여 Claude나 Cursor 같은 AI 도구가
대화 중에 Markdown 문서를 검사할 수 있게 합니다.

```bash
npm install -D @contextlint/mcp-server
```

`mcp.json`(예: `.cursor/mcp.json` 또는 `claude_desktop_config.json`)에 추가합니다:

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

사용 가능한 도구:

| 도구 | 설명 |
| --- | --- |
| `lint` | 지정된 규칙으로 Markdown 콘텐츠를 직접 검사 |
| `lint-files` | 설정 파일을 사용하여 패턴에 맞는 파일을 검사 |
| `context-graph` | 프로젝트의 문서 의존 관계 그래프를 구축하여 반환 |

## 프로그래밍 API

### 컨텍스트 그래프

`@contextlint/core`는 문서 의존 관계를 프로그래밍 방식으로 분석하기 위한
컨텍스트 그래프 API를 제공합니다. Markdown 문서 간의 관계를 이해해야 하는
도구를 구축하는 데 유용합니다.

```typescript
import {
  parseDocument,
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
} from "@contextlint/core";
import type { ContextGraph, GraphNode, GraphEdge } from "@contextlint/core";
```

| 함수 | 설명 |
| ---- | --- |
| `buildContextGraph(documents)` | 파싱된 문서에서 의존 관계 그래프를 구축 |
| `getImpactSet(graph, filePath)` | 지정 파일 변경 시 영향받는 모든 파일을 조회 (직접 + 간접) |
| `getContextSlice(graph, documents, query, maxDepth?)` | 쿼리(파일 경로 또는 ID)에 관련된 최소 파일 집합을 조회 |
| `topologicalSort(graph)` | 문서 그래프의 위상 정렬 (의존 순서) |
| `getComponents(graph)` | 연결 컴포넌트 조회 (관련 파일 클러스터) |

사용 예시:

```typescript
import { readFileSync } from "node:fs";
import { parseDocument, buildContextGraph, getImpactSet } from "@contextlint/core";

// 문서 파싱
const documents = new Map();
documents.set("docs/overview.md", parseDocument(readFileSync("docs/overview.md", "utf-8")));
documents.set("docs/requirements.md", parseDocument(readFileSync("docs/requirements.md", "utf-8")));
documents.set("docs/design.md", parseDocument(readFileSync("docs/design.md", "utf-8")));

// 그래프 구축
const graph = buildContextGraph(documents);

// requirements.md가 변경되면 어떤 파일이 영향을 받나요?
const impacted = getImpactSet(graph, "docs/requirements.md");
// => ["docs/design.md", "docs/overview.md"]
```

## 패키지 구성

| 패키지 | 설명 |
| --- | --- |
| `@contextlint/core` | 규칙 엔진 및 Markdown 파서 |
| `@contextlint/cli` | CLI 진입점 (`contextlint` 명령어) |
| `@contextlint/mcp-server` | AI 도구 연동을 위한 MCP 서버 |

## 관련 자료

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## 라이선스

[MIT](LICENSE)
