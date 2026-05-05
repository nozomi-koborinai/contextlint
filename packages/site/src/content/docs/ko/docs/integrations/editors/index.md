---
title: Editors (LSP)
description: contextlint Language Server를 에디터에 통합하여 편집 중 진단, 호버, Quick Fix를 표시.
---

:::note
동작 확인은 VS Code / Cursor만. Neovim / Helix / JetBrains / VSCodium도 LSP 명세에 따라 generic한 설정으로 동작할 것으로 예상되지만 현 시점에서는 미검증.
:::

contextlint에는 Language Server Protocol(LSP) 구현인 `@contextlint/lsp-server`가 동봉되어 있습니다. LSP 대응 에디터에 통합하면 Markdown 파일을 여는 동안 편집 중인 차분을 즉시 lint하고, 진단, 호버 정보, Quick Fix를 에디터 내에서 받을 수 있습니다.

## 가능한 것

- **진단(Diagnostics)** — 21개 규칙 모두의 위반을 에디터의 해당 행에 인라인으로 표시
- **호버** — 위반 위치에 커서를 맞추면 규칙 ID와 메시지 표시
- **Quick Fix** — 일부 규칙에 대해 원클릭으로 자동 수정
  - `CHK-001`: 체크리스트 항목을 체크 완료로 표시
  - `TBL-002`: 빈 셀에 `TODO` 삽입
- **크로스 파일 규칙의 즉시 반영** — `REF-001` / `REF-002` / `TBL-006` / `GRP-*` 등 파일 횡단 규칙도 워크스페이스 전체의 캐시를 사용해 편집 중에 평가됨

설정 파일은 CLI / MCP와 동일한 `contextlint.config.json`을 사용합니다. 에디터용으로 별도의 설정 파일을 준비할 필요는 없습니다.

## 설치

```bash
# bun
bun add -D @contextlint/lsp-server

# npm
npm install -D @contextlint/lsp-server
```

LSP 서버는 `contextlint-lsp`라는 바이너리를 제공합니다. 대부분의 에디터는 이 바이너리를 `npx contextlint-lsp`로 시작하는 형태로 사용합니다.

## VS Code

VS Code용 확장 `contextlint-vscode`를 VSIX로 배포하고 있습니다. Marketplace 게시는 향후 예정입니다.

GitHub Release에서 `contextlint-vscode-*.vsix`를 다운로드해 주세요.

```bash
code --install-extension contextlint-vscode-VERSION.vsix
```

또는 Extensions 뷰에서 수동으로 설치할 수 있습니다.

1. Extensions 뷰 열기
2. **Views and More Actions...** 에서 **Install from VSIX...** 선택
3. 다운로드한 `.vsix` 파일 지정

설치 후 Markdown 파일을 열면 자동으로 LSP가 시작되어, 가장 가까운 `contextlint.config.json`을 사용하여 진단이 표시됩니다. 추가 설정은 필요하지 않습니다.

## Cursor

Cursor는 VS Code 호환이므로 `contextlint-vscode`의 VSIX를 그대로 설치할 수 있습니다. 절차는 VS Code와 동일합니다.

```bash
cursor --install-extension contextlint-vscode-VERSION.vsix
```

## Generic한 LSP 셋업

LSP 대응 에디터에 대해서는 다음 정보가 있으면 통합할 수 있습니다.

| 항목 | 값 |
| --- | --- |
| 시작 명령 | `npx contextlint-lsp` |
| 프로토콜 | LSP(stdio) |
| 대상 파일 타입 | `markdown` |
| 루트 디렉터리 판정 | `contextlint.config.json`의 존재, 없으면 `.git` |
| 설정 파일 | 워크스페이스 직하 또는 그 부모 계층의 `contextlint.config.json`을 자동 감지 |

`contextlint-lsp`는 `process.stdin` / `process.stdout`으로 LSP를 통신합니다. 단일 파일(프로젝트 외부의 단독 파일)은 대상 외이며, `contextlint.config.json`이 발견된 워크스페이스에 대해서만 동작합니다.

### Neovim([nvim-lspconfig](https://github.com/neovim/nvim-lspconfig))

```lua
local configs = require('lspconfig.configs')
local util = require('lspconfig.util')

if not configs.contextlint then
  configs.contextlint = {
    default_config = {
      cmd = { 'npx', 'contextlint-lsp' },
      filetypes = { 'markdown' },
      root_dir = util.root_pattern('contextlint.config.json', '.git'),
      single_file_support = false,
    },
  }
end

require('lspconfig').contextlint.setup({})
```

### Helix(`~/.config/helix/languages.toml`)

```toml
[language-server.contextlint]
command = "npx"
args = ["contextlint-lsp"]

[[language]]
name = "markdown"
language-servers = ["contextlint"]
```

### JetBrains IDE([LSP4IJ](https://plugins.jetbrains.com/plugin/23257-lsp4ij))

1. Marketplace에서 **LSP4IJ** 플러그인을 설치
2. **Settings → Languages & Frameworks → Language Servers → Add** 에서 다음과 같이 설정:
   - **Name**: `contextlint`
   - **Command**: `npx contextlint-lsp`
   - **Mapping → File name patterns**: `*.md`

## 알려진 제약

- **외부로부터의 파일 변경은 감시되지 않습니다.** `git pull`이나 에디터 외부 스크립트에서 파일이 변경된 경우, LSP의 워크스페이스 캐시는 자동으로 갱신되지 않습니다. 에디터 윈도우를 리로드(VS Code / Cursor라면 `Cmd+R` / `Ctrl+R`)하면 캐시가 재구축됩니다.
- **Quick Fix 대응 규칙은 현 시점에서 2개(`CHK-001` / `TBL-002`)뿐입니다.** 그 외 규칙에 대해서는 진단과 호버만 제공됩니다.
