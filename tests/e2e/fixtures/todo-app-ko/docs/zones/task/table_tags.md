# Task - tags 테이블

## 비즈니스 가치 (Why)

태스크에 분류 라벨을 부여하여 필터링을 가능하게 한다.

## 요구사항 (What)

| ID | 요구사항 | 안정도 |
|----|---------|--------|
| REQ-TASK-TBL-04 | 태그명을 저장할 수 있을 것 | draft |
| REQ-TASK-TBL-05 | 태스크와 태그의 다대다 관계를 관리할 수 있을 것 | draft |

## 사양 (Spec)

### 컬럼 정의

| No | 컬럼명 | 데이터 타입 | NOT NULL | 기본값 | 안정도 | 설명 |
|----|--------|-----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | draft | 기본 키 |
| 2 | name | VARCHAR(50) | YES | - | draft | 태그명 |
| 3 | color | VARCHAR(7) | NO | NULL | draft | 표시 색상 (#RRGGBB) |

## 설계 (How)

| 영역 | 선택 | 이유 |
|------|------|------|
| 다대다 | 중간 테이블 task_tags | 표준적인 RDB 설계 |
