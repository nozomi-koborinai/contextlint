---
title: watch 모드
description: --watch로 파일 변경을 감지하여 자동으로 재 lint.
---

`--watch` 플래그를 붙이면 contextlint는 최초 lint를 실행한 뒤 워킹 디렉터리 내의 `.md` 파일 변경을 계속 감시합니다. 에디터를 열어둔 채 위반을 실시간으로 확인하고 싶을 때 사용합니다.

## 시작

```bash
# include 패턴에 따라 watch
npx contextlint --watch

# 특정 glob을 watch
npx contextlint --watch "docs/**/*.md"

# 설정 파일 명시
npx contextlint --watch --config contextlint.config.json
```

`Ctrl+C`로 종료합니다.

## 동작

watch 모드의 기본 흐름은 다음과 같습니다.

1. 시작 시 터미널을 클리어하고 최초의 전체 lint를 실행
2. 워킹 디렉터리 아래 `.md` 파일의 변경을 감시
3. 변경을 감지하면 매칭되는 모든 파일을 재 lint
4. 터미널을 클리어하고 타임스탬프와 함께 최신 결과를 표시

연속된 변경에는 **300밀리초의 디바운스**가 적용됩니다. 짧은 시간에 여러 파일을 저장해도 마지막 변경으로부터 300ms 후에 한 번만 재 lint가 실행됩니다.

### 왜 모든 파일을 재 lint하는가

변경된 파일만 lint해도 REF-002(ID 참조 정합성)나 TBL-006(파일 간 ID 고유성) 같은 **크로스 파일 규칙**에는 충분하지 않습니다. 한 파일의 변경이 다른 파일의 위반을 만들거나 / 해소할 수 있기 때문에, 대상 세트 전체에 대해 재실행합니다.

## 사용 시기

| 상황 | 권장 |
| --- | --- |
| 에디터에서 Markdown을 편집 중 | 에디터가 LSP를 지원한다면 [Editors (LSP)](/ko/docs/integrations/editors/) 쪽이 즉시성이 높음 |
| LSP 비대응 에디터 사용 중 | watch 모드가 폴백 수단으로 유효 |
| AI에 대량의 문서를 생성시키고 결과를 확인하고 싶을 때 | watch를 켜두면 AI 출력 직후 자동으로 재 lint됨 |
| CI 환경 | watch는 사용하지 않음. 일회성 실행(exit code)으로 결과를 판정 |

## 터미널 출력

변경 감지 시 헤더에 타임스탬프와 변경 파일명이 표시됩니다.

```text
[14:32:15] File changed: docs/requirements.md

docs/requirements.md
  line 12  error  Required column "Status" not found in table  TBL-001

1 error in 1 files
```

watch 모드에서는 항상 human 형식으로 표시됩니다(`--format json`과의 병용은 상정하지 않습니다).
