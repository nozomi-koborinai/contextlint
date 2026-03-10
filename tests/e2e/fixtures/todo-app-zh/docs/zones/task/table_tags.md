# Task - tags 表

## 业务价值（Why）

为任务添加分类标签，支持筛选功能。

## 需求（What）

| ID | 需求 | 稳定度 |
|----|------|--------|
| REQ-TASK-TBL-04 | 能够保存标签名称 | draft |
| REQ-TASK-TBL-05 | 能够管理任务与标签的多对多关系 | draft |

## 规格（Spec）

### 列定义

| No | 列名 | 数据类型 | NOT NULL | 默认值 | 稳定度 | 说明 |
|----|------|----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | draft | 主键 |
| 2 | name | VARCHAR(50) | YES | - | draft | 标签名称 |
| 3 | color | VARCHAR(7) | NO | NULL | draft | 显示颜色（#RRGGBB） |

## 设计（How）

| 领域 | 选择 | 理由 |
|------|------|------|
| 多对多 | 中间表 task_tags | 标准的关系型数据库设计 |
