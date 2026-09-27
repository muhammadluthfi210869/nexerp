# P16 Frozen Acceptance Contract

**Phase:** P16 — HR, Personnel, Attendance/Payroll Scope, and KPI System  
**Contract version:** `P16-v2`, frozen 2026-09-22 (Updated with Owner Requirements)  
**Final verification command:** `npm run verify:p16`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typecheck and database cleanup checks pass  

## Purpose and finish line

P16 is complete when one real, tenant-safe production HR, Attendance, Payroll, and KPI golden thread proves:

`Candidate Recruitment (CV review, stage pipeline to done/reject, and automated stage notifications BUS-RULE-115) → Employee Onboarding (3-day onboarding standard & training log with hours, goals and certificates BUS-RULE-116) → Dual-Role Weighting totaling exactly 100% (BUS-RULE-074) & 30-day Contract Expiry alerts (BUS-RULE-071) → Attendance Clock-In within GPS Geofence radius blocking duplicate clock-in and leave collisions (BUS-RULE-073) → Operational Ticket Approval (Reimbursement auto-generating Cash Bank Out queue in Finance BUS-RULE-075) → Event-Driven KPI Calculation with monthly trend graph and Top Performers Leaderboard while strictly blocking manual score injections (BUS-RULE-072, BUS-RULE-090, BUS-RULE-106, BUS-RULE-118) → Comprehensive Monthly Payroll Generation computing Upah Tetap, Transport 2-Kolom (Flat & Tentatif), approved Overtime, Kasbon/Loan deduction with remaining balance tracking, BPJS and PPh 21 thresholding (BUS-RULE-073, BUS-RULE-117) → Printable Salary Slip and Maker-Checker authorization`

and the transactions produce immutable audit logs, encrypted salary/PII fields, zero static array mocks in all named HR surfaces, and zero residue rows in PostgreSQL.

## Frozen scope

In scope:
- **Recruitment & Candidate ATS (`BUS-RULE-115`, `REQUIREMENT.md §16.1`)**:
  - Candidate master: name, department, email, duration, CV attachment path, review evaluation.
  - Multi-stage pipeline: `SCREENING` $\to$ `HR_INTERVIEW` $\to$ `USER_INTERVIEW` $\to$ `OFFERING` $\to$ `DONE` / `REJECTED`.
  - Historical archive of passed and rejected candidates with automated notification/reminder triggers on stage advancement.
- **Master Karyawan, Onboarding & Training Management (`BUS-RULE-116`, `REQUIREMENT.md §16.2`)**:
  - Employee demographics: birth date (auto age computation), gender, position, department, contract duration, base salary (encrypted AES-256-GCM).
  - 3-day onboarding tracking with readiness status.
  - Training logs: training type, duration hours, custom goal description, execution date, and certificate attachment.
- **Contract Expiry & Multi-Role Weighting (`BUS-RULE-071`, `BUS-RULE-074`)**:
  - 30-day contract expiry query (`GET /hr/contracts/expiring`) returning impending expirations.
  - Multi-role assignments with effective dating; active weights must sum to exactly 100% (`KPI_ROLE_WEIGHT_INVALID`).
- **Attendance Geofencing & Operational Tickets (`BUS-RULE-073`, `BUS-RULE-075`)**:
  - Distance verification against factory GPS coordinates, duplicate clock-in prevention, and leave collision lock.
  - Operational ticket lifecycle (Leave, Overtime, Reimbursement).
  - Approved reimbursement ticket auto-triggers a pending `FundRequest` (`WAITING_FINANCE_DISBURSEMENT`) in Finance.
- **Event-Driven KPI Engine, Monthly Trends & Leaderboard (`BUS-RULE-072`, `BUS-RULE-090`, `BUS-RULE-106`, `BUS-RULE-118`)**:
  - Passive event harvesting from operational transactions (Sales, SCM, Production, QC).
  - Historical actor-at-event attribution and zero-denominator null safety ($0 \to \text{null/N/A}$).
  - Strictly block manual score inputs from HR (`PERFORMANCE_MANUAL_BLOCKED` - HTTP 400).
  - Monthly KPI performance trend tracking and automated Top Performers Leaderboard ranking.
- **Comprehensive Payroll, Kasbon Deductions & Slip Gaji (`BUS-RULE-117`, `REQUIREMENT.md §16.3`)**:
  - Upah Tetap: Gaji Pokok + Tunjangan Jabatan.
  - Tunjangan Transport: 2 kolom (Transport Flat + Transport Tentatif berbasis kehadiran).
  - Overtime pay computed from approved overtime tickets / roster; unapproved overtime blocks payroll authorization with `PAYROLL_PENDING_OVERTIME`.
  - Kasbon / Employee Loan: automatic monthly installment deduction + tracking remaining loan balance.
  - BPJS Kesehatan & Ketenagakerjaan columns present.
  - PPh 21: taxable only on earnings above UMR/PTKP threshold.
  - Optional salary notes/descriptions.
  - Detailed Salary Slip (Slip Gaji) with printable export.
