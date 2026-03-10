# Task - tasks テーブル

## 業務価値（Why）

ユーザーのタスクを永続化し、一覧表示・検索・フィルタリングを可能にする。

## 要件（What）

| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-TASK-TBL-01 | タスクのタイトルと説明を保存できること | stable |
| REQ-TASK-TBL-02 | タスクのステータスを管理できること | review |
| REQ-TASK-TBL-03 | タスクの作成者を追跡できること | review |

## 仕様（Spec）

### カラム定義

| No | カラム名 | データ型 | NOT NULL | デフォルト | 安定度 | 説明 |
|----|---------|---------|----------|-----------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 主キー |
| 2 | title | VARCHAR(200) | YES | - | stable | タスクタイトル |
| 3 | description | TEXT | NO | NULL | review | 説明 |
| 4 | status | VARCHAR(20) | YES | 'todo' | review | ステータス（todo/in_progress/done） |
| 5 | created_by | UUID | YES | - | review | 作成者（users.id への参照） |
| 6 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 作成日時 |
| 7 | updated_at | TIMESTAMPTZ | YES | NOW() | stable | 更新日時 |

### 外部キー

| 制約名 | カラム | 参照先テーブル | 参照先カラム |
|--------|--------|--------------|-------------|
| fk_tasks_created_by | created_by | users | id |

## 設計（How）

| 領域 | 選択 | 理由 |
|-----|------|------|
| 主キー | UUID v4 | 分散環境でも衝突しない |
| ステータス | VARCHAR + CHECK 制約 | enum より柔軟 |
