/**
 * DNA Linter Reference - Enforced Design Rules from VISUAL_DNA.md Section 12
 * 
 * This file documents the 10 enforced design rules for manual code review.
 * Import this file to reference the rules during development.
 * 
 * Usage in code review:
 *   import { DNA_LINTER_RULES } from "@/lib/dna-linter"
 *   console.log(DNA_LINTER_RULES.map(r => r.description))
 */

export const DNA_LINTER_RULES = [
  {
    id: "DNA-001",
    severity: "ERROR",
    title: "Strict Atomic Columns",
    description: "Dilarang menggabungkan 2 informasi dalam 1 kolom (misal: Tanggal & Tempo, Pelanggan & Brand, Total & Sisa). Pecah menjadi kolom mandiri.",
    check: "Ensure each table column contains only one piece of information.",
  },
  {
    id: "DNA-002",
    severity: "ERROR",
    title: "Zero-History Single Source of Truth",
    description: "Hapus tab 'Riwayat' terpisah. Semua data operasional (aktif, selesai, batal) ada di tabel yang sama, disaring menggunakan DnaDateFilter (per Bulan & Tahun).",
    check: "No separate history tab; use monthly date filter instead.",
  },
  {
    id: "DNA-003",
    severity: "ERROR",
    title: "Card-Level Unified Toolbar",
    description: "Search, 2-Tier Dynamic Column Filter, Date Filter, Reset, dan Tombol Tambah wajib berada dalam 1 baris di header card tabel. Jarak Search ke baris tabel maksimal 8-12px.",
    check: "All toolbar elements in one row; max 8-12px gap to table.",
  },
  {
    id: "DNA-004",
    severity: "ERROR",
    title: "Sub-Navbar Kanan Atas",
    description: "Letakkan DnaTabNav (variant='header') di dalam prop tabs={...} milik DnaPageHeader (sejajar judul di kanan atas).",
    check: "DnaTabNav placed in DnaPageHeader tabs prop, aligned top-right.",
  },
  {
    id: "DNA-005",
    severity: "ERROR",
    title: "Single Shared Components",
    description: "Gunakan DnaTableRowActions, DnaBadge, DnaTable dari @/components/dna. No custom implementations.",
    check: "Use shared DNA components only; no custom per-division components.",
  },
  {
    id: "DNA-006",
    severity: "ERROR",
    title: "Standard Card Radius",
    description: "All divisions use standard 10-12px radius cards (rounded-xl). No custom border-radius.",
    check: "All cards use rounded-xl (10-12px); no rounded-2xl or rounded-3xl.",
  },
  {
    id: "DNA-007",
    severity: "ERROR",
    title: "No Decorative Elements",
    description: "Clean flat white surfaces with neutral borders (#E2E8F0). No decorative glow or heavy gradient.",
    check: "No decorative glow, shadows beyond standard, or gradients.",
  },
  {
    id: "DNA-008",
    severity: "ERROR",
    title: "Unified 4px Spacing",
    description: "All margins, paddings, and gaps align to 4px multiples.",
    check: "All spacing values must be multiples of 4px.",
  },
  {
    id: "DNA-009",
    severity: "WARNING",
    title: "Consistent Typography with tabular-nums",
    description: "Angka dan nilai menggunakan font Inter standar dengan tabular-nums agar titik desimal vertikal lurus rapi.",
    check: "All numeric values use tabular-nums for vertical decimal alignment.",
  },
  {
    id: "DNA-010",
    severity: "ERROR",
    title: "Single Primary Action Button",
    description: "Pages carry ONLY ONE primary action button located on the right side of the toolbar filter bar.",
    check: "Only one primary action button per page, in toolbar top-right.",
  },
] as const

export const DNA_LINTER_SUMMARY = {
  totalRules: DNA_LINTER_RULES.length,
  errorCount: DNA_LINTER_RULES.filter(r => r.severity === "ERROR").length,
  warningCount: DNA_LINTER_RULES.filter(r => r.severity === "WARNING").length,
  lastUpdated: "2026-09-07",
  reference: "VISUAL_DNA.md Section 12",
}

/**
 * Quick reference for ESLint comment block:
 *
 * DNA Compliance Check Required — Rules DNA-001 through DNA-010.
 * See DNA_LINTER_RULES array above for full descriptions.
 *
 * eslint-disable
 */

/* eslint-enable */

export default DNA_LINTER_RULES
