/**
 * DNA Design Token System
 * Visual DNA compliance layer for NEX ERP frontend
 * Reference: VISUAL_DNA.md
 */

// ============================================================
// 01. COLOR TOKENS
// ============================================================

export const DNA_COLORS = {
  // Primary
  primary: {
    DEFAULT: "#2563EB",
    600: "#2563EB",
    light: "#EFF6FF",
    lightBg: "#EFF6FF",
  },
  // Neutral / Slate
  slate: {
    900: "#0F172A",
    800: "#1E293B",
    700: "#334155",
    600: "#475569",
    500: "#64748B",
    400: "#94A3B8",
    300: "#CBD5E1",
    200: "#E2E8F0",
    100: "#F1F5F9",
    50: "#F8FAFC",
    DEFAULT: "#64748B",
  },
  // Semantic
  success: {
    600: "#16A34A",
    DEFAULT: "#16A34A",
    light: "#DCFCE7",
    lightBg: "#DCFCE7",
  },
  warning: {
    600: "#D97706",
    DEFAULT: "#D97706",
    light: "#FEF3C7",
    lightBg: "#FEF3C7",
  },
  danger: {
    600: "#DC2626",
    DEFAULT: "#DC2626",
    light: "#FEF2F2",
    lightBg: "#FEF2F2",
  },
  // Surface
  surface: {
    white: "#FFFFFF",
    DEFAULT: "#FFFFFF",
  },
  // Border
  border: {
    DEFAULT: "#E2E8F0",
    color: "#E2E8F0",
  },
} as const

export type DnaColorKey = keyof typeof DNA_COLORS
export type DnaSlateShade = keyof typeof DNA_COLORS.slate

// ============================================================
// SPACING TOKENS (4px base rhythm)
// ============================================================

export const DNA_SPACING = {
  // Base 4px units
  unit: 4,
  // Tailwind-equivalent tokens
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  3.5: "14px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  11: "44px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  // Named semantic tokens
  "page-x": "20px",
  "page-y": "24px",
  "section-gap": "20px",
  "card-padding": "14px",
  "card-padding-lg": "18px",
  "grid-gap": "12px",
  "toolbar-gap": "8px",
  "row-height": "42px",
  "tab-height": "46px",
  "thead-height": "40px",
} as const

export type DnaSpacingKey = keyof typeof DNA_SPACING


// ============================================================
// RADIUS TOKENS
// ============================================================

export const DNA_RADIUS = {
  canonical: "10px",
  canonicalMin: "8px",
  canonicalMax: "12px",
  // Tailwind equivalents
  none: "0px",
  sm: "4px",
  DEFAULT: "6px",
  md: "6px",
  lg: "8px",
  xl: "10px",
  "2xl": "12px",
  "3xl": "16px",
  full: "9999px",
  // Badge radius
  badge: "6px",
  badgeInner: "4px",
} as const

export type DnaRadiusKey = keyof typeof DNA_RADIUS


// ============================================================
// TYPOGRAPHY TOKENS (Section 02)
// ============================================================

export const DNA_TYPOGRAPHY = {
  pageTitle: {
    fontSize: "32px",
    lineHeight: "40px",
    fontWeight: "700",
    description: "Untuk judul halaman utama",
  },
  sectionTitle: {
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: "600",
    description: "Untuk judul section / modul",
  },
  body: {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: "400",
    description: "Teks utama untuk konten",
  },
  bodyMedium: {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: "500",
    description: "Teks penting / emphasized",
  },
  tableHeader: {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: "600",
    description: "Digunakan di header tabel",
  },
  helper: {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: "400",
    description: "Teks bantu, catatan, hint",
  },
  kpiValue: {
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: "700",
    description: "Nilai utama pada KPI card",
  },
  kpiLabel: {
    fontSize: "13px",
    lineHeight: "16px",
    fontWeight: "500",
    description: "Label pada KPI card",
  },
  kpiSupporting: {
    fontSize: "11px",
    lineHeight: "14px",
    fontWeight: "400",
    description: "Supporting line pada KPI card",
  },
} as const

export type DnaTypographyKey = keyof typeof DNA_TYPOGRAPHY

