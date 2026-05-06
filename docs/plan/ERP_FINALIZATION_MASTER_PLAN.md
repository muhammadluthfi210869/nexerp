# 🏗️ ERP FINALIZATION — MASTER PLAN
**Version**: 1.0 — 2026-05-05
**Source**: Comprehensive codebase audit (backend 42 services, 14 prisma schemas, frontend 80+ pages, 10 e2e tests)

---

## 📊 EXECUTIVE SUMMARY — CURRENT STATE

| Aspek | Skor | Critical Issues |
|:---|---:|---:|
| **Backend Logic** | 55% | No centralized state machine, mass assignment, 5 orphan FKs |
| **Prisma Schema** | 80% | 7 CRITICAL: orphan FKs, circular ref, missing formulaId |
| **Frontend Pages** | 65% | 17 pages missing, 5 pages mock data, `prompt()` in production |
| **API Readiness** | 40% | 34/36 controllers untested via HTTP, FundRequest API exists no UI |
| **Test Coverage** | 15% | 18/27 modules zero tests, no Financial Gate test suite |
| **Notification** | 0% | Complete stub |
| **State Machine** | 20% | `StateTransitionService` is log-only, no validation |

**Overall System Readiness: ~45% — Not production-ready.**

---

## 🔴 FASE 1: BACKEND FOUNDATION

**Goal**: Fix schema, core logic bugs, security holes — before any UI work.
**Estimasi**: 5-7 hari

---

### 1.1 Prisma Schema Repairs (1 hari)

| # | Item | File | Fix |
|:---|:---|---:|---|
| 1.1.1 | Orphan FK: `DesignFeedback.authorId` | `creative.prisma:57` | Add `@relation(fields: [authorId], references: [id])` to User |
| 1.1.2 | Orphan FK: `ProductionLog.operatorId` | `production.prisma:221` | Add `@relation` to User |
| 1.1.3 | Orphan FK: `InternalAudit.picId` | `legal.prisma:67` | Add `@relation` to User |
| 1.1.4 | Orphan FK: `SampleRequest.paymentApprovedById` | `rnd.prisma:46` | Add `@relation` to User |
| 1.1.5 | Orphan FK: `LeadActivity.validatedBy` | `bussdev.prisma:88` | Add `@relation` to User |
| 1.1.6 | Circular ref: Invoice-DeliveryOrder | Both files | Remove unannotated `DeliveryOrder.invoice Invoice?` |
| 1.1.7 | Missing `formulaId` on ProductionPlan/WO | `production.prisma` | Add `formulaId String? @db.Uuid` + relation to Formula |

---

### 1.2 Missing Indexes (0.5 hari)

Add indexes to hot-path models (queried every page load):

```prisma
model SalesLead {
  @@index([picId, status, createdAt])
}
model SampleRequest {
  @@index([stage, leadId])
}
model SalesOrder {
  @@index([leadId, status])
}
model Invoice {
  @@index([soId, status])
}
model DesignTask {
  @@index([leadId, kanbanState])
}
model RegulatoryPipeline {
  @@index([leadId, type, currentStage])
}
model ProductionPlan {
  @@index([soId, status])
}
model QCAudit {
  @@index([stepLogId, status])
}
model Payment {
  @@index([invoiceId])
}
model ActivityStream {
  @@index([leadId, eventType, createdAt])
}
```

---

### 1.3 Critical Logic Bugs (2 hari)

| # | Bug | File | Impact | Fix |
|:---|:---|---:|:---|---:|
| 1.3.1 | `WAITING_FINANCE_APPROVAL` cast as `any` | `bussdev.service:285` | Type safety hole | Create proper enum + transition map |
| 1.3.2 | No state machine validation | `bussdev.service:199-421` | Can skip NEW_LEAD→WON_DEAL | Implement `StateTransitionService.validate()` |
| 1.3.3 | WIP Journal Dr=Cr to same account | `finance.service:261-263` | Zeroes out WIP | Fix: Dr WIP / Cr RawMaterial |
| 1.3.4 | FundRequest department search by UUID | `finance.service:872-877` | 100% failure rate | Use Account.code lookup, not departmentId name |
| 1.3.5 | autoCreatePR uses MOQ not SO qty | `scm.service:623` | Wrong PR quantity | Use `sample.salesOrders[0].quantity` instead of `lead.moq` |
| 1.3.6 | Random invoice numbers in Formula | `formulas.service:105` | Collision risk | Use `IdGeneratorService.generateId('INV')` |
| 1.3.7 | Inbound bypasses QC | `inbounds.service:45-86` | PENDING→APPROVED without QC | Add QC validation step |
| 1.3.8 | FEFO validation is empty stub | `production-execution.service:97` | "Untuk simplikasi" | Implement actual FEFO check |
| 1.3.9 | `advanceSampleStage()` no validation | `rnd.service:142-226` | Can skip QUEUE→APPROVED | Add transition map check |
| 1.3.10 | Gate 3 missing auto journal | `finance.service:1088-1117` | Pelunasan tidak tercatat | Add JournalEntry creation on G3 |

