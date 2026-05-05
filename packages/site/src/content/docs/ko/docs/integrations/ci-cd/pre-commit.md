---
title: pre-commit / 로컬 훅
description: Husky / lint-staged / pre-commit framework에서 contextlint를 호출하는 로컬 훅 설정.
---

로컬 git 훅에서 contextlint를 호출하면, 위반을 포함한 커밋이 애초에 저장소에 들어가지 않게 됩니다. CI에서 위반을 검출하기 전에, 커밋 순간에 로컬에서 피드백을 돌려줄 수 있습니다. 대표적인 세 가지 방법을 다룹니다.

## 속도 전제

contextlint는 수 초로 완료되기 때문에, `pre-commit` 단계에서 실행해도 체감에는 영향이 없습니다. 다만 파일 수가 많은 저장소에서는, 변경 파일만으로 좁히거나 cross-file 규칙을 포함한 완전한 lint는 CI에 맡기는 등, 목적에 맞춰 구성을 선택하면 좋습니다.

## Husky

[Husky](https://typicode.github.io/husky/)는 가장 널리 사용되는 npm 에코시스템의 git 훅 관리 도구입니다.

`package.json`에 Husky를 설치한 후, `.husky/pre-commit`을 작성합니다.

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx contextlint
```

이대로 사용하면 커밋마다 저장소 전체를 lint합니다. 변경된 파일만으로 좁히고 싶은 경우는 다음 lint-staged와 조합해 주세요.

## lint-staged

[lint-staged](https://github.com/lint-staged/lint-staged)를 사용하면, git stage 완료 파일에만 lint를 실행시킬 수 있습니다.

`package.json`에 설정을 추가합니다.

```json
{
  "lint-staged": {
    "*.md": "contextlint"
  }
}
```

`.husky/pre-commit`에서 `npx lint-staged`를 호출합니다.

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

다만 contextlint의 REF-001, REF-002, TBL-006, GRP-\* 같은 **cross-file 규칙**은 저장소 전체를 보지 않으면 판정할 수 없으므로, stage 완료 파일에만 전달하면 오탐(또는 검출 누락)이 발생할 가능성이 있습니다. lint-staged 경유로 실행하는 경우는, cross-file 규칙에 의존하지 않는 구성으로 만들거나, CI에 최종 체크를 맡기는 전제로 사용하는 것이 안전합니다.

## pre-commit framework

[pre-commit](https://pre-commit.com/)은 Python 기반의 범용 훅 프레임워크로, 여러 언어를 가로질러 사용할 수 있습니다. `.pre-commit-config.yaml`에 로컬 훅으로 등록합니다.

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: \.md$
        pass_filenames: false
```

`pass_filenames: false`를 지정하는 것은, contextlint가 저장소 전체에 대해 실행되는 것을 전제로 하기 때문입니다. CLI 인수로 파일을 한정하고 싶은 경우는 `pass_filenames: true`로 바꿔서 변경 파일만 전달할 수도 있습니다. 다만 lint-staged와 마찬가지로, cross-file 규칙에서는 검출이 변할 가능성에 주의해 주세요.

## 어느 방법을 선택할까

| 관점 | Husky | Husky + lint-staged | pre-commit framework |
| --- | --- | --- | --- |
| 설치 | npm만 | npm만 | Python만 |
| 변경 파일로 좁히기 | 불가 | 가능 | 가능 |
| 다언어 프로젝트 | npm 에코시스템에 의존 | npm 에코시스템에 의존 | 언어 횡단이 쉬움 |
| cross-file 규칙의 정확성 | 완전 | 한정적 | 한정적 |

cross-file 규칙을 정확히 평가하고 싶은 경우는 저장소 전체에 대해 실행할 필요가 있으므로, 로컬 훅에서는 좁히지 않고 CI에서 완전한 lint를 수행하는 구성이 무난합니다.

## CI와의 조합

로컬 훅은 "커밋 시의 조기 발견", CI는 "머지 전의 최종 체크"로 역할이 나뉩니다. 양쪽을 활성화해 두면,

- 로컬에서 잘못한 커밋을 즉시 검출
- 훅을 skip한 경우라도 CI에서 차단

의 이중 구조가 됩니다. CI 통합 방법은 [GitHub Actions](/ko/docs/integrations/ci-cd/github-actions/)를 참조해 주세요.
