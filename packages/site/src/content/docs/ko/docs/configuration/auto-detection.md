---
title: 설정 파일 자동 감지
description: findConfig를 통한 상위 디렉터리 탐색.
---

contextlint는 CLI 실행 시, 현재 디렉터리부터 상위 디렉터리를 향해 `contextlint.config.json`을 자동으로 감지합니다. 설정 파일의 경로를 매번 지정하실 필요가 없습니다.

## 동작

1. CLI를 실행한 디렉터리(cwd)에서 `contextlint.config.json`을 탐색
2. 발견되지 않으면 한 단계 위의 상위 디렉터리로 이동
3. 파일 시스템의 루트(`/`)까지 거슬러 올라감
4. 발견되면 그 위치를 「리포지터리 루트」로 취급

## 모노레포에서의 동작

bun workspace나 pnpm workspace의 모노레포에서도 동일하게 동작합니다. 각 package 안에서 실행하시더라도 리포지터리 최상단의 `contextlint.config.json`이 발견됩니다.

```text
my-monorepo/
├── contextlint.config.json    ← 여기에 배치
├── packages/
│   ├── api/
│   │   └── docs/
│   │       └── README.md
│   └── web/
│       └── docs/
│           └── README.md
```

`packages/api/`에서 `npx contextlint`를 실행하셔도 `my-monorepo/contextlint.config.json`이 로드됩니다. glob 패턴은 설정 파일이 배치된 디렉터리(이 예시에서는 `my-monorepo/`)를 기점으로 해석됩니다.

## 설정 파일을 찾을 수 없을 경우

설정 파일이 발견되지 않을 경우, contextlint는 기본 설정으로 동작합니다. 규칙이 없는 상태이므로 아무것도 감지하지 않지만, 실행 자체가 에러가 되지는 않습니다.

CI 등에서 「설정 파일이 필수」라고 명시하시고자 할 경우에는 `--config` 플래그로 명시적으로 경로를 지정하시는 것이 확실합니다.

```bash
npx contextlint --config ./contextlint.config.json
```
