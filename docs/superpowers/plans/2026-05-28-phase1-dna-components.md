# Phase 1: DNA Components Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all core DNA components under `frontend/src/components/dna/` to VISUAL_DNA.md v7.0 specifications.

**Architecture:** Each component is an isolated presentational component in `@/components/dna/`. Tailwind classes are used for styling. Changes must preserve all existing props/interfaces so consumer pages don't break.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Next.js App Router

---

### Task 1: DataCard — Fix padding to 2rem standard

**Files:**
- Modify: `frontend/src/components/dna/DataCard.tsx`

- [ ] **Fix padding from px-7 to px-8 (1.75rem → 2rem)**

Current: `"bg-white border border-[var(--border-color)] rounded-[24px] py-8 px-7 flex flex-col h-full transition-all animate-fade-slide-in"`
Replace `px-7` with `px-8` (28px → 32px = 2rem per VISUAL_DNA §4).

- [ ] **Verify change**

Run: `Get-Content frontend/src/components/dna/DataCard.tsx | Select-String "px-[78]"` — should show `px-8`.

---

### Task 2: StatCard — Fix value to 32px per Primary Value standard

**Files:**
- Modify: `frontend/src/components/dna/StatCard.tsx`

- [ ] **Fix value font-size from 26px to 32px**

Current: `"text-[26px] font-black text-slate-900 tracking-tight tabular leading-tight"`
Change to: `"text-[32px] font-black text-slate-900 tracking-[-0.02em] tabular leading-tight"`

- [ ] **Fix label font-size from 10px to 9px (micro label)**

Current: `"text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]"`
Change to: `"text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]"`

---

### Task 3: SectionLabel — Use text-section-label class from globals.css

**Files:**
- Modify: `frontend/src/components/dna/SectionLabel.tsx`

- [ ] **Replace inline `section-label` class with defined `.text-section-label`**

Current: `<Tag className={cn("section-label", className)}>`
Change to: `<Tag className={cn("text-section-label", className)}>`

The `.text-section-label` class is already defined in globals.css with:
- font-size: 10px, font-weight: 800, letter-spacing: 0.3em, text-transform: uppercase

---

### Task 4: DnaBadge — Fix critical status colors to exact VISUAL_DNA hex values

**Files:**
- Modify: `frontend/src/components/dna/DnaBadge.tsx`

- [ ] **Fix critical badge colors from rose-50/rose-600 to exact red hex**

Current: `critical: "bg-rose-50 text-rose-600 border-rose-100",`
Change to: `critical: "bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]",`

This matches VISUAL_DNA §3C exactly:
- bg: #FEF2F2 (was #FFF1F2), text: #DC2626 (was #E11D48), border: #FECDD3

- [ ] **Fix success badge colors to exact hex**

Current: `success: "bg-emerald-50 text-emerald-600 border-emerald-100",`
Change to: `success: "bg-[#ECFDF5] text-[#059669] border-[#DCFCE7]",`

This matches VISUAL_DNA §3C exactly:
- bg: #ECFDF5, text: #059669, border: #DCFCE7

---

### Task 5: DnaButton — Add `rounded-xl` consistency

**Files:**
- Modify: `frontend/src/components/dna/DnaButton.tsx`

- [ ] **Ensure all button variants use `rounded-xl` consistently**

Current code already has `rounded-xl` in the base classes. No change needed.

- [ ] **Verify: no visual DNA changes needed for DnaButton**

DnaButton is not explicitly in VISUAL_DNA.md specs. Skip.

---

### Task 6: DnaInput — Verify VISUAL DNA compliance

**Files:**
- Modify: `frontend/src/components/dna/DnaInput.tsx`

- [ ] **Verify DnaInput is already compliant**

Current: `rounded-xl` (12px), font-medium, proper focus ring. No changes needed per VISUAL_DNA.

---

### Task 7: globals.css — Verify typography classes match VISUAL_DNA §1

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Verify and fix text-dashboard-title**

Current: `font-size: 32px; font-weight: 900; letter-spacing: -0.05em;` — ✅ matches VISUAL_DNA.

- [ ] **Verify text-section-label**

Current: `font-size: 10px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase;` — ✅ matches VISUAL_DNA.

- [ ] **Verify text-primary-value**

Current: `font-size: 32px; font-weight: 900; letter-spacing: -0.02em;` — ✅ matches VISUAL_DNA.

- [ ] **Verify text-secondary-value**

Current: `font-size: 24px; font-weight: 950; letter-spacing: -0.02em;` — ✅ matches VISUAL_DNA.

- [ ] **Verify text-table-header**

Current: `font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;` — ✅ matches VISUAL_DNA.

- [ ] **Verify custom scrollbar**

Current: width 4px, thumb #D1D5DB, hover #9CA3AF, track transparent — ✅ matches VISUAL_DNA §G.

---

### Task 8: Build verification

**Files:**
- Run: frontend build

- [ ] **Run frontend build to check for errors**

Run: `cd frontend; npx next build 2>&1`

Expected: Build succeeds with no type errors or broken imports.

- [ ] **Fix any type errors encountered**

If errors appear:
1. Read the error message
2. Fix the specific file
3. Rebuild

---

### Task 9: Commit Phase 1 changes

- [ ] **Stage and commit**

```bash
git add frontend/src/components/dna/DataCard.tsx
git add frontend/src/components/dna/StatCard.tsx
git add frontend/src/components/dna/SectionLabel.tsx
git add frontend/src/components/dna/DnaBadge.tsx
git add docs/superpowers/specs/2026-05-28-erp-restoration-design.md
git add docs/superpowers/plans/2026-05-28-phase1-dna-components.md
git commit -m "refactor(dna): align DataCard/StatCard/SectionLabel/DnaBadge to VISUAL_DNA.md

- DataCard: fix padding to 2rem (px-7 -> px-8)
- StatCard: value 32px tracking-[-0.02em], label 9px tracking-[0.1em]
- SectionLabel: use .text-section-label class from globals.css
- DnaBadge: critical/success colors match exact hex from VISUAL_DNA §3C
"
```
