---
title: Recipes
description: 대표적인 문서 운영 패턴별 contextlint 설정 예시.
---

Recipes 카테고리에서는 자주 사용되는 문서 운영 패턴에 대해 **그대로 사용 가능한 `contextlint.config.json`** 과 그 설정을 선택한 의도를 정리합니다.

[Configuration](/ko/docs/configuration/)이 개별 필드의 사양을, [Rules](/ko/docs/rules/)가 각 규칙의 사양을 다루는 데 비해, Recipes는 **여러 규칙을 어떻게 조합할 것인가**에 초점을 맞춥니다.

## 이 카테고리의 구성

- [ADR 스타일 리포지터리](/ko/docs/recipes/adr-style-repo-setup/) — Architecture Decision Records를 템플릿 기반으로 운영하는 설정
- [사양 주도 개발 리포지터리](/ko/docs/recipes/spec-driven-development-setup/) — 요구사항 → 사양 → 구현의 추적성과 안정도 관리를 포함하는 설정
- [모노레포](/ko/docs/recipes/monorepo-setup/) — 여러 패키지의 문서를 하나의 설정으로 일괄 검증
- [CI 연동 패턴](/ko/docs/recipes/ci-integration-patterns/) — GitHub Actions / GitLab CI / pre-commit / PR 게이트에서의 실행 예시

## 레시피 읽는 법

각 레시피는 다음과 같이 구성되어 있습니다.

1. **어떤 프로젝트에 적합한가** — 상정하는 규모, 템플릿의 유무, 운영 단계
2. **권장 구성 (`contextlint.config.json`)** — 그대로 복사하여 사용 가능한 완전한 설정
3. **각 규칙을 선택한 이유** — 해당 규칙을 채택한, 또는 채택하지 않은 의도
4. **운영상의 주의점** — 기존 리포지터리에 대한 도입 절차, 단계적 이행, CI에서의 게이트 방법

## 설정이 정해지지 않을 경우

규칙 카테고리나 템플릿에 망설여지실 경우, 먼저 [`contextlint init`](/ko/docs/integrations/cli/commands/)으로 대화형으로 기본 설정을 생성한 뒤, 그 위에 레시피를 참고하여 확장하는 것이 빠른 도입 절차입니다.
