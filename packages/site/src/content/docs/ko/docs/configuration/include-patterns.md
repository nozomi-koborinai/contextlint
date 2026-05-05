---
title: include 패턴
description: include로 검증 대상을 지정하는 방법과 CLI 인수와의 우선순위.
---

`include` 필드는 contextlint가 검증할 Markdown 파일을 glob 패턴으로 지정합니다.

## 기본

```json
{
  "include": ["docs/**/*.md"]
}
```

이 지정으로 `docs/` 디렉터리 이하의 모든 Markdown 파일이 검증 대상이 됩니다.

## 여러 디렉터리

여러 개의 glob을 배열로 지정하실 수 있습니다.

```json
{
  "include": ["docs/**/*.md", "specs/**/*.md", "adr/**/*.md"]
}
```

## 기본값

`include`를 생략하실 경우의 기본값은 `["**/*.md"]`입니다. 리포지터리 전체의 Markdown 파일이 대상이 됩니다.

## 우선순위

검증 대상의 결정에는 다음의 우선순위가 적용됩니다.

1. **CLI 인수**(최우선) — glob 패턴을 직접 전달
2. **설정 파일의 `include`**
3. **기본값** — `["**/*.md"]`

```bash
# CLI 인수로 specs/ 이하만 검증 (config의 include를 덮어쓰기)
npx contextlint "specs/**/*.md"
```

## 제외 패턴

contextlint에는 독립된 `exclude` 필드가 없습니다. 제외하시고자 하는 경로는 glob의 부정 패턴(`!`)으로 표현해 주십시오.

```json
{
  "include": ["docs/**/*.md", "!docs/_drafts/**"]
}
```

include에 해당하지 않는 경로는 자동으로 제외되므로, include를 좁히는 것으로 실질적으로 제외와 동등한 동작이 됩니다.

## glob의 동작

contextlint는 내부에서 [picomatch](https://www.npmjs.com/package/picomatch)를 사용하고 있습니다. `*`, `**`, `?`, `[abc]` 등 표준적인 glob 구문이 지원됩니다.

dot으로 시작하는 디렉터리(`.claude/`, `.github/` 등)도 매칭됩니다. Markdown 파일을 두고 있는 dot 디렉터리를 제외하시고자 할 경우에는 명시적으로 부정 패턴을 작성해 주십시오.

```json
{
  "include": ["**/*.md", "!.claude/**", "!.github/**"]
}
```
