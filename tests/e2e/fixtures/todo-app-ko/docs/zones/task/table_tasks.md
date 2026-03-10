# Task - tasks 테이블

## 비즈니스 가치 (Why)

사용자의 태스크를 영속화하고, 목록 표시 및 검색, 필터링을 가능하게 한다.

## 요구사항 (What)

| ID | 요구사항 | 안정도 |
|----|---------|--------|
| REQ-TASK-TBL-01 | 태스크의 제목과 설명을 저장할 수 있을 것 | stable |
| REQ-TASK-TBL-02 | 태스크의 상태를 관리할 수 있을 것 | review |
| REQ-TASK-TBL-03 | 태스크의 작성자를 추적할 수 있을 것 | review |

## 사양 (Spec)

### 컬럼 정의

| No | 컬럼명 | 데이터 타입 | NOT NULL | 기본값 | 안정도 | 설명 |
|----|--------|-----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 기본 키 |
| 2 | title | VARCHAR(200) | YES | - | stable | 태스크 제목 |
| 3 | description | TEXT | NO | NULL | review | 설명 |
| 4 | status | VARCHAR(20) | YES | 'todo' | review | 상태 (todo/in_progress/done) |
| 5 | created_by | UUID | YES | - | review | 작성자 (users.id 참조) |
| 6 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 생성 일시 |
| 7 | updated_at | TIMESTAMPTZ | YES | NOW() | stable | 수정 일시 |

### 외래 키

| 제약명 | 컬럼 | 참조 테이블 | 참조 컬럼 |
|--------|------|------------|----------|
| fk_tasks_created_by | created_by | users | id |

## 설계 (How)

| 영역 | 선택 | 이유 |
|------|------|------|
| 기본 키 | UUID v4 | 분산 환경에서도 충돌하지 않음 |
| 상태 | VARCHAR + CHECK 제약 | enum보다 유연함 |
