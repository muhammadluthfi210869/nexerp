# Marketing Task Schema/Code Mismatch — Refactor Note

> Status: KNOWN ISSUE · Out of scope for sprint fixes · Decision needed

## Problem

`backend/src/modules/marketing/prototype/marketing-prototype.service.ts` references Prisma models that don't exist in `backend/prisma/schema/marketing.prisma`:

- `MarketingTaskHistory`
- `MarketingTaskAttachment`
- `MarketingTaskComment`
- `MarketingProject`

The schema currently has only a minimal `MarketingTask` (id, ownerId, assigneeId, title, description, status, priority, dueDate).

`tsc --noEmit` shows ~25 errors as a result.

## Why this exists

The service was originally built against a richer schema (full relations, attachments, history, comments, projects). The schema was simplified at some point but the service was not refactored to match.

The frontend (`ManagementTaskBoard.tsx`) consumes the bundle endpoint and assumes the rich shape (tasks with attachments[], history[], comments[], project relation).

## Two paths forward

### Path A — Restore the schema (bigger blast radius)

Add back:
- `MarketingTaskHistory` (taskId, byId, fromStatus, toStatus, note, at)
- `MarketingTaskAttachment` (taskId, name, type, sizeKb, path, uploadedById)
- `MarketingTaskComment` (taskId, authorId, body, createdAt)
- `MarketingProject` (projectCode, name, channel, category, ownerId, startDate, deadline, progress, status, summary, blockers)

Then run `prisma migrate dev --name restore-marketing-tasks` + regenerate client.

Risk: data loss if existing tables have rows that conflict with new schema.

### Path B — Simplify the service (smaller blast radius)

Refactor the service to match the minimal schema: drop attachments/history/comments/projects, map frontend bundle to flat fields.

Risk: frontend redesign required, breaks current UI flows.

## What's needed before deciding

- [ ] Confirm with stakeholder whether attachments/comments/history/project tracking is a product requirement
- [ ] Audit existing production DB (if any) to see what schema is actually deployed
- [ ] Run `prisma generate` to confirm current client matches current schema
- [ ] Run `npx tsc --noEmit` and count actual errors (currently ~25)

## Related

- Wave 1 fixes touched this service file but only the existing-code-correctness (transactions, race fixes, history.toStatus null)
- The pre-existing schema gap was NOT introduced by recent work
- All recent fixes are isolated to the rich-schema contract

---

_Last reviewed: 2026-09-08_
