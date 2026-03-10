# Auth - users Table

## Business Value (Why)

Manage information for users who log in to the application.

## Requirements (What)

| ID | Requirement | Stability |
|----|-------------|-----------|
| REQ-AUTH-TBL-01 | Uniquely identify users by email address | stable |
| REQ-AUTH-TBL-02 | Store password hashes | stable |

## Specification (Spec)

### Column Definition

| No | Column | Type | NOT NULL | Default | Stability | Description |
|----|--------|------|----------|---------|-----------|-------------|
| 1 | id | UUID | YES | gen_random_uuid() | stable | Primary key |
| 2 | email | VARCHAR(255) | YES | - | stable | Email address (unique) |
| 3 | password_hash | VARCHAR(255) | YES | - | stable | bcrypt hash |
| 4 | display_name | VARCHAR(100) | NO | NULL | review | Display name |
| 5 | created_at | TIMESTAMPTZ | YES | NOW() | stable | Created timestamp |

## Design (How)

| Area | Decision | Reason |
|------|----------|--------|
| Primary key | UUID v4 | Easy to integrate with session management |
| Password | bcrypt | Industry-standard hashing algorithm |
