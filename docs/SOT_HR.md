# SOURCE OF TRUTH (SoT): HUMAN RESOURCES (HR) DIVISION
**Version**: 2.0 — Sinkron dengan CANONICAL_GLOSSARY.md v2.0
**Role**: Performance-Driven Workforce Management, Payroll Integrity, and Talent Lifecycle.

---

## 1. HR OPERATIONAL PIPELINE

| Phase | System Status | Key Action / Event | Mandatory Trigger Action |
|:---|:---|:---|:---|
| **HR-1: Attendance** | `ON_TIME` / `LATE` / `OUTSIDE_GEOFENCE` | Clock-in via Mobile/Tablet | `geofencing` (Radius 50m) + selfie |
| **HR-2: KPI Accumulation** | `KPI_ACTIVE` | Event-driven point accumulation | `event_listener` (SO_PAID, QC_FAIL, etc) |
| **HR-3: Ticketing** | `PENDING` → `APPROVED`/`REJECTED` → `DISBURSED` | Leave/Overtime/Reimbursement | `createTicket` (Supervisor Flow) |
| **HR-4: Performance Review** | `SCORE_PERIOD` | KPI Score 70/30 split | `generateKpiScore` (auto:manual) |
| **HR-5: Payroll** | `DRAFT` → `AUTHORIZED` → `PAID` | Rekap gaji + KPI + insentif | `generateDraftPayroll` |
| **HR-6: Recruitment** | `SENT` → `DONE` / `PENDING` | Pipeline kandidat per posisi | `createCandidate` |

---

## 2. COMPLIANCE PROTOCOLS (HR GATES)

### [GATE 1] — The Geofencing Lock (Anti-Jastip Absen)
- **Aturan**: Absensi hanya dalam radius 50m dari koordinat pabrik
- **System Action**: `ForbiddenException` jika GPS di luar parameter
- **Impact**: Mencegah kecurangan absensi

### [GATE 2] — The Dual-Role KPI Weighting (Matrix Logic)
- **Aturan**: Karyawan multi-role (ex: SCM 80%, Production 20%) dinilai per bobot
- **Logic**: `Final Score = (Score_A × Weight_A) + (Score_B × Weight_B)`
- **Model**: `EmployeeRoleMapping` dengan `roleId`, `weight`
- **Impact**: Penilaian adil untuk lintas departemen

### [GATE 3] — Two-Tier Payroll Authorization
- **Aturan**: Draft gaji harus `AUTHORIZED` oleh HR Manager sebelum Finance proses
- **Security**: `baseSalary` & `netSalary` terenkripsi AES-256-GCM
- **Decrypt-only**: Role `FINANCE_MANAGER` atau `HR_HEAD`

### [GATE 4] — KPI Event-Driven Scoring
- **Aturan**: 70% skor KPI dari event otomatis, 30% dari penilaian manual atasan
- **Events**: `KpiMetricDefinition` (SO_PAID → BD, QC_FAIL → Production, etc)
- **Storage**: `KpiPointLog` — immutable audit trail per event

---

## 3. PAGE SPECIFICATIONS

### 3.1. PAGE: HR INTELLIGENCE DASHBOARD
- **Inputs**:
  - `employeeId`, `department`, `contractType` (PERMANENT/CONTRACT/PROBATION)
  - `baseSalary` (encrypted), `netSalary` (encrypted)
- **Outputs**:
  - Contract Lifecycle: `Days Left` countdown untuk PKWT/Magang
  - Departmental Breakdown: Distribusi staf per divisi real-time
  - KPI Score: Rata-rata skor per departemen dari aktivitas riil

### 3.2. PAGE: ATTENDANCE WORKBENCH
- **Inputs**:
  - `geoLat`, `geoLng` — otomatis dari GPS device
  - `photoUrl` — selfie clock-in
  - `status` — ON_TIME / LATE / OUTSIDE_GEOFENCE
- **Outputs**:
  - Daily attendance report per employee
  - Geofence violation log

### 3.3. PAGE: KPI ENGINE v2 (NEW — detail lengkap)
- **Inputs**:
  - `kpiMetricId` — referensi dari `KpiMetricDefinition`
  - `pointValue` — skor per event (otomatis dari sistem)
  - `manualScore` — 30% dari atasan (input manual)
- **Models**:
  - `KpiMetricDefinition`: nama event, divisi, bobot point
  - `KpiPointLog`: employeeId, metricId, point, timestamp, referenceId (immutable)
  - `KpiScore`: periodId, employeeId, score70, score30, finalScore

### 3.4. PAGE: TICKET PORTAL (NEW — detail lengkap)
- **Ticket Types** (`TicketType`):
  - `LEAVE` — cuti tahunan/sakit
  - `OVERTIME` — lembur dengan approval
  - `REIMBURSE` — penggantian biaya (medis/transport)
- **Inputs**:
  - `type` (enum TicketType)
  - `startDate`, `endDate` (untuk LEAVE)
  - `amount`, `proofUrl` (untuk REIMBURSE)
  - `reason`
- **Status Flow**: `PENDING` → Supervisor Approve → `APPROVED` / `REJECTED` → (jika REIMBURSE) → `DISBURSED`

### 3.5. PAGE: PAYROLL WORKSHEET (NEW — detail lengkap)
- **Model**: `Payroll` + `PayrollItem`
- **Status Flow**: `DRAFT` → `AUTHORIZED` (HR Manager) → `PAID` (Finance execute)
- **Components**:
  - Base salary (encrypted)
  - KPI bonus (dari `KpiScore`)
  - Overtime pay (dari Ticket OVERTIME)
  - Deductions (tax, absen, etc)
  - Net salary (encrypted)

### 3.6. PAGE: RECRUITMENT PIPELINE (NEW)
- **Inputs**:
  - `candidateName`, `source`, `position`, `department`
  - `stages` (applied → interview → test → offering → hired)
- **Outputs**: Pipeline visual per posisi, Time-to-Fill metric

---

## 4. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **FINANCE**: `FinancialPeriod` untuk siklus payroll
2. **ALL DIVISIONS**: Sinyal aktivitas → `KpiPointLog` (Production Log, Sales Order, QC events)
3. **SYSTEM**: Koordinat `FACTORY_LAT` & `FACTORY_LNG`

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **FINANCE**: `PayrollItem.netSalary` (encrypted → decrypted by Finance Manager)
2. **MANAGEMENT**: `Workforce Productivity` — KPI score per departemen
3. **ALL DIVISIONS**: Data kontrak & attendance untuk audit

---

## 5. HR PERFORMANCE METRICS (KPIs)

| KPI | Formula | Data Source |
|:---|---:|---:|
| Absenteeism Rate | Hari absen / Hari kerja efektif | Attendance |
| Avg KPI Score | Rata-rata `finalScore` per period | KpiScore |
| Turnover Rate | Karyawan keluar / Total karyawan | Employee |
| Time to Fill | Hari dari open requisition sampai hired | Recruitment |
| Payroll Accuracy | % kesesuaian draft vs realisasi | Payroll |
| Overtime Ratio | Total jam lembur / Total jam kerja | Ticket |

---

## 6. PRIVACY & SECURITY PROTOCOL
- **Salary Encryption**: Field `baseSalary` dan `netSalary` AES-256-GCM. Hanya `FINANCE_MANAGER` & `HR_HEAD` bisa decrypt
- **Photo Evidence**: Absensi wajib selfie (disimpan terenkripsi)
- **Audit Logs**: Setiap perubahan data master (role/salary) tercatat di `system_logs` (immutable)
- **GDPR Readiness**: Employee data export & deletion protocol
