# Task Zone Overview

## Responsibilities

Handles CRUD operations for tasks, status management, and tag-based categorization.

## Out of Scope

| Feature | Owning Zone |
|---|---|
| User authentication and login | auth |
| User master management | auth |

## Zone Relations

| Zone | Relation | Interface |
|------|----------|-----------|
| auth | depends-on | References users.id (task creator) |

## Future Enhancements

TBD

## Key Documents

| Document | Category | Description |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | Business value and requirements |
| [spec_task.md](./spec_task.md) | Spec | Task specification |
| [table_tasks.md](./table_tasks.md) | How | tasks table design |
| [table_tags.md](./table_tags.md) | How | tags table design |
