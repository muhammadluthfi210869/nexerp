# Actionable Execution Ticket: HR & Payroll Domain Audit

**Domain**: Human Resources & Payroll (`/hr`)  
**Audit Date**: 2026-10-01  
**Status**: FAILING GATES — NOT PRODUCTION READY  
**Auditor**: Senior Systems Architect & CRUD Surgical Auditor  

---

## 1. Executive Summary & Domain Scope

The HR & Payroll domain covers 6 operational modules and 1 executive dashboard:
- **Employees & Compensation Directory** (`/hr/employees`): Staff records, contract PKWT, compensation structure (base salary, position allowance, flat transport, tentative transport), BPJS, loans (kasbon).
- **Payroll & Salary Slips Workbench** (`/hr/payroll`): Monthly batch payroll calculation, attendance prorating, PPh 21 threshold, loan deductions, authorization flow, slip generation.
- **Applicant Tracking System (ATS)** (`/hr/recruitment`): Candidate pipeline, resume review, multi-stage selection workflow.
- **Competency & Training Development** (`/hr/training`): Onboarding 3-day matrix, training hours accumulation, certificate tracking.
- **Izin, Cuti & Lembur Tickets** (`/hr/tickets`): Leave requests, overtime tickets, reimbursement approval pipeline.
- **KPI Performance Evaluation** (`/hr/kpi`): Institutional and divisional scorecards, discipline metrics.
- **Executive Dashboard HR** (`/hr/dashboard`): Cross-departmental audit summary.

### Core Architecture Findings:
1. **Critical Data Corruption on Employee Update**: `GET /hr/employees` omits salary and compensation fields. The edit modal fills missing values with hardcoded dummy strings (`Rp 4.500.000`, `Rp 500.000`, etc.). Any update to an employee's personal info silently overwrites their salary in the database.
2. **Payroll Run Idempotency & Premature Loan Deduction**: Generating a draft payroll immediately and permanently deducts active loan balances from the database before authorization. Re-running or cancelling the draft results in balance desynchronization. Furthermore, duplicate payroll checks only evaluate draft status, allowing multiple authorized/paid runs for the identical financial period.
3. **Severe PII & Credential Exposure**: Multiple endpoints use `user: true` and `employee: true` without field selection, leaking `User.passwordHash`, `User.managerPin`, `User.approvalPin`, NIK, NPWP, and encrypted salary ciphers across unprivileged list endpoints.
4. **ATS Stage State Machine Collision**: Frontend and backend define mutually incompatible candidate stage enums, causing all stage advancement actions in the UI to crash with HTTP 400.
5. **Architectural Facade Collapse & Tri-Layer Violations**: `HrService` is a 1,880-line monolith, while all 4 domain sub-services in `backend/src/modules/hr/services/` are dead, unreferenced code. Frontend `kpi/page.tsx` (359 lines) and `tickets/page.tsx` (460 lines) bypass their colocated `_hooks` and `_components` entirely.

---

## 2. Findings by Severity

```
+-------------------+-------+
| Severity          | Count |
+-------------------+-------+
| Critical Bug      |   6   |
| Contract Mismatch |   2   |
| Broken UX State   |   1   |
| Missing Validation|   2   |
| Edge Case         |   1   |
+-------------------+-------+
| TOTAL             |  12   |
+-------------------+-------+
```

---

### 📌 Module: [Data Pegawai & Kompensasi / `/hr/employees`]

