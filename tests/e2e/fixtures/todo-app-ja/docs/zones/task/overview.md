# Task Zone 概要

## 責任範囲

タスクの CRUD 操作、ステータス管理、タグによる分類を担当する。

## 担当外

| 担当外の機能 | 担当 Zone |
|---|---|
| ユーザー認証・ログイン | auth |
| ユーザーマスタ管理 | auth |

## 他 Zone との関係

| Zone | 関係 | インターフェース |
|------|------|----------------|
| auth | depends-on | users.id を参照（タスク作成者） |

## 主要なドキュメント

| ドキュメント | 区分 | 内容 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 業務価値と要件 |
| [spec_task.md](./spec_task.md) | Spec | タスクの仕様 |
| [table_tasks.md](./table_tasks.md) | How | tasks テーブル設計 |
| [table_tags.md](./table_tags.md) | How | tags テーブル設計 |
