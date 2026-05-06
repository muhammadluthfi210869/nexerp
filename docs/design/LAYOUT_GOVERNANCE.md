# ERP Layout Governance: World-Class UI/UX Standards

This document establishes the structural parameters and criteria for the "ERP FROM ZERO" project. The goal is to ensure 100% consistency, eliminate scaling issues, and optimize for high-speed data input and auditability.

## 1. The Core Grid System (The 8px Rule)
To eliminate "zoomed in" or "too small" inconsistencies, every spatial dimension must follow a strict mathematical grid.

| Parameter | Value | Rationale |
| :--- | :--- | :--- |
| **Base Unit** | 8px | Industry standard for logical scaling across all displays. |
| **Gutter Width** | 24px (3x Base) | Provides enough breathing room for complex data. |
| **Main Margin** | 32px (4x Base) | Outer edge padding for the main content area. |
| **Component Radius**| 8px | Modern, professional "soft-square" aesthetic. |

## 2. Layout Viewport Strategy
ERP users often use 13" laptops or 27" ultra-wide monitors. The layout must adapt without losing density.

- **Max Content Width**: 1600px. Center the layout on wider screens to prevent "travel fatigue" (mouse moving too far).
- **Minimum Width**: 1280px. ERPs are productivity tools; we do not prioritize "mobile-first" for complex data entry, but "responsive-first."
- **Scale Factor**: Use `rem` for all sizing based on a 16px root. Avoid `vw` or `vh` for component sizing to prevent the "zoom" distortion.

## 3. Data Input & Form Architecture
Efficiency in an ERP is measured by "Time to Input."

### A. Field Consistency
- **Height Standard**: All inputs/buttons must be exactly 40px (Standard) or 32px (Compact).
- **Label Position**: Top-aligned labels for faster scanning (eye movement tracking shows top-aligned is 2x faster than left-aligned for data entry).
- **Grouping**: Use "Field Groups" (Cards) to categorize data. No more than 7 fields per group to avoid cognitive overload.

### B. Logical Flow (The "Z-Pattern")
- Users scan from Top-Left to Bottom-Right.
- Primary Action (Save/Submit) always in the Bottom-Right or Top-Right (sticky).
- Secondary Action (Cancel/Back) always to the left of the Primary.

## 4. Table & Data Auditability Criteria
Tables are the heart of an ERP. To make them "auditable":

1. **Row Height Consistency**: 48px (Standard) or 40px (Compact).
2. **Column Alignment**:
    - Text: Left-aligned.
    - Numbers/Currency: Right-aligned (for easier decimal comparison).
    - Status/Badges: Center-aligned.
3. **Sticky Elements**: Headers must be sticky. The "ID" or "Primary Name" column should be sticky-left for horizontal scrolling.
4. **Visual Cues**: Zebra striping (very subtle) or hover-states to prevent "line-jumping" during audits.

## 5. Audit Checklist for "World-Class" Status
Every page must pass this audit before being considered "Done":

- [ ] **Grid Alignment**: Does every element snap to the 8px grid?
- [ ] **Focus Management**: Can a user navigate the entire form using only the `Tab` key?
- [ ] **Empty States**: Are there clear "No data found" states for every table?
- [ ] **Loading States**: Are skeletons used to prevent layout shifts (CLS)?
- [ ] **Hierarchy**: Is the H1 clearly distinguishable from section headers?
- [ ] **Feedback**: Does every action (Save/Delete) provide a non-intrusive toast notification?

## 6. Layout Components to Standardize
We will build/refine these core layout wrappers:
1. `PageHeader`: Title, Breadcrumbs, and Global Actions.
2. `ContentWrapper`: Handles the 1600px max-width and padding.
3. `FormSection`: A card-based container for grouped inputs.
4. `DataTable`: A wrapper for standardized TanStack Table implementation.
