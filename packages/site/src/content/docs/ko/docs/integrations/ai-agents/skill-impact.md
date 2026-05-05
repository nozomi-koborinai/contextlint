---
title: contextlint-impact Skill
description: Context Graph를 사용해 파일 변경이나 삭제의 영향 범위를 직접 / 간접으로 분류하는 Skill의 역할과 동작.
---

`contextlint-impact`는 **파일의 변경이나 삭제가 문서 그래프 전체에 어떻게 파급되는지**를 분석하는 Skill입니다. AI가 "design.md를 변경하면 뭐가 망가져?", "FR-101을 삭제해도 괜찮아?"와 같은 의뢰를 받았을 때 자동으로 시작됩니다.

## 왜 이 Skill이 있는가

문서가 많아질수록, 하나의 파일에 대한 변경은 의외의 곳에 파급됩니다.

- `grep`은 **직접 언급**은 찾지만, **간접 참조 연쇄**는 잡아내지 못함
- 100파일 규모가 되면 사람의 머릿속에서 transitive한 의존을 따라가는 것은 현실적이지 않게 됨
- AI에 의한 일괄 편집은 영향 범위 인식 없이 진행되면 참조 깨짐을 doc 그래프에 흩뜨림

contextlint에는 `@contextlint/core`의 Context Graph 엔진이 내장되어 있습니다. `contextlint-impact`는 이 엔진을 "이 파일을 만지면 뭐가 망가져?"라는 단순한 질문으로 번역하여 제공합니다.

## 시작 조건

사용자가 다음과 같은 의뢰를 했을 때 시작됩니다. Skill 이름을 명시할 필요는 없습니다.

- "design.md를 변경하면 뭐가 망가져?", "FR-101을 삭제해도 괜찮아?"
- "의존 관계 알고 싶어", "이 doc는 다른 어디에서 참조되고 있어?"
- "리팩터링하고 싶은데 영향 범위는?"

"contextlint"라는 이름이 나오지 않는 의뢰여도, 영향 범위, 의존 관계, 삭제 안전성 등의 문맥으로 시작됩니다.

## 동작 흐름

### 1. 셋업 확인

`contextlint.config.json`의 존재와, cross-file 규칙(REF-001 / GRP-002)이 활성화되어 있는지를 확인합니다. 이들이 비활성화되어 있으면 그래프가 "노드만 있는 평평한 리스트"가 되어, impact 분석이 의미를 가지지 못하기 때문입니다.

미셋업 상태인 경우 [contextlint-init Skill](/ko/docs/integrations/ai-agents/skill-init/)을 안내합니다.

### 2. 타깃 특정

사용자의 의뢰에는 파일 경로가 포함되는 경우도 있고, ID(`FR-101` 등)가 포함되는 경우도 있습니다.

| 사용자 입력 | 타깃 |
| --- | --- |
| `design.md` | 파일 `design.md` |
| `FR-101 삭제하고...` | ID `FR-101` → 정의 위치 파일로 해소한 후 분석 |
| "API의 인증 부분을 refactor하고 싶어" | 불명확 → 사용자에게 "어느 파일?"을 확인 |

ID 지정의 경우, 먼저 `grep -rn 'FR-101' . --include='*.md'` 등으로 정의 위치 파일을 특정하고, 그 파일을 기점으로 impact 분석을 수행합니다.

### 3. impact 분석 실행

```sh
npx contextlint impact <target-file> --format json
```

JSON 출력으로 함으로써, Skill이 결과를 구조적으로 처리할 수 있습니다. MCP를 사용할 수 있는 환경에서는 `impact-analysis` 도구를 직접 호출하여 JSON 파싱을 생략합니다.

### 4. 출력 해석

JSON에는 다음이 포함됩니다.

- **direct** — 대상 파일을 직접 참조하고 있는 파일
- **transitive** — 간접적으로 도달 가능한 파일(참조 연쇄)
- 영향 범위 내에 존재하는 **lint 위반** — 편집 후 `contextlint-fix`를 실행하는 동기 부여가 됨

출력이 비어 있는 경우, 대상 파일이 doc 그래프 상에서 **orphan**일 가능성이 있습니다. Skill은 "그래프 상으로는 고립되어 있지만, 코드, 빌드 설정, README로부터의 참조까지는 보장하지 않는다"는 취지를 전달합니다.

### 5. 구조화된 요약 제시

평탄한 파일 목록이 아니라, direct / transitive / 주의점을 나누어 제시합니다.

```
Impact analysis for `design.md`:

DIRECT (5 files reference this directly):
  - requirements.md
  - overview.md
  - api/auth.md
  - api/users.md
  - testing.md

TRANSITIVE (12 more files affected indirectly):
  - architecture.md (via overview.md)
  - migrations/2026-01.md (via api/users.md)
  - ...

HIGHLIGHTS:
  - api/auth.md는 8 파일에서 참조되는 hub → 파급 위험 높음
  - 영향 범위 내에서 3건의 lint 위반 검출(편집 후 contextlint-fix 권장)

RECOMMENDATIONS:
  - direct를 먼저 갱신하고, transitive가 아직 의미를 가지는지 확인
  - cascade가 크므로 변경을 여러 PR로 분할하는 것도 검토
```

평탄한 목록이면 "어디부터 손을 댈지"가 잘 안 보이기 때문에, "먼저 direct를 갱신한다" 같은 우선순위 첨부의 권장과 함께 반환합니다.

### 6. 관찰에 따른 추가 권장

| 관찰 | 권장 |
| --- | --- |
| transitive가 10건 초과 | PR을 분할하여 review 가능한 입자도로 |
| 대상이 hub(피참조가 많음) | 후방 호환되는 변경(deprecate-then-remove)을 제안 |
| 대상이 orphan | 코드, 빌드 설정, README로부터의 참조를 확인하고 나서 삭제 |
| 영향 범위 내에 lint 위반 | 편집 후 `contextlint-fix`를 실행 |
| 순환 참조 검출 | `grp002` 활성화 → 순환 해소를 먼저 수행하는 것을 제안 |

## 엣지 케이스

- **`contextlint.config.json`이 없음** — `contextlint-init`을 안내하고 impact 실행은 하지 않습니다.
- **REF-001 / GRP-002가 미활성화** — 그래프가 비어 가까워지므로 경고하고 활성화를 제안합니다.
- **대상 파일이 존재하지 않음** — 타이포인지 이미 삭제 완료인지 확인하기 위해 사용자에게 물어봅니다.
- **대상이 순환의 일부** — 순환을 해소하고 나서 impact를 읽지 않으면 transitive가 오해를 부르는 취지를 전달합니다.
- **영향 범위가 100건 초과** — 평탄한 리스트가 아니라 클러스터별 tree 표시로 전환합니다. `contextlint slice`로 더 좁은 범위로 좁히는 것도 제안할 수 있습니다.
- **MCP 서버 사용 가능** — `impact-analysis` 도구를 우선하여 JSON 파싱을 생략합니다.

## 관련

- 영향 범위 내의 위반은 [contextlint-fix Skill](/ko/docs/integrations/ai-agents/skill-fix/)로 수정할 수 있습니다.
- Context Graph의 개념과 동작은 [Concepts → Context Graph](/ko/docs/concepts/context-graph/)를 참조해 주세요.
- 프로그래밍 방식으로 동일한 기능을 호출하고 싶은 경우는, `@contextlint/core`의 Context Graph API(`buildContextGraph`, `classifyImpact` 등)를 직접 사용할 수 있습니다.
