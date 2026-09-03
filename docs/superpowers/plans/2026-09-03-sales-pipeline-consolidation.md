# Sales Pipeline Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Konsolidasi 5 halaman Bussdev klien-list (pipeline, pipeline-v2, clients, client-manager, sample-sales, sample-tracking) + entri sidebar duplikat menjadi 1 halaman `/bussdev/pipeline` dengan sub-navbar 5 tab. SalesLead tetap sumber tunggal — backend & schema tidak diubah.

**Architecture:**
- `/bussdev/pipeline/page.tsx` saat ini adalah **redirect** ke `/bussdev/client-manager`. Task utama: ganti redirect dengan halaman riil yang berisi sub-navbar 5 tab.
- Setiap tab panggil endpoint `GET /v1/bussdev/pipeline/leads/:group` yang sudah ada (`pipeline.service.ts → getLeadsByGroup()`).
- Tab konten reuse pola tabel/data lead yang sudah ada di `client-manager/page.tsx` (sudah dipakai sebagai basis).
- Backend, schema Prisma, dan intake channels (`guest-book/`, `intake/`, `master/customers`) **tidak disentuh**.

**Tech Stack:** Next.js (App Router, version-specific — lihat Global Constraints), TypeScript, Vitest, `@playwright/test`, Tailwind, lucide-react, Prisma client (backend only, tidak disentuh).

## Global Constraints

- **Next.js version:** BUKAN Next.js dari training data. Wajib baca `frontend/node_modules/next/dist/docs/` (terutama dokumen routing, redirects, server vs client components) sebelum menulis/mengubah kode Next. Hormati deprecation notices. (Sumber: `frontend/AGENTS.md`.)
- **DNA UI:** "Binary Audit Vision" v7.0 — dark mode, glassmorphism. Sub-navbar & tab styling harus konsisten dengan pola yang sudah ada di `frontend/src/components/`. Jangan bikin design token baru.
- **Backend boundary:** Tidak ada perubahan di `backend/src/**`. Service `pipeline.service.ts` & `getLeadsByGroup()` dipakai apa adanya.
- **Schema boundary:** Tidak ada perubahan Prisma schema. Tidak ada migrasi data.
- **Intake channels:** `guest-book/`, `intake/`, `master/customers/` tetap berdiri sendiri dan **tidak** dihapus atau dimodifikasi.
- **Role-based access:** Sales Pipeline tab & sidebar entry muncul untuk role `SUPER_ADMIN`, `COMMERCIAL`, `MARKETING`, `DIRECTOR` (sama seperti aturan Bussdev section saat ini).
- **No placeholders / TBD / TODO** di kode yang ditulis. Semua step harus selesai & terverifikasi.
- **Bahasa UI:** Label tab mengikuti konvensi Indonesia yang sudah dipakai di sidebar: `Buku Tamu`, `Sample`, `RO`, `Produksi`, `Lost`. Case-sensitive match dengan `pipeline.service.ts → getLeadsByGroup()` enum: `'guest' | 'sample' | 'production' | 'ro' | 'lost'`.
- **Test runner:** Vitest untuk unit/component (`frontend/test/components/`), `@playwright/test` untuk E2E (`frontend/tests/e2e/`).
- **Commits:** Conventional Commits. Atomic per task. Co-authored footer tidak perlu (sesuai CLAUDE.md project convention).
- **Branch:** Bekerja di branch `feat/sales-pipeline-consolidation`. Push & buka PR ke `main` setelah semua task selesai.

---

## File Structure

**Modify:**
- `frontend/src/components/layout/Sidebar.tsx` — hapus grup duplikat "client-centric" (lines 84–88 yang punya 5 entri klien); Bussdev group tetap punya `Sales Pipeline` (line 108).
- `frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx` — ganti redirect dengan halaman riil yang render `<PipelineTabs />`.
- `frontend/test/components/sidebar-roles.test.tsx` — update `MODULE_STRUCTURE` agar sesuai struktur sidebar baru.

**Add:**
- `frontend/src/components/bussdev/pipeline-tabs.tsx` — komponen sub-navbar tab (5 tab) + konten tabel lead. State local `activeTab`. Pakai pola data fetching yang sudah ada di `client-manager/page.tsx` (lihat file tsb sebelum coding).
- `frontend/tests/e2e/sales-pipeline-tabs.spec.ts` — 1 E2E test: navigate ke `/bussdev/pipeline`, assert 5 tab, klik tiap tab, assert tabel render.

