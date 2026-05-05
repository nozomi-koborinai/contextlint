---
title: 설정 파일
description: contextlint.config.json의 구조와 각 필드 개요.
---

contextlint의 설정 파일은 `contextlint.config.json`이라는 이름으로, 리포지터리 최상단에 배치합니다. JSON 형식입니다.

## 최소 예시

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" }
  ]
}
```

## 필드

| 필드 | 타입 | 필수 | 개요 |
|-----------|------|------|------|
| `$schema` | string | 권장 | 에디터 자동 완성용 |
| `include` | string[] | 선택 | 검증 대상 glob 패턴. 자세한 내용은 [include 패턴](/ko/docs/configuration/include-patterns/) |
| `rules` | object[] | 필수 | 활성화할 규칙 배열. 각 규칙의 사양은 [Rules](/ko/docs/rules/) |

## $schema

`$schema`를 지정하시면 VS Code / Cursor / JetBrains 등의 에디터에서 설정 파일 편집 시 자동 완성과 인라인 검증이 활성화됩니다. 릴리스 버전에 고정하시고자 할 경우에는 URL의 `main`을 `v1.0.0`과 같은 태그명으로 교체해 주십시오.

## 검증

설정 파일은 Zod schema에 의해 런타임에 검증됩니다. 필드 타입이 올바르지 않거나 알 수 없는 규칙 ID를 지정하실 경우, 시작 시점에 사용자용 에러 메시지가 표시됩니다.
