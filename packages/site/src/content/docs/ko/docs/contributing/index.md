---
title: Contributing
description: contextlint에 기여하는 방법과 개발 관련 규약.
---

contextlint는 오픈소스 프로젝트이며, 규칙 추가, 버그 수정, 문서 개선과 같은 기여를 환영합니다. 이 카테고리에서는 contextlint 개발에 참여하기 위해 필요한 리포지터리 셋업, 규칙 추가 절차, 테스트 규약을 정리합니다.

## 이 카테고리의 구성

- [개발 환경 셋업](/ko/docs/contributing/development-setup/) — bun workspace의 구성과 각 패키지의 역할, 빌드·테스트·타입 체크 명령어
- [새로운 규칙 추가](/ko/docs/contributing/adding-a-new-rule/) — ID 채번부터 Zod schema, registry 등록, `schema.json` 갱신까지의 절차
- [테스트 작성 방법](/ko/docs/contributing/writing-tests/) — `bun:test` 사용법과 CJK 언어 테스트 픽스처가 필수인 이유

## 기여 흐름

1. 리포지터리를 fork하고, 1개의 Issue / 기능마다 1개의 branch를 작성합니다
2. [개발 환경 셋업](/ko/docs/contributing/development-setup/)에 따라 로컬에서 동작시킵니다
3. 변경 내용에 따라, 해당 page의 규약에 맞춰 구현·테스트·문서 갱신을 진행합니다
4. Conventional Commits 형식(`feat:`, `fix:`, `docs:` 등)으로 커밋한 후 Pull Request를 작성합니다

코드·주석·문서·커밋 메시지는 모두 영어로 작성해 주세요. GitHub의 Issue / PR / 리뷰 코멘트 또한 영어가 표준입니다.
