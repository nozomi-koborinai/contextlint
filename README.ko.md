# contextlint

구조화된 Markdown 문서를 위한 규칙 기반 린터.

## 왜 contextlint인가?

AI 주도 개발이 주류가 되어가는 현대에,
사양서를 먼저 Markdown으로 작성하고
이를 바탕으로 AI가 구현을 생성하는
SDD(Spec Driven Development: 사양 주도 개발)와
같은 방법론이 주목받고 있습니다.
프로젝트가 문서 주도 워크플로우를 채택함에 따라,
상호 연관된 Markdown 파일의 수는 증가합니다:
요구사항 정의, 설계 결정, API 사양,
ADR(Architecture Decision Records:
아키텍처 결정 기록),
RFC(Request for Comments: 의견 요청) 등.

이러한 문서들은 의존 관계 그래프를 형성합니다.
특정 ID가 다른 ID를 참조하고,
파일 간에 링크가 연결되며,
상태의 안정성이 하류로 전파됩니다.
이 그래프가 깨질 때(삭제된 요구사항,
오타가 있는 ID, 누락된 섹션 등),
그 영향은 조용히 발생합니다.
또한 LLM(대규모 언어 모델) 기반 리뷰는
본질적으로 비결정적이므로,
구조적 불일치를 감지하는 수단으로
LLM에만 의존하는 것은 한계가 있습니다.

contextlint는 구조화된 Markdown에 대해
**결정론적 정적 검증**을 제공합니다.
끊어진 참조, 중복 ID, 누락된 섹션,
구조적 문제를 몇 초 만에 감지합니다.
AI를 사용하지 않아 비용이 들지 않으며,
CI(지속적 통합)와의 호환성도 뛰어납니다.

### contextlint가 검사하는 것 (그리고 하지 않는 것)

contextlint는 **콘텐츠의 의미적 정합성**과
**파일 간 무결성**에 특화되어 있습니다.
Markdown 구문, 포맷, 스타일에 대해서는
contextlint와 함께
[markdownlint](https://github.com/DavidAnson/markdownlint)를
사용해 주세요.
이 둘은 서로 보완적인 관계입니다.

| 검증 도메인 | 도구 |
| -------- | ------ |
| 테이블 포맷, 제목 스타일, 줄 길이 | markdownlint |
| 테이블 내용 (ID, 필수 컬럼, 값 검증) | contextlint |
| Markdown 구문 및 스타일 | markdownlint |
| 파일 간 참조, 추적성, 링크 무결성 | contextlint |
| 섹션 커버리지, 파일 구조 | contextlint |

## 설치

```bash
npm install -D @contextlint/cli
```

또는 설치 없이 바로 실행할 수도 있습니다:

```bash
npx @contextlint/cli --config contextlint.config.json "docs/**/*.md"
```

## 패키지 구성

| 패키지 | 설명 |
| --------- | ------------- |
| `@contextlint/core` | 규칙 엔진 및 Markdown 파서 |
| `@contextlint/cli` | CLI 진입점 (`contextlint` 명령어) |
| `@contextlint/mcp-server` | AI 도구 연동을 위한 MCP 서버 |

## 사용법

### 설정 파일 사용

```bash
contextlint --config contextlint.config.json "docs/**/*.md"
```

`contextlint.config.json` 설정 예시:

```jsonc
{
  // $schema를 추가하면 VS Code, Cursor, JetBrains 등의 편집기에서 자동 완성이 활성화됩니다
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
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
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } }
  ]
}
```

### CI (GitHub Actions)에서 사용

```yaml
- run: npx @contextlint/cli --config contextlint.config.json "docs/**/*.md"
```

### MCP 서버로 사용

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
| ------ | ------------- |
| `lint` | 지정된 규칙으로 Markdown 콘텐츠를 직접 검사 |
| `lint-files` | 설정 파일을 사용하여 패턴에 맞는 파일을 검사 |

## 규칙 상세

### 테이블 규칙

| ID | 설명 | 설정 항목 |
| ---- | ------------- | -------- |
| TBL-001 | 테이블에 필수 컬럼이 존재해야 함 | `requiredColumns`, `section`(선택), `files`(선택) |
| TBL-002 | 주요 컬럼에 빈 셀이 없어야 함 | `columns`, `files`(선택) |
| TBL-003 | 컬럼 값이 허용된 집합에 포함되어야 함 | `column`, `values`, `files`(선택) |
| TBL-004 | 셀 값이 정규표현식과 일치해야 함 | `column`, `pattern`, `files`(선택) |
| TBL-005 | 컬럼 간 조건부 제약 검증 | `when`, `then`, `section`(선택), `files`(선택) |
| TBL-006 | 지정 파일 간 ID가 고유해야 함 | `files`, `column`, `idPattern` |

### 섹션 / 구조 규칙

| ID | 설명 | 설정 항목 |
| ---- | ------------- | -------- |
| SEC-001 | 문서에 필수 섹션이 존재해야 함 | `sections`, `files`(선택) |
| SEC-002 | 섹션이 지정된 순서로 나열되어야 함 | `order`, `level`(선택), `section`(선택), `files`(선택) |
| STR-001 | 프로젝트에 필수 파일이 존재해야 함 | `files` |

### 참조 규칙

| ID | 설명 | 설정 항목 |
| ---- | ------------- | -------- |
| REF-001 | Markdown 링크 대상이 실재해야 함 | `exclude`(선택) |
| REF-002 | ID 정의와 참조의 정합성이 유지되어야 함 | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | 의존 관계에서 안정성 순서가 지켜져야 함 | `stabilityColumn`, `stabilityOrder`, `definitions`, `references` |
| REF-004 | 영역 간 링크가 개요 파일에서 선언되어야 함 | `zonesDir`, `dependencySection` |
| REF-005 | 앵커 프래그먼트가 대상 파일의 제목과 일치해야 함 | `files`(선택) |
| REF-006 | 이미지 참조가 실재하는 파일을 가리켜야 함 | `exclude`(선택) |

### 체크리스트 규칙

| ID | 설명 | 설정 항목 |
| ---- | ------------- | -------- |
| CHK-001 | 체크리스트의 모든 항목이 체크되어야 함 | `section`(선택), `files`(선택) |

### 활용 사례

이러한 규칙들은 범용적으로 설계되었습니다:

- **SDD(사양 주도 개발)** — 사양서가 기존 요구사항을
  참조하고 있는지, 파일 간 ID에 모순이 없는지 검증
- **ADR(아키텍처 결정 기록)** — 모든 ADR에
  필수 섹션(Status, Context, Decision)이
  포함되어 있는지, 상태 전환이 올바른지 확인
- **RFC(의견 요청)** — RFC 문서에 필요한 제목이 포함되어 있는지, 제안 간 상호 참조가 깨지지 않았는지 확인
- **모든 구조화된 Markdown 프로젝트** — CI에서 끊어진 링크, 중복 ID, 누락된 파일을 자동으로 감지

## 라이선스

MIT
