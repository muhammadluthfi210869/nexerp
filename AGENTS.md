# NEX ERP Agent Entry & Clean Architecture Standard

**MANDATORY FOR ALL AI AGENTS & CLI TOOLS (Antigravity, Claude Code, Cursor, Copilot, Codex, Aider).**
Before making ANY modification, refactor, or feature addition to this codebase, you MUST read and strictly adhere to the following standards.

---

## 🧭 Step 0: Route & Module Location
- **Always read `docs/ROUTE_MAP.md` first** to locate active screens, routes, and division boundaries without scanning or guessing.
- Read `docs/legacy-erp/AGENTS.md` and `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`.
- No bespoke phase certifiers, generic diagnose CLIs, SHA tokens, or mutation engines. Use focused native tests and thin `verify:pXX`.

---

## 🛡️ 6 Strict Clean Code & Architecture Parameters

Every change in frontend, backend, or database MUST comply with these 6 quality gates:

### 1. Coupling & Cohesion (Strict Layer Isolation)
- **Frontend**: Every route MUST follow **Tri-Layer Colocation**:
  - `_components/`: Pure presentation & UI components.
  - `_hooks/`: Operations & state hooks (React Query, `apiClient`, mutations, modal states).
  - `_types/`: Domain interfaces & DTOs.
  - `page.tsx`: Ultra-thin entrypoint shell (< 120 lines).
- **Backend**: Monoliths are forbidden. Break logic into **Single-Responsibility Domain Services** under `services/` orchestrated by a thin **Facade Service** (< 250 lines) with ACID database transaction boundaries.

### 2. File Size Limits (Zero Monolith Policy)
- **Frontend `page.tsx`**: Must NEVER exceed **120 lines** (hard limit: 150 lines).
- **Backend Facades**: Must NEVER exceed **250 lines**.
- **Domain Sub-Services & UI Components**: Keep under **300–400 lines**. Decompose immediately if growing larger.

### 3. Cognitive Complexity (Atomic & Predictable)
- 1 component / 1 service method = 1 single responsibility.
- Low cognitive complexity, zero spaghetti branching, predictable state flow without side-effects.

### 4. Zero Dead Code & Single Source of Truth
- Consult `docs/ROUTE_MAP.md` as the canonical registry.
- NEVER create duplicate/fossil routes (e.g. `*-finance`, `master/hr-*`, `warehouse/hub`).
- Always delete unused files, broken links, and dead imports immediately.

### 5. UI Integrity & Visual DNA
- 100% Identical Visuals (0% UI regression).
- Preserve existing styling and use standard `@/components/dna` design system tokens.

### 6. Strict Type Safety & Build Quality Gate
- Strict TypeScript: No `any` type escapes, duplicate types, or broken DTO contracts.
- **Verification Requirement**: You MUST run and pass before completing any task:
  1. `npm --prefix backend run typecheck` ➜ Exit Code 0 (0 errors)
  2. `npm --prefix frontend run typecheck` ➜ Exit Code 0 (0 errors)
  3. `npm --prefix frontend run build` ➜ Exit Code 0 (Next.js Turbopack build success)
