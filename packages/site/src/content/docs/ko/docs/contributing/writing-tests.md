---
title: 테스트 작성 방법
description: contextlint의 테스트 규약, 그리고 일본어·한국어·중국어 픽스처가 필수인 이유.
---

contextlint의 테스트는 모두 [`bun:test`](https://bun.sh/docs/cli/test)로 작성합니다. 각 규칙에는 유닛 테스트가 필수이며, 특히 **일본어·한국어·중국어 테스트 픽스처**를 포함하는 것이 규약으로 정해져 있습니다. 이 페이지에서는 테스트 파일의 배치와 테스트 러너 사용법, CJK 요건의 이유를 설명합니다.

## 파일 배치

테스트 파일은 규칙 본체와 같은 디렉터리에, `<rule-id>.test.ts` 패턴으로 배치합니다.

```text
packages/core/src/rules/
├── tbl-001.ts
├── tbl-001.test.ts
├── tbl-002.ts
├── tbl-002.test.ts
└── ...
```

빌드 시에는 `tsconfig.json`의 설정으로 테스트 파일을 제외하지만, ESLint와 타입 체크(`tsconfig.eslint.json`)의 대상에는 포함됩니다. 테스트 코드도 본체 코드와 같은 strict 설정으로 작성해야 합니다.

## bun:test의 기본

`bun:test`는 `describe` / `it` / `expect`를 제공합니다. Markdown을 직접 string으로 전달하고, `parseDocument`로 파싱한 후 `runRules`를 실행하는 흐름이 정형입니다.

```typescript
import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
```

테스트 안에서 사용하는 패스는 `"test.md"`와 같은 임의의 문자열로 충분합니다. `files` 옵션의 테스트에서는 매칭시키고 싶은 패스를 명시적으로 전달합니다.

## 테스트해야 할 관점

각 규칙에는 최소한, 아래의 관점에 대한 테스트를 포함해 주세요.

- **정상계** — 위반이 없는 Markdown에서 메시지가 0건
- **위반 검출** — 위반이 있는 Markdown에서 기대대로 메시지가 출력 (건수·`ruleId`·`severity`·`message`의 주요 부분)
- **복수 위반** — 같은 파일 안에서 복수의 위반이 병렬로 검출
- **옵션 분기** — `section`, `files`, 컬럼 이름 지정, 허용 값 리스트 등, 각 옵션이 의도대로 좁히기에 작용
- **CJK 픽스처** — 일본어·한국어·중국어 제목, 컬럼 이름, 셀 값에서의 검증 (후술)

## CJK 언어의 테스트 픽스처는 필수

각 규칙에는 **일본어·한국어·중국어**의 테스트 픽스처가 필수입니다. 이는 contextlint의 핵심적인 규약입니다.

### 왜 필수인가

contextlint는 국제화된 Markdown을 다루므로, CJK 문자(중일한)를 포함하는 컬럼 이름·섹션 제목·셀 값·ID가 **올바르게 파싱·비교되는** 것을 보장할 필요가 있습니다. CJK 문자는 다음과 같은 점에서 ASCII와 동작이 다를 가능성이 있습니다.

- **정규화** — Unicode 정규화(NFC / NFD)를 경유하는 패스에서, 합성 문자가 분해되면 일치하지 않게 됨
- **트림** — 전각 공백(U+3000)이 ASCII의 `trim()`으로 제거되지 않음
- **정규표현식** — `\w`나 `\b`는 ASCII 상정이며, 중일한 문자에 대한 동작이 직관에 반할 수 있음
- **비교** — 테이블 헤더나 섹션 이름의 문자열 비교가, 반각·전각이나 보기에 비슷한 다른 글자로 인해 실패

영어 테스트만으로는 이러한 문제가 표면화되지 않습니다. CJK 언어 사용자가 contextlint를 운영에 투입했을 때 비로소 검출되는 버그가 됩니다. 그것을 방지하기 위해, **규칙 구현 측에서 언어에 의존하지 않는 처리를 작성하고 있는 것을 테스트로 담보**한다는 규약으로 되어 있습니다.

### 작성법

각 규칙에, 3개 언어분의 **정상계와 위반 검출** 페어로 테스트를 추가합니다. `tbl-001.test.ts`를 예로 들면 다음과 같은 형태입니다.

```typescript
it("validates required columns with Japanese column names", () => {
  const md = `
| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-01 | ユーザー認証 | draft |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  expect(runRules([rule], doc, "test.md")).toHaveLength(0);
});

it("reports missing Japanese column names", () => {
  const md = `
| ID | 要件 |
|----|------|
| REQ-01 | ユーザー認証 |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  const messages = runRules([rule], doc, "test.md");
  expect(messages).toHaveLength(1);
  expect(messages[0].message).toContain("安定度");
});
```

한국어(`요구사항` / `안정성`)와 중국어(`需求` / `稳定性`)에서도 같은 페어를 추가해 주세요. 체크리스트 규칙이나 섹션 규칙이라면, 제목이나 체크리스트 항목의 문구를 CJK로 바꿔 작성한 픽스처를 준비합니다.

## 테스트 실행

리포지터리의 루트에서 아래를 실행하면, 전체 패키지의 테스트가 한꺼번에 실행됩니다.

```bash
bun test
```

특정 규칙으로 좁혀서 실행하고 싶은 경우에는, 파일 이름으로 좁힐 수 있습니다.

```bash
bun test packages/core/src/rules/tbl-001.test.ts
```

테스트가 통과한 후, 타입 체크·빌드·ESLint도 함께 확인하시기를 권장합니다.

```bash
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

## 관련

- [새로운 규칙 추가](/ko/docs/contributing/adding-a-new-rule/) — 테스트 추가를 포함한 규칙 구현의 전체 흐름
- [개발 환경 셋업](/ko/docs/contributing/development-setup/) — bun 셋업과 명령어 목록
