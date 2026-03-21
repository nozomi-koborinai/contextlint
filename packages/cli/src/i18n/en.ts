import type { Messages } from "./types.js";

export const en: Messages = {
  init: {
    welcome: "Welcome to contextlint! Let's create your configuration.",
    existingConfig: "contextlint.config.json already exists. Overwrite?",
    cancelled: "Cancelled.",
    selectInclude: "File patterns to lint (leave empty for **/*.md):",
    selectCategories: "Which rule categories do you want to enable?",
    created: "Created contextlint.config.json",
    includedRules: "Included rules:",
    configHint: "To add more rules or configure options, see:",
    docsUrl: "https://github.com/nozomi-koborinai/contextlint#rules",
  },
  categories: {
    tbl: "Table rules — validate table structure and content",
    sec: "Section rules — check required headings and order",
    str: "Structure rules — verify required files exist",
    ref: "Reference rules — validate links, anchors, and images",
    chk: "Checklist rules — ensure checklist completion",
    ctx: "Context quality rules — detect placeholders and term inconsistency",
    grp: "Graph integrity rules — check document dependencies",
  },
};