- **Named Live DNA UI Surfaces (100% Zero Mock)**:
  - `/hr` (`HRDashboardClient.tsx`)
  - `/master/hr-attendance`
  - `/master/hr-payroll`
  - `/master/hr-recruitment`
  - `/hr/kpi`
  - `/master/kpi-department`
  - `/master/kpi-individual`
  - `/hr/tickets`

Out of scope:
- Automated WhatsApp/Email external gateway protocols (P17);
- Executive multi-year consolidated BI governance (P18);
- Product-wide WCAG AA accessibility certification (P19).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P16-01` | **Recruitment Pipeline & Candidate ATS:** Candidate management tracks multi-stage pipeline (`SCREENING` to `DONE`/`REJECTED`), imports CVs, logs review notes, and triggers stage advance notifications. Historical records preserved. |
| `AC-P16-02` | **Employee Demographics, Onboarding & Training Logs:** Master employee records encrypted PII. 3-day onboarding status tracked. Training entries record duration hours, goal descriptions, and certificate attachments. Multi-role weights validate to 100% (`KPI_ROLE_WEIGHT_INVALID`). Expirations $\le$ 30 days are reported accurately. |
| `AC-P16-03` | **Attendance Geofencing & Reimbursement Bridge:** Clock-in verifies GPS radius; duplicate clock-in is rejected; clock-in during approved leave is forbidden. Approved reimbursement tickets automatically create a pending cash disbursement entry in Finance (`FundRequest`). |
| `AC-P16-04` | **Passive Event-Driven KPI Engine & Leaderboard:** HR manual score injection is strictly rejected (`PERFORMANCE_MANUAL_BLOCKED`). Event-driven metrics attribute the actor at event time. Zero-denominator produces `null` (N/A). Monthly trend and Top Performers Leaderboard rank employees accurately. |
| `AC-P16-05` | **Comprehensive Payroll, Kasbon & Slip Gaji:** Draft payroll calculates Upah Tetap, Transport 2-kolom (Flat & Tentatif), approved overtime, loan installment deductions with remaining balance tracking, BPJS and PPh 21 above UMR. Unapproved overtime blocks authorization (`PAYROLL_PENDING_OVERTIME`). Detailed Slip Gaji renders all components. |
| `AC-P16-06` | **Zero-Mock Live UI Surfaces:** All 8 named HR surfaces fetch live backend data, handle loading, empty, and error states using `@/components/dna`, and contain zero static mock arrays. |
| `AC-P16-07` | **Thin Final Verification & Clean DB:** `npm run verify:p16` executes dual typechecks, focused backend suites, frontend live UI behavior suite, real DB golden thread, and cleanup check with natural exit `0`, leaving 0 residue rows in PostgreSQL. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| Recruitment & ATS | Candidate Pipeline | `REQUIREMENT.md §16.1`, `BUS-RULE-115` | Screening $\to$ Done/Reject, CV review, reminder | None |
| Onboarding & Training | 3-Day Onboarding & Logs | `REQUIREMENT.md §16.2`, `BUS-RULE-116` | 3 days onboarding, training hours & certs | None |
| Contract Expiry Alert | Alert 30 Hari Expiry | `contracts/04_BUSINESS_RULES.md` `BUS-RULE-071` | Expiry $\le$ 30 days flagged to HR | None |
| Dual-Role Scorecard | Bobot Multi-Peran | `BUS-RULE-074`, `REQ-036` | Active weights sum to 100%; weighted average | None |
| Attendance & Geofence | GPS Presensi | `BUS-RULE-073` | GPS radius, duplicate lock, leave lock | None |
| Reimbursement Cash Out | Auto Kas Keluar | `BUS-RULE-075` | Approved ticket creates FundRequest in Finance | None |
| Event KPI Calculation | Auto dari Event | `BUS-RULE-072`, `REQ-035` | No manual score; actor-at-event attribution | None |
| KPI Direction & Leaderboard | Direction & Ranking | `BUS-RULE-090`, `BUS-RULE-118` | HIGHER/LOWER/ZERO, Top Performers Rank | None |
| Comprehensive Payroll | Upah, Kasbon & Pajak | `BUS-RULE-117`, `REQUIREMENT.md §16.3` | Upah tetap, transport 2-col, loan, PPh 21 UMR | None |

## Verification composition

The frozen verification command `npm run verify:p16` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p16:recruitment-training`
3. `npm --prefix backend run test:p16:employee-contract`
4. `npm --prefix backend run test:p16:attendance-tickets`
5. `npm --prefix backend run test:p16:kpi-engine`
6. `npm --prefix backend run test:p16:payroll-loan`
7. `npm --prefix backend run test:p16:golden-thread`
8. `npm --prefix frontend run test:p16`
9. `node scripts/ssot/p16_clean_db.js`
