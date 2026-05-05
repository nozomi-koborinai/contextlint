---
title: 명령어
description: contextlint / contextlint init / contextlint compile의 동작과 사용법.
---

이 페이지에서는 일상적으로 사용하는 세 가지 서브커맨드 `lint`(기본값) / `init` / `compile`의 동작을 설명합니다. 그래프 계열 서브커맨드(`impact` / `slice` / `graph`)의 자세한 내용은 [Concepts](/ko/docs/concepts/)를 참조해 주세요.

## `contextlint`(lint, 기본값)

인수 없이 실행하면 설정 파일의 `include` 패턴(또는 CLI에서 전달한 glob)에 해당하는 Markdown 파일을 모두 검증합니다.

```bash
# include 패턴에 따라 lint
npx contextlint

# 특정 파일 / glob을 지정해 lint(include를 덮어씀)
npx contextlint "docs/**/*.md"

# 설정 파일 경로를 명시
npx contextlint --config contextlint.config.json
```

검증 대상의 결정 로직(CLI 인수 → `include` → 기본값 순)은 [include 패턴](/ko/docs/configuration/include-patterns/)을 참조해 주세요.

### 종료 코드

| 코드 | 의미 |
| --- | --- |
| `0` | 위반 없음, 또는 warning만 |
| `1` | error가 1건 이상 |
| `2` | 설정 파일 부재 / 파싱 에러 등의 런타임 에러 |

CI에서 PR을 차단하고 싶을 때는 종료 코드 `1`을 실패로 처리하면 error 발생 시 job이 떨어집니다.

## `contextlint init`

대화식으로 `contextlint.config.json`을 생성합니다. 언어, include 패턴, 규칙 카테고리를 차례로 선택하기만 하면, 추가 설정이 필요 없는 규칙(zero-config rules)이 자동으로 배치된 설정 파일이 작성됩니다.

```bash
npx contextlint init
```

대화 단계는 다음 네 가지입니다.

1. **언어 선택** — 영어 / 일본어 / 중국어 / 한국어
2. **include 패턴 입력** — 콤마 구분으로 여러 개 지정 가능(공란이면 기본값 `**/*.md`)
3. **규칙 카테고리 선택** — TBL / SEC / STR / REF / CHK / CTX / GRP에서 체크박스로 다중 선택
4. **기존 파일 덮어쓰기 확인** — `contextlint.config.json`이 이미 존재할 경우에만

생성된 설정 파일은 추가 옵션이 필요 없는 규칙만 들어 있는 상태이므로, 필요에 따라 규칙별 `options`를 수동으로 추가해 주세요. 자세한 내용은 [설정 파일](/ko/docs/configuration/config-file/)과 [Rules](/ko/docs/rules/)를 참조해 주세요.

AI 호스트를 사용 중이라면, `contextlint-init` Skill을 활용하는 방법도 있습니다(저장소 구조를 분석하여 규칙 선택까지 AI가 수행). 자세한 내용은 [Get Started → 설치](/ko/docs/get-started/installation/)를 참조해 주세요.

## `contextlint compile`

문서와 활성화된 규칙으로부터 결정론적으로 `SKILL.md` 파일을 생성합니다. Claude Code의 커스텀 스킬로 사용하는 것을 전제로 합니다.

```bash
# SKILL.md 생성
npx contextlint compile

# 쓰기 없이 무엇이 생성되는지 확인
npx contextlint compile --dry-run

# 출력 디렉터리 덮어쓰기
npx contextlint compile --outdir .claude/skills/my-skill
```

`compile` 실행에는 `contextlint.config.json`에 `compile` 섹션이 필요합니다. `compile` 섹션이 없는 상태로 실행하면 에러로 종료합니다. 설정 작성법과 파이프라인 동작은 [Concepts → Context Compiler](/ko/docs/concepts/)를 참조해 주세요.
