# Task - Task List Screen

## Overview

| Item | Details |
|------|---------|
| Screen name | Task List |
| URL | `/tasks` |
| Summary | Displays a list of the user's tasks |

## Screen Items

| No | Item | Type | Stability | Description |
|----|------|------|-----------|-------------|
| 1 | Task title | Display | stable | tasks.title |
| 2 | Status badge | Display | review | Color-coded tasks.status |
| 3 | Created date | Display | stable | tasks.created_at |
| 4 | "New Task" button | Button | stable | Opens the task creation modal |

## Screen Transitions

| From | Action | To |
|------|--------|----|
| This screen | Click a task | [Task Detail](./screen_task_detail.md) |
