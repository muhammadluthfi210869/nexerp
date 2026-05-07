# 🧬 Nex Matrix: Visual DNA & Design System

This document defines the core visual identity and structural standards for the **Nex Matrix Dashboard System**. It is designed to ensure 100% parity across all divisions, providing a "perfectly tidy" interface that is easy to audit and scale.

---

## 1. 📐 Foundation: Typography & Numerics
The system uses **Inter** as the primary typeface. It relies on extreme weight contrast and letter-spacing to create a technical, high-authority aesthetic.

### Font Family
- **Primary**: `Inter, sans-serif`
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Numeric Standard (Critical)
All data-heavy elements **MUST** use tabular numbers to ensure vertical alignment in tables and lists.
```css
canvas, table, .tabular, .value, .val {
  font-variant-numeric: tabular-nums !important;
}
```

### Type Hierarchy
| Level | Size | Weight | Spacing | Case | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Title** | 32px | 900 | -0.05em | Default | Main page headings |
| **Section Label** | 10px | 800 | 0.3em | UPPER | Group headers (with left border) |
| **Micro Label** | 9px | 900 | 0.1em | UPPER | Inside cards, metadata |
| **Primary Value** | 32px | 900 | -0.02em | Default | KPI numbers |
| **Secondary Value**| 24px | 950 | -0.02em | Default | Sub-KPIs |
| **Table Header** | 10px | 800 | 0.05em | UPPER | Column labels |
| **Body Text** | 13.5px | 600 | Default | Default | Nav items, general text |

---

## 2. 🎨 Color Palette: The Matrix Tokens
Colors are divided into **Surfaces**, **Grays**, and **Semantic Statuses**.

### Core Surface Tokens
- `var(--app-bg)`: `#F3F4F6` (Main background)
- `var(--card-surface)`: `#FFFFFF` (Component background)
- `var(--dark-accent)`: `#111827` (Inverted cards / Primary buttons)

### Semantic Palette
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--status-action` | `#2563EB` | Active states, primary accents, links |
| `--status-success`| `#10B981` | Positive growth, "Verified" status |
| `--status-warning`| `#F59E0B` | Attention required, neutral alerts |
| `--status-critical`| `#DC2626` | Errors, negative growth, critical alerts |
| `--accent-purple` | `#8B5CF6` | Funnel metrics, specific analytics |

### Gray Scale (The Neutral Bone)
- `50`: `#F9FAFB` (Table headers)
- `100`: `#E5E7EB` (Borders, subtle dividers)
- `400`: `#9CA3AF` (Secondary labels)
- `500`: `#6B7280` (Primary body text)
- `900`: `#111827` (Headings, bold text)

---

## 3. 📦 Component Architecture

### A. The "Macro Card" Standard
The standard container for all dashboard sections.
- **Border Radius**: `24px` (Standard) or `32px` (Hero KPI)
- **Padding**: `2rem` (Standard) or `1.5rem` (Internal grids)
- **Border**: `1px solid var(--border-color)`
- **Shadow**: `0 4px 6px -1px rgba(0, 0, 0, 0.02)`
- **Hover**: `transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);`

### B. The "Nex Data Table"
Tables must feel like a precision instrument.
- **Headers**: 
  - `background: #F9FAFB`
  - `padding: 1.5rem`
  - `font-size: 10px; font-weight: 800`
- **Cells**:
  - `padding: 1.25rem 1.5rem`
  - `font-size: 11px; font-weight: 500`
  - `border-bottom: 1px solid var(--border-color)`

### C. Status Badges & Indicators
- **Shape**: `border-radius: 8px`
- **Text**: `font-size: 10px; font-weight: 900; text-transform: uppercase`
- **Success**: `bg: #ECFDF5; color: #059669`
- **Critical**: `bg: #FEF2F2; color: #DC2626`
- **Indicator Pulse**: Small dot (`7px`) with `box-shadow` and `animation: pulse 2s infinite`.

### D. Global Alert System
Used for mission-critical notifications at the top of the dashboard.
- **Background**: `#FFF1F2` (Critical) or `#FEF9C3` (Warning)
- **Border**: `1px solid #FECDD3` (Critical) or `#FEF08A` (Warning)
- **Padding**: `1.25rem`
- **Border Radius**: `20px`

### E. "Owner Insight" Callouts
Contextual advice or analysis usually placed at the bottom of a KPI card.
- **Success (Green)**: `bg: #F0FDF4; border: 1px solid #DCFCE7; color: #166534`
- **Action (Blue)**: `bg: #EFF6FF; border: 1px solid #DBEAFE; color: #1E40AF`
- **Warning (Yellow)**: `bg: #FEF9C3; border: 1px solid #FEF08A; color: #854D0E`
- **Radius**: `16px`
- **Content**: Bold label (e.g., `💡 OWNER INSIGHT:`) followed by medium weight text.