#### [CRIT-01]: Employee Update Silently Overwrites Real Salary & Allowances With Hardcoded Dummy Defaults
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/employees/_components/EmployeeFormModal.tsx:75-78`
  - Frontend: `frontend/src/app/(dashboard)/hr/employees/_hooks/useEmployeeOperations.ts:60-94`
  - Backend: `backend/src/modules/hr/hr.service.ts:1103-1148`
  - Backend: `backend/src/modules/hr/hr.service.ts:102-159`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `GET /hr/employees` (`getAllEmployees()` in `hr.service.ts:1128-1147`) explicitly selects public identity and contract fields, omitting `baseSalary`, `positionAllowance`, `transportFlat`, `transportTentativeDaily`, `nik`, `bpjsKesehatan`, and `bpjsKetenagakerjaan`.
  In `useEmployeeOperations.ts`, clicking "Edit" passes this partial employee object to `editingEmployee`.
  In `EmployeeFormModal.tsx:75-78`:
  ```ts
  baseSalary: editingEmployee.baseSalary || "4500000",
  positionAllowance: editingEmployee.positionAllowance || "500000",
  transportFlat: editingEmployee.transportFlat || "300000",
  transportTentativeDaily: editingEmployee.transportTentativeDaily || "25000",
  ```
  Since `editingEmployee.baseSalary` is undefined, it defaults to `"4500000"`.
  When the user submits the form to update an employee's address or phone number, `useEmployeeOperations.ts:73-76` sends these default strings in the `PATCH /hr/employees/:id` payload. `hr.service.ts:121` encrypts and overwrites the employee's genuine compensation with the dummy defaults.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /hr/employees/:id`):
    ```json
    {
      "name": "Budi Santoso",
      "phone": "08123456789",
      "address": "Jl. Industri No. 12"
    }
    ```
    *Note: Compensation fields must be strictly optional on update. If omitted, they must not be overwritten.*
  - Expected Response DTO (`GET /hr/employees/:id/compensation` or privileged detail):
    ```json
    {
      "success": true,
      "data": {
        "id": "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
        "name": "Budi Santoso",
        "nik": "3201234567890001",
        "baseSalary": "8500000",
        "positionAllowance": "1500000",
        "transportFlat": "500000",
        "transportTentativeDaily": "50000"
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.service.ts` — In `updateEmployee`, only encrypt and update `baseSalary`, `positionAllowance`, `transportFlat`, and `transportTentativeDaily` if explicitly provided in `dto` (`if (dto.baseSalary !== undefined)`). Provide a privileged endpoint `GET /hr/employees/:id/compensation` guarded with `FINANCE` and `HR` roles that decrypts and returns compensation data.
  - `frontend/src/app/(dashboard)/hr/employees/_hooks/useEmployeeOperations.ts` — When opening the edit modal, fetch the complete record via `GET /hr/employees/:id` before initializing the form. Do not send compensation fields if they were untouched.
  - `frontend/src/app/(dashboard)/hr/employees/_components/EmployeeFormModal.tsx` — Remove hardcoded fallback strings (`"4500000"`, `"500000"`). Leave fields blank (`""`) if empty, and disable editing compensation unless the actor has HR/Finance role.
  - `[Verification]` — Edit an employee with Rp 12.000.000 base salary to change their phone number. Verify in DB that `baseSalary` ciphertext remains untouched and decrypts to 12.000.000.

---

### 📌 Module: [Payroll & Slip Gaji / `/hr/payroll`]

#### [CRIT-02]: Premature Loan Deduction During Draft Run, Lack of Transaction & Missing Period Uniqueness Guard
- **Target Files**:
  - Backend: `backend/src/modules/hr/hr.service.ts:439-446`
  - Backend: `backend/src/modules/hr/hr.service.ts:557-576`
  - Backend: `backend/src/modules/hr/hr.service.ts:467-614`
  - Database: `backend/prisma/schema/hr.prisma:165-180`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. In `generateDraftPayroll` (`hr.service.ts:558-576`), when processing each employee's loan, it executes:
     ```ts
     await this.prisma.employeeLoan.update({
       where: { id: activeLoan.id },
       data: {
         remainingBalance: new Prisma.Decimal(remainingLoan),
         status: remainingLoan === 0 ? 'PAID_OFF' : 'ACTIVE',
       },
     });
     ```
     This permanently mutates the `employee_loans` table during **DRAFT** generation. If the draft is deleted or re-generated, the loan balance is permanently decremented again.
  2. Idempotency check in `hr.service.ts:439-446` only queries `status: PayrollStatus.DRAFT`:
     ```ts
     const existingDraft = await this.prisma.payroll.findFirst({
       where: { periodId: period.id, status: PayrollStatus.DRAFT },
     });
     ```
     If a payroll for that period was already `AUTHORIZED` or `PAID`, `existingDraft` is null. The system allows generating a duplicate payroll run for the same period.
  3. `payrolls` table in `hr.prisma:165-180` has no `@unique([periodId])` constraint.
  4. The multi-entity mutation (`payroll.create`, multiple `payrollItem.create`, and multiple `employeeLoan.update`) is executed sequentially outside of `prisma.$transaction`.
- **Exact Contract Specification**:
  - Request DTO (`POST /hr/payroll/generate`):
    ```json
    {
      "periodName": "September 2026"
    }
    ```
  - Expected Response DTO (on duplicate attempt):
    ```json
    {
      "success": false,
      "message": "Payroll for period 'September 2026' already exists in AUTHORIZED status.",
      "errorCode": "PAYROLL_PERIOD_ALREADY_EXISTS"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/prisma/schema/hr.prisma` — Add `@@unique([periodId])` to `Payroll` model and `@@unique([payrollId, employeeId])` to `PayrollItem` model. Run migration.
  - `backend/src/modules/hr/hr.service.ts` — 
    1. In `generateDraftPayroll`, check `this.prisma.payroll.findFirst({ where: { periodId: period.id } })`. If any payroll exists (regardless of status), reject with `PAYROLL_PERIOD_ALREADY_EXISTS`.
    2. Do NOT mutate `employeeLoan.remainingBalance` in `generateDraftPayroll`. Calculate the proposed deduction in memory and store it in `PayrollItem.loanDeduction`.
    3. In `authorizePayroll` (`hr.service.ts:1054`), wrap status transition and actual loan deduction execution inside `this.prisma.$transaction(async (tx) => { ... })`.
  - `[Verification]` — Generate draft payroll. Verify `employee_loans.remainingBalance` is unchanged. Authorize payroll. Verify `employee_loans.remainingBalance` is decremented. Attempt to generate payroll again for the same period and verify 400 rejection.

