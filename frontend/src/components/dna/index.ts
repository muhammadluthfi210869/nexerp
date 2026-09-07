/**
 * DNA Components — Canonical Index
 *
 * Per /VISUAL_DNA.md (Operational DNA contract) + /dna-visual/golden-reference (implementation).
 *
 * Components are exported from their CANONICAL source files (root for primitives,
 * layout/ for layout components, table/ for table components, cells/ for cell renderers).
 *
 * DnaLegacyCompat is DEPRECATED — only UNIQUE exports remain (DnaTh, DnaTableBody,
 * DnaTableRow, DnaTd, DnaTdNumber, DnaTdCode, DnaTabItem). Migrate your imports to
 * canonical versions where possible.
 *
 * @see /plan/NEX_ERP_REFACTOR_ROADMAP.md Phase 0 + Sprint 0.5
 */

// ── PRIMITIVE COMPONENTS (root) ──
export { DataCard } from "./DataCard";
export { MetricRow } from "./MetricRow";
export { SectionLabel } from "./SectionLabel";
export { PageSection } from "./PageSection";
export { TableWrapper } from "./TableWrapper";
export { StatCard } from "./StatCard";        // Dashboard DNA (Aureon Matrix) — dashboards only
export { KpiCard } from "./KpiCard";           // Operational DNA — operational pages (legacy)
export { DashboardCard } from "./DashboardCard"; // Macro dashboard card
export { DnaStatCard } from "./DnaStatCard";   // Operational DNA — KPI with subtle semantic tint (PREFERRED)
export { DnaInfoCard } from "./DnaInfoCard";   // Operational DNA — info block for detail pages
export { MasterPageShell } from "./MasterPageShell";  // Reusable shell for consolidated master pages (Batch 6.3)
export type { DnaStatCardProps, DnaStatCardVariant } from "./DnaStatCard";
export type { DnaInfoCardProps } from "./DnaInfoCard";
export type {
  MasterPageShellProps,
  MasterStatItem,
  MasterTab,
} from "./MasterPageShell";
export { PipelineNode, PipelineRow } from "./PipelineNode";

// ── BADGE / TABLE ACTIONS ──
export { DnaBadge } from "./DnaBadge";
export { DnaTableRowActions } from "./DnaTableRowActions";

// ── INPUTS (root) ──
export { DnaInput } from "./DnaInput";
export { DnaButton } from "./DnaButton";
export { DnaSelect } from "./DnaSelect";
export { DnaTextarea } from "./DnaTextarea";
export { DnaCheckbox } from "./DnaCheckbox";

// ── FEEDBACK (root) ──
export { DnaModal } from "./DnaModal";
export { DnaDrawer } from "./DnaDrawer";
export { DnaEmptyState, DnaLoadingSkeleton, DnaErrorState } from "./DnaFeedbackStates";
export { DnaSlaBadge } from "./DnaSlaBadge";
export { DnaProgress } from "./DnaProgress";
export { DnaBulkActionBar } from "./DnaBulkActionBar";
export { DnaAuditTimeline } from "./DnaAuditTimeline";
export { DnaInternalThread } from "./DnaInternalThread";

// ── TAB / NAV (root) ──
export { DnaTabNav } from "./DnaTabNav";
export { DnaToolbar } from "./DnaToolbar";
export { DnaDateFilter } from "./DnaDateFilter";
export { DnaColumnFilter } from "./DnaColumnFilter";
export type { ColumnOption, DnaColumnFilterProps } from "./DnaColumnFilter";

// ── LAYOUT (canonical — replaces duplicate root DnaPageContainer / DnaKpiGrid) ──
export { DnaPageHeader } from "./layout/DnaPageHeader";
export type { DnaPageHeaderProps, DnaPageTabItem } from "./layout/DnaPageHeader";
export { DnaKpiGrid, DnaKpiCard } from "./layout/DnaKpiGrid";
export type { DnaKpiGridProps, DnaKpiCardItem } from "./layout/DnaKpiGrid";
export { DnaPageContainer } from "./DnaPageContainer";

// ── TABLE (canonical — replaces duplicate root DnaTable / DnaPagination / DnaDataTable) ──
export { DnaTableToolbar } from "./table/DnaTableToolbar";
export type { DnaTableToolbarProps, DnaDateMode, DnaFilterColumnConfig } from "./table/DnaTableToolbar";
export { DnaPagination } from "./table/DnaPagination";
export type { DnaPaginationProps } from "./table/DnaPagination";
export { DnaDataTableCard } from "./table/DnaDataTableCard";
export type { DnaDataTableCardProps } from "./table/DnaDataTableCard";

// ── CELL RENDERERS (canonical — DnaCell namespace, used by golden reference) ──
export { DnaCell, formatStatusTitleCase, getStatusBadgeStyle } from "./cells/DnaCell";
export type {
  DnaCellCodeProps,
  DnaCellTextProps,
  DnaCellBadgeProps,
  DnaCellProgressProps,
  DnaCellAvatarProps,
  DnaCellNumberProps,
  DnaCellCurrencyProps,
  DnaCellDateProps,
  DnaCellActionsProps,
} from "./cells/DnaCell";

// ── DnaTable PRIMITIVES (canonical — root version) ──
export { DnaTable, DnaTableHead, DNA_TABLE_CLASSES } from "./DnaTable";

// ── SPECIALIZED SEARCH-SELECTS (master data) ──
export { CoaSelect } from "./CoaSelect";
export { CustomerSelect } from "./CustomerSelect";
export { SupplierSelect } from "./SupplierSelect";
export { GoodsSelect } from "./GoodsSelect";
export { CategorySelect } from "./CategorySelect";

// ── UTILITIES ──
export { formatRupiah } from "@/lib/utils";

// ── DEPRECATED — DnaLegacyCompat ──
// Only UNIQUE exports remain (no canonical version exists).
// Migrate imports to canonical versions above.
export {
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaTabItem,
} from "./DnaLegacyCompat";

// ── HISTORY ──
// Previously in DnaLegacyCompat (now using canonical):
//   DnaModal, DnaDrawer, DnaTabNav, DnaToolbar, DnaSelect, DnaTextarea,
//   DnaCheckbox, DnaAuditTimeline, DnaPageContainer, DnaEmptyState
// → Now exported from canonical root files (above). Pages importing these
// from "@/components/dna" now get the canonical version automatically.
//
// DELETED (dead code):
//   - DnaKpiGrid.tsx (root) → use layout/DnaKpiGrid.tsx
//   - DnaPageHeader.tsx (root) → use layout/DnaPageHeader.tsx
//   - DnaPagination.tsx (root) → use table/DnaPagination.tsx
//   - DnaDataTable.tsx (930-line monster, not used by golden reference)
//   - DashboardMetric.tsx (dead code)
