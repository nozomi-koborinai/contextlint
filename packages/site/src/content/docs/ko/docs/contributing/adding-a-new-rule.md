---
title: 새로운 규칙 추가
description: contextlint에 새로운 규칙을 구현하기 위한 단계별 절차.
---

contextlint에 새로운 규칙을 추가할 때의 절차를, ID 채번부터 `schema.json` 갱신까지 단계별로 설명합니다. 각 규칙은 `packages/core/src/rules/<rule-id>.ts`에 1 파일씩 배치되며, Zod schema를 옵션의 단일 정보원으로 가집니다.

## 1. ID 채번

새로운 규칙은 우선 카테고리를 결정하고, 그 안에서 **다음으로 비어 있는 연번**을 3자리 0 패딩으로 할당합니다.

| Prefix | 카테고리 | 검증 대상 |
|--------|---------|---------|
| TBL | Table | 테이블 내용 (필수 컬럼, 빈 셀, 허용 값, 패턴, 컬럼 간 제약, 파일 간 ID 고유성) |
| SEC | Section | 섹션 제목 (존재, 순서) |
| STR | Structure | 프로젝트 레벨의 파일 존재 |
| REF | Reference | 링크, 앵커, ID 참조, 안정성 정합성, 영역 의존, 이미지 참조 |
| CHK | Checklist | 체크리스트의 완료 상태 |
| CTX | Context | 콘텐츠 품질 (플레이스홀더 검출, 용어 일관성) |
| GRP | Graph | 문서 의존 그래프 (트레이서빌리티, 순환 참조, 고립 문서) |

예를 들어 TBL 카테고리에 새로운 규칙을 추가하는 경우, 기존의 TBL-001~TBL-006의 다음으로서 **TBL-007**을 채번합니다.

규칙 ID 형식은 `<PREFIX>-<3자리>` (문서·로그 표시용)이며, registry 상의 키는 소문자 연결 `<prefix><3자리>` (예: `tbl007`)가 됩니다.

## 2. 규칙 파일 작성

`packages/core/src/rules/<id>.ts`를 작성합니다. 예를 들어 `TBL-007`이라면 `packages/core/src/rules/tbl-007.ts`입니다.

최소 골격은 다음과 같습니다.

```typescript
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { globMatch } from "../utils/glob-match.js";

export const tbl007Schema = z.object({
  // 규칙 고유의 옵션
  files: z.string().optional(),
}).strict();

export type Tbl007Options = z.infer<typeof tbl007Schema>;

export function tbl007(options: Tbl007Options): Rule {
  const isMatch = options.files ? globMatch(`**/${options.files}`) : null;

  return {
    id: "TBL-007",
    description: "Short English description of what this rule checks",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      // 테이블이나 섹션을 순회하며 context.report()로 위반 사항을 보고
    },
  };
}
```

## 3. Zod schema 정의

각 규칙은 **Zod schema를 단일 정보원**으로 합니다. 직접 작성한 interface를 사용하지 말고, `z.infer<typeof xxxSchema>`로 타입을 도출해 주세요.

- 스키마 이름은 `<prefix><number>Schema` (예: `tbl007Schema`)
- 끝에 `.strict()`를 붙여 알 수 없는 필드를 거부
- 정규표현식을 받는 경우에는 `utils/regex-string.ts`의 `regexString`을 사용하여, 설정 로드 시점에 잘못된 패턴을 검출
- 파일 매칭용 `files?: string` 옵션을 받는 규칙은, 변수 이름 `isMatch`, 폴백 `null`, `**/${options.files}` 프리픽스라는 규약을 따른다

registry 측에서 `schema.parse(options)`가 실행되므로, 규칙 본체 안에서 `as` 캐스트나 수동 검증은 불필요합니다.

## 4. registry에 등록

`packages/core/src/registry.ts`를 편집하여, 새로운 규칙을 등록합니다.

```typescript
import { tbl007, tbl007Schema } from "./rules/tbl-007.js";

const registry = {
  // ... 기존 규칙 ...
  tbl007: defineRule(tbl007Schema, tbl007),
};
```

