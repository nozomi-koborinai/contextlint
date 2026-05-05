---
title: Contributing
description: contextlint へのコントリビュート方法と開発に関する規約。
---

contextlint はオープンソースプロジェクトであり、ルール追加、バグ修正、ドキュメント改善などのコントリビュートを歓迎します。このカテゴリでは、contextlint の開発に参加するために必要なリポジトリのセットアップ、ルール追加の手順、テスト規約をまとめています。

## このカテゴリの構成

- [開発環境のセットアップ](/ja/docs/contributing/development-setup/) — bun workspace の構成と各 package の役割、ビルド・テスト・型チェックのコマンド
- [新しいルールの追加](/ja/docs/contributing/adding-a-new-rule/) — ID 採番から Zod schema、registry 登録、`schema.json` 更新までの手順
- [テストの書き方](/ja/docs/contributing/writing-tests/) — `bun:test` の使い方と CJK 言語のテストフィクスチャが必須である理由

## コントリビュートの流れ

1. リポジトリを fork して、1 つの Issue / 機能ごとに 1 つの branch を作る
2. [開発環境のセットアップ](/ja/docs/contributing/development-setup/) に従ってローカルで動かす
3. 変更内容に応じて、対応する page の規約に沿って実装・テスト・ドキュメント更新を行う
4. Conventional Commits 形式（`feat:`、`fix:`、`docs:` など）でコミットし、Pull Request を作成する

コード・コメント・ドキュメント・コミットメッセージはすべて英語で記述してください。GitHub 上の Issue / PR / レビューコメントも英語が標準です。