---

### 1.4 Build Centralized State Machine (1.5 hari)

**Create a Transition Map Registry** in `system/state-transition.service.ts`:

```typescript
// Canonical transition map — source of truth
const TRANSITION_MAP: Record<EntityType, Record<string, string[]>> = {
  SalesLead: {
    NEW_LEAD:                                   ['CONTACTED', 'LOST'],
    CONTACTED:                                  ['FOLLOW_UP_1', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_1:                                ['FOLLOW_UP_2', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_2:                                ['FOLLOW_UP_3', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_3:                                ['NEGOTIATION', 'LOST'],
    NEGOTIATION:                                ['SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST'],
    SAMPLE_REQUESTED:                           ['WAITING_FINANCE_APPROVAL', 'LOST'],
    WAITING_FINANCE_APPROVAL:                   ['SAMPLE_SENT', 'LOST'],  // only via G1
    SAMPLE_SENT:                                ['SAMPLE_APPROVED', 'LOST'],
    SAMPLE_APPROVED:                            ['SPK_SIGNED', 'LOST'],
    SPK_SIGNED:                                 ['WAITING_FINANCE_APPROVAL', 'LOST'], // G2 needed
    DP_PAID:                                    ['PRODUCTION_PLAN', 'LOST'],
    PRODUCTION_PLAN:                            ['READY_TO_SHIP', 'LOST'],
    READY_TO_SHIP:                              ['WON_DEAL', 'LOST'], // G3 needed
    WON_DEAL:                                   [],
    LOST:                                       [],
    ABORTED:                                    [],
  },
  SampleStage: {
    WAITING_FINANCE:                            ['QUEUE', 'CANCELLED'],  // only via G1
    QUEUE:                                      ['FORMULATING', 'CANCELLED'],
    FORMULATING:                                ['LAB_TEST', 'CANCELLED'],
    LAB_TEST:                                   ['READY_TO_SHIP', 'CANCELLED'],
    READY_TO_SHIP:                              ['SHIPPED', 'CANCELLED'],
    SHIPPED:                                    ['RECEIVED', 'CANCELLED'],
    RECEIVED:                                   ['CLIENT_REVIEW', 'CANCELLED'],
    CLIENT_REVIEW:                              ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED:                                   [],
    REJECTED:                                   [],
    CANCELLED:                                  [],
  },
  SOStatus: {
    PENDING_DP:                                 ['LOCKED_ACTIVE', 'CANCELLED'], // only via G2
    LOCKED_ACTIVE:                              ['READY_TO_PRODUCE', 'CANCELLED'],
    READY_TO_PRODUCE:                           ['COMPLETED', 'CANCELLED'], // only via G3
    COMPLETED:                                  [],
    CANCELLED:                                  [],
    ACTIVE:                                     ['LOCKED_ACTIVE', 'CANCELLED'], // legacy
  },
  // ... add for FormulaStatus, LifecycleStatus, DesignState, RegStage
};
```

**Key methods to add:**
- `validateTransition(entityType: EntityType, from: string, to: string): boolean`
- `isGateControlled(from: string, to: string): GateType | null`
- `executeTransition(entityType, entityId, to, userId, overridePin?)`

**Wire into every module via decorator:**
```typescript
@ValidateStateMachine('SalesLead')
advanceLeadStage(@Body() dto: AdvanceLeadDto) { ... }
```

**Emergency Override**: requires `SUPER_ADMIN` PIN + creates `SystemOverrideLog` record.

---

### 1.5 Security Fixes (1 hari)

| # | Issue | File | Fix |
|:---|:---|---:|---:|
| 1.5.1 | Mass assignment | `sales-orders.service:110` | Use whitelist DTO, not raw `dto` |
| 1.5.2 | Emergency Override no PIN | `bussdev.service:1545` | Add bcrypt PIN check for SUPER_ADMIN |
| 1.5.3 | Regulatory pipeline bypass | `legality.service:446` | Return `{ allowed: false }` if no pipeline |
| 1.5.4 | Magic strings → enum refs (20+ spots) | All files | Replace `'NEW_LEAD'` → `WorkflowStatus.NEW_LEAD` etc |
| 1.5.5 | No auth/permission checks | All services | Add `@Roles()` decorator + permission guard |

