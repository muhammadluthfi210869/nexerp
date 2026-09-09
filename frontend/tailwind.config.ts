import type { Config } from "tailwindcss";

/**
 * NEX ERP Tailwind Config
 *
 * Design tokens defined per `/VISUAL_DNA.md` (Operational DNA).
 *
 * SCOPE: This config applies to OPERATIONAL PAGES only.
 *        Dashboard pages use the Dashboard DNA (see `old_erp/ACUAN_DASHBOARD/`).
 *        See `plan/NEX_ERP_REFACTOR_ROADMAP.md` Section 0 for full scope definition.
 *
 * When changing values here, ensure you also update:
 * - `/VISUAL_DNA.md` (contract)
 * - `/frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx` (implementation)
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────
      // COLORS — Per VISUAL_DNA.md (operational pages only)
      // ─────────────────────────────────────────────────────────────
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        border: "hsl(var(--border))",
        base: "#F8FAFC",

        // Operational DNA tokens
        "card-surface": "#FFFFFF",
        "page-bg": "#F8FAFC",
        "border-subtle": "#E2E8F0", // slate-200 — operational borders
        "border-strong": "#CBD5E1", // slate-300

        // KPI tint backgrounds (per VISUAL_DNA.md Layer 02)
        "tint-blue": "#EFF6FF",     // blue-50
        "tint-emerald": "#ECFDF5",  // emerald-50
        "tint-amber": "#FFFBEB",    // amber-50
        "tint-rose": "#FFF1F2",     // rose-50
        "tint-slate": "#F8FAFC",    // slate-50

        // KPI icon badge backgrounds
        "badge-blue": "#DBEAFE",     // blue-100
        "badge-emerald": "#D1FAE5", // emerald-100
        "badge-amber": "#FEF3C7",   // amber-100
        "badge-rose": "#FFE4E6",    // rose-100
        "badge-slate": "#F1F5F9",   // slate-100
      },

      // ─────────────────────────────────────────────────────────────
      // FONT FAMILY — Per VISUAL_DNA.md
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        heading: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },

      // ─────────────────────────────────────────────────────────────
      // FONT WEIGHTS — Per VISUAL_DNA.md
      // ─────────────────────────────────────────────────────────────
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },

      // ─────────────────────────────────────────────────────────────
      // FONT SIZE TOKENS — Per VISUAL_DNA.md Layer 01-05
      // Use these instead of arbitrary values like text-[24px]
      // ─────────────────────────────────────────────────────────────
      fontSize: {
        // Page title (Layer 01)
        "page-title": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        // KPI cards (Layer 02)
        "kpi-value": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
        "kpi-label": ["13px", { lineHeight: "20px" }],
        "kpi-delta": ["11px", { lineHeight: "16px" }],
        "kpi-icon": ["12px", { lineHeight: "16px" }],
        // Tab nav (Layer 03)
        "tab-active": ["12px", { lineHeight: "16px" }],
        "tab-inactive": ["12px", { lineHeight: "16px" }],
        // Toolbar (Layer 04)
        "toolbar-input": ["12px", { lineHeight: "16px" }],
        "toolbar-button": ["12px", { lineHeight: "16px" }],
        // Table (Layer 05)
        "table-header": ["11px", { lineHeight: "16px", letterSpacing: "0.05em" }],
        "table-data": ["12px", { lineHeight: "18px" }],
        "table-row-num": ["11px", { lineHeight: "16px" }],
        // Badges
        "badge": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
        "badge-meta": ["11px", { lineHeight: "16px" }],
      },

      // ─────────────────────────────────────────────────────────────
      // BORDER RADIUS — Per VISUAL_DNA.md
      // Operational: rounded-card (12px) for cards/inputs
      // Macro dashboard cards (Dashboard DNA): rounded-[24px] — see old_erp
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        // Token aliases (use these for clarity)
        card: "12px",       // operational cards, inputs, tabs container
        button: "12px",     // operational buttons (matches card)
        badge: "9999px",    // pill shape
        macro: "24px",      // dashboard hero cards (Dashboard DNA only)
      },

      // ─────────────────────────────────────────────────────────────
      // SPACING TOKENS — Per VISUAL_DNA.md vertical rhythm
      // ─────────────────────────────────────────────────────────────
      spacing: {
        // Page vertical rhythm (gap between layers)
        "layer-header": "24px",      // mt-6 between header and KPI grid
        "layer-tab": "22px",         // mt-[22px] between KPI and tabs
        "layer-toolbar": "18px",     // mt-[18px] between tabs and toolbar
        "layer-table": "18px",       // mt-[18px] between toolbar and table

        // Component heights (per VISUAL_DNA.md)
        "kpi-card": "104px",         // KPI card height
        "tab-container": "46px",     // Tab nav container height
        "tab-button": "38px",        // Individual tab button height
        "toolbar-input": "36px",     // Toolbar h-9 = 36px
        "table-header": "40px",      // Thead height
        "table-row": "42px",         // Table row height
      },

      // ─────────────────────────────────────────────────────────────
      // BOX SHADOW — Per VISUAL_DNA.md (shadow-2xs)
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        "2xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.03)", // operational card shadow
      },

      // ─────────────────────────────────────────────────────────────
      // OPACITY — Per VISUAL_DNA.md (tints use /20, /30, /70, /80)
      // ─────────────────────────────────────────────────────────────
      opacity: {
        "tint-20": "0.2",
        "tint-30": "0.3",
        "tint-70": "0.7",
        "tint-80": "0.8",
      },
    },
  },

  plugins: [],
};

export default config;
