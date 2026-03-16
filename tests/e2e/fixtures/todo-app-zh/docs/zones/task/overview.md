# Task Zone 概述

## 职责范围

负责任务的增删改查操作、状态管理以及标签分类功能。

## 职责外

| 职责外的功能 | 负责 Zone |
|---|---|
| 用户认证与登录 | auth |
| 用户主数据管理 | auth |

## Zone关系

| Zone | 关系 | 接口 |
|------|------|------|
| auth | depends-on | 引用 users.id（任务创建者） |

## 未来增强

TBD

## 主要文档

| 文档 | 分类 | 内容 |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | 业务价值与需求 |
| [spec_task.md](./spec_task.md) | Spec | 任务规格 |
| [table_tasks.md](./table_tasks.md) | How | tasks 表设计 |
| [table_tags.md](./table_tags.md) | How | tags 表设计 |
