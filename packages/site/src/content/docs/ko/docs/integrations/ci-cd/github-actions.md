---
title: GitHub Actions
description: contextlint를 GitHub Actions 워크플로에 통합하는 두 가지 방법.
---

contextlint는 GitHub Actions와 궁합이 좋은 두 가지 통합 방법을 제공합니다. **공식 Composite Action**을 사용하는 방법과, `npx`로 직접 실행하는 방법입니다. 최소한의 설정으로 PR마다 lint를 실행할 수 있고, 위반 시는 잡이 실패합니다.

## 공식 Composite Action

저장소에는 `nozomi-koborinai/contextlint` 아래에 Composite Action이 포함되어 있습니다. `--format json`으로 contextlint를 실행하고, PR에 인라인 어노테이션을 첨부하는 처리까지 Action 측에서 완결됩니다.

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # 선택
        #   files: 'docs/**/*.md'              # 선택
        #   version: 'latest'                  # 선택
```

| 입력 | 개요 |
| --- | --- |
| `config` | 설정 파일의 경로. 생략 시는 부모 디렉터리를 거슬러 올라 자동 감지 |
| `files` | 검증 대상 glob. 생략 시는 config의 `include`를 사용 |
| `version` | 사용할 `@contextlint/cli`의 버전. 생략 시는 `latest` |

`paths`를 지정하면 문서 변경이 있는 PR에서만 실행되므로 CI 시간을 억제할 수 있습니다.

## 직접 실행하는 경우

Composite Action을 사용하지 않고 단순히 `npx`로 실행할 수도 있습니다. Node.js 환경이 있다면 추가 셋업은 필요 없습니다.

```yaml
name: contextlint
on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli
```

설정 파일이 저장소에 있으면 `npx @contextlint/cli`만으로 lint가 실행됩니다. 위반이 있으면 비제로 종료하므로, 잡이 자동적으로 실패로 처리됩니다.

## 기존 패키지 매니저로 실행

저장소에서 bun / pnpm / yarn을 사용하고 있다면, `devDependencies`에 `@contextlint/cli`를 포함시킨 다음 `bun run` 등에서 호출하는 편이 의존 해석이 빨라집니다.

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bunx contextlint
```

의존 락이 버전을 고정하기 때문에, CI에서 실행되는 버전과 개발기에서 실행되는 버전이 일치합니다.

## 어노테이션

Composite Action은 인라인 어노테이션을 자동으로 첨부하지만, 직접 실행하는 구성에서도 JSON 출력을 스크립트로 처리하면 동등한 일이 가능합니다.

```yaml
- run: npx contextlint --format json | tee contextlint.json
- run: node ./scripts/annotate.js contextlint.json
```

JSON의 구조는 [JSON 출력](/ko/docs/integrations/cli/json-output/)을 참조해 주세요.

## 병렬 잡과의 조합

contextlint는 `markdownlint`나 `eslint`와 병렬로 실행해도 문제 없습니다. 양쪽은 책무가 나뉘어 있기 때문에, 결과도 간섭하지 않습니다.

```yaml
jobs:
  contextlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli

  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx markdownlint-cli2 "**/*.md"
```

contextlint와 markdownlint의 책무 차이는 [의미적 린터와 구문 린터](/ko/docs/concepts/semantic-vs-syntax/)를 참조해 주세요.

## SKILL.md의 동기화

`contextlint compile`은 결정론적이기 때문에, CI 상에서 `--dry-run`을 실행하면 "저장소의 SKILL.md가 문서의 최신 상태와 동기화되어 있는지"를 검증할 수 있습니다.

```yaml
- run: npx contextlint compile --dry-run
```

차분이 있으면 비제로 종료하므로, SKILL.md의 갱신 누락을 CI에서 감지할 수 있습니다.
