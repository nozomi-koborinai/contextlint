import type { Messages } from "./types.js";

export const ko: Messages = {
  init: {
    welcome: "contextlint에 오신 것을 환영합니다! 설정 파일을 만들어 봅시다.",
    existingConfig: "contextlint.config.json이 이미 존재합니다. 덮어쓰시겠습니까?",
    cancelled: "취소되었습니다.",
    selectInclude: "린트할 파일 패턴 (비우면 **/*.md):",
    selectCategories: "활성화할 규칙 카테고리를 선택하세요:",
    created: "contextlint.config.json을 생성했습니다",
    includedRules: "포함된 규칙:",
    configHint: "규칙 추가 및 옵션 설정은 다음을 참조하세요:",
    docsUrl: "https://github.com/nozomi-koborinai/contextlint/blob/main/README.ko.md#규칙-목록",
  },
  categories: {
    tbl: "테이블 규칙 — 테이블 구조와 내용을 검증",
    sec: "섹션 규칙 — 필수 제목과 순서를 확인",
    str: "구조 규칙 — 필수 파일 존재 여부를 확인",
    ref: "참조 규칙 — 링크, 앵커, 이미지를 검증",
    chk: "체크리스트 규칙 — 체크리스트 완료 확인",
    ctx: "콘텐츠 품질 규칙 — 플레이스홀더 및 용어 불일치 감지",
    grp: "그래프 무결성 규칙 — 문서 종속성을 확인",
  },
};
