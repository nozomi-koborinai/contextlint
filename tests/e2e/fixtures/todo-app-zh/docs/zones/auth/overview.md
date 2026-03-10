# Auth Zone 概述

## 职责范围

负责用户认证和账户管理。

## 职责外

| 职责外的功能 | 负责 Zone |
|---|---|
| 任务的增删改查操作 | task |
| 标签管理 | task |

## Zone关系

| Zone | 关系 | 接口 |
|------|------|------|
| task | provides | 提供 users.id（任务创建者） |

## 主要文档

| 文档 | 分类 | 内容 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 业务价值与需求 |
| [table_users.md](./table_users.md) | How | users 表设计 |
