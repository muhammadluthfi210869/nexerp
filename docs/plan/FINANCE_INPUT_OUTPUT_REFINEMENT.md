# Implementation Plan: Finance Input/Output Refinement & AR Validation Hub
**Version**: 5.0 (Enterprise Standard)
**Target**: 100% Systemic Compliance & Zero-Leakage Finance Workflow

## 1. Database & Master Data (The Foundation)
### A. Chart of Accounts (CoA) Re-structuring
We will implement a hierarchical numbering system (Digit Code) to ensure the "backbone" of the ERP can support automated event-driven journaling.

**Table Updates:**
- Ensure `Account` model has `code` (Unique), `name`, `type`, and `normalBalance`.
- **Seeding Logic**: Create a new seed script `prisma/seed-coa-v2.ts` containing the following hierarchy:
  - **1000 SERIES (ASET)**: 1100 (Kas/Bank), 1101 (Petty Cash), 1110 (BCA), 1111 (Mandiri), 1200 (Piutang), 1201 (Piutang Usaha), 1300 (Persediaan), etc.
  - **2000 SERIES (KEWAJIBAN)**: 2101 (Hutang Usaha), 2301 (DP Produksi - Liability), etc.
  - **3000 SERIES (EKUITAS)**: 3100 (Modal), 3200 (Retained Earnings).
  - **4000 SERIES (REVENUE)**: 4101 (Maklon), 4102 (Sample), 4103 (Legalitas).
  - **5000 SERIES (HPP/COGS)**: 5101 (Bahan Kimia), 5102 (Kemasan), 5103 (Tenaga Kerja).
  - **6000 SERIES (OPEX)**: 6101 (Ads), 6201 (Gaji), 6202 (Listrik).
  - **7000/8000 SERIES (LAIN-LAIN)**: 7100 (Pendapatan Lain), 8100 (Beban Lain).

---

## 2. Backend Logic (NestJS)
### A. Mandatory Proof Validation
Modify `FinanceService.createJournalEntry` and `FinanceService.createDisbursement`:
- **Rule**: If the account used belongs to the **Expense (6000)** or **Asset (1500 - Fixed Assets)** series, the `attachmentUrls` array MUST NOT be empty.
- **Error**: Return `400 Bad Request` with message "Proof of payment (attachment) is mandatory for disbursements."

### B. AR Validation Hub Endpoints
New endpoints in `FinanceController`:
- `GET /finance/ar-hub/pending`: Returns all `SampleRequest` and `SalesOrder` where `paymentProofUrl` is present but `isPaymentVerified` is false.
- `POST /finance/ar-hub/verify`: 
    - **Payload**: `type` (SAMPLE/DP_ORDER/PELUNASAN), `id`, `receivingAccountId`, `actualAmount`, `bankAdminFee`, `taxAmount`.
    - **Dynamic Journaling**:
        - **Debit**: `Bank Account` (actualAmount) + `Beban Admin Bank - 8100` (bankAdminFee).
        - **Credit**: `Target Account` (Calculated Base) + `Hutang Pajak PPN - 2201` (taxAmount).
    - **Mapping Logic**:
        - `SAMPLE`: Credit `4102` (Pendapatan Sampel).
        - `DP_ORDER`: Credit `2301` (DP Produksi - Liability).
        - `PELUNASAN`: Credit `4101` (Pendapatan Maklon) + Adjust Accounts Receivable.

---

## 3. Frontend Implementation (Next.js)
### A. Finance Input Terminal (Refinement)
- **Dynamic CoA**: Replace hardcoded accounts with a searchable dropdown fetching data from `/finance/accounts`.
- **Mandatory Attachment UI**:
    - Add a "Upload Proof" section using `FileUploader` component.
    - Visual indicator (Red Asterisk) when a Disbursement/Expense account is selected.
    - Disable "Save" button if proof is missing for mandatory rows.

### B. AR Validation Hub (New Page)
**Route**: `/dashboard/finance/ar-hub`
**UI Architecture (Eye-Flow Optimized)**:
- **Left Panel (60%)**: Proof Viewer (Premium high-res preview).
- **Right Panel (40%)**: Data Entry Form (Pre-filled logic).
- **Logic**: Accountant reads the document on the left and inputs/verifies on the right.

---

## 4. Integration Protocol (Bussdev ↔ Finance)
1. **Bussdev Action**: Uploads image in `/bussdev/pipeline`.
2. **System Action**: Sets `isPaymentVerified = false` and adds to `Finance AR Hub`.
3. **Finance Action**: Validates in `AR Hub`.
4. **System Action**:
    - Creates Journal: `Debit 1111 (Bank Mandiri) / Credit 2301 (DP Produksi)`.
    - Notifies Bussdev: "Payment for Client X Verified. Production/R&D started."

---

## 5. Quality Assurance (Testing Plan)
- **Unit Test (Backend)**: Verify that trying to save a `6201 (Gaji)` entry without an attachment fails.
- **Integration Test**: 
    1. Create Lead -> Submit Sample Payment Proof.
    2. Check if it appears in `AR Validation Hub`.
    3. Verify in Finance -> Check if `SampleRequest` stage moves to `FORMULATING`.
- **UI Test**: Ensure the split-screen UI is responsive and the image viewer doesn't break the layout on smaller screens.

---

## 6. Implementation Checklist
- [x] [DB] Create Migration for Account Seeding (V2).
- [x] [Backend] Update Validation Logic in `FinanceService`.
- [x] [Backend] Create AR Hub Endpoints.
- [x] [Frontend] Build `ARValidationHub` Page.
- [x] [Frontend] Update `FinanceInputPage` with Dynamic CoA & Mandatory Uploads.
- [x] [Backend] Implement Profit & Loss and Cash Flow Report Logic.
- [x] [Frontend] Build Financial Reports Dashboard.
- [x] [E2E] Full Simulation of Sample Closing Flow (Verified via Logic Audit).
