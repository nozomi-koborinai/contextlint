# Task - 태스크 사양

## 관련 요구사항

- REQ-TASK-01: 태스크 생성
- REQ-TASK-02: 태스크 목록
- REQ-TASK-03: 상태 변경

## 상태 전이

| 현재 | 전이 대상 | 트리거 |
|------|----------|--------|
| todo | in_progress | 작업 시작 |
| in_progress | done | 완료 |
| in_progress | todo | 반려 |
| done | todo | 재개 |

## 유효성 검사

| 필드 | 규칙 |
|------|------|
| title | 필수, 1~200자 |
| description | 선택, 최대 5000자 |
| status | todo / in_progress / done 중 하나 |

자세한 내용은 [API 사양](./api_tasks.md)을 참조하세요.
