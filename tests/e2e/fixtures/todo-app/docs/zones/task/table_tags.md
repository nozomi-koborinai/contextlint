# Task - tags Table

## Business Value (Why)

Allow tasks to be labeled for categorization and filtering.

## Requirements (What)

| ID | Requirement | Stability |
|----|-------------|-----------|
| REQ-TASK-TBL-04 | Store tag names | draft |
| REQ-TASK-TBL-05 | Manage many-to-many relationship between tasks and tags | draft |

## Specification (Spec)

### Column Definition

| No | Column | Type | NOT NULL | Default | Stability | Description |
|----|--------|------|----------|---------|-----------|-------------|
| 1 | id | UUID | YES | gen_random_uuid() | draft | Primary key |
| 2 | name | VARCHAR(50) | YES | - | draft | Tag name |
| 3 | color | VARCHAR(7) | NO | NULL | draft | Display color (#RRGGBB) |

## Design (How)

| Area | Decision | Reason |
|------|----------|--------|
| Many-to-many | Junction table task_tags | Standard relational database design |