---

### 1.6 Notification Service (1 hari)

**Architecture:**
```typescript
interface NotificationChannel {
  send(recipient: User, message: NotificationMessage): Promise<void>;
}

class InAppChannel implements NotificationChannel { ... }   // DB notification
class EmailChannel implements NotificationChannel { ... }   // Nodemailer
class WhatsAppChannel implements NotificationChannel { ... } // Twilio/WABlas
```

**Events to wire (minimum viable):**
| Event | Trigger | Recipient |
|:---|---:|---:|
| `sample.payment.verified` | Finance verifies G1 | R&D formulator |
| `production.dp.verified` | Finance verifies G2 | SCM + Legal + Creative |
| `payment.final.verified` | Finance verifies G3 | Warehouse |
| `sample.revision.overlimit` | Revision > 3x | Director |
| `stock.shortage` | Auto PR created | SCM Purchasing |
| `sla.breach` | Any stage exceeds SLA | Head of division |
| `bpom.published` | NA number issued | BD + Production |

**Connect to existing `EventEmitter2`:**
```typescript
@OnEvent('finance.gate2.verified')
handleGate2Verified(payload: GateEvent) {
  this.notify(/* SCM */, `DP verified for ${payload.leadName}. Start procurement.`);
  this.notify(/* Legal */, `Start BPOM registration for ${payload.productName}.`);
  this.notify(/* Creative */, `Design task available for ${payload.brandName}.`);
}
```

---

## 🟠 FASE 2: SERVICE LAYER INTEGRITY

**Goal**: Complete all incomplete service methods, fix split workflows.
**Estimasi**: 5-7 hari (mulai setelah Fase 1 selesai)

---

### 2.1 Complete Split Workflows (2 hari)

| Workflow | Current State | Fix |
|:---|---:|---:|
| **PR→PO flow** | PR created but no approval→PO method | Add `approvePR()` + auto-create PO from PR |
| **FundRequest multi-stage** | Missing Director approval & reject | Add `PENDING_APPROVAL_DIR` + `REJECTED` handler |
| **Gate 3 auto journal** | Missing journal for pelunasan | Add `JournalEntry` (Kas↑, Piutang↓) on G3 verify |
| **QC inbound gate** | Inbound PENDING→APPROVED no QC | Add QC inspection before inbound status change |
| **FEFO validation** | Stub method — comment "simplifikasi" | Implement actual FEFO batch selection + validation |
| **ProductionLog double-deduction** | Comm-protocol deducts, WH also deducts | Fix: only one service handles stock deduction |
| **ActivityStream consumer** | 50+ emitters, 0 consumers | Wire `activity-stream.service.ts` as `@OnEvent` listener |

---

### 2.2 Complete Missing API Endpoints (1.5 hari)

| # | Endpoint | Module | Purpose |
|:---|:---|---:|---:|
| 2.2.1 | `PATCH /fund-requests/:id/reject` | Finance | Reject fund request with reason |
| 2.2.2 | `POST /fund-requests/:id/director-approve` | Finance | Director approval stage |
| 2.2.3 | `POST /production-plans/:id/assign-formula` | Production | Direct formula→plan linkage |
| 2.2.4 | `GET /rnd/lab-test-results/:formulaId` | R&D | Lab test center data |
| 2.2.5 | `POST /lab-test-results` | R&D | Create lab test result |
| 2.2.6 | `POST /scm/purchase-requests/:id/approve` | SCM | PR approval + auto PO |
| 2.2.7 | `POST /inbounds/:id/qc-validate` | SCM/Warehouse | QC gate before inbound finalize |
| 2.2.8 | `POST /inbounds/:id/reject` | SCM/Warehouse | Reject inbound shipment |
| 2.2.9 | `GET /notifications/unread` | Notification | Fetch unread notifications |
| 2.2.10 | `POST /notifications/:id/read` | Notification | Mark notification as read |
| 2.2.11 | `POST /notifications/read-all` | Notification | Mark all as read |
| 2.2.12 | `POST /retention-engine/:id/trigger` | Bussdev | Manual trigger retention check |

---

### 2.3 Error Handling Standardization (1 hari)

**Consistent error response format:**
```typescript
class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,           // e.g., 'STATE_TRANSITION_INVALID'
    message: string,        // Human-readable
    details?: any,          // Validation errors, etc.
  ) {
    super({ code, message, details, timestamp: new Date().toISOString() }, status);
  }
}
```

