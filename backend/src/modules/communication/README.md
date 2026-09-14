# Communication Module (Wave 3/D1)

Notes / reply / mention / attach protocol — backend v2 implementation.

## What this module does

- Threads polymorphic to any entity (`contextType` + `contextId` — SalesOrder,
  PurchaseOrder, Invoice, Project, ...). No FK rewiring required.
- Replies support nested threads via `parentReplyId`.
- Mentions fan out to `notification.mention` EventEmitter2 events → WS
  gateway pushes to `user.{userId}` room.
- Attachments: exactly one of `threadId` / `replyId` (CHECK constraint).
- Status transitions (`OPEN` → `CLOSED` → `ARCHIVED`) routed through
  `StateMachineService.transition()` for audit. No bypass.
- Every action writes an `ActivityLog` row.

## REST endpoints (all under `/v1/communications/`)

| Method | Path                                  | Purpose                                  |
|-------:|---------------------------------------|------------------------------------------|
| POST   | `/threads`                            | Create thread                            |
| GET    | `/threads?mine=1`                     | Threads the caller is involved in        |
| GET    | `/threads?contextType=X&contextId=Y`  | Threads for a given entity               |
| GET    | `/threads/:id`                        | Detail with replies + mentions + files   |
| PATCH  | `/threads/:id`                        | Update title / close / archive           |
| POST   | `/threads/:id/replies`                | Reply (with optional inline mentions)    |
| POST   | `/threads/:id/attachments`            | Upload attachment to thread              |
| POST   | `/replies/:id/mentions`               | Add a mention to an existing reply       |
| POST   | `/replies/:id/attachments`            | Upload attachment to a reply             |

All routes require `JwtAuthGuard`.

## WebSocket gateway

- Namespace: `/v1/ws`
- Handshake auth: `auth.token` (JWT) — verified with same secret as REST
  `JwtStrategy`.
- Per-user room: `user.{userId}` (clients join on connect)
- Heartbeat: 30s server-side ping
- Reconnect replay: client passes `lastEventId` on handshake, server replays
  missed events from a per-user 200-entry ring buffer.

## Event subscriptions (gateway reads from EventEmitter2)

- `notification.mention` → push to `user.{mentionedUserId}`
- `thread.reply.created` → push to `user.{authorId}` (self)
- `notification.approval_granted` → push to `user.{approverId}` (already
  emitted by `state-machine/listeners/approval-granted.listener.ts:45`)

## Future inputs (already documented)

- `docs/communication_protocol/bussdev_comm.md` — BD comm flows
- `docs/communication_protocol/finance.md` — finance comm flows
- `docs/communication_protocol/input_bussdev_progress.md` — BD progress input

These are domain specs the backend already supports generically; UI work in
D1.Frontend will render the surfaces.

## Out of scope (deliberate)

- Thread deletion: only CLOSE / ARCHIVE per spec.
- Read receipts / typing indicators — add when UI needs them.
- Push notification fanout to mobile — separate channel.
