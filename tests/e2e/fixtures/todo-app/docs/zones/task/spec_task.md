# Task - Task Specification

## Related Requirements

- REQ-TASK-01: Task creation
- REQ-TASK-02: Task listing
- REQ-TASK-03: Status transitions

## Status Transitions

| Current | Next | Trigger |
|---------|------|---------|
| todo | in_progress | Start work |
| in_progress | done | Complete |
| in_progress | todo | Send back |
| done | todo | Reopen |

## Validation

| Field | Rule |
|-------|------|
| title | Required, 1-200 characters |
| description | Optional, max 5000 characters |
| status | One of: todo / in_progress / done |

See [API Spec](./api_tasks.md) for details.
