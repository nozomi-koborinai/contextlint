# Task - tasks Table

## Business Value (Why)

Persist user tasks to enable listing, searching, and filtering.

## Requirements (What)

| ID | Requirement | Stability |
|----|-------------|-----------|
| REQ-TASK-TBL-01 | Store task title and description | stable |
| REQ-TASK-TBL-02 | Manage task status | review |
| REQ-TASK-TBL-03 | Track task creator | review |

## Specification (Spec)

### Column Definition

| No | Column | Type | NOT NULL | Default | Stability | Description |
|----|--------|------|----------|---------|-----------|-------------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | Primary key |
| 2 | title | VARCHAR(200) | YES | - | stable | Task title |
| 3 | description | TEXT | NO | NULL | review | Description |
| 4 | status | VARCHAR(20) | YES | 'todo' | review | Status (todo/in_progress/done) |
| 5 | created_by | UUID | YES | - | review | Creator (references users.id) |
| 6 | created_at | TIMESTAMPTZ | YES | NOW() | stable | Created timestamp |
| 7 | updated_at | TIMESTAMPTZ | YES | NOW() | stable | Updated timestamp |

### Foreign Keys

| Constraint | Column | Referenced Table | Referenced Column |
|------------|--------|------------------|-------------------|
| fk_tasks_created_by | created_by | users | id |

## Design (How)

| Area | Decision | Reason |
|------|----------|--------|
| Primary key | UUID v4 | No collisions in distributed environments |
| Status | VARCHAR + CHECK constraint | More flexible than enum |
