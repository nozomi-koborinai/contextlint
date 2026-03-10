# Task - タスクの仕様

## 関連要件

- REQ-TASK-01: タスク作成
- REQ-TASK-02: タスク一覧
- REQ-TASK-03: ステータス変更

## ステータス遷移

| 現在 | 遷移先 | トリガー |
|------|--------|---------|
| todo | in_progress | 作業開始 |
| in_progress | done | 完了 |
| in_progress | todo | 差し戻し |
| done | todo | 再開 |

## バリデーション

| フィールド | ルール |
|-----------|--------|
| title | 必須、1〜200文字 |
| description | 任意、最大5000文字 |
| status | todo / in_progress / done のいずれか |

詳しくは [API 仕様](./api_tasks.md) を参照。
