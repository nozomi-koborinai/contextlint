import type { Messages } from "./types.js";

export const ja: Messages = {
  init: {
    welcome: "contextlint へようこそ！設定ファイルを作成しましょう。",
    existingConfig: "contextlint.config.json は既に存在します。上書きしますか？",
    cancelled: "キャンセルしました。",
    selectInclude: "リント対象のファイルパターン（空で **/*.md）:",
    selectCategories: "有効にするルールカテゴリを選択してください:",
    created: "contextlint.config.json を作成しました",
    includedRules: "含まれるルール:",
    configHint: "ルールの追加・オプション設定については:",
    docsUrl: "https://github.com/nozomi-koborinai/contextlint/blob/main/README.ja.md#ルール一覧",
  },
  categories: {
    tbl: "テーブルルール — テーブル構造とコンテンツを検証",
    sec: "セクションルール — 必須見出しと順序をチェック",
    str: "構造ルール — 必須ファイルの存在を確認",
    ref: "参照ルール — リンク・アンカー・画像を検証",
    chk: "チェックリストルール — チェックリストの完了を確認",
    ctx: "コンテンツ品質ルール — プレースホルダーや用語の不整合を検出",
    grp: "グラフ整合性ルール — ドキュメント依存関係をチェック",
  },
};