// Table column typography specs (from Section 03)
export const DNA_TABLE_COLUMNS = {
  rowNumber: {
    classes: "text-[11px] font-medium text-slate-400 select-none",
    align: "center",
    width: "w-8",
  },
  documentCode: {
    classes: "text-[12px] font-bold font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
    align: "left",
  },
  crossRef: {
    classes: "text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400",
    align: "left",
  },
  primaryName: {
    classes: "text-[12px] font-bold text-slate-900 dark:text-slate-100",
    align: "left",
  },
  relation: {
    classes: "text-[12px] font-medium text-slate-700 dark:text-slate-300",
    align: "left",
  },
  status: {
    classes: "text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md border",
    align: "center",
  },
  progress: {
    barWidth: "80px",
    fontClasses: "text-[11px] font-bold tabular-nums",
  },
  pic: {
    avatarClasses: "w-5 h-5 bg-blue-100 text-blue-700 font-bold text-[10px]",
    nameClasses: "text-xs font-semibold text-slate-800",
    gap: "gap-1.5",
  },
  quantity: {
    classes: "text-[12px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums",
    align: "right",
  },
  financial: {
    classes: "text-[12px] font-bold text-slate-900 dark:text-slate-100 tabular-nums",
    align: "right",
    prefix: "Rp ",
  },
  date: {
    classes: "text-[11px] font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap",
    align: "left",
  },
  note: {
    classes: "text-xs text-slate-500 dark:text-slate-400 max-w-[150px] truncate block",
    align: "left",
  },
  actions: {
    classes: "p-1.5 rounded-lg text-slate-500",
    align: "center",
  },
} as const

// ============================================================
// ACTION BUTTON PATTERNS (Section 04)
// ============================================================

export const DNA_ACTION_BUTTONS = {
  view: {
    classes: "p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50",
    label: "Lihat Detail",
  },
  print: {
    classes: "p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
    label: "Cetak Dokumen",
  },
  edit: {
    classes: "p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50",
    label: "Edit Dokumen",
  },
  overflow: {
    classes: "p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
    label: "More Actions",
  },
} as const

// ============================================================
// DNA COMPLIANCE VALIDATOR
// ============================================================

export interface DnaValidationResult {
  isCompliant: boolean
  warnings: string[]
}

/**
 * Validates a CSS class string against the DNA token system.
 * Returns warnings for non-compliant values.
 */
export function validateDnaCompliance(classString: string): DnaValidationResult {
  const warnings: string[] = []

  // Check for hardcoded colors not in DNA palette
  const DNA_HEX_PALETTE = [
    "#2563EB","#EFF6FF","#0F172A","#1E293B","#334155","#475569","#64748B",
    "#94A3B8","#CBD5E1","#E2E8F0","#F1F5F9","#F8FAFC",
    "#16A34A","#DCFCE7","#D97706","#FEF3C7","#DC2626","#FEF2F2","#FFFFFF",
  ]
  const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g
  const foundHexColors = classString.match(hexColorRegex) || []
  for (const hex of foundHexColors) {
    const normalizedHex = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
    if (!DNA_HEX_PALETTE.includes(normalizedHex) && !DNA_HEX_PALETTE.includes(hex)) {
      warnings.push(`Non-DNA color detected: ${hex}. Use DNA color tokens from DNA_COLORS.`)
    }
  }

  // Check for non-standard border radius
  const radiusClasses = classString.split(/\s+/).filter(c => c.startsWith("rounded-"))
  for (const rc of radiusClasses) {
    const radiusValue = rc.replace("rounded-", "")
    if (radiusValue && !["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full", "DEFAULT"].includes(radiusValue)) {
      if (radiusValue.match(/^\[.*\]$/)) {
        warnings.push(`Arbitrary border-radius detected: ${rc}. Use DNA_RADIUS tokens.`)
      }
    }
  }

  // Check for non-DNA slate shades
  const slateCheck = classString.match(/text-slate-(\d+)|bg-slate-(\d+)|border-slate-(\d+)/g)
  if (slateCheck) {
    for (const match of slateCheck) {
      const shade = parseInt(match.match(/\d+/)?.[0] || "0", 10)
      const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      if (!validShades.includes(shade)) {
        warnings.push(`Non-DNA slate shade: ${match}. Use DNA_COLORS.slate values.`)
      }
    }
  }

  // Check for font sizes not in typography scale
  const fontSizeRegex = /text-(\d+)(?:\/\d+)?/g
  const foundFontSizes = classString.match(/text-(\d+)/g) || []
  for (const fs of foundFontSizes) {
    const size = parseInt(fs.replace("text-", ""), 10)
    const validSizes = [10, 11, 12, 13, 14, 20, 24, 32]
    if (!validSizes.includes(size)) {
      warnings.push(`Non-standard font size: ${fs}. Use DNA_TYPOGRAPHY tokens.`)
    }
  }

  return {
    isCompliant: warnings.length === 0,
    warnings,
  }
}

export default {
  DNA_COLORS,
  DNA_SPACING,
  DNA_RADIUS,
  DNA_TYPOGRAPHY,
  DNA_TABLE_COLUMNS,
  DNA_ACTION_BUTTONS,
  validateDnaCompliance,
}
