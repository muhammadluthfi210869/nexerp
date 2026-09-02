# 🧬 NEX ERP Unified Design System (Visual DNA)
*One card, one table, one navbar, one form, one tab system for all divisions*

This document defines the core visual identity, design tokens, typography, and structural guidelines for **NEX ERP System**. All frontend modules **MUST** strictly comply with these canonical standards.

---

## 🏆 Architectural Hierarchy & Single Source of Truth

- **Foundations & Design Tokens Board**: 👉 **`/dna-visual`**
  - Contains **ONLY**:
    1. `01. Color Tokens` (Primary, Neutral, Semantic, Surface)
    2. `02. Typography Scale` (Page Title, Section Title, Body, Table Header, Caption, KPI Value)
    3. `03. Canonical Top Navbar` (Preview & Component Legend)

- **Canonical Operational UI Benchmark (Source of Truth)**: 👉 **`/dna-visual/golden-reference`**
  - Clean operational happy path view + supporting developer benchmark section below:
    - **Header**: Small back link (`← Kembali ke Visual DNA Specs`) + `32px/40px Bold` Page Title.
    - **05. KPI / Metric Card System**: 4 compact cards with 2–4% status tints, simplified 3-layer structure (`1 Label + 1 Value + 1 Supporting Line`), and micro-metrics.
    - **06. System Alerts**: Real-time system sync alert notification banner with dismiss action.
    - **07. Section Navigation Tabs, Toolbar & Data Table**: Bordered tab container with icons (`WORK ORDERS`, `MIXING`, `FILLING`, `PACKING`, `HISTORY`, `ANALYTICS`), search & stage filters, active filter reset button, visual progress meters (`[██████░░░░] 65%`), 42px row height data table, pagination, and row action menu (`...`).
    - **07. Operational Analytics View**: Clicking `ANALYTICS` tab renders a live Production Yield Line/Bar Trend Chart (Senin–Minggu target vs actual) & Machine OEE Efficiency Gauges (98.4% Availability, 94.1% Performance, 99.2% Quality).
    - **Supporting Developer Spec Section (Rendered Below Main Flow)**:
      - `Canonical Form Pattern` (Work Order Form Modal with live auto-calculation `Target x HPP = Nilai Estimasi`).
      - `Operational UI States Reference` (Interactive switcher for Empty State, Loading Skeleton, Error State, and Sticky Bulk Actions Bar).
      - `Live Spacing & Radius Scale Indicator` (4px rhythm & 12px main radius guide).

---

## 🎯 Global Core Layout & Density Standards

- **Target Desktop**: `1440px+`, `zoom 100%`
- **Base Spacing Rhythm**: `4px`
- **Page Horizontal Padding**: `20px – 24px` (`px-5` / `px-6`)
- **Page Vertical Spacing Rhythm ("Napas")**:
  - Header → KPI Cards: **`24px`** (`mt-6`)
  - KPI Cards → Section Tabs: **`20–24px`** (`mt-[22px]`)
  - Section Tabs → Toolbar Filter: **`16px`** (`mt-4`)
  - Toolbar Filter → Data Table: **`16–20px`** (`mt-[18px]`)
- **Section Gap**: `16px – 24px` (`gap-4` / `gap-5`)
- **Grid Gap**: `12px – 16px` (`gap-3` / `gap-3.5`)
- **Standard Card Padding**: `14px – 18px` (`p-3.5` / `p-4`)
- **Canonical Main Radius**: `10px – 12px` (`rounded-xl`) — *Frozen standard across all cards and controls*
- **Default Border Color**: `#E2E8F0` (`border-slate-200`)
- **Header Clean Policy**: Operational page headers are **un-boxed** (no heavy card container, no presentation badges, no marketing subtitles). Consists strictly of optional small back link + `32px/40px Bold` Page Title.
- **Single Primary Action Button Policy**: Pages carry **ONLY ONE** primary action button located on the right side of the **Toolbar filter bar** (e.g. `+ Tambah Work Order`).
- **KPI Card Structure (3 Layers Maximum)**:
  - `1 Label` (13px Slate 600) + `1 Value` (24px Bold Slate 900) + `1 Supporting Line` (11px micro-metric). No second competing headlines.
  - Card 1: `Total Omset` → `Rp 279 Jt` → `+14% vs mggu lalu`
  - Card 2: `Sample Approved` → `1` → `Yield 94% • Rilis APJ`
  - Card 3: `Pending Review` → `2` → `Dalam Antrean Review`
  - Card 4: `Aktif Mixing` → `2` → `Lini Tank 01 & 02 Running`
