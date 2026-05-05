---
title: Concepts
description: contextlint의 설계 사상과 개념 모델.
---

contextlint가 왜 존재하는지, 왜 정적 분석을 선택했는지, 왜 3계층 피드백으로 나누었는지. 이 카테고리에서는 도구의 배경에 있는 **설계 사상과 개념** 을 설명합니다.

[Get Started](/ko/docs/get-started/)에서는 도구 사용법을, [Configuration](/ko/docs/configuration/)이나 [Rules](/ko/docs/rules/)에서는 규칙 사양을 다룹니다. Concepts는 **"왜 그렇게 되어 있는가"** 에 집중합니다.

## 이 카테고리의 구성

- [왜 contextlint가 존재하는가](/ko/docs/concepts/why-contextlint-exists/) — AI 시대의 Markdown 문서가 안고 있는 정합성 문제와, 이에 대한 contextlint의 위치
- [의미 린터와 구문 린터](/ko/docs/concepts/semantic-vs-syntax/) — semantic linter란 무엇인가, markdownlint와의 대비
- [3계층 피드백 설계](/ko/docs/concepts/three-layer-feedback/) — LSP / MCP / CI를 3계층으로 나눈 이유
- [Context Graph](/ko/docs/concepts/context-graph/) — 문서 의존 관계 그래프를 기반으로 삼은 이유
