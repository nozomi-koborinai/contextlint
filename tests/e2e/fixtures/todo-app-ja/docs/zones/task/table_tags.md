# Task - tags テーブル

## 業務価値（Why）

タスクに分類ラベルを付与し、フィルタリングを可能にする。

## 要件（What）

| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-TASK-TBL-04 | タグ名を保存できること | draft |
| REQ-TASK-TBL-05 | タスクとタグの多対多関係を管理できること | draft |

## 仕様（Spec）

### カラム定義

| No | カラム名 | データ型 | NOT NULL | デフォルト | 安定度 | 説明 |
|----|---------|---------|----------|-----------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | draft | 主キー |
| 2 | name | VARCHAR(50) | YES | - | draft | タグ名 |
| 3 | color | VARCHAR(7) | NO | NULL | draft | 表示色（#RRGGBB） |

## 設計（How）

| 領域 | 選択 | 理由 |
|-----|------|------|
| 多対多 | 中間テーブル task_tags | 標準的な RDB 設計 |
