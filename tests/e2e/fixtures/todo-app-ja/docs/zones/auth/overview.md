# Auth Zone 概要

## 責任範囲

ユーザーの認証とアカウント管理を担当する。

## 担当外

| 担当外の機能 | 担当 Zone |
|---|---|
| タスクの CRUD 操作 | task |
| タグ管理 | task |

## 他 Zone との関係

| Zone | 関係 | インターフェース |
|------|------|----------------|
| task | provides | users.id を提供（タスク作成者） |

## 主要なドキュメント

| ドキュメント | 区分 | 内容 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 業務価値と要件 |
| [table_users.md](./table_users.md) | How | users テーブル設計 |