---

### 📌 Module: [Security, PII & Authorization / All Endpoints]

#### [CRIT-03]: Systematic PII & Credential Leakage via `user: true` and `employee: true` Wildcard Inclusions
- **Target Files**:
  - Backend: `backend/src/modules/hr/hr.service.ts:1030`, `1323`, `1729`, `1002`, `1181`, `1435`, `1489`, `1729`
  - Backend: `backend/src/modules/hr/tickets/tickets.service.ts:16`, `24`, `52`
  - Database: `backend/prisma/schema/auth.prisma:5, 14, 15`
  - Database: `backend/prisma/schema/hr.prisma:6, 17-22, 27-30`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. Multiple service methods (`getExpiringContracts:1030`, `getDepartmentScores:1323`, `getKpiEmployees:1729`) execute Prisma queries with `include: { user: true }`. Because `User` model (`auth.prisma:1-17`) includes `passwordHash`, `managerPin`, and `approvalPin`, these sensitive cryptographic secrets are serialized into the JSON response.
  2. `getTickets:1002` (`hr.service.ts`), `TicketsService.findAll:16`, and `TicketsService.findOne:24` include `employee: true` without field masking. Every ticket payload exposes `nik`, `npwp`, `bankAccount`, `bankHolder`, `bpjsKesehatan`, `bpjsKetenagakerjaan`, `address`, `emergencyPhone`, and the AES-256 encrypted `baseSalary` to any viewer authorized to read tickets.
- **Exact Contract Specification**:
  - Expected Public/List Response DTO (`GET /hr/tickets`):
    ```json
    {
      "id": "t1-uuid",
      "type": "LEAVE",
      "status": "PENDING",
      "startDate": "2026-10-05T00:00:00.000Z",
      "endDate": "2026-10-07T00:00:00.000Z",
      "reason": "Family obligation",
      "employee": {
        "id": "e1-uuid",
        "name": "Ahmad Dani",
        "division": "PRODUCTION",
        "position": "Senior Operator"
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.service.ts` & `backend/src/modules/hr/tickets/tickets.service.ts` — Replace all `user: true` inclusions with explicit safe selects:
    ```ts
    user: { select: { id: true, email: true, fullName: true, status: true, roles: true } }
    ```
  - In `getTickets`, `TicketsService.findAll`, and `TicketsService.findOne`, replace `employee: true` with:
    ```ts
    employee: {
      select: {
        id: true,
        name: true,
        roles: { select: { division: true, roleName: true, isPrimary: true } }
      }
    }
    ```
  - `[Verification]` — Send `GET /hr/contracts/expiring` and `GET /hr/tickets`. Inspect raw HTTP response body. Verify that `passwordHash`, `managerPin`, `approvalPin`, `nik`, `baseSalary`, and `bankAccount` are absent.

---

### 📌 Module: [Rekrutmen & Pelamar (ATS) / `/hr/recruitment`]

