# SSOT — Communication Protocol Spec

> Sub-dokumen dari `_SSOT_FINAL.md`.
> Versi: 1.0 | Tanggal: 2026-09-16 | Status: **LOCKED**

---

## 1. Ringkasan Keputusan

| Aspek | Keputusan | Rationale |
|-------|-----------|-----------|
| **Real-time chat** | ❌ **NOT INCLUDED** | User explicit "ga ada chat real time" |
| **Tipe komunikasi** | **Notes** + **Document Transfer Status** + **Tags** + **Cross-Reference Comments** | User: "notes, document transfer, status, bisa di luar WA jadi full di dalam ini" |
| **Notification feed** | ✅ **In-app badge feed** (badge polling pattern dari legacy) | Sidebar badge counts + dropdown notification center |
| **External (WA)** | ❌ **NOT for internal processes** | WA only for external customer chat (existing integration) |
| **Audit** | ✅ All notes/status changes logged |

**Prinsip**: Semua komunikasi terkait **business process** (document transfer, status change, approval request, etc.) HARUS di dalam ERP. Komunikasi eksternal ke customer (WA) tetap via existing integration.

---

## 2. Entity Communication Schema

Setiap business entity punya communication layer:

```typescript
interface EntityCommunication {
  entity_type: string;       // 'sales_order', 'batch_record', 'sample', etc.
  entity_id: string;          // UUID of the entity
  
  notes: Note[];              // Free-text notes added by users
  status_transitions: StatusTransition[];  // Document transfer history
  tags: Tag[];                 // @mentions / user tags
  comments: Comment[];         // Cross-reference comments (link to other entities)
  attachments: Attachment[];   // Files attached to this entity
}

interface Note {
  id: string;
  author_id: string;          // User who wrote
  body: string;               // Free text (markdown supported)
  tagged_users: string[];     // @mentioned users
  created_at: Date;
  edited_at?: Date;
  visibility: 'all' | 'internal' | 'admin';
}

interface StatusTransition {
  id: string;
  from_status: string;        // e.g., 'draft', 'pending', 'approved'
  to_status: string;          // e.g., 'in_production', 'sent_to_rnd'
  from_user_id: string;        // Who triggered
  to_user_id?: string;         // Who is the new PIC (recipient)
  to_role_id?: string;         // Role receiving the transition
  notes?: string;              // Why transferred
  attachments?: string[];     // Related docs
  acknowledged_at?: Date;      // When recipient acknowledged
  sla_deadline?: Date;         // Expected ack time
  created_at: Date;
}

interface Tag {
  type: '@user' | '@role' | '@division';
  target_id: string;          // User ID, Role ID, or Division ID
  context: 'note' | 'comment' | 'transition';
  context_id: string;
  mentioned_by: string;        // User who tagged
  created_at: Date;
}

interface Comment {
  id: string;
  author_id: string;
  body: string;
  // Cross-reference to another entity
  related_entity_type?: string;  // e.g., 'batch_record' when commenting on sales_order
  related_entity_id?: string;
  tagged_users: string[];
  created_at: Date;
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_url: string;         // Supabase Storage path
  uploaded_by: string;
  uploaded_at: Date;
  description?: string;
}
```

---

## 3. Document Transfer Status Pattern

The core "communication" — when a document moves between divisions/people, it MUST be tracked.

### 3.1. Status State Machine (universal pattern)

```
draft → pending → acknowledged → in_progress → completed → archived
                  │
                  └─→ rejected (with reason)
                  └─→ cancelled
```

### 3.2. Per-Pipeline Implementations

**Sales Pipeline:**
```
Leads 
  ↓ [BusDev acknowledges]
Sales Sample (draft)
  ↓ [BusDev submits, R&D queue]
  ↓ [R&D acknowledges → starts formulation]
Sample Pending → In Progress
  ↓ [Sample selesai, kirim ke klien]
Sample Approved
  ↓ [Klien deal, DP dibayar]
Sales Order (draft)
  ↓ [Approval]
SO Approved
  ↓ [Production acknowledgment]
In Production
  ↓ [QC acknowledged]
QC Pass
  ↓ [Logistics acknowledged]
Shipping → Delivered
```

**Purchase Pipeline:**
```
Purchase Request (draft)
  ↓ [Submit → Manager queue]
  ↓ [Manager approved → PO auto-create]
PO (draft)
  ↓ [Submit → Purchasing Manager]
PO Pending Approval
  ↓ [Approved]
PO Approved → [Warehouse acknowledges receipt scheduled]
Goods Receipt (scheduled)
  ↓ [Warehouse received → QC acknowledged]
GR Completed
  ↓ [Finance acknowledges invoice]
Invoice Recorded → [Payment scheduled]
Payment (scheduled)
  ↓ [Treasurer confirms]
Paid
```

**Production Pipeline:**
```
Batch Record (draft)
  ↓ [Submit → Production Manager]
BR Acknowledged → Schedule Mixing
  ↓ [Mixing acknowledged]
Schedule Mixing → Production Mixing (in progress)
  ↓ [Bulk complete, QC acknowledged]
Production Mixing (completed) → Production Filling (queued)
  ↓ [Filling acknowledged]
... (filling → packaging → delivery)
```

