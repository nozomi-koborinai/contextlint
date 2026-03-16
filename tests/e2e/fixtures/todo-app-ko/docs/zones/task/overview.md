# Task Zone 개요

## 책임 범위

태스크의 CRUD 조작, 상태 관리, 태그를 이용한 분류를 담당한다.

## 담당 외

| 담당 외 기능 | 담당 Zone |
|---|---|
| 사용자 인증 및 로그인 | auth |
| 사용자 마스터 관리 | auth |

## Zone 관계

| Zone | 관계 | 인터페이스 |
|------|------|-----------|
| auth | depends-on | users.id를 참조 (태스크 작성자) |

## 향후 개선 사항

TBD

## 주요 문서

| 문서 | 구분 | 내용 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 비즈니스 가치와 요구사항 |
| [spec_task.md](./spec_task.md) | Spec | 태스크 사양 |
| [table_tasks.md](./table_tasks.md) | How | tasks 테이블 설계 |
| [table_tags.md](./table_tags.md) | How | tags 테이블 설계 |
