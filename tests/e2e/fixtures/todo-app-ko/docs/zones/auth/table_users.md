# Auth - users 테이블

## 비즈니스 가치 (Why)

앱에 로그인하는 사용자의 정보를 관리한다.

## 요구사항 (What)

| ID | 요구사항 | 안정도 |
|----|---------|--------|
| REQ-AUTH-TBL-01 | 이메일 주소로 사용자를 고유하게 식별할 수 있을 것 | stable |
| REQ-AUTH-TBL-02 | 비밀번호 해시를 저장할 수 있을 것 | stable |

## 사양 (Spec)

### 컬럼 정의

| No | 컬럼명 | 데이터 타입 | NOT NULL | 기본값 | 안정도 | 설명 |
|----|--------|-----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 기본 키 |
| 2 | email | VARCHAR(255) | YES | - | stable | 이메일 주소 (유니크) |
| 3 | password_hash | VARCHAR(255) | YES | - | stable | bcrypt 해시 |
| 4 | display_name | VARCHAR(100) | NO | NULL | review | 표시 이름 |
| 5 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 생성 일시 |

## 설계 (How)

| 영역 | 선택 | 이유 |
|------|------|------|
| 기본 키 | UUID v4 | 세션 관리와도 연동하기 용이함 |
| 비밀번호 | bcrypt | 업계 표준 해시 알고리즘 |
