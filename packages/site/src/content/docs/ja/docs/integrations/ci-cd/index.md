---
title: CI/CD
description: contextlint を CI パイプラインやローカルフックに組み込む方法。
---

contextlint は Node.js 環境があれば任意の CI で動かせます。`@contextlint/cli` パッケージは依存が軽く、サブ秒で完了するため、PR ごとに走らせても CI 時間に大きく影響しません。マージ前にドキュメント整合性を保証する用途と、コミット前にローカルで素早く検出する用途のどちらにも組み込めます。

## 統合のタイミング

| タイミング | 主なツール | 用途 |
| --- | --- | --- |
| ローカルフック | pre-commit / Husky / lint-staged | コミット前の最後のセーフティネット |
| プッシュ時 | GitHub Actions / GitLab CI / CircleCI | PR レビュー前にドキュメント整合性を保証 |

エディタ統合（[Editors (LSP)](/ja/docs/integrations/editors/)）と AI 統合（[AI Agents](/ja/docs/integrations/ai-agents/)）が「書いている瞬間」のフィードバックを担うのに対し、CI/CD は「マージ前」の最終チェックを担います。三層を組み合わせることで、ドキュメントの整合性が崩れた状態がリポジトリに残らない環境を作れます。

## このセクションの構成

- [GitHub Actions](/ja/docs/integrations/ci-cd/github-actions/) — 公式の Composite Action と直接実行のサンプル
- [pre-commit / ローカルフック](/ja/docs/integrations/ci-cd/pre-commit/) — Husky / lint-staged / pre-commit framework との連携

## 設定ファイルの扱い

CI 上で contextlint を実行する場合、`contextlint.config.json` はリポジトリにコミットしておきます。ランナーがリポジトリを checkout した時点で `npx contextlint` が自動的に設定ファイルを検出するため、CLI に追加の引数を渡す必要はありません。

設定ファイルの仕様は [Configuration](/ja/docs/configuration/) を参照してください。

## 終了コードと出力形式

`contextlint` は違反が 1 件以上あると非ゼロで終了するため、CI ジョブをそのまま失敗扱いにできます。レビューコメントやアノテーションを付けたい場合は `--format json` で機械可読な出力を得てください。

```bash
npx contextlint --format json
```

JSON 出力の構造とフィールドは [Integrations → CLI → JSON 出力](/ja/docs/integrations/cli/json-output/) を参照してください。
