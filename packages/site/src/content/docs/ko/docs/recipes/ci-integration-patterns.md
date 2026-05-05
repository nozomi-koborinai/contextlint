---
title: CI 연동 패턴
description: GitHub Actions / GitLab CI / pre-commit / PR 게이트에서 contextlint를 실행하기 위한 설정 예시.
---

이 레시피는 contextlint를 CI / CD 파이프라인에 도입하기 위한 대표적인 패턴을 모은 것입니다. `pull_request`에서의 게이트, `push`에서의 스냅샷 검증, 로컬의 pre-commit hook 각각에서 적절한 실행 방법이 다릅니다.

설정 파일 (`contextlint.config.json`)의 내용은 다루지 않습니다. 설정 예시는 다른 레시피 ([ADR 스타일 리포지터리](/ko/docs/recipes/adr-style-repo-setup/) / [사양 주도 개발 리포지터리](/ko/docs/recipes/spec-driven-development-setup/) / [모노레포](/ko/docs/recipes/monorepo-setup/))를 참고해 주십시오.

## 어떤 프로젝트에 적합한가

- 문서의 정합성을 **머지 전**에 게이트하고 싶다
- 로컬에서도 CI에서도 같은 규칙, 같은 결과가 나오는 것을 보장하고 싶다 (결정론적 검증의 활용)
- PR의 차분 행에 대해 **인라인 어노테이션**을 출력하고 싶다
- `main` 브랜치에 대한 스냅샷도 별도로 취하고 싶다

contextlint는 실행이 고속 (수 초)이며 API 키나 외부 서비스 연동이 불필요하므로, CI 상에서 부담 없이 실행할 수 있습니다.

## 권장 구성 (GitHub Actions)

공식 Composite Action을 사용하시는 것이 가장 빠른 방법입니다. 리포지터리 최상단에 `.github/workflows/contextlint.yml`을 배치합니다.

```yaml
name: contextlint

on:
  pull_request:
    paths:
      - "**/*.md"
      - "contextlint.config.json"
  push:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'   # optional (생략 시 자동 감지)
        #   files: 'docs/**/*.md'                # optional (CLI 인수로 include 덮어쓰기)
        #   version: 'latest'                    # optional (버전 고정 시 'v0.9.0' 등)
```

이것만으로 `bun setup` → `@contextlint/cli` 실행 → `--format json` 출력 → PR 차분에 대한 행 단위 인라인 어노테이션까지를 1단계로 실행합니다.

## 각 설정을 선택한 이유

### Composite Action 채택

공식 Composite Action (`nozomi-koborinai/contextlint/.github/actions/contextlint`)은 내부에서 다음을 수행합니다.

1. `oven-sh/setup-bun@v2`로 bun을 셋업
2. `bunx @contextlint/cli@<version>`을 `--format json`과 함께 실행
3. JSON 출력을 GitHub Actions의 `::error` / `::warning` workflow command로 변환하여, PR 차분 위에 어노테이션을 출력
4. error가 1건 이상이면 exit code 1로 job을 실패시킴

자체적으로 같은 동작을 작성하시려면 JSON의 파싱과 어노테이션 변환이 필요해집니다. 버전 고정이 필요한 경우 외에는, 이 Composite Action을 사용하시는 것이 간편합니다.

### `paths` 필터

`pull_request: paths`로 `**/*.md`와 `contextlint.config.json`의 변경이 있는 PR에서만 실행합니다. 코드만 변경한 PR에서 contextlint를 매번 실행할 필요는 없으므로, CI 크레딧을 절약할 수 있습니다.

다만, 모노레포에서 문서가 특정 `packages/*/docs/`에만 있는 경우라도, `paths`를 `packages/*/docs/**/*.md`까지 좁히지 마시고 `**/*.md` 그대로 두시는 것을 권장합니다. 이유는 다음 두 가지입니다.