**Delete (setelah pipeline page baru jadi):**
- `frontend/src/app/(dashboard)/bussdev/pipeline-v2/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/clients/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/client-manager/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/sample-sales/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/sample-tracking/` (folder + isinya)

**Reference (read-only, jangan dimodifikasi):**
- `frontend/src/app/(dashboard)/bussdev/client-manager/page.tsx` — basis pola render & data fetching untuk tab konten. Copy/adapt (bukan reuse langsung — page ini akan dihapus).
- `frontend/src/hooks/use-pipeline-v2.ts` — pola client-side hook untuk fetch leads per group.
- `backend/src/modules/bussdev/services/pipeline.service.ts` — baca `getLeadsByGroup()` signature (sudah ada, jangan diubah).
- `frontend/node_modules/next/dist/docs/` — baca sebelum coding Next.js (AGENTS.md).

---

## Task 1: Update sidebar test structure (TDD red)

**Files:**
- Modify: `frontend/test/components/sidebar-roles.test.tsx`
- Reference: `frontend/src/components/layout/Sidebar.tsx` (lines 84–88 untuk grup duplikat, line 108 untuk Sales Pipeline)

**Step 1.1: Read existing test**

Buka `frontend/test/components/sidebar-roles.test.tsx` dan identifikasi blok `MODULE_STRUCTURE`. Cari grup Bussdev (`label: "BUSSDEV"`) dan grup "client-centric" duplikat (yang punya item `Buku Tamu`, `Client Sample`, `Client Produksi`, `Client RO`).

**Step 1.2: Write failing test untuk struktur baru**

Dalam blok `describe("Sidebar Role Structure", ...)` (atau buat blok `it` baru), tambah assertion:

```ts
it("tidak punya grup duplikat client-centric", () => {
  const clientGroup = MODULE_STRUCTURE.find(
    (g) => Array.isArray(g.items) &&
      g.items.some((i: { href?: string }) => i.href === "/bussdev/sample-tracking"),
  );
  expect(clientGroup).toBeUndefined();
});

it("BUSSDEV hanya punya satu entry Sales Pipeline", () => {
  const bussdev = MODULE_STRUCTURE.find((g) => g.label === "BUSSDEV");
  const pipelineEntries = bussdev?.items.filter(
    (i: { href?: string }) => i.href === "/bussdev/pipeline",
  ) ?? [];
  expect(pipelineEntries).toHaveLength(1);
});
```

Tambah juga assertion untuk memastikan `Buku Tamu`, `Client Sample`, `Client Produksi`, `Client RO`, `sample-tracking`, `sample-sales`, `clients`, `client-manager` **tidak** ada di MODULE_STRUCTURE manapun:

```ts
it("tidak ada entry sidebar duplikat untuk client-* items", () => {
  const allHrefs = MODULE_STRUCTURE.flatMap(
    (g) => (g.items ?? []).map((i: { href?: string }) => i.href),
  );
  expect(allHrefs).not.toContain("/bussdev/guest-book");
  expect(allHrefs).not.toContain("/bussdev/sample-tracking");
  expect(allHrefs).not.toContain("/bussdev/sample-sales");
  expect(allHrefs).not.toContain("/bussdev/clients");
  expect(allHrefs).not.toContain("/bussdev/client-manager");
});
```

**Step 1.3: Run test untuk verify fail**

```bash
cd frontend && npx vitest run test/components/sidebar-roles.test.tsx
```

Expected: FAIL — `MODULE_STRUCTURE` lama masih punya entry `Buku Tamu`, `Client Sample`, `Client Produksi`, `Client RO`, `sample-tracking`.

**Step 1.4: Commit (test red)**

```bash
git add frontend/test/components/sidebar-roles.test.tsx
git commit -m "test(sidebar): failing assertions for sales pipeline consolidation"
```

---

## Task 2: Refactor Sidebar.tsx — remove duplicate client-centric group

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Reference: hasil Task 1 (test red masih aktif sampai Step 2.2)

**Step 2.1: Identify duplicate group**

