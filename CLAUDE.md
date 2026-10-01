# NEX ERP — Claude & AI CLI Development Guide

Before making any changes to this codebase, you MUST strictly adhere to the standards outlined below.

## 🧭 Navigation & Source of Truth
- Always check `docs/ROUTE_MAP.md` before creating or modifying any route.
- Fast Delivery Standard: `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`.

## 🛡️ 6 Mandatory Clean Code Parameters

1. **Coupling & Cohesion**:
   - Frontend: Tri-Layer Colocation per route (`_components/`, `_hooks/`, `_types/`, thin `page.tsx`).
   - Backend: Domain Services under `services/` orchestrated by thin Facades (< 250 lines) with ACID boundaries.
2. **File Size Limits**:
   - `page.tsx`: < 120 lines (hard limit: 150 lines).
   - Backend Facades: < 250 lines.
   - Domain Sub-Services & Components: < 300–400 lines.
3. **Cognitive Complexity**:
   - Single responsibility per function and component. Low complexity, predictable state.
4. **Zero Dead Code**:
   - 0 duplicate/fossil routes. Keep `docs/ROUTE_MAP.md` in sync.
5. **UI Integrity & Visual DNA**:
   - 0% unintended visual regressions. Use `@/components/dna`.
6. **Strict Type Safety**:
   - Strict TypeScript. Every task must pass:
     - `npm --prefix backend run typecheck`
     - `npm --prefix frontend run typecheck`
     - `npm --prefix frontend run build`
