# P17 Frozen Acceptance Contract

**Phase:** P17 — Documents, Communication, Integrations, and Automation  
**Contract version:** `P17-v1`, frozen 2026-09-22  
**Final verification command:** `npm run verify:p17`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typechecks, and database cleanup checks pass  

## Purpose and finish line

P17 is complete when one real, tenant-safe production Documents, Communication, Integrations, and Automation golden thread proves:

`Entity Context Creation (SalesOrder/Invoice/PO) → Polymorphic Note & Comment Creation with @username Mentions under Parent ACL (BUS-RULE-091, BUS-RULE-094, BUS-RULE-095) → Presigned File Upload, Verification, and Entity Attachment Linking (BUS-RULE-096, BUS-RULE-098) → Reproducible Document Draft & PDF Generation with Immutable Snapshot Preservation (DocumentDraft) → Resilient Webhook Intake (WhatsApp Cloud API) with HMAC-SHA256 Signature Verification, Deduplication (BUS-RULE-101), Outbox Processing, Exponential Retry Backoff and DLQ Quarantine → Centralized In-App Notifications with 1-Hour Deduplication (BUS-RULE-092), Unread Counting, SLA Escalation Scanning (BUS-RULE-093), and Notification Preferences Management`

and the transactions produce immutable audit logs (`BUS-RULE-097`), maintain strict tenant isolation (`BUS-RULE-098`), render 100% live data in all named P17 surfaces without static array mocks, and leave zero residue rows in PostgreSQL.

## Frozen scope

In scope:
- **Polymorphic Communication Protocol & Mention Engine (`BUS-RULE-091`, `BUS-RULE-094`, `BUS-RULE-095`, `REQ-037`)**:
  - Entity notes & comments: `/entities/{type}/{id}/notes`, `/entities/{type}/{id}/notes/{noteId}`, `/entities/{type}/{id}/comments`.
  - Polymorphic thread/reply storage under parent ACL.
  - `@username` parsing resolving only active tenant users with parent access.
  - Atomic persistence of Note/Comment, Tag/Mention records, Notification records, and outbox event `entity.mention.created`.
  - Entity status transition history: `/entities/{type}/{id}/transitions`.
  - Entity tags: `/entities/{type}/{id}/tags`.
- **Secure File Storage & Attachment Management (`BUS-RULE-096`, `BUS-RULE-098`)**:
  - Presigned upload URL generation: `POST /files/presign`.
  - Upload confirmation and audit log: `POST /files/{id}/confirm`.
  - Entity attachment linking: `POST /entities/{type}/{id}/attachments` and `GET /entities/{type}/{id}/attachments`.
  - File size limits (5MB/10MB), MIME whitelisting, and signed download/access.
- **Document Automation & Deterministic PDF Engine**:
  - `DocumentDraft` lifecycle (`DRAFT` $\to$ `REVIEWING` $\to$ `APPROVED` $\to$ `CONVERTED`).
  - Immutable payload snapshotting preserving original input data for exact reproducibility.
  - Secure, dependency-safe PDF generation replacing vulnerable legacy libraries.
  - Document & message templates catalog: `/templates`, `/email-templates`, `/sms-templates`, `/document-templates`.
- **Resilient Integrations, Webhook Security & Outbox DLQ (`BUS-RULE-093`, `BUS-RULE-101`)**:
  - Inbound webhook security: Meta / WhatsApp Cloud API verify token (`GET`) and HMAC-SHA256 signature validation (`POST`).
  - Webhook deduplication using message ID with 24-hour TTL (`IDEMPOTENCY_KEY_CONFLICT`).
  - Outbox retry engine: exponential backoff (1s, 2s, 4s) up to 3 attempts, routing poison messages to `outbox_dlq`.
  - SLA timer scanner: auto-escalation of pending approvals older than 24 hours (`notification.sla.escalate`).
- **Centralized Notification Hub & Named Live DNA UI Surfaces**:
  - Notification management APIs: `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/mark-all-read`, `GET /notifications/:id`.
  - Notification preferences: `GET /profile/notification-preferences`, `PUT /profile/notification-preferences`.
  - 1-hour notification deduplication (`BUS-RULE-092`).
  - Named Live DNA UI Surfaces (100% Zero Mock):
    - `/notifications` (`SCR-136`)
    - `/notifications/[id]` (`SCR-137`)
    - `/settings/notifications` (`SCR-138`)
    - `/settings/templates` (`SCR-145`)
    - `/master/automation` (Automation Dashboard)

Out of scope:
- Executive multi-year consolidated BI governance (P18);
- Product-wide WCAG AA accessibility certification (P19);
- Full disaster recovery rehearsal (P21).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P17-01` | **Polymorphic Communication & Mention Engine:** Entity notes, comments, tags, and transition history operate under parent ACL. Mentioning `@username` atomically saves note, tags, notifications, and emits outbox event `entity.mention.created`. Inactive or cross-tenant users cannot be tagged. |
| `AC-P17-02` | **Secure File Storage & Attachments:** Presign endpoint validates MIME and size limits. Upload confirmation logs audit entry. Attachments securely bind to target business entity and enforce parent authorization. |
| `AC-P17-03` | **Document Automation & Hardened PDF Engine:** Document drafts support complete lifecycle transitions (`DRAFT` to `APPROVED`/`CONVERTED`), maintain immutable original payload snapshots, and render reproducible documents safely. |
| `AC-P17-04` | **Resilient Webhook Security, Outbox & DLQ:** WhatsApp webhook verifies signature and deduplicates incoming message IDs. Outbox processor retries transient failures with backoff and safely routes poison events to `outbox_dlq`. SLA scanner flags idle approvals >24h. |
| `AC-P17-05` | **Central Notification Hub & Preferences:** Notifications deduplicate identical events within 1 hour. Unread count, mark-read, mark-all-read, and channel preferences function predictably. |
| `AC-P17-06` | **Zero-Mock Live UI Surfaces:** All named P17 surfaces fetch live backend data, handle loading, empty, and error states using `@/components/dna`, and contain zero static mock arrays. |
| `AC-P17-07` | **Thin Final Verification & Clean DB:** `npm run verify:p17` executes dual typechecks, focused backend suites, frontend live UI behavior suite, real DB golden thread, and cleanup check with natural exit `0`, leaving 0 residue rows in PostgreSQL. |

## Verification composition

The frozen verification command `npm run verify:p17` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p17:communication-mentions`
3. `npm --prefix backend run test:p17:files-attachments`
4. `npm --prefix backend run test:p17:document-automation`
5. `npm --prefix backend run test:p17:integrations-dlq`
6. `npm --prefix backend run test:p17:golden-thread`
7. `npm --prefix frontend run test:p17`
8. `node scripts/ssot/p17_clean_db.js`