Baca `Sidebar.tsx` lines 67–110. Cari grup yang berisi `Buku Tamu`, `Client Sample`, `Client Produksi`, `Client RO`, `Lost`. Itu yang harus dihapus seluruhnya (5 item sekaligus). Bussdev group (lines ~107–110) **tetap ada** dengan `Sales Pipeline`.

**Step 2.2: Remove duplicate group**

Hapus seluruh blok grup duplikat tersebut dari `MODULE_STRUCTURE`. Pastikan:
- Bussdev group masih ada dengan item `Command Center`, `Sales Pipeline` (`/bussdev/pipeline`), `Lead Intake Form` (`/bussdev/intake`).
- TIDAK ada item dengan `href` `/bussdev/guest-book`, `/bussdev/sample-tracking`, `/bussdev/sample-sales`, `/bussdev/clients`, `/bussdev/client-manager` di seluruh MODULE_STRUCTURE.
- Jika ada `Lost` di Bussdev group, **tetap boleh ada** (sesuai struktur saat ini) — atau boleh dihapus karena `Lost` jadi tab di pipeline. **Default: hapus** Lost dari sidebar karena akan jadi tab di pipeline sub-navbar.

**Step 2.3: Run sidebar test**

```bash
cd frontend && npx vitest run test/components/sidebar-roles.test.tsx
```

Expected: PASS. Semua 3 assertion hijau.

**Step 2.4: Manual smoke — sidebar render**

```bash
cd frontend && npm run build 2>&1 | tail -30
```

Expected: build sukses tanpa TypeScript error terkait Sidebar.tsx.

**Step 2.5: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "refactor(sidebar): remove duplicate client-centric group, single Sales Pipeline entry"
```

---

## Task 3: Build PipelineTabs component (TDD)

**Files:**
- Create: `frontend/src/components/bussdev/pipeline-tabs.tsx`
- Create: `frontend/src/components/bussdev/pipeline-tabs.test.tsx`
- Reference: `frontend/src/app/(dashboard)/bussdev/client-manager/page.tsx` (pola data fetching), `frontend/src/hooks/use-pipeline-v2.ts` (pola hook)

**Step 3.1: Write component test (red)**

Di `frontend/src/components/bussdev/pipeline-tabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineTabs } from "./pipeline-tabs";

vi.mock("@/hooks/use-pipeline-v2", () => ({
  useLeadsByGroup: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}));