1. **장래에 다른 위치에서 문서가 추가되었을 때 누락하는** 위험을 피한다
2. **설정 파일의 변경도 `paths`에 포함**해야 하므로, 결국 넓은 glob 쪽이 관리하기 쉽다

### `push: main`의 병용

`pull_request`만으로는 「main에 머지된 순간 무언가가 깨진다」는 케이스 (squash merge / fork PR / 직접 push)를 포착할 수 없습니다. `push: main`을 병용하시면, main의 현재 상태가 항상 검증된 상태로 유지됩니다.

### 버전 고정

`version: 'latest'` 그대로 두시면, 새로운 규칙이나 기본 동작의 변경이 즉시 CI에 반영됩니다. 안정성을 중시하신다면 `version: 'v0.9.0'`과 같은 명시적인 태그 지정으로 두시고, Renovate / Dependabot으로 갱신 관리하시는 것을 권장합니다.

## 다른 CI 시스템에 응용

### GitLab CI

GitLab CI에서는 Composite Action에 상당하는 구조가 없으므로, CLI를 직접 호출합니다.

```yaml
contextlint:
  image: oven/bun:latest
  rules:
    - changes:
        - "**/*.md"
        - "contextlint.config.json"
  script:
    - bunx @contextlint/cli@latest --format json > contextlint.json || true
    - |
      if [ -s contextlint.json ]; then
        cat contextlint.json
        # error가 포함되어 있으면 exit 1
        if jq -e 'any(.[]; .severity == "error")' contextlint.json > /dev/null; then
          exit 1
        fi
      fi
  artifacts:
    when: always
    paths:
      - contextlint.json
```

GitLab CI에는 GitHub Actions와 같은 workflow command 형식의 인라인 어노테이션이 없으므로, `artifacts`로 JSON을 남겨, Merge Request의 리뷰에서 참조하는 운영이 됩니다.

### CircleCI

CircleCI에서는 `bun`을 포함하는 image를 선택하시거나, `oven-sh/bun-orb`를 사용하십시오.

```yaml
version: 2.1

jobs:
  contextlint:
    docker:
      - image: oven/bun:latest
    steps:
      - checkout
      - run:
          name: Run contextlint
          command: bunx @contextlint/cli@latest

workflows:
  docs:
    jobs:
      - contextlint
```

`paths` 필터에 상당하는 기능은 CircleCI 표준에는 없으므로, 필요하시다면 `path-filtering` orb를 사용하시거나, 모든 commit에서 실행해 주십시오.

### npm / pnpm 환경

`@contextlint/cli`는 **bun 전용이 아니라** npm에서 install할 수 있는 일반적인 CLI입니다. bun을 사용하지 않고 npm / pnpm / yarn 환경에서 운영하시려는 경우, 각 패키지 매니저의 dlx 상당으로 실행하실 수 있습니다.

```yaml
# pnpm
- run: pnpm dlx @contextlint/cli

# npm (devDependency 경유)
- run: npm install
- run: npx contextlint

# yarn
- run: yarn dlx @contextlint/cli
```

`devDependencies`에 추가하여 `npm install` 후에 `npx contextlint`를 실행하는 형태가, 의존 록 관점에서는 가장 확실합니다.

## 로컬의 pre-commit hook