- **Desktop KPI Limit**: Maximum `4 cards / row` (Prevents orphan 4+1 layout)
- **Bordered Tab Nav Container**: Section tabs are wrapped in a single structural container:
  - Wrapper: `border border-slate-200` (`1px #E2E8F0`), `rounded-xl` (`10–12px`), height `44–48px` (`h-[46px]`), background `white`, inner padding `4px` (`p-1`).
  - Active Tab: Blue fill (`#2563EB`), text `12px`, weight `600`, radius `8px–10px`, icon + text.
  - Inactive Tab: Transparent background, text `Slate 600`, hover light fill.
  - Icons per tab: `WORK ORDERS` (`FileText`), `MIXING` (`FlaskConical`), `FILLING` (`Droplet`), `PACKING` (`Package`), `HISTORY` (`History`), `ANALYTICS` (`BarChart3`).

---

## 01. Color Tokens

### Primary
- **Primary 600**: `#2563EB` | **Primary Light**: `#EFF6FF`

### Neutral
- **Slate 900**: `#0F172A` | **Slate 700**: `#334155` | **Slate 500**: `#64748B` | **Slate 300**: `#CBD5E1` | **Slate 200**: `#E2E8F0` | **Slate 100**: `#F1F5F9` | **White**: `#FFFFFF`

### Semantic
- **Success 600**: `#16A34A` | **Success Light**: `#DCFCE7`
- **Warning 600**: `#D97706` | **Warning Light**: `#FEF3C7`
- **Danger 600**: `#DC2626` | **Danger Light**: `#FEF2F2`

---

## 02. Typography Scale

| Token Name | Font Size / Line Height | Font Weight | Description | Usage Example |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 32px / 40px | Bold (700) | Untuk judul halaman utama | *Work Orders & Production*, *Client Manager* |
| **Section Title** | 20px / 28px | Semibold (600) | Untuk judul section / modul | *Intake Klien*, *Pipeline Overview* |
| **Body / Regular** | 14px / 20px | Regular (400) | Teks utama untuk konten | Deskripsi, label umum |
| **Body / Medium** | 14px / 20px | Medium (500) | Teks penting / emphasized | Nilai data, highlight |
| **Table Header** | 12px / 16px | Semibold (600) | Digunakan di header tabel | Kolom data (*WO*, *PRODUK*, *KLIEN*) |
| **Helper / Caption** | 12px / 16px | Regular (400) | Teks bantu, catatan, hint | Helper text, sub-captions |
| **KPI Value** | 24px / 32px | Bold (700) | Nilai utama pada KPI card | *Rp 450 Jt*, *64%* |

---

## 12. Enforced Design Rules

1. ✔️ **Single shared component per primitive**: Build once in `@/components/dna` or `@/components/ui`.
2. ✔️ **No custom card per division**: All divisions use standard `10-12px` radius cards.
3. ✔️ **No decorative glow or heavy gradient**: Clean flat white surfaces with neutral borders.
4. ✔️ **Unified spacing scale (4px base)**: All margins, paddings, and gaps align to 4px multiples.
5. ✔️ **Light-mode first**: System is optimized for high-visibility light surface default.
6. ✔️ **Accessibility**: Minimum WCAG AA contrast ratio across all text and UI elements.
7. ✔️ **Consistent radius**: Main card radius frozen strictly at **10–12px**.
8. ✔️ **Consistent icon style**: Outline icons with uniform `2px` stroke width (Lucide React).
9. ✔️ **Data first, clarity over decoration**: Pure functional elegance, high data density.

---
*Maintained & Frozen by NEX ERP Engineering Team.*