**Replace all ad-hoc:**
- `throw new Error('...')` → `throw new BadRequestException(...)` or `ApiException`
- `throw new BadRequestException('...')` → consistent `ApiException` with error code

**Add global ExceptionFilter:**
```typescript
@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Standardize all errors to { code, message, details, timestamp }
    // Log to SystemOverrideLog for audit
  }
}
```

**Add `@Transaction()` decorator:**
```typescript
@Transaction({ isolation: 'READ_COMMITTED' })
async createWithRollback(dto: Dto) {
  // All Prisma operations in this method use $transaction
  // Auto-rollback on any exception
}
```

---

### 2.4 Harden Gate Conditions (1 hari)

**Gate 1 — Sample Gate:**
- [ ] Finance verifies payment → `SampleStage.WAITING_FINANCE` → `QUEUE`
- [ ] `paymentApprovedAt` + `verifiedBy` MUST be non-null before R&D can accept
- [ ] Auto-create `JournalEntry` (Kas↑, Pendapatan Diterima Dimuka↑)

**Gate 2 — Production Gate:**
- [ ] Finance verifies DP ≥ 50% → `SOStatus.PENDING_DP` → `LOCKED_ACTIVE`
- [ ] Auto-trigger: RegulatoryPipeline, Creative DesignTask, SCM PR, Warehouse Capacity
- [ ] Auto-create `JournalEntry` (Kas↑, Unearned Revenue↑)
- [ ] ❌ SCM cannot create PO for packaging before this gate

**Gate 3 — Delivery Gate:**
- [ ] Finance verifies remaining payment → `InvoiceStatus.PAID`
- [ ] Warehouse cannot create DO/Shipment before this gate
- [ ] Auto-create `JournalEntry` (Unearned Revenue↓, Revenue↑)
- [ ] Auto-trigger: Lead → `WON_DEAL`, SO → `COMPLETED`

---

## 🟡 FASE 3: FRONTEND REPAIR

**Goal**: Fix bugs, replace mock data, remove anti-patterns, add missing pages.
**Estimasi**: 7-10 hari (paralel dengan Fase 2)

---

### 3.1 Emergency Fixes (1 hari)

| # | Anti-pattern | File | Fix |
|:---|:---|---:|---:|
| 3.1.1 | `prompt("Scan QR...")` | `production/terminal/mixing/page.tsx` | Replace with `<QRScannerDialog>` component |
| 3.1.2 | `prompt("Scan QR...")` | `production/terminal/filling/page.tsx` | Replace with `<QRScannerDialog>` component |
| 3.1.3 | `prompt()` twice in packing | `production/terminal/packing/page.tsx` | Single scan + auto-detect multi-field |
| 3.1.4 | Hardcoded `"MANAGER_ID"` | `production/terminal/mixing/page.tsx` | Use actual user from auth context |
| 3.1.5 | `console.log('DEBUG_PIPELINE_GRANULAR:')` | `bussdev/pipeline/page.tsx` | Remove debug logging |
| 3.1.6 | `confirm()` dialog | `bussdev/guest-book/page.tsx` | Replace with proper modal component |
| 3.1.7 | `setTimeout` fake API | `finance/actual-costing/page.tsx` | Replace with real API call |
| 3.1.8 | `toast.success` without API call | `finance/bills/page.tsx` | Add real mutation |
| 3.1.9 | Hardcoded COA data | `finance/transactions/page.tsx` | Fetch from `/finance/accounts` API |

---

### 3.2 Replace Mock Data Pages (1.5 hari)

| # | Page | Current | Replace With |
|:---|:---|---:|---:|
| 3.2.1 | `qc/coa/page.tsx` | Hardcoded array | API: `GET /qc/audits?type=inbound` |
| 3.2.2 | `qc/inspections/page.tsx` | Hardcoded mock | API: `GET /qc/audits?status=PENDING` |
| 3.2.3 | `qc/stability/page.tsx` | Hardcoded mock | API: `GET /rnd/lab-test-results?type=stability` |
| 3.2.4 | `rnd/repository/page.tsx` | Hardcoded mock | API: `GET /formulas?status=ARCHIVED` |
| 3.2.5 | `finance/transactions/page.tsx` | Hardcoded mock | API: `GET /finance/journal` |
| 3.2.6 | `production/dashboard/page.tsx` | Mock KPIs | API: `GET /production/dashboard` |

---

### 3.3 Add Missing Pages (3 hari)

17 pages minimum viable (form + table + status).

#### Priority P0 — Critical Path (1 hari)