#### [CRIT-04]: Candidate Stage State Machine Collision Causing 100% 400 Failure on Stage Advancement
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/recruitment/_components/CandidateTable.tsx:189-199`
  - Frontend: `frontend/src/app/(dashboard)/hr/recruitment/_types/recruitment.types.ts:1-10`
  - Backend: `backend/src/modules/hr/hr.service.ts:769-786`
  - Backend: `backend/src/modules/hr/dto/recruitment.dto.ts:11-20`
  - Database: `backend/prisma/schema/hr.prisma:217-218`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  Four conflicting sets of candidate stage enums exist in the codebase:
  - Frontend `recruitment.types.ts`: `["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]`
  - Backend `hr.service.ts:769-776`: `['SCREENING', 'HR_INTERVIEW', 'USER_INTERVIEW', 'OFFERING', 'DONE', 'REJECTED']`
  - Backend `recruitment.dto.ts:11-18`: `['APPLIED', 'INTERVIEW', 'TEST', 'OFFERING', 'HIRED', 'REJECTED']`
  - Database `hr.prisma:217`: `SCREENING | HR_INTERVIEW | USER_INTERVIEW | OFFERING | DONE | REJECTED`
  In `CandidateTable.tsx:189-199`, advancing a candidate from `SCREENING` sends `stage: "INTERVIEW"` via `PATCH /hr/candidates/:id/stage`.
  `hr.service.ts:777` evaluates `validStages.includes('INTERVIEW')`, which is `false`. It immediately throws `BadRequestException('Tahap rekrutmen tidak valid. / INVALID_RECRUITMENT_STAGE')`.
  Furthermore, when a candidate completes the pipeline, backend sets `status = 'PASSED'`, whereas frontend filter tab checks `status === 'HIRED'`.
- **Exact Contract Specification**:
  - Canonical Stage Enum:
    `SCREENING`, `HR_INTERVIEW`, `USER_INTERVIEW`, `OFFERING`, `DONE`, `REJECTED`.
  - Canonical Status Enum:
    `IN_PROCESS`, `PASSED`, `REJECTED`.
  - Request DTO (`PATCH /hr/candidates/:id/stage`):
    ```json
    {
      "stage": "HR_INTERVIEW"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "id": "c1-uuid",
      "name": "Citra Lestari",
      "stage": "HR_INTERVIEW",
      "status": "IN_PROCESS",
      "notificationMessage": "Kandidat Citra Lestari dipindahkan ke tahap HR_INTERVIEW"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/dto/recruitment.dto.ts` — Align `RECRUITMENT_STAGES` and `CreateRecruitmentDto` with `hr.service.ts` (`SCREENING`, `HR_INTERVIEW`, `USER_INTERVIEW`, `OFFERING`, `DONE`, `REJECTED`).
  - `backend/src/modules/hr/hr.controller.ts:184-225` — Use `CreateRecruitmentDto` and `UpdateRecruitmentStageDto` instead of inline object types.
  - `frontend/src/app/(dashboard)/hr/recruitment/_types/recruitment.types.ts` — Update `CandidateStage` to `"SCREENING" | "HR_INTERVIEW" | "USER_INTERVIEW" | "OFFERING" | "DONE" | "REJECTED"`, and `CandidateStatus` to `"IN_PROCESS" | "PASSED" | "REJECTED"`.
  - `frontend/src/app/(dashboard)/hr/recruitment/_components/CandidateTable.tsx` — Update `nextStage` transition map to:
    ```ts
    const nextStage: Record<string, CandidateStage> = {
      SCREENING: "HR_INTERVIEW",
      HR_INTERVIEW: "USER_INTERVIEW",
      USER_INTERVIEW: "OFFERING",
      OFFERING: "DONE",
    };
    ```
  - `frontend/src/app/(dashboard)/hr/recruitment/_components/CandidateModal.tsx` & `RecruitmentView.tsx` — Replace filter tab `"HIRED"` with `"PASSED"`.
  - `[Verification]` — Create a candidate. Click "Lanjut" repeatedly from `SCREENING` through `HR_INTERVIEW`, `USER_INTERVIEW`, `OFFERING`, to `DONE`. Verify HTTP 200 on each step and status transitions to `PASSED`.

---

### 📌 Module: [Payroll & Slip Gaji / `/hr/payroll`]

#### [CRIT-05]: Payroll List Contract Breakdown — Raw Ciphertext Displayed & Missing Employee Relation
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/payroll/_hooks/usePayrollOperations.ts:28-54`
  - Backend: `backend/src/modules/hr/hr.service.ts:1577-1586`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. `getAllPayrolls()` in `hr.service.ts:1577-1586`:
     ```ts
     return this.prisma.payroll.findMany({
       include: {
         period: true,
         approver: { select: { fullName: true, email: true } },
         items: true,
       },
       orderBy: { createdAt: 'desc' },
     });
     ```
     `items: true` returns raw `payroll_items` rows without decrypting AES-256 ciphertext columns (`baseSalary`, `positionAllowance`, `netSalary`, etc.).
  2. `items: true` does NOT include the `employee` relation.
  3. In `usePayrollOperations.ts:36-52`, `it.employee?.name` evaluates to `undefined`, falling back to `"Karyawan"`. `Number(it.baseSalary)` executes `Number("aes-256-gcm:iv:...")`, which results in `NaN` or `0`.
  As a result, the entire payroll workbench displays all employees as `"Karyawan"` with 0 total disbursement.
- **Exact Contract Specification**:
  - Expected Response DTO (`GET /hr/payrolls`):
    ```json
    [
      {
        "id": "p1-uuid",
        "status": "DRAFT",
        "totalDisbursement": 45000000,
        "period": { "id": "fp1-uuid", "name": "September 2026", "startDate": "2026-09-01", "endDate": "2026-09-30" },
        "approver": null,
        "items": [
          {
            "id": "pi1-uuid",
            "employeeId": "e1-uuid",
            "employee": {
              "name": "Agus Pratama",
              "roles": [{ "division": "PRODUCTION", "roleName": "Kepala Regu" }]
            },
            "baseSalary": 5000000,
            "positionAllowance": 750000,
            "transportFlat": 300000,
            "transportTentative": 440000,
            "overtimePay": 500000,
            "kpiIncentive": 250000,
            "grossIncome": 7240000,
            "bpjsHealth": 57500,
            "bpjsEmployment": 115000,
            "loanDeduction": 0,
            "remainingLoan": 0,
            "pph21": 112000,
            "totalDeductions": 284500,
            "netSalary": 6955500
          }
        ]
      }
    ]
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.service.ts` — In `getAllPayrolls()`, add `items: { include: { employee: { include: { roles: true } } } }`. Iterate over items and decrypt all encrypted numeric fields with `parseFloat(this.encryption.decrypt(...) || '0')`, matching the implementation in `getPayrollById()`.
  - `frontend/src/app/(dashboard)/hr/payroll/_hooks/usePayrollOperations.ts` — Consume decrypted numbers directly without re-parsing ciphers.
  - `[Verification]` — Open `/hr/payroll`. Verify employee names, job titles, and accurate Indonesian Rupiah amounts render in the table.

---

### 📌 Module: [Izin, Cuti & Lembur / `/hr/tickets`]

#### [CRIT-06]: Dual Controller Route Divergence Bypasses Reimbursement Fund Request & Fakes Authorized Actor
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/tickets/_hooks/useTicketsOperations.ts:108-110`
  - Backend: `backend/src/modules/hr/tickets/tickets.controller.ts:41-46`
  - Backend: `backend/src/modules/hr/tickets/tickets.service.ts:47-54`
  - Backend: `backend/src/modules/hr/hr.controller.ts:163-180`
  - Backend: `backend/src/modules/hr/hr.service.ts:935-985`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. There are two competing ticket controllers: `HrController` (`backend/src/modules/hr/hr.controller.ts`) and `TicketsController` (`backend/src/modules/hr/tickets/tickets.controller.ts`).
  2. In `HrService.approveTicket` (`hr.service.ts:945-985`), approving a ticket with `type === TicketType.REIMBURSE` automatically triggers the creation of a `FundRequest` in Finance (BUS-RULE-075) and records `authorizedById`.
  3. Frontend `useTicketsOperations.ts:109` calls `api.patch('/hr/tickets/${id}', { status })`. Express routes this to `TicketsController.update()` (`tickets.controller.ts:44`), which calls `TicketsService.update()`. This performs a bare Prisma update of the ticket status, bypassing all reimbursement auto-trigger logic in `HrService.approveTicket`.
  4. In `HrController.approveTicket` and `TicketsController.update`, `authorizedById` is accepted from the client `@Body` rather than derived from `@Req() req.user.id`, allowing authorizer identity spoofing.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /hr/tickets/:id/status`):
    ```json
    {
      "status": "APPROVED",
      "reason": "Disetujui untuk dinas luar"
    }
    ```
    *Note: Actor ID MUST be extracted from the validated JWT token.*
  - Expected Response DTO:
    ```json
    {
      "id": "t1-uuid",
      "status": "APPROVED",
      "authorizedById": "user-uuid-from-jwt",
      "fundRequestId": "fr-uuid"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/tickets/tickets.controller.ts` & `tickets.service.ts` — Remove the duplicate `TicketsController` or consolidate all ticket business logic into a single dedicated domain service. Delete raw status update paths.
  - `backend/src/modules/hr/hr.controller.ts` — In `approveTicket` and `rejectTicket`, inject `@Req() req: any` and extract `req.user.id` as the authorizer.
  - `frontend/src/app/(dashboard)/hr/tickets/_hooks/useTicketsOperations.ts` — Call `PATCH /hr/tickets/${id}/approve` and `PATCH /hr/tickets/${id}/reject` instead of generic `PATCH /hr/tickets/${id}`.
  - `[Verification]` — Create a ticket of type `REIMBURSE` with amount Rp 500.000. Approve the ticket. Verify in DB that a corresponding `fund_requests` row is created in Finance with status `PENDING` and matching amount.

---

### 📌 Module: [Absensi & Payroll Run / `/hr/attendance` & `/hr/payroll`]

#### [CRIT-07]: Attendance Idempotency Hole Inflates Calendar Days Worked in Payroll Calculation
- **Target Files**:
  - Backend: `backend/src/modules/hr/hr.service.ts:188-199`
  - Backend: `backend/src/modules/hr/hr.service.ts:504-524`
  - Database: `backend/prisma/schema/hr.prisma:128-143`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. In `clockIn` (`hr.service.ts:188-194`), duplicate check queries:
     ```ts
     const existingToday = await this.prisma.attendance.findFirst({
       where: {
         employeeId,
         clockIn: { gte: today },
         clockOut: null,
       },
     });
     ```
     If an employee clocks out during the day, `clockOut` is no longer null. A subsequent clock-in creates a second attendance record for the same calendar day.
  2. In `generateDraftPayroll` (`hr.service.ts:504-511`):
     ```ts
     const attendances = await this.prisma.attendance.findMany({
       where: {
         employeeId: emp.id,
         clockIn: { gte: period.startDate, lte: period.endDate },
         status: { in: [AttendanceStatus.ON_TIME, AttendanceStatus.LATE] },
       },
     });
     const actualDays = attendances.length > 0 ? attendances.length : workingDaysPerMonth;
     ```
     `actualDays` counts raw `attendances.length`. If an employee has multiple check-ins per day, `actualDays` exceeds calendar days worked.
  3. In `hr.service.ts:523`, `transportTentative = Math.round(transportDaily * actualDays)` calculates daily transport based on attendance record count rather than distinct work days, leading to overpayment.
- **Exact Contract Specification**:
  - In `hr.service.ts`:
    ```ts
    const distinctWorkDays = new Set(
      attendances.map((a) => a.clockIn.toISOString().split('T')[0])
    ).size;
    const actualDays = Math.min(workingDaysPerMonth, distinctWorkDays);
    ```
- **Actionable Execution Plan**:
  - `backend/prisma/schema/hr.prisma` — Add a composite check or unique calendar date enforcement for attendance per employee per day.
  - `backend/src/modules/hr/hr.service.ts` —
    1. In `clockIn`, check if an attendance record exists for the current calendar date (`clockIn: { gte: startOfDay, lte: endOfDay }`), regardless of `clockOut` status, unless multi-shift attendance is explicitly enabled.
    2. In `generateDraftPayroll`, compute unique attendance dates using `new Set(...)`. Calculate `transportTentative` using unique work dates.
  - `[Verification]` — Record two clock-ins on the same day for an employee. Run payroll generation. Verify that `actualDays` counts the day once and tentative transport is not doubled.

---

### 📌 Module: [Pelatihan & Onboarding / `/hr/training`]

#### [CONT-01]: Client-Side N+1 API Flooding & Injection of Synthetic Fake Training Records
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/training/_hooks/useTrainingOperations.ts:33-78`
  - Backend: `backend/src/modules/hr/hr.service.ts:848-853`
  - Backend: `backend/src/modules/hr/hr.controller.ts:245-250`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. Backend provides `GET /hr/employees/:id/trainings`, but has no global endpoint to query training records across all employees.
  2. To populate the training table, `useTrainingOperations.ts:33-56` takes a slice of 15 employees and fires 15 individual HTTP requests in parallel. Any employee beyond the first 15 is permanently omitted from the training view.
  3. In `useTrainingOperations.ts:61-78`, if the DB contains 0 training records, the hook fabricates synthetic records with dummy Google Drive links (`https://drive.google.com/cert-example.pdf`) and injects them into the UI state.
- **Exact Contract Specification**:
  - New Endpoint (`GET /hr/trainings`):
    - Query parameters: `page`, `limit`, `search`, `trainingType`, `division`.
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "tr1-uuid",
          "employeeId": "e1-uuid",
          "employeeName": "Agus Pratama",
          "department": "PRODUCTION",
          "position": "Kepala Regu",
          "trainingType": "CPKB & GMP Dasar",
          "hours": 8,
          "goal": "Pemahaman Kepatuhan Higienitas",
          "trainingDate": "2026-08-15T00:00:00.000Z",
          "certificateUrl": null,
          "onboardingStatus": "COMPLETED"
        }
      ],
      "meta": {
        "page": 1,
        "pageSize": 20,
        "totalCount": 1,
        "totalPages": 1
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.controller.ts` & `backend/src/modules/hr/hr.service.ts` — Add `GET /hr/trainings` supporting server-side filtering and pagination.
  - `frontend/src/app/(dashboard)/hr/training/_hooks/useTrainingOperations.ts` — Remove the 15-employee loop and the synthetic fallback array. Fetch from `GET /hr/trainings` with TanStack Query.
  - `[Verification]` — Seed 25 training records across 25 different employees. Open `/hr/training`. Verify all 25 records load in a single network request.

---

### 📌 Module: [Evaluasi KPI & Tiket / `/hr/kpi` & `/hr/tickets`]

#### [UX-01]: Tri-Layer Architecture Violation — 400+ Line Bloat & Dead Colocated Components/Hooks
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/kpi/page.tsx:1-359`
  - Frontend: `frontend/src/app/(dashboard)/hr/kpi/_hooks/useHrKpiOperations.ts:1-112`
  - Frontend: `frontend/src/app/(dashboard)/hr/kpi/_components/*`
  - Frontend: `frontend/src/app/(dashboard)/hr/tickets/page.tsx:1-460`
  - Frontend: `frontend/src/app/(dashboard)/hr/tickets/_hooks/useTicketsOperations.ts:1-140`
  - Frontend: `frontend/src/app/(dashboard)/hr/tickets/_components/*`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. `frontend/src/app/(dashboard)/hr/kpi/page.tsx` is 359 lines long (violating the <120 line standard). It implements inline tables, modals, and queries, ignoring `useHrKpiOperations.ts` and the 5 components in `_components/`.
  2. `handleProcessGradingBonus` and `handleSignoffEvaluation` in `kpi/page.tsx` are fake no-ops that display a success toast without performing an API mutation.
  3. `frontend/src/app/(dashboard)/hr/tickets/page.tsx` is 460 lines long. It duplicates the queries and state machines already written in `useTicketsOperations.ts` and `_components/TicketsTable.tsx`.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/hr/kpi/page.tsx` — Refactor into an ultra-thin shell (< 50 lines) importing `KpiView` and wrapping it in `DashboardShell` and `Suspense`.
  - `frontend/src/app/(dashboard)/hr/tickets/page.tsx` — Refactor into an ultra-thin shell (< 50 lines) importing `TicketsView`.
  - Connect `useHrKpiOperations.ts` and `useTicketsOperations.ts` to their respective views. Remove duplicate inline code.
  - `[Verification]` — Run `npm --prefix frontend run build`. Verify line counts of both `page.tsx` files are under 80 lines and UI renders identically.

---

### 📌 Module: [HR Architecture & Facade / `backend/src/modules/hr`]

#### [VAL-01]: Monolithic Facade Collapse (1,880 Lines) and Four Orphaned Domain Sub-Services
- **Target Files**:
  - Backend: `backend/src/modules/hr/hr.service.ts:1-1880`
  - Backend: `backend/src/modules/hr/hr.module.ts:1-14`
  - Backend: `backend/src/modules/hr/services/hr-attendance.service.ts`
  - Backend: `backend/src/modules/hr/services/hr-employee.service.ts`
  - Backend: `backend/src/modules/hr/services/hr-payroll.service.ts`
  - Backend: `backend/src/modules/hr/services/hr-performance.service.ts`
  - Backend: `backend/src/modules/hr/hr.controller.ts:184-250`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. `hr.service.ts` is 1,880 lines long, violating the architectural limit of < 250 lines for Facades.
  2. Four domain services (`HrAttendanceService`, `HrEmployeeService`, `HrPayrollService`, `HrPerformanceService`) exist in `backend/src/modules/hr/services/` but are NOT imported or registered in `hr.module.ts` or `hr.service.ts`.
  3. In `HrController`, `createCandidate` and `addEmployeeTraining` use raw inline TypeScript interfaces instead of validated DTO classes with `class-validator` rules, allowing unvalidated payloads to cause runtime exceptions.
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.module.ts` — Register `HrAttendanceService`, `HrEmployeeService`, `HrPayrollService`, and `HrPerformanceService` in `providers` and `exports`.
  - `backend/src/modules/hr/hr.service.ts` — Refactor into a thin orchestrator (< 250 lines) that delegates to the 4 domain sub-services.
  - `backend/src/modules/hr/hr.controller.ts` — Replace inline body typings with validated DTO classes (`CreateCandidateDto`, `AddTrainingDto`, `CreateLoanDto`).
  - `[Verification]` — Run `npm --prefix backend run typecheck` and `npm --prefix backend test`. Verify all sub-services are instantiated by NestJS dependency injection.

---

### 📌 Module: [Master Data & Integrasi / User vs Employee]

#### [EDGE-01]: Desynchronization Between Auth Accounts (`users`) and Staff Master (`employees`)
- **Target Files**:
  - Backend: `backend/src/modules/hr/hr.service.ts:161-173`
  - Backend: `backend/src/modules/master/services/personnel.service.ts:57-62`
  - Database: `backend/prisma/schema/hr.prisma:1-45`
  - Database: `backend/prisma/schema/auth.prisma:1-17`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `Employee.userId` references `User.id`. However:
  1. When an employee is soft-deleted via `DELETE /hr/employees/:id` (`hr.service.ts:161-173`), `employee.isActive` is set to `false`, but their linked `User` record remains `status: UserStatus.ACTIVE`. Terminated employees retain valid credentials to log in and call APIs.
  2. When an administrator deactivates a user in `PersonnelService.deactivateUser`, it updates `User.status = INACTIVE`, but does not set `Employee.isActive = false`.
- **Exact Contract Specification**:
  - When an employee is soft-deleted or resigned:
    - `Employee.isActive = false`
    - `User.status = SUSPENDED` (or `INACTIVE`)
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.service.ts` — In `deleteEmployee`, look up `employee.userId`. If present, wrap in `prisma.$transaction` and update `this.prisma.user.update({ where: { id: employee.userId }, data: { status: 'INACTIVE' } })`.
  - `backend/src/modules/master/services/personnel.service.ts` — In `deactivateUser`, update linked `Employee.isActive = false`.
  - `[Verification]` — Soft-delete an employee. Verify in DB that both `employees.isActive` is `false` and linked `users.status` is `INACTIVE`. Attempt to log in with that user's credentials; verify 401 Unauthorized.

---

### 📌 Module: [Data Pegawai & Kompensasi / `/hr/employees`]

#### [VAL-02]: Missing Delete Employee Action in UI & Missing Server-Side Pagination
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/hr/employees/_components/EmployeeTable.tsx:244-260`
  - Frontend: `frontend/src/app/(dashboard)/hr/employees/_hooks/useEmployeeOperations.ts:17-49`
  - Backend: `backend/src/modules/hr/hr.service.ts:1103-1148`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. Backend exposes `DELETE /hr/employees/:id`, but frontend `EmployeeTable.tsx:244-260` only provides two action buttons: "Ajukan Kasbon" and "Edit Data". There is no button or confirmation modal to trigger employee deletion or mark resignation.
  2. `getAllEmployees()` in `hr.service.ts:1104` has no `skip` or `take` parameters. It dumps the entire employee table into memory, which will cause browser performance degradation and timeouts as company headcount scales.
- **Actionable Execution Plan**:
  - `backend/src/modules/hr/hr.service.ts` — Add `page`, `limit`, and `search` query parameters to `getAllEmployees()`.
  - `frontend/src/app/(dashboard)/hr/employees/_components/EmployeeTable.tsx` — Add a delete/terminate action button with a DNA confirmation dialog.
  - `frontend/src/app/(dashboard)/hr/employees/_hooks/useEmployeeOperations.ts` — Add `deleteEmployeeMutation` invalidating `["hr-employees"]`.
  - `[Verification]` — Click delete on an employee, confirm in dialog. Verify employee disappears from active list and DB row has `isActive: false` and `resignReason: 'SYSTEM_DELETED'`.

---

## 3. Module Verdict Table

| Module / Route | Route Status in `docs/ROUTE_MAP.md` | CRUD Completeness | Architecture & Security Grade | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Employees Directory** (`/hr/employees`) | Registered (Line 106) | C: Partial, R: Full, U: Broken (Overwrites salary), D: Missing in UI | Grade F (Salary wipe bug, PII leaks) | **FAILING** |
| **Payroll Workbench** (`/hr/payroll`) | Registered (Line 109) | C: Broken (Ciphertext), R: Broken, U: Premature Loan Ded, D: None | Grade F (Ciphertext display, double payment risk) | **FAILING** |
| **ATS Recruitment** (`/hr/recruitment`) | Registered (Line 107) | C: Working, R: Working, U: 100% 400 Crash, D: None | Grade F (Broken stage state machine) | **FAILING** |
| **Competency & Training** (`/hr/training`) | Registered (Line 108) | C: Working, R: N+1 (Max 15), U: None, D: None | Grade D (Client N+1 flooding, fake mock data) | **FAILING** |
| **Tickets (Cuti/Lembur)** (`/hr/tickets`) | Registered (Line 111) | C: Working, R: Working, U: Route divergence, D: Working | Grade D (Bypasses reimbursement fund trigger) | **FAILING** |
| **Evaluasi KPI** (`/hr/kpi`) | Registered (Line 110) | C: Blocked, R: Working, U: Fake no-ops, D: None | Grade D (Dead hooks/components, fake buttons) | **FAILING** |
| **Executive Dashboard** (`/hr/dashboard`) | Registered (Line 105) | R only | Grade C (Leaks passwordHash in summary) | **FAILING** |

---

## 4. Prioritized Execution Roadmap

1. **Phase 1: Critical Security & Data Integrity Patch (Blockers)**
   - Fix `EmployeeFormModal.tsx` and `hr.service.ts` update logic to stop overwriting compensation with dummy defaults.
   - Remove `user: true` and unmasked `employee: true` across all HR services to stop leaking password hashes and PII.
   - Wrap payroll generation and authorization in `prisma.$transaction`. Remove premature loan deduction from draft run.
2. **Phase 2: Contract Reconciliation & State Machines**
   - Align ATS candidate stage enums across frontend, backend DTOs, and Prisma schema.
   - Update `getAllPayrolls()` to join `employee` relation and decrypt financial columns before responding to frontend.
   - Route ticket approvals through `HrService.approveTicket` to re-enable automated reimbursement `FundRequest` generation.
3. **Phase 3: Architecture Refactoring & Cleanup**
   - Decompose 1,880-line `HrService` monolith into `HrAttendanceService`, `HrEmployeeService`, `HrPayrollService`, and `HrPerformanceService`.
   - Refactor `kpi/page.tsx` and `tickets/page.tsx` into thin shells (< 120 lines) utilizing their colocated `_hooks` and `_components`.
   - Replace N+1 employee training queries with a paginated `GET /hr/trainings` endpoint and remove synthetic mock data.
