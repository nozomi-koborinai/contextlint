# Auth Zone 개요

## 책임 범위

사용자 인증 및 계정 관리를 담당한다.

## 담당 외

| 담당 외 기능 | 담당 Zone |
|---|---|
| 태스크의 CRUD 조작 | task |
| 태그 관리 | task |

## Zone 관계

| Zone | 관계 | 인터페이스 |
|------|------|-----------|
| task | provides | users.id를 제공 (태스크 작성자) |

## 주요 문서

| 문서 | 구분 | 내용 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 비즈니스 가치와 요구사항 |
| [table_users.md](./table_users.md) | How | users 테이블 설계 |
