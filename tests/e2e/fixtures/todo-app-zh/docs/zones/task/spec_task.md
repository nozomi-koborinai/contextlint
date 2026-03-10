# Task - 任务规格

## 关联需求

- REQ-TASK-01: 创建任务
- REQ-TASK-02: 任务列表
- REQ-TASK-03: 状态变更

## 状态转换

| 当前状态 | 目标状态 | 触发条件 |
|----------|----------|----------|
| todo | in_progress | 开始工作 |
| in_progress | done | 完成 |
| in_progress | todo | 退回 |
| done | todo | 重新开始 |

## 验证规则

| 字段 | 规则 |
|------|------|
| title | 必填，1~200个字符 |
| description | 可选，最多5000个字符 |
| status | 仅限 todo / in_progress / done |

详情请参阅 [API 规格](./api_tasks.md)。
