# Plan: Bussdev Admin Optimization & Stability

This plan outlines the steps to ensure a 100% bug-free experience for Admins/Super Admins when using the Lead Intake form.

## Current Issues Identified
1. **ID Mapping Conflict**: The backend was incorrectly using `BussdevStaff.id` for the `SalesLead.bdId` field (which expects a `User.id`), causing Foreign Key violations.
2. **Data Inconsistency**: Existing staff records might have missing names or broken links, leading to "empty" dropdown options.
3. **Hydration Mismatch**: React SSR conflicts due to conditional rendering based on client-side state (localStorage).
4. **UI Clarity**: Dropdown options not clearly reflecting the identity of the PIC.

## Implementation Phases

### Phase 1: Data Integrity & Backend Logic (COMPLETED)
- [x] Fix `BussdevService.createLead` to correctly fetch and map `userId` for the `bdId` field.
- [x] Ensure Diva & Nisa exist in the database with correct UUIDs and Names.
- [x] Corrected the mapping of `picId` (Staff) and `bdId` (User) in the creation service.

### Phase 2: UI/UX Stabilization (COMPLETED)
- [x] Implement `isMounted` guard to eliminate all Hydration Mismatch errors.
- [x] Add fallback text (`Staff {ID}`) for dropdown options if the name is missing in the database.
- [x] Re-brand the "Auto-Balance" option for better visibility.
- [x] Added `isMounted` checks to assignment rule logic.

### Phase 3: Validation & Stress Testing (PENDING)
- [ ] Add explicit validation for `estimatedValue` to ensure it's always a valid number.
- [ ] Test the "Auto-Balance" logic with multiple staff members to verify even distribution.
- [ ] Verify that Admins can track leads assigned to others without permission issues.

## Expected Outcome
An Admin can now:
1. Open the form without any console warnings (Hydration).
2. See "DIVA", "NISA", and "AUTO-BALANCE" clearly in the dropdown.
3. Submit a lead and have it correctly linked to both the Staff record (for workload) and User record (for system tracking) without 500 errors.
