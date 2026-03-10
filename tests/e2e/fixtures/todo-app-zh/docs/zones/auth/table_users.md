# Auth - users 表

## 业务价值（Why）

管理登录应用程序的用户信息。

## 需求（What）

| ID | 需求 | 稳定度 |
|----|------|--------|
| REQ-AUTH-TBL-01 | 能够通过邮箱地址唯一标识用户 | stable |
| REQ-AUTH-TBL-02 | 能够保存密码的哈希值 | stable |

## 规格（Spec）

### 列定义

| No | 列名 | 数据类型 | NOT NULL | 默认值 | 稳定度 | 说明 |
|----|------|----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 主键 |
| 2 | email | VARCHAR(255) | YES | - | stable | 邮箱地址（唯一） |
| 3 | password_hash | VARCHAR(255) | YES | - | stable | bcrypt 哈希值 |
| 4 | display_name | VARCHAR(100) | NO | NULL | review | 显示名称 |
| 5 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 创建时间 |

## 设计（How）

| 领域 | 选择 | 理由 |
|------|------|------|
| 主键 | UUID v4 | 便于与会话管理联动 |
| 密码 | bcrypt | 行业标准的哈希算法 |