### F. Complex Audit Tables
For high-density data views (SCM/Finance).
- **Horizontal Scroll**: Parent container with `overflow-x: auto`.
- **Min-Width**: Often set to `1400px` to `1800px` to prevent squeezing.
- **Row Hover**: `background: #F8FAFC` (subtle light blue/gray).
- **Zebra Striping**: Use sparingly; preferred is `border-bottom: 1px solid #F1F5F9`.

### G. Custom Scrollbar DNA
To maintain the "tidy" look, default browser scrollbars are replaced with minimal tracks.
- **Width/Height**: `4px`
- **Track**: `transparent` or `var(--app-bg)`
- **Thumb**: `#D1D5DB` (Gray-200) with `border-radius: 20px`.
- **Hover**: `#9CA3AF` (Gray-400).

### H. System Status Pills
Found in the top header for versioning and sync status.
- **Stable (Blue)**: `bg: #F0F9FF; color: #0369A1; font-size: 10px; font-weight: 900; radius: 6px`
- **Live Sync (Red)**: `bg: #FDF2F8; color: #DC2626; font-size: 10px; font-weight: 900; radius: 6px`

---

## 4. 🗺️ Spacing & Layout DNA
Consistency in white space is what creates the "tidy" feel.

- **Main View Padding**: `3rem` (All sides)
- **Grid Gaps**:
  - **Macro Level**: `2rem` to `2.5rem` (Between large cards)
  - **Micro Level**: `1.25rem` (Inside KPI grids)
- **Sidebar Width**: `280px`
- **Header Height**: `72px`
- **Margin Bottom (Titles)**: `2rem`
- **Margin Bottom (Sections)**: `3rem`
- **Padding (Cards)**: Standard `2rem`, Micro `1.5rem`.

---

## 5. 📊 Data Visualization Standards

### Line Chart Gradients
All line charts **MUST** use a vertical linear gradient to create a "glow" effect.
- **Top Offset (0%)**: `stopColor: {MainColor}; stopOpacity: 0.2`
- **Bottom Offset (100%)**: `stopColor: {MainColor}; stopOpacity: 0`
- **Stroke Width**: `3px`
- **Points**: White circle with `{MainColor}` stroke.

### Standard Color Mapping
- **Revenue/Growth**: `#10B981` (Green)
- **Primary KPI**: `#2563EB` (Blue)
- **Analytics/Funnel**: `#8B5CF6` (Purple)
- **Critical/Alerts**: `#EF4444` (Red)
- **Stock/Timeline**: `#F59E0B` (Amber)

---

## 6. 🕹️ Interactions & Motion (Institutional-Grade)
The Nex ERP motion system is built for speed and spatial clarity. Motion must be non-blocking and feel like physics, not cartoons.

### Standardized Durations
- **FAST (150ms)**: Micro-interactions (Hover, Toggles, Checkboxes).
- **STANDARD (300ms)**: Page entrances, Modal openings, Section transitions.
- **SLOW (500ms)**: Complex data visualizations or large-scale layout changes.

### Easing DNA
Never use `linear`. Use the **Institutional Ease** (Cubic Bezier):
- `cubic-bezier(0.22, 1, 0.36, 1)` (Quick start, precision finish)

### Motion Patterns
- **The "Staggered Entrance"**: Child elements (like KPI cards or Table rows) must arrive in sequence with a `0.03s` stagger.
- **The "Tactile Hover"**: Cards should lift (`-2px`) and scale slightly (`1.01`) on hover using a physics-based spring or tight transition.
- **The "Spatial View Switch"**: Pages should use a subtle `Fade + Slide-Up (10px)` to provide directionality.
- **Exit Strategy**: Exit animations MUST be 30% faster than entry animations to ensure the interface never feels "heavy".

---

## 7. 📝 Audit Checklist (The "Perfect State" Test)
When creating new views, verify against these rules:
1. [ ] **Background**: Is the main body `#F3F4F6` or `#F8FAFC`?
2. [ ] **Typography**: Are all data numbers using `tabular-nums`?
3. [ ] **Labels**: Are labels uppercase with `0.1em` to `0.3em` letter spacing?
4. [ ] **Contrast**: Are the weights `900` or `950` used for primary numbers?
5. [ ] **Borders**: Are all card borders exactly `1px solid #E2E8F0` or `#E5E7EB`?
6. [ ] **Radius**: Are card corners set to `24px` or `32px`?
7. [ ] **Gaps**: Is the space between cards exactly `2rem` or `2.5rem`?
8. [ ] **Charts**: Do line charts have the correct 0.2-to-0 opacity gradient?
9. [ ] **Insights**: Do callout boxes use the `#F0FDF4` (success) or `#EFF6FF` (info) scheme?
10. [ ] **Scroll**: Is the scrollbar width set to `4px` with a gray thumb?

---
*Documented by Antigravity AI for the Porto Nex ERP Ecosystem.*
