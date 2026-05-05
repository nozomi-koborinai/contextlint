---
title: Configuration
description: contextlint の設定ファイルとオプション。
---

contextlint の挙動はリポジトリ直下の `contextlint.config.json` で制御します。このカテゴリでは、設定ファイルの書き方、検証対象の指定方法、ルール単位の細かい制御を解説します。

## このカテゴリの構成

- [設定ファイル](/ja/docs/configuration/config-file/) — `contextlint.config.json` の構造と各フィールドの概要
- [include パターン](/ja/docs/configuration/include-patterns/) — 検証対象のファイル指定と優先順位
- [ルール単位のスコープ指定](/ja/docs/configuration/per-file-rule-scoping/) — 特定のファイル群にだけルールを適用する
- [設定ファイルの自動検出](/ja/docs/configuration/auto-detection/) — `findConfig` の親ディレクトリ走査
