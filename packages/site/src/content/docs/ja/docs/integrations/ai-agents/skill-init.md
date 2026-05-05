---
title: contextlint-init Skill
description: リポジトリへ contextlint を初期セットアップする Skill の役割と挙動。
---

`contextlint-init` は **リポジトリへ contextlint を初期セットアップする** ための Skill です。AI が「contextlint を設定して」「lint 環境整えて」のような依頼を受け取ったときに自動で起動します。

## なぜこの Skill があるか

contextlint には 21 個のルールが 7 カテゴリにまたがって存在します。人間が初見で全部読んで「自分のリポジトリに何を有効化すべきか」を判断するのは負担が大きく、結果として導入を諦めるケースに繋がります。

`contextlint-init` は **リポジトリの構造を実際に scan してから構成を提案する** ことで、この壁を取り払います。人間が手で 21 個から選ぶのではなく、AI が文書の配置・スタイル・参照パターンを見て、プロジェクトに合うルールセットを推論します。

## 起動条件

ユーザーが次のような依頼をしたときに起動します。Skill 名を明示する必要はありません。

- 「contextlint を設定して」「contextlint 入れて」
- 「Markdown のリンターを入れたい」「ドキュメントの整合性チェックを導入して」
- 「lint 環境整えて」「lint setup」

contextlint という名前を出さずに「ドキュメントの整合性チェック」のような文脈だけが渡されても起動します。

## 挙動の流れ

Skill は以下の手順を順に実行します。

### 1. 既存セットアップの検出

リポジトリ直下や親ディレクトリに `contextlint.config.json` がないかを最初に確認します。見つかった場合は、ユーザーに次の選択肢を提示します。

| 選択肢 | 動作 |
| --- | --- |
| `overwrite` | 一から再生成 |
| `add` | 既存設定を保持しつつ、新しいスキャン結果に基づいてルール追加を提案 |
| `skip` | 何もしない |

既存設定を勝手に上書きしないのは、過去にチューニングされた設定や CI を通っている前提を壊さないためです。

### 2. パッケージマネージャー検出

ロックファイルから優先順位付きで判定します。

| ロックファイル | マネージャー |
| --- | --- |
| `bun.lock` / `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` | npm |
| （なし） | npm にフォールバック |

### 3. ドキュメント配置の検出

`docs/` を決め打ちにせず、`documentation/`、`specs/`、`adr/`、`decisions/`、`requirements/`、`architecture/`、`notes/` などの典型的な配置を実際に walk して確認します。3 ファイル以上の Markdown が集まっているディレクトリを「doc クラスタ」候補として抽出し、ディレクトリ名がドキュメント文脈とマッチするものを優先します。`README.md` や `CHANGELOG.md` などのプロジェクトメタは検出するものの、デフォルトでは lint 対象に含めません。

monorepo の場合は `packages/*/docs/` のような配置も検出して、すべて include に含めます。

### 4. ドキュメント内容のサンプリング

検出された各クラスタから 3〜5 ファイルを抜粋して内容を読み、以下のシグナルを探します。コンテキストを浪費しないよう、全ファイル読みはしません。

| 観察されたパターン | 提案ルール |
| --- | --- |
| `[link](file.md#anchor)` 形式の相互参照 | REF-001 |
| `ID` カラムを持つテーブル | TBL-001 + TBL-002 |
| 同じ見出しトリプレット（例: `## Context` / `## Decision` / `## Consequences`） | SEC-001 |
| 多用されるチェックリスト | CHK-001 |
| `TODO`、`TBD`、`<pending>` などの placeholder | CTX-001 |
| ファイル間の双方向参照が多い | GRP-002 |

REF-001 と GRP-002 は **常時オン** のベースラインとして提案します。リンク切れ検出と循環参照検出はリポジトリの種類を問わず有用なためです。

### 5. 設定提案と人間の確認

抽出した構成を `contextlint.config.json` のドラフトとして提示し、各ルールに「なぜ提案したか」の 1 行根拠を添えます。「ADR ディレクトリで Context/Decision/Consequences の繰り返しを観測したので SEC-001 を提案」のように、観察に基づく具体的な説明を行います。

設定を勝手に書き込むのではなく、必ずユーザーの確認を取ります。AI が観察を間違えていた場合や、ユーザーが特定ルールを意図的に外したい場合に備えるためです。

### 6. インストールと初回 lint 実行

ユーザーが承認したら、検出済みのパッケージマネージャーで `@contextlint/cli` を install し、`contextlint.config.json` を書き込みます。続けて `npx contextlint` を 1 回走らせて、現状の違反を可視化します。インストールが終わった瞬間に「現状どこに何があるか」が分かる流れにしています。

### 7. 任意の追加成果物

CI と README は変更がチーム全体に影響するため、それぞれ別個に許可を取って書き込みます。

- **GitHub Actions ワークフロー** — `.github/workflows/contextlint.yml` を生成（pull_request トリガー、`npx contextlint` 実行）
- **README セクション** — 「contextlint を使っている」ことを示す短いブロックを追記

それぞれは任意で、確認なしには実行しません。

## エッジケース

- **README.md しかないリポジトリ** — contextlint の真価は cross-file 整合性にあるため、構造化ドキュメントが揃ってから導入するよう案内します。
- **複数のロックファイルが共存** — 最終更新が新しい方を採用するか、ユーザーに確認します。
- **親ディレクトリに既に設定が存在する** — monorepo を想定し、上位の設定を尊重して同階層に重複作成しません。
- **GitHub Actions 以外の CI** — GitLab CI、CircleCI などでは `.github/workflows/` を生成せず、「`npx contextlint` で同等の検証を任意の CI に組み込める」旨だけを伝えます。

## 関連

- 最短セットアップ手順は [Quick Start — AI 連携](/ja/docs/get-started/quick-start-ai/) を参照してください。
- 検出された違反の修正は [contextlint-fix Skill](/ja/docs/integrations/ai-agents/skill-fix/) に任せられます。
- 完成した設定ファイルの構造は [設定ファイル](/ja/docs/configuration/config-file/) を参照してください。