`defineRule`은 schema와 factory를 짝지어, `resolveRule`로부터 `schema.parse()` 경유로 호출 가능하게 만듭니다. `Zod`의 검증 에러는 자동으로 사용자용 메시지(규칙 이름 + 필드 패스 포함)로 변환됩니다.

## 5. `schema.json` 갱신

리포지터리 직하의 `schema.json`은 `contextlint.config.json`의 에디터 자동 보완용 JSON Schema입니다. 새로운 규칙을 추가했다면, 해당하는 엔트리를 `properties.rules.items.oneOf`에 **반드시 추가**해 주세요.

엔트리의 형식은 기존 규칙(TBL-001 등)을 따릅니다.

```json
{
  "type": "object",
  "description": "TBL-007: Short description.",
  "properties": {
    "rule": { "const": "tbl007" },
    "options": {
      "type": "object",
      "description": "Options for TBL-007.",
      "properties": {
        // Zod schema와 일치하는 필드
      },
      "required": ["..."],
      "additionalProperties": false
    }
  },
  "required": ["rule", "options"],
  "additionalProperties": false
}
```

CI 상에서는 `packages/core/src/schema.test.ts`가 registry와 `schema.json`의 정합성을 검증합니다. 엔트리 추가를 잊거나, 등록에서 제외한 오래된 엔트리가 남아 있으면 테스트가 실패합니다.

## 6. 테스트 추가

규칙 파일과 같은 디렉터리에 `<id>.test.ts`를 작성합니다 (예: `packages/core/src/rules/tbl-007.test.ts`).

테스트는 `bun:test`로 작성하며, **정상계·위반 검출·옵션별 동작**에 더해, **일본어·한국어·중국어** 테스트 픽스처를 반드시 포함해 주세요. CJK 요건의 자세한 내용은 [테스트 작성 방법](/ko/docs/contributing/writing-tests/)을 참조하세요.

## 7. 문서 추가

사용자용 문서를 아래의 각 언어별로 추가·갱신합니다.

- `packages/site/src/content/docs/ja/docs/rules/<id>.md` (일본어)
- `packages/site/src/content/docs/en/docs/rules/<id>.md` (영어)
- `packages/site/src/content/docs/ko/docs/rules/<id>.md` (한국어)
- `packages/site/src/content/docs/zh/docs/rules/<id>.md` (중국어)

각 규칙 page는 다음 구성으로 작성합니다.

1. 개요 (무엇을 검출하는가)
2. 왜 필요한가 (어떤 문제를 방지하는가)
3. 옵션 (필드 표)
4. 위반 예와 수정 후 (Bad → Good)
5. 설정 예 (`contextlint.config.json` 발췌)
6. 관련 규칙

추가로, `Rules` 카테고리의 index(각 언어의 `rules/index.md`)에 새로운 규칙으로의 링크를 추가합니다. CLI / 설정 / README에 영향을 주는 변경을 가했다면, 리포지터리 직하의 `README.md` / `README.ja.md` / `README.zh.md` / `README.ko.md`도 **모두** 갱신해 주세요. 하나의 언어만 갱신하는 것은 피해 주세요.

## 8. 동작 확인

마지막으로, 리포지터리 루트에서 아래를 실행하여 모두 통과하는지 확인합니다.

```bash
bun test
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

`schema.test.ts`가 통과한다면 registry와 `schema.json`의 정합성도 유지되고 있습니다.

## 커밋과 Pull Request

Conventional Commits 형식으로 커밋합니다. 신규 규칙 추가는 일반적으로 `feat:` 프리픽스입니다.

```text
feat: add TBL-007 rule for <what it validates>
```

규칙을 1개 추가할 때마다, 규칙 본체·registry 등록·`schema.json` 갱신·테스트·문서 추가를 1개의 PR로 묶으면 리뷰가 용이합니다.

## 관련

- [테스트 작성 방법](/ko/docs/contributing/writing-tests/) — 테스트 규약과 CJK 요건
- [Rules](/ko/docs/rules/) — 기존 규칙 목록 (구현의 참고)
