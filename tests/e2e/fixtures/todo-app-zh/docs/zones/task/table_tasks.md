# Task - tasks 表

## 业务价值（Why）

持久化用户的任务数据，支持列表展示、搜索和筛选功能。

## 需求（What）

| ID | 需求 | 稳定度 |
|----|------|--------|
| REQ-TASK-TBL-01 | 能够保存任务的标题和描述 | stable |
| REQ-TASK-TBL-02 | 能够管理任务的状态 | review |
| REQ-TASK-TBL-03 | 能够追踪任务的创建者 | review |

## 规格（Spec）

### 列定义

| No | 列名 | 数据类型 | NOT NULL | 默认值 | 稳定度 | 说明 |
|----|------|----------|----------|--------|--------|------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | 主键 |
| 2 | title | VARCHAR(200) | YES | - | stable | 任务标题 |
| 3 | description | TEXT | NO | NULL | review | 描述 |
| 4 | status | VARCHAR(20) | YES | 'todo' | review | 状态（todo/in_progress/done） |
| 5 | created_by | UUID | YES | - | review | 创建者（引用 users.id） |
| 6 | created_at | TIMESTAMPTZ | YES | NOW() | stable | 创建时间 |
| 7 | updated_at | TIMESTAMPTZ | YES | NOW() | stable | 更新时间 |

### 外键

| 约束名 | 列 | 引用表 | 引用列 |
|--------|-----|--------|--------|
| fk_tasks_created_by | created_by | users | id |

## 设计（How）

| 领域 | 选择 | 理由 |
|------|------|------|
| 主键 | UUID v4 | 在分布式环境中不会冲突 |
| 状态 | VARCHAR + CHECK 约束 | 比 enum 更灵活 |