| Page | Route | Key Features |
|:---|---:|:---|
| **Lab Test Center** | `/rnd/lab-test` | Form: pH, visco, density, stability 40°C/RT/4°C; Table: history per formula |
| **Fund Request UI** | `/finance/fund-requests` | Form: amount, reason, attachment; Table: status timeline (PENDING→APPROVED→PAID) |

#### Priority P1 — Operational (1 hari)

| Page | Route | Key Features |
|:---|---:|:---|
| **Material Master** | `/scm/materials` | CRUD: name, code, type (RAW/PACK/LABEL/BOX), unit, INCI name, supplier linkage |
| **Attendance** | `/hr/attendance` | Clock-in/out button, geofence status indicator, history table per employee |
| **Tickets** | `/hr/tickets` | Forms: Leave (dates), Overtime (hours), Reimburse (amount+proof); Approval flow |
| **Supplier Management** | `/scm/suppliers` | CRUD: name, contact, payment terms, tax ID; Rating: OTD %, reject rate |

#### Priority P2 — Business Support (1 hari)

| Page | Route | Key Features |
|:---|---:|:---|
| **Payroll Worksheet** | `/hr/payroll` | Period selector, employee table (base + KPI + OT - deductions), approve/paid actions |
| **Recruitment Pipeline** | `/hr/recruitment` | Kanban stages: Applied → Interview → Test → Offering → Hired |
| **Tax Management** | `/finance/taxes` | CRUD: name (PPN 11%), rate, active flag |
| **Currency Management** | `/finance/currencies` | CRUD: code (IDR/USD), exchange rate, main flag |
| **Period Management** | `/finance/periods` | Open/soft-lock/close periods; block if trial balance ≠ 0 |
| **Revision Tracker** | `/rnd/revisions` | Table per sample: revision#, feedback, status, completion date |
| **Returns (Bussdev)** | `/bussdev/returns` | Form: SO reference, qty, reason, return status; Table: return history |

#### Priority P3 — Compliance (1 hari)

| Page | Route | Key Features |
|:---|---:|:---|
| **Internal Audit Workbench** | `/legality/internal-audit` | Checklist CPKB/CARA per area, findings, remediation deadline, status |
| **Artwork Review Panel** | `/legality/artwork-review` | Image viewer, claim risk (LOW/MED/HIGH), approve/reject with PIN signature |
| **Retention Sample Tracker** | `/qc/retention` | Batch# list, location rack, retained date, expiry alert |

---

### 3.4 Global Component Library (1 hari)

**Reusable primitives to create:**
```typescript
// Form components
<FormField label="Nama" error={errors.name} required>
  <Input {...register('name')} />
</FormField>

<FormSelect label="Tipe" options={MaterialType} />

// Data display
<DataTable columns={columns} data={data} loading={isLoading} empty={<EmptyState />} />
<KPIGrid>
  <KPICard title="Total" value={total} trend={trend} />
</KPIGrid>

// Feedback
<LoadingSkeleton rows={5} />
<EmptyState icon={Package} title="Belum ada data" action={<Button>Buat Baru</Button>} />
<ErrorBoundary fallback={<ErrorFallback error={error} retry={refetch} />} />

// Layout
<DashboardShell title="Pipeline" subtitle="Monitor leads" actions={[<Button>+ Lead</Button>]}>
  {children}
</DashboardShell>
```

**Hooks to create:**
```typescript
useAuth()           // Current user + roles
usePermissions()    // Check action permission
useNotification()   // Toast + sound abstraction
usePagination()     // Page, limit, total, onPageChange
useDebounce()       // Debounced value
useConfirm()        // Confirmation dialog
```

**Query key constants (replace scattered string literals):**
```typescript
export const QUERY_KEYS = {
  LEADS:         ['leads'],
  LEAD:          (id) => ['leads', id],
  SAMPLE_REQUESTS:  ['sample-requests'],
  SALES_ORDERS:     ['sales-orders'],
  INVOICES:         ['invoices'],
  FORMULAS:         ['formulas'],
  PRODUCTION_PLANS: ['production-plans'],
  WORK_ORDERS:      ['work-orders'],
  MACHINES:         ['machines'],
  // ... etc
} as const;
```

---

### 3.5 Financial Gate Visual Indicators (0.5 hari)

Add to every lead detail, SO detail, and pipeline page:

```tsx
<GateIndicator
  gate="G1"
  status={lead.samplePaymentVerified ? 'PASSED' : lead.samplePaymentUploaded ? 'PENDING' : 'BLOCKED'}
  label="Biaya Sampel"
  description={lead.samplePaymentVerified
    ? `Diverifikasi oleh ${lead.verifiedByName} pada ${formatDate(lead.paymentApprovedAt)}`
    : 'Menunggu verifikasi Finance'}
/>
```