CI에서 게이트하기 전에, 로컬에서도 커밋 전에 lint를 실행하시고자 하는 경우에는 [pre-commit](https://pre-commit.com/) 또는 [husky](https://typicode.github.io/husky/)와 [lint-staged](https://github.com/lint-staged/lint-staged)의 조합을 사용하십시오.

### pre-commit (Python 기반)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: '\.(md)$'
        pass_filenames: false
```

`pass_filenames: false`를 지정하시는 것이 핵심입니다. **contextlint는 프로젝트 스코프 규칙을 가지므로, 변경된 파일만 인수로 전달하면 REF-001 / GRP-002 등의 크로스 파일 검증이 깨집니다.** 매번 전체를 검증하는 것을 상정하여 동작시켜 주십시오.

### husky + lint-staged

`package.json`:

```json
{
  "lint-staged": {
    "*.md": "npx contextlint"
  }
}
```

다만 lint-staged는 기본적으로 「변경된 파일만」을 인수로 전달합니다. 프로젝트 스코프 규칙을 사용하시는 경우에는, `lint-staged` 대신 husky의 `pre-commit` hook에서 `npx contextlint`를 직접 호출하는 운영으로 해 주십시오.

```bash
# .husky/pre-commit
#!/bin/sh
npx contextlint
```

## 종료 코드와 CI 게이트

contextlint의 종료 코드는 [CLI 플래그 레퍼런스](/ko/docs/integrations/cli/flags/)에 자세히 나와 있지만, CI 게이트에 관계되는 범위만 요약합니다.

| 코드 | 의미 | CI 동작 |
| --- | --- | --- |
| `0` | 위반 없음, 또는 warning만 | 성공 |
| `1` | error가 1건 이상 | 실패 (PR 게이트 발동) |
| `2` | 설정 파일 부재 / 파싱 에러 | 실패 (CI 설정 미스 취급) |

**warning은 CI를 fail시키지 않습니다.** 「warning도 멈추고 싶다」는 경우에는 CLI의 출력을 grep하시거나, JSON 출력을 jq로 평가하여 exit code를 변경하는 wrapper를 작성하실 필요가 있습니다.

## 운영상의 주의점

### Composite Action의 캐시

공식 Composite Action은 내부에서 `bunx @contextlint/cli@<version>`을 실행하므로, 매번 npm 레지스트리에서 fetch됩니다. 실행 시간이 신경 쓰이실 경우, `actions/setup-bun` 다음에 `actions/cache`로 `~/.bun/install/cache`를 캐시하는 단계를 추가하시면 개선됩니다. 대부분의 프로젝트에서는 `latest` 버전의 fetch도 수 초 이내이므로, 기본값으로 충분히 빠릅니다.

### Fork PR에서의 어노테이션

GitHub Actions에서는 fork로부터의 PR에서는 default GITHUB_TOKEN의 권한이 제한되어 있어, 인라인 어노테이션이 표시되지 않는 경우가 있습니다. Composite Action은 어노테이션 실패로 job을 떨어뜨리지 않고, stdout에 같은 내용을 출력하므로, PR의 checks 탭에서 log로 위반을 확인하실 수 있습니다.

### 단계적 도입

기존 리포지터리에서 warning을 포함해 100건 이상의 위반이 발생하는 상태에서 PR 게이트를 갑자기 활성화하시면, 처음 몇 PR에서 「관계없는 부분도 전부 고치지 않으면 머지할 수 없다」는 상태가 됩니다. 다음 중 하나의 수단으로 단계적으로 도입해 주십시오.

1. **`push: main`만으로 우선 운영을 시작** — PR 게이트는 하지 않고, main의 상태를 가시화만 한다
2. **`continue-on-error: true`를 job에 추가** — Action은 실행하지만 job은 떨어뜨리지 않는다 (어노테이션만 출력)
3. **`include`를 좁혀서 점진적으로 확대** — 처음에는 새로운 디렉터리만 검증, 레거시 디렉터리는 제외

3번째 방법은 [include 패턴](/ko/docs/configuration/include-patterns/)에서 부정 패턴을 사용하시면 구현하실 수 있습니다.

### 관련 문서

- [CLI 명령어](/ko/docs/integrations/cli/commands/) — `lint`의 서브 명령어와 플래그
- [CLI 플래그 레퍼런스](/ko/docs/integrations/cli/flags/) — `--config` / `--format` / `--cwd`의 자세한 내용
- [CI/CD 통합](/ko/docs/integrations/ci-cd/) — 이 카테고리의 공식 통합 방법 (Composite Action의 API 레퍼런스)