describe("PipelineTabs", () => {
  it("render 5 tab dengan label yang benar", () => {
    render(<PipelineTabs />);
    expect(screen.getByRole("tab", { name: /buku tamu/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^sample$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^ro$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /produksi/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /lost/i })).toBeInTheDocument();
  });

  it("tab default aktif adalah Buku Tamu", () => {
    render(<PipelineTabs />);
    expect(screen.getByRole("tab", { name: /buku tamu/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
```

Tambah `@testing-library/react` ke `devDependencies` jika belum ada (`grep -r "@testing-library/react" frontend/package.json`). Jika belum, install: `cd frontend && npm install -D @testing-library/react`.

**Step 3.2: Run test untuk verify fail**

```bash
cd frontend && npx vitest run src/components/bussdev/pipeline-tabs.test.tsx
```

Expected: FAIL — `PipelineTabs` module not found.

**Step 3.3: Implement PipelineTabs (minimum viable)**

Di `frontend/src/components/bussdev/pipeline-tabs.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useLeadsByGroup } from "@/hooks/use-pipeline-v2";

const TABS = [
  { key: "guest",      label: "Buku Tamu" },
  { key: "sample",     label: "Sample" },
  { key: "ro",         label: "RO" },
  { key: "production", label: "Produksi" },
  { key: "lost",       label: "Lost" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PipelineTabs() {
  const [active, setActive] = useState<TabKey>("guest");
  const { data, isLoading, error } = useLeadsByGroup(active);

  return (
    <div className="space-y-4">
      <nav role="tablist" className="flex gap-2 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 rounded-lg transition ${
              active === t.key
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel">
        {isLoading && <p className="text-slate-400">Memuat…</p>}
        {error && <p className="text-red-400">Gagal memuat data.</p>}
        {!isLoading && !error && data?.length === 0 && (
          <p className="text-slate-500">Belum ada lead di grup ini.</p>
        )}
        {!isLoading && !error && data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left py-2 px-3">Client</th>
                <th className="text-left py-2 px-3">Brand</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">PIC</th>
                <th className="text-right py-2 px-3">Est. Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((lead: any) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3">{lead.clientName}</td>
                  <td className="py-2 px-3">{lead.brandName ?? "—"}</td>
                  <td className="py-2 px-3">{lead.status}</td>
                  <td className="py-2 px-3">{lead.lastActionBy ?? "—"}</td>
                  <td className="py-2 px-3 text-right">
                    Rp {Number(lead.estimatedValue ?? 0).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

**Adaptasi penting:** Baca `frontend/src/hooks/use-pipeline-v2.ts` lebih dulu. Hook mungkin punya signature berbeda (mis. `usePipelineLeads(group)` atau return `{ leads, isLoading, error }`). Sesuaikan nama hook, parameter, dan field shape dengan signature yang ada di file itu. Jika hook belum export `useLeadsByGroup`, **buat wrapper minimal** di file yang sama dengan panggilan `fetch(/v1/bussdev/pipeline/leads/${group})`. **Jangan** ubah hook asli.

**Step 3.4: Run test untuk verify pass**

```bash
cd frontend && npx vitest run src/components/bussdev/pipeline-tabs.test.tsx
```

Expected: PASS. Kedua test hijau.

**Step 3.5: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error terkait `pipeline-tabs.tsx`. Field `any` untuk `lead` boleh untuk MVP (TODO untuk hardening ada di task akhir).

**Step 3.6: Commit**

```bash
git add frontend/src/components/bussdev/pipeline-tabs.tsx frontend/src/components/bussdev/pipeline-tabs.test.tsx
git commit -m "feat(bussdev): PipelineTabs component with 5 sub-navbar tabs"
```

---

## Task 4: Convert /bussdev/pipeline from redirect to real page

**Files:**
- Modify: `frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx`
- Reference: `frontend/src/components/bussdev/pipeline-tabs.tsx`

**Step 4.1: Replace redirect dengan real page**

Replace seluruh isi `frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx` dengan:

```tsx
import { PipelineTabs } from "@/components/bussdev/pipeline-tabs";

export const metadata = {
  title: "Sales Pipeline — Bussdev",
};

export default function PipelinePage() {
  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-white">Sales Pipeline</h1>
        <p className="text-sm text-slate-400">
          Semua klien dari intake sampai Won / Lost — dalam satu halaman.
        </p>
      </header>
      <PipelineTabs />
    </div>
  );
}
```

**Step 4.2: Verify build sukses**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build sukses, route `/bussdev/pipeline` terdaftar sebagai halaman (bukan redirect).

**Step 4.3: Manual smoke (optional, butuh env)**

```bash
cd frontend && npm run dev
# buka http://localhost:3000/bussdev/pipeline
# (login dulu kalau auth gate aktif)
```

Expected: halaman menampilkan 5 tab; tab "Buku Tamu" aktif; tabel render (atau empty state "Belum ada lead").

**Step 4.4: Commit**

```bash
git add frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx
git commit -m "feat(bussdev): replace pipeline redirect with real page using PipelineTabs"
```

---

## Task 5: Delete duplicate pipeline pages

**Files:**
- Delete: `frontend/src/app/(dashboard)/bussdev/pipeline-v2/` (folder + isinya)
- Delete: `frontend/src/app/(dashboard)/bussdev/clients/` (folder + isinya)
- Delete: `frontend/src/app/(dashboard)/bussdev/client-manager/` (folder + isinya)
- Delete: `frontend/src/app/(dashboard)/bussdev/sample-sales/` (folder + isinya)
- Delete: `frontend/src/app/(dashboard)/bussdev/sample-tracking/` (folder + isinya)

**Penting:** Sebelum hapus `client-manager/`, **pastikan** Task 3 & Task 4 sudah selesai dan `pipeline-tabs.tsx` sudah memuat semua logika render yang dibutuhkan. Pola render & data fetching dari `client-manager/page.tsx` harus sudah ter-akomodasi di `PipelineTabs`. Baca `client-manager/page.tsx` terakhir kali untuk memastikan tidak ada field/fitur unik yang hilang.

**Step 5.1: Hapus folder**

Gunakan satu `git rm` per folder (PowerShell di Windows):

```bash
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO"
git rm -r "frontend/src/app/(dashboard)/bussdev/pipeline-v2"
git rm -r "frontend/src/app/(dashboard)/bussdev/clients"
git rm -r "frontend/src/app/(dashboard)/bussdev/client-manager"
git rm -r "frontend/src/app/(dashboard)/bussdev/sample-sales"
git rm -r "frontend/src/app/(dashboard)/bussdev/sample-tracking"
```

**Step 5.2: Verify build masih sukses**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build sukses. Jika ada TypeScript error yang menyebut `client-manager` atau `pipeline-v2`, ada referensi yang luput — grep dulu:

```bash
cd frontend && grep -rn "client-manager\|pipeline-v2\|sample-tracking\|sample-sales\|/bussdev/clients" src/
```

Fix referensi yang ditemukan (mis. link internal di halaman lain) sebelum lanjut.

**Step 5.3: Verify sidebar test masih pass**

```bash
cd frontend && npx vitest run test/components/sidebar-roles.test.tsx
```

Expected: PASS.

**Step 5.4: Commit**

```bash
git commit -m "refactor(bussdev): remove 5 duplicate pipeline/client pages; consolidate into /bussdev/pipeline"
```

---

## Task 6: Add E2E test for tab navigation

**Files:**
- Create: `frontend/tests/e2e/sales-pipeline-tabs.spec.ts`
- Reference: `frontend/playwright.config.ts` (kalau ada) atau `frontend/tests/e2e/` setup yang sudah ada

**Step 6.1: Cek setup Playwright**

```bash
cd frontend && ls tests/e2e/ 2>/dev/null | head -10 && echo --- && grep -n "playwright\|test:" frontend/package.json
```

Catat path config (`playwright.config.ts` atau `playwright.config.js`) dan base URL default. Path E2E tests: `frontend/tests/e2e/` (bukan `frontend/test/e2e/`).

**Step 6.2: Tulis E2E test**

Di `frontend/tests/e2e/sales-pipeline-tabs.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Sales Pipeline Tabs", () => {
  test.beforeEach(async ({ page }) => {
    // Sesuaikan login flow dengan auth setup project.
    // Jika tanpa auth (dev mode), hapus atau comment blok ini.
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_USER ?? "zaki@dreamlab.id");
    await page.fill('input[name="password"]', process.env.E2E_PASS ?? "password");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/my-dashboard|\/executive/);
  });

  test("user bisa lihat & klik 5 tab di /bussdev/pipeline", async ({ page }) => {
    await page.goto("/bussdev/pipeline");
    await expect(page.getByRole("tab", { name: /buku tamu/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^sample$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^ro$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /produksi/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /lost/i })).toBeVisible();

    // Default tab aktif
    await expect(page.getByRole("tab", { name: /buku tamu/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Klik RO → assert selected
    await page.getByRole("tab", { name: /^ro$/i }).click();
    await expect(page.getByRole("tab", { name: /^ro$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("halaman duplikat sudah dihapus", async ({ page }) => {
    const targets = [
      "/bussdev/pipeline-v2",
      "/bussdev/clients",
      "/bussdev/client-manager",
      "/bussdev/sample-sales",
      "/bussdev/sample-tracking",
    ];
    for (const path of targets) {
      const res = await page.goto(path);
      expect(res?.status(), `route ${path} seharusnya 404`).toBe(404);
    }
  });
});
```

**Adaptasi penting:** Jika login flow berbeda (mis. OTP, cookie session), sesuaikan `beforeEach`. Sesuaikan selector dengan form login riil. Cek `frontend/tests/e2e/` untuk pola test existing yang bisa di-copy.

**Step 6.3: Run E2E test**

```bash
cd frontend && npx playwright test tests/e2e/sales-pipeline-tabs.spec.ts
```

Expected: PASS kedua test.

Jika backend tidak jalan (test E2E gagal karena API tidak merespons), start backend dulu di terminal lain: `cd backend && npm run start:dev`, lalu re-run.

**Step 6.4: Commit**

```bash
git add frontend/tests/e2e/sales-pipeline-tabs.spec.ts
git commit -m "test(e2e): sales pipeline tabs navigation + duplicate routes return 404"
```

---

## Task 7: Final verification & PR

**Files:** none modified — verifikasi saja.

**Step 7.1: Run semua test**

```bash
cd frontend && npx vitest run
cd frontend && npx playwright test
```

Expected: semua pass. (E2E mungkin skip kalau backend tidak jalan — verify minimal Vitest hijau.)

**Step 7.2: Type-check global**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error. Field `any` di `pipeline-tabs.tsx` boleh untuk MVP, tapi **tandai dengan comment `// ponytail: any lead shape, tighten when pipeline types stabilizes`** dan `// upgrade path: import type from @/types/pipeline` agar tidak lupa.

**Step 7.3: Verify acceptance criteria (dari spec section 8)**

Jalankan check berikut, semua harus iya:

- [ ] `/bussdev/pipeline` bisa dibuka, menampilkan 5 tab di sub-navbar. (Manual atau via E2E.)
- [ ] Tiap tab menampilkan data lead dari `SalesLead`. (Cek via dev server + DevTools Network tab.)
- [ ] Tidak ada halaman pipeline duplikat (5 route sudah 404). (Cek via E2E test.)
- [ ] Sidebar Bussdev hanya menampilkan 1 entry "Sales Pipeline". (Cek via Vitest + manual.)
- [ ] `frontend/test/components/sidebar-roles.test.tsx` pass.
- [ ] E2E test pass.
- [ ] Tidak ada perubahan backend (`git diff main..HEAD -- backend/` kosong).
- [ ] Tidak ada migrasi data (`git diff main..HEAD -- backend/prisma/schema/` hanya perubahan dari main, bukan dari branch ini).

**Step 7.4: Push branch & buka PR**

```bash
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO"
git push -u origin feat/sales-pipeline-consolidation
gh pr create --base main --head feat/sales-pipeline-consolidation \
  --title "feat(bussdev): consolidate 5 client pages into /bussdev/pipeline with sub-navbar tabs" \
  --body "Sesuai spec docs/superpowers/specs/2026-09-03-sales-pipeline-consolidation-design.md. Tidak ada perubahan backend / schema / data."
```

---

## Self-Review Checklist

**1. Spec coverage:**

| Spec section | Covered by task |
|---|---|
| §4.1 Arsitektur (yang berubah/tetap) | Tasks 2, 4, 5 |
| §4.2 Sub-navbar tab | Tasks 3, 4 |
| §4.2 Sidebar BUSSDEV struktur baru | Task 2 |
| §4.3 Data flow | Task 3 (komponen), Task 4 (page) |
| §4.4 Error handling (loading/empty/error state) | Task 3 (ada di komponen) |
| §4.5 Test (update sidebar test + tambah E2E) | Tasks 1, 2 (sidebar), Task 6 (E2E) |
| §5 Files Touched (Modified/Added/Deleted) | Tasks 2, 3, 4, 5 |
| §6 Rollout (1 PR, no flag) | Task 7 |
| §8 Acceptance Criteria | Task 7 |

**2. Placeholder scan:** Tidak ada "TBD", "TODO", "implement later", atau "fill in details". Setiap step punya output konkret atau command yang runnable. Catatan "Sesuaikan dengan…" di Step 3.3 dan 6.2 bukan placeholder — itu instruksi eksplisit untuk baca file spesifik sebelum coding.

**3. Type consistency:** Hook `useLeadsByGroup` dipakai konsisten di Task 3 (component test, component impl) dan tidak direferensikan di task lain. Field `lead.id`, `lead.clientName`, `lead.brandName`, `lead.status`, `lead.lastActionBy`, `lead.estimatedValue` dipakai konsisten di Task 3.

**4. Skipped (sengaja, dengan justifikasi):**
- **301 redirect untuk old routes:** Spec §6 nyatakan opsional & batch terpisah. Tidak masuk plan ini.
- **Lost entry di sidebar:** Saya putuskan hapus (Task 2 Step 2.2). Spec §4.2 izinkan keduanya. Default konservatif.
- **Field `any` di tabel:** Ponytail-mode acceptable untuk MVP. Ditandai `ponytail:` comment.