**Color scheme:**
- `BLOCKED` → RED dengan ikon lock
- `PENDING` → YELLOW/AMBER dengan ikon clock
- `PASSED` → GREEN dengan ikon check-circle

---

## 🟢 FASE 4: STATE MACHINE UI INTEGRATION

**Goal**: Ensure frontend respects backend-enforced state transitions.
**Estimasi**: 3-4 hari (setelah Fase 1 + 3)

---

### 4.1 Anti-Skip UI (1 hari)

- Fetch `allowedTransitions` from backend per entity
- Disable buttons for invalid transitions
- Show tooltip: "Status tidak bisa dilompati. Harus melalui [status sebelumnya]"
- Emergency Override button: visible only for `SUPER_ADMIN`, requires PIN confirmation

```tsx
<StatusActions
  currentStatus={lead.status}
  allowedTransitions={['CONTACTED', 'NEGOTIATION', 'LOST']}
  onTransition={(to) => mutate({ newStatus: to })}
  emergencyOverride={role === 'SUPER_ADMIN'}
/>
```

---

### 4.2 Activity Stream Feed (1 hari)

Build real-time widget on every lead/profile page:

```tsx
<ActivityStream leadId={lead.id}>
  {(events) => events.map(event => (
    <ActivityItem
      icon={getEventIcon(event.eventType)}
      timestamp={event.createdAt}
      division={event.senderDivision}
      action={event.notes}
      link={event.referenceId ? `/document/${event.referenceId}` : undefined}
      type={event.eventType}  // GATE_OPENED → green, GATE_BLOCKED → red, SLA_BREACH → amber
    />
  ))}
</ActivityStream>
```

**Connected to backend**: Poll or WebSocket for real-time updates.

---

### 4.3 SLA Dashboard Widgets (0.5 hari)

**Global SLA bar** (top of each dashboard):
```tsx
<SLABanner alerts={slaAlerts}>
  {/* Sample: Sara - Stuck 16 days in SAMPLE_SENT */}
  {/* BPOM: Whitening Cream - 92 days in EVALUATION */}
  {/* AR: PT Maju Jaya - Rp 50jt overdue 45 days */}
</SLABanner>
```

**Per-card indicators:**
- Sample stuck > 14d → RED badge "OVERDUE"
- BPOM > 90d → AMBER badge "MENUNGGU"
- AR > 30d → WARNING badge

---

## 🔵 FASE 5: TEST INFRASTRUCTURE

**Goal**: From 15% to 80% coverage on critical paths.
**Estimasi**: 5-7 hari (paralel dengan Fase 3-4)

---

### 5.1 Unit Tests — Core Services (2 hari)

Minimum 5 test cases per service:

| Priority | Service | Path | Key Test Scenarios |
|:---|:---|---:|:---|
| **P0** | `state-transition.service` | `system/` | Valid transition passes; Invalid transition throws; Emergency override bypass; Gate-controlled transition blocked without gate |
| **P0** | `bussdev.service` | `bussdev/` | Create lead → CONTACTED; Advance NEGOTIATION → SAMPLE_REQUESTED; Advance without G1 blocked; Emergency override works |
| **P0** | `finance.service` | `finance/` | Double-entry balance enforced; G1 verify → journal created; G2 verify → 5 modules triggered; G3 verify → WON_DEAL |
| **P0** | `production.service` | `production/` | Atomic phase enforced; QC Bulk gate blocks filling; Physical limit validation; Artwork interlock blocks packing |
| **P1** | `warehouse.service` | `warehouse/` | FEFO picks oldest batch; Quarantine blocks release; Opname threshold requires PIN; Capacity check alerts |
| **P1** | `legality.service` | `legality/` | Formula shield blocks prohibited; Artwork gate blocks SCM PO; Production gate blocks filling; Pipeline bypass returns false |
| **P1** | `creative.service` | `creative/` | Commercial lock blocks without SO; Revision cap at 3; APJ PIN signature required; Client review auto-locks |
| **P2** | `scm.service` | `scm/` | Auto PR from BOM shortage; PR approval → PO created; Vendor watchlist blocks |
| **P2** | `qc-audits.service` | `qc/` | GOOD updates inventory; REJECT creates COPQRecord; Quarantine → Available move |

---

### 5.2 E2E Tests — API Level (2 hari)

HTTP-level tests with supertest:

| Priority | Flow | Test Name | Key Assertions |
|:---|:---|---:|:---|
| **P0** | **Golden Path** | `full-cycle.e2e-spec` | Lead → CONTACTED → NEGOTIATION → SAMPLE_REQUESTED → WAITING_FINANCE → G1 → FORMULATING → ... → WON_DEAL. Every status in sequence. |
| **P0** | **Gate 1 Block** | `gate1-block.e2e-spec` | Create sample without payment → advance → 403. Verify payment → advance succeeds → 200 |
| **P0** | **Gate 2 Block** | `gate2-block.e2e-spec` | Create SO PENDING_DP → advance → 403. Verify DP 50% → advance succeeds → 200 |
| **P0** | **Gate 3 Block** | `gate3-block.e2e-spec` | Create shipment without pelunasan → 403. Verify final payment → shipment succeeds → 200 |
| **P1** | **Atomic Phase** | `atomic-phase.e2e-spec` | Start MIXING → skip to FILLING → 400 `ATOMIC_SEQUENCE_VIOLATION` |
| **P1** | **QC Bulk Gate** | `qc-bulk-gate.e2e-spec` | Complete MIXING without QC → advance to FILLING → 400 "QC Bulk belum PASS" |
| **P1** | **FEFO Violation** | `fefo-violation.e2e-spec` | Pick newer batch when older exists → 400 FEFO violation |
| **P1** | **Artwork Gate** | `artwork-gate.e2e-spec` | Create PO for packaging without artwork approval → 400 |
| **P2** | **Formula Dosage** | `formula-dosage.e2e-spec` | Create formula with dosage ≠ 100% → 400 |
| **P2** | **Mass Balance** | `mass-balance.e2e-spec` | Input filling output > bulk consumed → 400 physical limit |

---

### 5.3 Test Utilities (1 hari)

```typescript
// test/utilities/test-factory.ts
export class TestFactory {
  static createLead(overrides?: Partial<CreateLeadDto>): CreateLeadDto { ... }
  static createSampleRequest(overrides?: Partial<CreateSampleDto>): CreateSampleDto { ... }
  static createSalesOrder(overrides?: Partial<CreateSalesOrderDto>): CreateSalesOrderDto { ... }
  static createFormula(overrides?: Partial<CreateFormulaDto>): CreateFormulaDto { ... }
  static createUser(role: UserRole): CreateUserDto { ... }
  static createJournalEntry(balanced: boolean = true): CreateJournalDto { ... }
}

// test/utilities/test-module.ts
export class TestModule {
  static async forService(service: Type, mocks: Mock[]) {
    const module = await Test.createTestingModule({
      providers: [service, ...mocks.map(m => ({ provide: m.token, useValue: m.impl }))],
    }).compile();
    return module;
  }
}

// test/utilities/seed-assertions.ts
export function assertStateTransition(entity: any, from: string, to: string): void { ... }
export function assertJournalBalanced(entry: JournalEntry): void { ... }
export function assertInventoryConsistent(item: MaterialInventory): void { ... }
```

---

### 5.4 Frontend Test Setup (0.5 hari)

- Add Vitest + React Testing Library to frontend
- Add MSW (Mock Service Worker) for API mocking
- Create test for: Lead Intake form validation, Gate indicator rendering, Terminal interlock overlays

---

## 🟣 FASE 6: UI/UX POLISH

**Only after Fase 1-5 are complete and all tests pass.**
**Estimasi**: 5-7 hari

---

### 6.1 Design System Consistency (1.5 hari)

- [ ] Audit all pages against "Dark Glassmorphism Premium" DNA
- [ ] Standardize: card spacing (p-6), border radius (rounded-xl), shadow (shadow-xl)
- [ ] Typography scale: h1(3xl), h2(2xl), h3(xl), body(base), small(sm), caption(xs)
- [ ] Color tokens: primary(amber), success(emerald), danger(rose), info(indigo), warning(amber)
- [ ] Fix: Terminal pages use black theme, dashboard pages use light — ensure consistent dark mode

---

### 6.2 Terminal UX Enhancements (1.5 hari)

- Replace `prompt()` with real QR scanner:
  - Use `BarcodeDetector` API (Chrome built-in) or `@zxing/browser` library
  - Audio feedback: beep on scan success, buzz on error
  - Visual feedback: green flash on correct scan, red flash on mismatch
- Large-font mode for industrial touchscreens (configurable font scale)
- On-screen numpad for weight inputs (touch-friendly)
- Dark/high-contrast theme for factory floor (glare-resistant)

---

### 6.3 Dashboard Enhancements (1 hari)

