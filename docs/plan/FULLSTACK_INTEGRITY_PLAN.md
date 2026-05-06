# Full-Stack Integrity & Synchronization Plan (ERP V4)

## Problem: The "Sync-Gap"
Backend testing validates logic, but it doesn't guarantee that the Frontend is sending the right data or that it can handle the Backend's response structure. This leads to the "But it works on my machine (backend)" syndrome.

## Solution: The "Triple-Lock" Strategy
We will implement three layers of synchronization to ensure Frontend and Backend always speak the same language.

### Phase 1: Contract Enforcement (Shared Type Safety)
**Goal:** Eliminate "Undefined" errors in the Frontend caused by renaming backend fields.
1. **Automated SDK Generation**: We will use the Backend's Swagger (OpenAPI) definition to generate TypeScript interfaces for the Frontend.
   - *Tool:* `openapi-typescript`
   - *Result:* If you change a field in `ProductionService`, the Frontend build will fail immediately with a TypeScript error.
2. **Unified DTOs**: Ensure `class-validator` rules in the Backend match the `zod` or `yup` schemas used in Frontend forms.

### Phase 2: E2E Integrity Loop (Playwright)
**Goal:** Ensure the actual user interface works with the real API.
1. **Scenario-Based Testing**: Instead of just testing "Does the API work?", we test "Can the user finish a Work Order?".
2. **Headless Validation**: Run Playwright tests that:
   - Login to the Frontend.
   - Click buttons and fill forms.
   - Intercept API calls to verify the payload is correct.
   - Verify the UI updates correctly after the API response.
3. **Cross-Service Validation**: Ensure that when a user clicks "Finish Production" in the Frontend, the stock deduction (Warehouse) and journal entry (Finance) are actually created.

### Phase 3: Defensive Frontend Architecture
**Goal:** Prevent the Frontend from crashing when the Backend returns an error.
1. **Standardized Response Wrapper**: Every API response will follow a strict `{ success: boolean, data: T, error?: string }` format.
2. **Global Error Boundaries**: Implement React Error Boundaries that capture 500/400 errors and display a "Premium Audit" error message instead of a white screen.
3. **Zod Validation on API Response**: (Optional but powerful) Validate the data received from the API at runtime to catch schema drifts before they reach the UI components.

---

## Execution Workflow

### Step 1: Backend Swagger Stabilization
Ensure every controller in the Backend has proper `@ApiProperty()` and `@ApiResponse()` decorators.

### Step 2: Frontend Client Generation
Run a script to generate `api-client.ts` in the Frontend folder based on the Backend's schema.
```bash
npx openapi-typescript http://localhost:3001/api-json --output ./frontend/src/types/api.ts
```

### Step 3: Critical Flow E2E (Playwright)
Implement the first "Golden Thread" test in Playwright:
1. **SCM**: Inbound material.
2. **Production**: Create and Complete Schedule.
3. **Warehouse**: Check stock reduction in the UI.
4. **Finance**: Check journal entry list in the UI.

---

## Why this works
- **Typescript** catches errors at **Coding Time**.
- **Playwright** catches errors at **Runtime**.
- **Swagger** acts as the **Peace Treaty** between Frontend and Backend teams.
