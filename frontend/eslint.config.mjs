import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Visual DNA scope: dashboards & DigMar are excluded from refactor
    "src/app/(dashboard)/dashboard/**",
    "src/app/(dashboard)/marketing/**",
    // Reference pages (not operational)
    "src/app/(dashboard)/dna-visual/**",
    "src/app/(dashboard)/dna-preview/**",
    // Legacy reference (do not lint)
    "old_erp/**",
  ]),
  {
    files: [
      // Operational pages only (where DNA applies)
      "src/app/(dashboard)/**/page.tsx",
      "src/app/(dashboard)/**/layout.tsx",
      "src/components/dna/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "react-compiler/react-compiler": "off",

      // ─────────────────────────────────────────────────────────────
      // DNA-ONLY IMPORT ENFORCEMENT — Per ADR-007 + VISUAL_DNA.md
      // Blocks raw @/components/ui/* imports in operational pages.
      // Components in /components/dna/*, /dna-visual/*, and /components/ui/* itself are exempt.
      // ─────────────────────────────────────────────────────────────
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/components/ui/*"],
            message: "Use DNA components from @/components/dna/* instead. See ADR-007 + DNA_CHEATSHEET.md.",
          },
        ],
      }],

      // ─────────────────────────────────────────────────────────────
      // VISUAL DNA ENFORCEMENT — Per /VISUAL_DNA.md (operational pages)
      // See plan/NEX_ERP_REFACTOR_ROADMAP.md Phase 0 for rationale
      // ─────────────────────────────────────────────────────────────

      // Block hardcoded text-[Npx] — must use font-size tokens
      // Allowed: text-[11px], text-[12px], text-[13px] (table-header, table-data, kpi-label)
      // Blocked: text-[14px], text-[15px], text-[16px]+ (use tokens)
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='className'][value.value=/\\btext-\\[1[4-9]px\\]|text-\\[2[0-9]px\\]|text-\\[3[0-9]px\\]/]",
          message:
            "Use font-size tokens from tailwind.config.ts (e.g., text-kpi-value, text-table-data) instead of arbitrary text-[Npx]. See /VISUAL_DNA.md.",
        },
        // Block rounded-lg (use rounded-xl or rounded-card token)
        {
          selector: "JSXAttribute[name.name='className'][value.value=/\\brounded-lg\\b/]",
          message:
            "Operational DNA uses rounded-xl (or rounded-card token). rounded-lg is legacy. See /VISUAL_DNA.md.",
        },
        // Block hardcoded badge color patterns — must use DnaBadge or DnaCell.Badge
        {
          selector: "JSXAttribute[name.name='className'][value.value=/\\bbg-emerald-(50|100)\\b.*\\btext-emerald-(600|700)\\b|\\bbg-blue-(50|100)\\b.*\\btext-blue-(600|700)\\b|\\bbg-amber-(50|100)\\b.*\\btext-amber-(600|700)\\b|\\bbg-rose-(50|100)\\b.*\\btext-rose-(600|700)\\b/]",
          message:
            "Use <DnaCell.Badge> from @/components/dna instead of hardcoded badge color classes. See /VISUAL_DNA.md Layer 05.",
        },
        // Block solid bg-blue-600 in table rows — must use DnaTableRowActions (ghost)
        {
          selector: "JSXAttribute[name.name='className'][value.value=/\\bbg-blue-600\\b(?!.*\\bhover:bg-blue-700\\b)/]",
          message:
            "Solid bg-blue-600 buttons allowed only in Toolbar primary CTA. Table rows must use <DnaTableRowActions> (ghost icon). See /VISUAL_DNA.md Larangan #3.",
        },
        // Block non-slate-200 border colors
        {
          selector: "JSXAttribute[name.name='className'][value.value=/\\bborder-(gray|zinc|neutral|stone|red|orange|yellow|green|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-(100|200|300)\\b/]",
          message:
            "Operational borders must use border-slate-200 (or border-border-subtle token). See /VISUAL_DNA.md Layer 05.",
        },
      ],
    },
  },
]);

export default eslintConfig;
