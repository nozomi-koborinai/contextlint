# Auth Zone Overview

## Responsibilities

Handles user authentication and account management.

## Out of Scope

| Feature | Owning Zone |
|---|---|
| Task CRUD operations | task |
| Tag management | task |

## Zone Relations

| Zone | Relation | Interface |
|------|----------|-----------|
| task | provides | Provides users.id (task creator) |

## Key Documents

| Document | Category | Description |
|---|---|---|
| [requirements.md](./requirements.md) | Why/What | Business value and requirements |
| [table_users.md](./table_users.md) | How | users table design |