### 3.3. Transfer Acknowledgment SLA

| Transfer Type | Default SLA | Critical |
|--------------|-------------|----------|
| Sample → R&D | 24 hours | Critical (blocks production) |
| SO Approved → Production acknowledge | 4 hours | High |
| PO Approved → Warehouse schedule receipt | 48 hours | Medium |
| GR Completed → Finance invoice | 24 hours | Medium |
| Mix complete → Fill queue | 1 hour | High |
| QC Pass → Logistics | 4 hours | High |
| Delivery scheduled → Driver dispatch | 30 min | Critical (late penalty) |

**Overdue alerts**: Any transfer exceeding SLA → in-app notification + email to PIC + escalation to role manager after 2× SLA.

---

## 4. Tags (@Mentions)

### 4.1. Tag Syntax

In notes/comments:
- `@username` — tag specific user
- `@role:BusDev` — tag role (all members notified)
- `@division:Production` — tag division (all members notified)
- `@me` — self-tag (bookmark)

### 4.2. Tag Resolution

```
1. User types `@`
2. Frontend opens autocomplete (search users/roles/divisions)
3. User selects target
4. On save → backend creates Tag record + notification
```

### 4.3. Notification on Tag

When user is tagged:
- In-app notification (immediate, in notification center)
- Optional email (configurable per user preference)

### 4.4. Tag Visibility

Tags create **explicit attention** — recipient must acknowledge or respond. Different from CC (informational).

---

## 5. Cross-Reference Comments

Comments yang refer ke **entity lain** — e.g., di Sales Order, comment yang link ke Batch Record.

### 5.1. Use Case

BusDev di SO comment: "Klien minta revisi, sudah kirim brief baru. Lihat: [Batch Record BR-2026-09-001]"
- Click link → navigate to Batch Record
- Both entities show the comment in their timeline (bidirectional reference)

### 5.2. Implementation

```typescript
interface CrossReference {
  id: string;
  source_entity_type: string;   // 'sales_order'
  source_entity_id: string;
  target_entity_type: string;    // 'batch_record'
  target_entity_id: string;
  reference_type: 'comment' | 'attachment' | 'transition';
  created_by: string;
  created_at: Date;
}
```

Bidirectional timeline: viewing either entity shows references to/from.

---

## 6. Notification Center (Sidebar Badge)

### 6.1. In-App Feed

Top-right notification icon → dropdown panel showing:
- Recent mentions (last 7 days)
- Pending Pending for me (approval queue, SLA due)
- Recent status transitions on entities I own/watch
- System announcements

### 6.2. Sidebar Badge Polling (legacy pattern preserved)

Each user has badge counts per module:
- BusDev: `/sales-approval/badge`, `/sales-sample-approval/badge`, etc.
- Production: `/batch-record/badge`, `/checklist-progress/badge`
- Universal pattern: poll `/{module}/badge` every 30s (configurable)

### 6.3. Notification Types

| Type | Trigger | Default delivery |
|------|---------|-------------------|
| `@mention` | User tagged | In-app + email (if enabled) |
| `approval_request` | Doc needs my approval | In-app + email |
| `sla_warning` | Transfer approaching SLA breach | In-app |
| `sla_breach` | Transfer exceeded SLA | In-app + email + escalate to role manager |
| `status_changed` | Entity I'm watching transitioned | In-app (no email) |
| `system` | Admin announcement | In-app + email |

---

## 7. Watch / Subscribe

User can subscribe to entities to get updates:

```
POST /api/v1/entities/:type/:id/watch { notify_on: ['status_change', 'comment', 'tag'] }
```

Default subscriptions:
- Creator of entity
- Current PIC
- Users mentioned in notes
- Division head (if entity affects their division)

---

## 8. Storage & Retention

| Data | Retention | Storage |
|------|-----------|---------|
| Notes | Unlimited | DB |
| Status transitions | Unlimited | DB |
| Tags | Unlimited | DB (with notification log) |
| Comments | Unlimited | DB |
| Attachments | 5 years | Supabase Storage + DB metadata |
| Notification log | 1 year | DB |

---

## 9. Search

Global search across all communications:
- Full-text on note body, comment body
- Filter by author, entity, date range
- Filter by tagged user, status transition type

```
GET /api/v1/search?q=batch+record&type=note&author=andi
```

---

## 10. Open Questions (require user decision)

1. **Email digest** — daily/weekly summary, or per-event? Default: per-event for critical, daily digest for non-critical.
2. **Mobile push notifications** — Phase 2? (Default: in-app + email only for MVP)
3. **External customer communication** — include customer replies in communication feed? (Currently WA external, integration via `wa-webhook` already exists)
4. **Note editing history** — keep all versions or only last? Default: only last (but audit log shows who edited).

---

## 11. References

- Legacy badge pattern: `/{module}/badge` endpoints (38 found in legacy crawl)
- Existing NEX modules: `lead-capture/`, `wa-webhook/` (external customer chat — separate)
- Frontend pattern: Notification dropdown + sidebar badge counts

---

**Dokumen ini adalah referensi implementasi communication. Ubah dokumen ini dulu sebelum mengubah file communication backend.**