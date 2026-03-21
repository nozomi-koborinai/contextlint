import type { Messages } from "./types.js";

export const zh: Messages = {
  init: {
    welcome: "欢迎使用 contextlint！让我们来创建配置文件。",
    existingConfig: "contextlint.config.json 已存在。是否覆盖？",
    cancelled: "已取消。",
    selectInclude: "要检查的文件模式（留空则为 **/*.md）:",
    selectCategories: "选择要启用的规则类别:",
    created: "已创建 contextlint.config.json",
    includedRules: "包含的规则:",
    configHint: "如需添加更多规则或配置选项，请参阅:",
    docsUrl: "https://github.com/nozomi-koborinai/contextlint/blob/main/README.zh.md#规则列表",
  },
  categories: {
    tbl: "表格规则 — 验证表格结构和内容",
    sec: "章节规则 — 检查必需的标题和顺序",
    str: "结构规则 — 验证必需文件是否存在",
    ref: "引用规则 — 验证链接、锚点和图片",
    chk: "检查清单规则 — 确保检查清单已完成",
    ctx: "内容质量规则 — 检测占位符和术语不一致",
    grp: "图完整性规则 — 检查文档依赖关系",
  },
};
