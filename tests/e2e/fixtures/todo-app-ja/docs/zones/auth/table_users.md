# Auth - users テーブル

## 業務価値（Why）

アプリにログインするユーザーの情報を管理する。

## 要件（What）

| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-AUTH-TBL-01 | メールアドレスでユーザーを一意に識別できること | stable |
| REQ-AUTH-TBL-02 | パスワードのハッシュを保存できること | stable |

## 仕様（Spec）

### カラム定義

| No | カラム名 | データ型 | NOT NULL | デフォルト | 安定度 | 説明 |
|----|---------|---------|----------|-----------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 主キー |
| 2 | email | VARCHAR(255) | YES | - | stable | メールアドレス（ユニーク） |
| 3 | password_hash | VARCHAR(255) | YES | - | stable | bcrypt ハッシュ |
| 4 | display_name | VARCHAR(100) | NO | NULL | review | 表示名 |
| 5 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 作成日時 |

## 設計（How）

| 領域 | 選択 | 理由 |
|-----|------|------|
| 主キー | UUID v4 | セッション管理とも連携しやすい |
| パスワード | bcrypt | 業界標準のハッシュアルゴリズム |
