---
title: 규칙 단위 스코프 지정
description: files 옵션으로 특정 파일군에만 규칙을 적용.
---

특정 규칙을 「특정 glob에 매칭되는 파일에만 적용하고 싶다」고 하실 경우, 규칙의 `files` 옵션을 사용합니다.

## 기본

```json
{
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    }
  ]
}
```

이 설정은 SEC-001(필수 섹션)을 `decisions/*.md`에만 적용합니다. 그 외의 파일은 SEC-001의 대상에서 제외됩니다.

## 구문

`files` 옵션은 glob 패턴(문자열 1개)을 받습니다. 내부에서 `**/${files}`로 전개되므로 상대 경로로 작성하시기만 하면 깊은 계층도 매칭됩니다.

```json
{ "rule": "sec001", "options": { "files": "decisions/*.md" } }
```

이는 `**/decisions/*.md` 상당으로, 리포지터리 내의 어디에 있는 `decisions/` 디렉터리든 매칭됩니다.

## 활용 사례

- **ADR 폴더에만 ADR 템플릿을 강제** — `decisions/*.md`에서 `Context / Decision / Consequences`를 필수로 지정
- **사양서 폴더에만 사양서 템플릿을 강제** — `specs/*.md`에서 `개요 / API / 예시`를 필수로 지정
- **신규 디렉터리만 엄격하게, 레거시 디렉터리는 유연하게** — 단계적으로 정합성 검사를 도입

## include와의 관계

[include](/ko/docs/configuration/include-patterns/)는 **검증 대상 파일 전체**를 좁힙니다. `files`는 include로 결정된 대상 안에서 **개별 규칙이 적용되는 범위**를 좁힙니다. 양쪽을 함께 사용하실 수 있습니다.

## 지원 규칙

TBL-001 ~ TBL-005, SEC-001, SEC-002, REF-\* 계열, CTX-001, CTX-002에서 지원됩니다. 각 규칙의 자세한 내용은 [Rules](/ko/docs/rules/)를 참조해 주십시오.