- Real-time WebSocket for production dashboards (OEE, COPQ, yield in real-time)
- Export to PDF/CSV/Excel for finance reports
- Drill-down: click KPI card → filtered detail table
- Print-friendly layout for Batch Record and Delivery Order

---

### 6.4 Mobile Responsiveness (1 hari)

- Bussdev pipeline: stack cards vertically on mobile (BD in field use case)
- Attendance: full-screen geolocation + camera for selfie
- Approval workflows: swipeable approve/reject, push notifications

---

### 6.5 Accessibility (0.5 hari)

- [ ] ARIA labels on all interactive elements (buttons, links, inputs)
- [ ] Keyboard navigation for terminals (Tab, Enter, Escape)
- [ ] High-contrast mode option
- [ ] Focus indicators visible
- [ ] Screen reader support for status changes (assertive role)

---

## 📈 TIMELINE & DEPENDENCIES

```
Fase 1: Backend Foundation     ████████████░░░░░░░░░░░░░░  5-7 hari   [WAJIB PERTAMA]
  └─ 1.4 State Machine         ████░░░░░░░░░░░░░░░░░░░░░░  [KRITIS — fondasi]
Fase 2: Service Layer          ░░░░████████████░░░░░░░░░░  5-7 hari   [mulai setelah F1]
Fase 3: Frontend Repair        ░░░░░░░░████████████████░░  7-10 hari  [paralel F2]
  └─ 3.3 Missing Pages         ░░░░░░░░░░████░░░░░░░░░░░░  [paling berat]
Fase 4: State Machine UI       ░░░░░░░░░░░░░░████████░░░░  3-4 hari   [setelah F1+F3]
Fase 5: Test Infrastructure    ░░░░░░░░████████████████░░  5-7 hari   [paralel F3-F4]
  └─ 5.2 E2E Golden Path       ░░░░░░░░░░░░░░████░░░░░░░░  [setelah F1 stabil]
Fase 6: UI/UX Polish           ░░░░░░░░░░░░░░░░░░████████  5-7 hari   [SETELAH SEMUA LULUS]

Total: 30-42 hari kerja
```

---

## ✅ GO/NO-GO CHECKLIST — SEBELUM FASE 6

- [ ] **All Critical & High security bugs** fixed (1.3.x)
- [ ] **State machine** centralized & each transition validated (1.4)
- [ ] **3 Financial Gates** fully tested (e2e + unit)
- [ ] **All service methods** complete — no stubs (2.1, 2.2)
- [ ] **Prisma schema** — no orphan FKs, no circular refs, proper indexes (1.1, 1.2)
- [ ] **No mock data** in production pages (3.2)
- [ ] **No `prompt()`** or anti-patterns (3.1)
- [ ] **All 17 missing pages** built — MVP: form + table + status (3.3)
- [ ] **Test coverage > 70%** on critical paths (state machine, gates, interlocks)
- [ ] **Notification service** wired to gate events (1.6)
- [ ] **ActivityStream** consuming events from all modules (2.1)
- [ ] **Error handling** consistent across all services (2.3)
- [ ] **E2E Golden Path** test passes: LEAD → WON_DEAL end-to-end

---

## 💡 RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|:---|---:|---:|:---|
| Circular dependency (forwardRef) breaks | Medium | High | Fix in Fase 1.1 — resolve schema first |
| State machine change breaks existing data | Medium | High | Add migration script to validate existing records |
| PR→PO flow changes break SCM operations | Medium | Medium | Run seed data + manual test before deploy |
| Frontend missing pages block user workflow | High | Medium | Prioritize P0 + P1 pages; P3 can wait |
| Notification service integration delay | Low | Low | Console log as fallback, wire real channels later |
| Test infra setup blocks CI/CD | Medium | Low | Start with 1 service test (state-transition), expand iteratively |

---

## 🔗 REFERENSI

| Dokumen | Path |
|:---|---:|
| Canonical Glossary v2.0 | `docs/CANONICAL_GLOSSARY.md` |
| Master Blueprint v2.0 | `docs/general docs/05_master_business_process_blueprint.md` |
| SOT Documents (11 files) | `docs/SOT_*.md` |
| Communication Protocols (3 files) | `docs/communication_protocol/` |
| Financial Gates Log | `docs/general docs/06_implementation_log_financial_gates.md` |
| Prisma Schema (14 files) | `backend/prisma/schema/` |
| Backend Services (42 files) | `backend/src/modules/` |
| Frontend Pages (80+) | `frontend/src/app/(dashboard)/` |
| E2E Tests (10 files) | `backend/test/` |
| Playwright Tests (20 files) | `frontend/tests/e2e/` |
