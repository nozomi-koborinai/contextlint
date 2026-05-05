---
title: Rules
description: contextlint의 21개 규칙 레퍼런스.
---

contextlint에는 **21개의 규칙** 이 있으며, 7개의 카테고리로 분류되어 있습니다. 각 규칙은 ID로 `contextlint.config.json`의 `rules` 배열에 등록합니다.

## 카테고리

| Prefix | 카테고리 | 검증하는 내용 |
|--------|---------|-------------|
| **TBL** | Table | 테이블 내용: 필수 컬럼, 빈 셀, 허용 값, 패턴, 컬럼 간 제약, 파일 간 ID 고유성 |
| **SEC** | Section | 섹션 제목의 존재와 순서 |
| **STR** | Structure | 프로젝트 레벨의 파일 존재 |
| **REF** | Reference | 링크, 앵커, 파일 간 ID 참조, 안정도 정합성, 영역 의존, 이미지 참조 |
| **CHK** | Checklist | 체크리스트의 완료 상태 |
| **CTX** | Context | 플레이스홀더 검출, 용어의 일관성 |
| **GRP** | Graph | 문서 의존 그래프: 추적성 체인, 순환 참조, 고립 문서 |

## 전체 21개 규칙

### TBL — 테이블 (6)

- [TBL-001 필수 컬럼](/ko/docs/rules/tbl-001/)
- [TBL-002 빈 셀](/ko/docs/rules/tbl-002/)
- [TBL-003 허용 값](/ko/docs/rules/tbl-003/)
- [TBL-004 셀 패턴](/ko/docs/rules/tbl-004/)
- [TBL-005 컬럼 간 제약](/ko/docs/rules/tbl-005/)
- [TBL-006 파일 간 ID 고유성](/ko/docs/rules/tbl-006/)

### SEC — 섹션 (2)

- [SEC-001 필수 섹션](/ko/docs/rules/sec-001/)
- [SEC-002 섹션 순서](/ko/docs/rules/sec-002/)

### STR — 구조 (1)

- [STR-001 파일 존재](/ko/docs/rules/str-001/)

### REF — 참조 (6)

- [REF-001 끊어진 링크](/ko/docs/rules/ref-001/)
- [REF-002 ID의 정의와 참조](/ko/docs/rules/ref-002/)
- [REF-003 안정도 정합성](/ko/docs/rules/ref-003/)
- [REF-004 영역 의존](/ko/docs/rules/ref-004/)
- [REF-005 앵커](/ko/docs/rules/ref-005/)
- [REF-006 이미지 참조](/ko/docs/rules/ref-006/)

### CHK — 체크리스트 (1)

- [CHK-001 미완료 항목](/ko/docs/rules/chk-001/)

### CTX — 컨텍스트 품질 (2)

- [CTX-001 플레이스홀더 검출](/ko/docs/rules/ctx-001/)
- [CTX-002 용어 일관성](/ko/docs/rules/ctx-002/)

### GRP — 그래프 (3)

- [GRP-001 추적성 체인](/ko/docs/rules/grp-001/)
- [GRP-002 순환 참조](/ko/docs/rules/grp-002/)
- [GRP-003 고립 문서](/ko/docs/rules/grp-003/)

## 각 규칙 page의 구성

1. **개요** — 무엇을 검출하는가
2. **왜 필요한가** — 어떤 문제를 방지하는가
3. **옵션** — 설정 가능한 필드
4. **위반 예시와 수정 후** — Bad → Good
5. **관련 규칙**

## 설정 방법

각 규칙은 `contextlint.config.json`의 `rules` 배열에 등록합니다.

```json
{
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

규칙 ID는 `<prefix><number>` 형식 (3자리 0 채움). 자세한 내용은 [Configuration](/ko/docs/configuration/)을 참조하세요.
