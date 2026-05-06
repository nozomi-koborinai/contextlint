# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![lsp-server downloads](https://img.shields.io/npm/dm/@contextlint/lsp-server.svg?label=lsp-server%20downloads)](https://www.npmjs.com/package/@contextlint/lsp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

구조화된 Markdown 문서를 위한 규칙 기반 린터.
링크 깨짐, ID 중복, 섹션 누락, 구조적 문제를
결정론적으로, 수 초 안에, CI 친화적으로 검출합니다.

> 📚 상세 레퍼런스와 가이드: **<https://contextlint.dev>**

## 왜 contextlint인가?

AI 주도 워크플로(SDD: Spec Driven Development 등)에서 Markdown 문서는
의존 관계 그래프를 형성합니다. 요구 사항이 ID를 참조하고, 설계서가 사양에
링크하고, ADR이 서로를 참조합니다. 이 그래프가 조용히 깨지면(요구 사항이
삭제됨, ID 오타, 섹션 누락) 결과는 읽는 시점에야 드러납니다.

contextlint는 구조화된 Markdown을 위한
**결정론적인 정적 검증**을 제공합니다. AI 불필요, 비용 없음, CI 친화적.

> contextlint는 **콘텐츠 시맨틱과 파일 횡단 정합성**에 집중합니다.
> Markdown의 syntax / formatting / style은
> [markdownlint](https://github.com/DavidAnson/markdownlint)와 함께
> 사용하는 것을 권장합니다. 둘은 보완 관계입니다.

## 빠른 시작

**AI 지원 셋업(권장)** — Claude Code, Cursor, Codex, Gemini CLI,
GitHub Copilot 등 [Agent Skills](https://agentskills.io) 호환 클라이언트용.
GitHub CLI **v2.90 이상** 필요:

```sh
gh skill install nozomi-koborinai/contextlint contextlint-init
```

이후 에이전트에게 "contextlint 셋업해줘"라고 지시하세요.
Skill이 저장소 레이아웃을 감지하고, 규칙을 추론하고, CLI를 설치하고,
`contextlint.config.json`을 작성해 줍니다.

**수동 셋업**:

```bash
npm install -D @contextlint/cli
npx contextlint init
npx contextlint
```

출력 예:

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

## 규칙

contextlint는 **21개 규칙**을 7개 카테고리로 제공합니다:

| Prefix | 카테고리 | 검증 내용 | 개수 |
| --- | --- | --- | --- |
| TBL | Table | 필수 컬럼, 빈 셀, 허용 값, 패턴, 컬럼 간 제약, 파일 횡단 ID 유일성 | 6 |
| SEC | Section | 섹션 헤딩의 존재 및 순서 | 2 |
| STR | Structure | 프로젝트 전체에서의 파일 존재 | 1 |
| REF | Reference | 링크, 앵커, ID 참조, Stability 정합성, Zone 의존, 이미지 참조 | 6 |
| CHK | Checklist | 체크리스트 항목 완료 상태 | 1 |
| CTX | Context | 플레이스홀더 검출, 용어 정합성 | 2 |
| GRP | Graph | 트레이서빌리티 체인, 순환 참조, 고립 문서 | 3 |

각 규칙의 자세한 내용은 [Rules](https://contextlint.dev/ko/docs/rules/)를 참조하세요.

## 더 알아보기

`lint` 외의 명령(`init`, `impact`, `slice`, `graph`, `compile`,
`--watch`)은 `npx contextlint --help`로 확인할 수 있습니다. 자세한 내용은 다음 문서를 참조하세요:

| 토픽 | 링크 |
| --- | --- |
| Get Started | <https://contextlint.dev/ko/docs/get-started/> |
| 설정 레퍼런스 | <https://contextlint.dev/ko/docs/configuration/> |
| 규칙 레퍼런스(21개) | <https://contextlint.dev/ko/docs/rules/> |
| CLI 명령과 플래그 | <https://contextlint.dev/ko/docs/integrations/cli/> |
| 에디터 연동(LSP) | <https://contextlint.dev/ko/docs/integrations/editors/> |
| AI 에이전트(MCP, Agent Skills) | <https://contextlint.dev/ko/docs/integrations/ai-agents/> |
| CI/CD 연동 | <https://contextlint.dev/ko/docs/integrations/ci-cd/> |
| Recipes(ADR / SDD / monorepo) | <https://contextlint.dev/ko/docs/recipes/> |
| Graph API(프로그램 활용) | <https://contextlint.dev/ko/docs/graph-api/> |

## 패키지 구성

| 패키지 | 설명 |
| --- | --- |
| `@contextlint/core` | 규칙 엔진 및 Markdown 파서 |
| `@contextlint/cli` | CLI 진입점(`contextlint` 명령) |
| `@contextlint/mcp-server` | AI 도구 연동용 MCP 서버 |
| `@contextlint/lsp-server` | Language Server Protocol 구현 |
| `contextlint-vscode` | VS Code / Cursor 확장 — Marketplace 게시 전까지는 [GitHub Releases](https://github.com/nozomi-koborinai/contextlint/releases)의 VSIX를 설치 |

## 관련 자료

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## 라이선스

[MIT](LICENSE)
