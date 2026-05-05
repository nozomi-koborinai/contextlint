# Task - Task Detail Screen

## Overview

| Item | Details |
|------|---------|
| Screen name | Task Detail |
| URL | `/tasks/:id` |
| Summary | Displays and edits task details |

## Screen Items

| No | Item | Type | Stability | Description |
|----|------|------|-----------|-------------|
| 1 | Task title | Text input | stable | Editable |
| 2 | Description | Textarea | review | Supports Markdown |
| 3 | Status | Select | review | todo / in_progress / done |
| 4 | Tags | Multi-select | draft | Assign or remove tags |
| 5 | "Delete" button | Button | review | Deletes the task |

## Screen Transitions

| From | Action | To |
|------|--------|----|
| This screen | Back | [Task List](./screen_task_list.md) |
