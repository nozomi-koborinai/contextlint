---
title: 개발 환경 셋업
description: contextlint를 로컬에서 동작시키기 위한 리포지터리 구성과 명령어.
---

contextlint는 [bun workspace](https://bun.sh/docs/install/workspaces)를 사용하는 모노레포입니다. 이 페이지에서는 리포지터리를 clone한 후, 빌드·테스트·타입 체크·lint를 실행할 수 있는 상태가 되기까지의 절차를 설명합니다.

## 전제

| 도구 | 버전 | 용도 |
|--------|-----------|------|
| [Bun](https://bun.sh/) | `1.3.x` 이상 | 패키지 매니저·테스트 러너 |
| Node.js | `22` 이상 | 런타임 (CLI / MCP / LSP는 Node 위에서 동작) |
| Git | — | 리포지터리 조작 |

`packageManager` 필드로 Bun의 버전을 고정하고 있으므로, Bun을 사용하시기를 권장합니다.

## 클론과 의존성 설치

```bash
git clone https://github.com/nozomi-koborinai/contextlint.git
cd contextlint
bun install
```

`bun install`은 workspace 내의 모든 패키지(`@contextlint/core`, `@contextlint/cli`, `@contextlint/mcp-server`, `@contextlint/lsp-server`, `contextlint-vscode`, site)를 일괄 셋업합니다.

## 리포지터리 구성

contextlint는 `packages/` 아래에 다음과 같이 배치되어 있습니다.

| Package | 역할 |
|---------|------|
| `@contextlint/core` | 규칙 엔진, Markdown 테이블 파서, Context Graph API |
| `@contextlint/cli` | `contextlint` 명령어의 진입점 |
| `@contextlint/mcp-server` | AI 도구 연동을 위한 MCP 서버 (5 도구) |
| `@contextlint/lsp-server` | 에디터 통합을 위한 LSP 서버 |
| `contextlint-vscode` | VS Code / Cursor 확장 기능 |
| `site` | `contextlint.dev` 랜딩 페이지와 문서 (Astro) |

리포지터리 전체의 아키텍처는 [Architecture](https://github.com/nozomi-koborinai/contextlint/blob/main/docs/architecture.md)를 참조하세요.

### 코어와 consumer의 책임 분리

lint 파이프라인(`lintFiles`), 설정 파일 로드(`findConfig` / `loadConfig`), 결과 포맷(`formatFileResults` / `formatContentResults`)는 모두 `@contextlint/core`에 집약되어 있습니다. `@contextlint/cli`와 `@contextlint/mcp-server`는 이를 import할 뿐이며, **consumer 측에서 파이프라인이나 설정 처리를 재구현해서는 안 됩니다**.

`lintFiles`는 의도적으로 동기 API(`globSync` + `readFileSync`)로 설계되어 있습니다. 비동기로 만들지 마세요.

## 주요 명령어

리포지터리의 루트에서 실행합니다.

| 명령어 | 내용 |
|---------|------|
| `bun run --filter '*' build` | 전체 패키지를 `tsc`로 빌드 |
| `bun test` | 전체 패키지의 테스트를 `bun:test`로 실행 |
| `bun run --filter '*' typecheck` | 전체 패키지의 타입 체크 |
| `npx eslint .` | TypeScript를 ESLint로 lint |
| `bunx markdownlint-cli2 "README*.md"` | README 파일의 Markdown lint |

특정 패키지만 빌드하고 싶은 경우에는 `--filter`의 값을 패키지 이름으로 변경합니다 (예: `bun run --filter '@contextlint/core' build`).

## TypeScript와 ESLint 설정

contextlint는 strict 설정을 채택하고 있습니다. 코드를 작성할 때에는 아래 사항을 지켜 주세요.

- **`strict` + `noUncheckedIndexedAccess`** — 배열이나 객체의 인덱스 접근은 `T | undefined` 타입이 됩니다.
- **`verbatimModuleSyntax`** — 타입만을 import할 때에는 반드시 `import type`을 붙입니다.
- **ESM** — 모든 패키지는 `"type": "module"`입니다.
- **`any` 금지** — `JSON.parse`의 결과 등, 암묵적인 `any`도 `no-unsafe-assignment`로 검출됩니다.
- **`!` non-null assertion 금지** — `if (!x) throw new Error(...)`와 같은 가드로 타입을 좁혀 주세요.
- **`as` 캐스트 불필요** — 규칙 구현에서는 Zod schema의 `parse`로 options가 검증된 상태이므로, `as`는 사용하지 않습니다.

ESLint의 설정은 `eslint.config.mjs`이며, TypeScript는 패키지별 `tsconfig.json`(빌드용, 테스트 제외)과 `tsconfig.eslint.json`(lint용, 테스트 포함)의 두 계통입니다.

## 동작 확인

셋업이 올바르게 완료되었는지 확인하려면, 아래를 실행하여 모두 성공하는지 확인합니다.

```bash
bun run --filter '*' build
bun test
bun run --filter '*' typecheck
npx eslint .
```

여기까지 통과한다면, 새로운 규칙 추가나 버그 수정을 시작할 수 있는 상태입니다.

## 다음 단계

- [새로운 규칙 추가](/ko/docs/contributing/adding-a-new-rule/) — 규칙 구현 절차
- [테스트 작성 방법](/ko/docs/contributing/writing-tests/) — 테스트 규약과 CJK 요건
