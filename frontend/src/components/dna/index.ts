export { DataCard } from "./DataCard";
export { MetricRow } from "./MetricRow";
export { SectionLabel } from "./SectionLabel";
export { PageSection } from "./PageSection";
export { TableWrapper } from "./TableWrapper";
export { StatCard } from "./StatCard";
export { KpiCard } from "./KpiCard";
export { DashboardCard } from "./DashboardCard";
export { DashboardMetric, DashboardMetricGrid } from "./DashboardMetric";
export { PipelineNode, PipelineRow } from "./PipelineNode";
export { DnaInput } from "./DnaInput";
export { DnaButton } from "./DnaButton";
export { DnaBadge } from "./DnaBadge";
export { TabButton, TabButtonGroup } from "./TabButton";
export { FilterBar } from "./FilterBar";

// ── NEW MODULAR DNA COMPONENTS ──

// Layout & Header
export { DnaPageHeader } from "./layout/DnaPageHeader";
export type { DnaPageHeaderProps, DnaPageTabItem } from "./layout/DnaPageHeader";
export { DnaKpiGrid, DnaKpiCard } from "./layout/DnaKpiGrid";
export type { DnaKpiGridProps, DnaKpiCardItem } from "./layout/DnaKpiGrid";

// Table & Toolbar
export { DnaDataTableCard } from "./table/DnaDataTableCard";
export type { DnaDataTableCardProps } from "./table/DnaDataTableCard";
export { DnaTableToolbar } from "./table/DnaTableToolbar";
export type { DnaTableToolbarProps, DnaDateMode, DnaFilterColumnConfig } from "./table/DnaTableToolbar";
export { DnaPagination } from "./table/DnaPagination";
export type { DnaPaginationProps } from "./table/DnaPagination";

// Standardized Cell DNA
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

// Utilities & Formatting
export { formatRupiah } from "@/lib/utils";

// Compatibility exports
export {
  DnaPageContainer,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaModal,
  DnaDrawer,
  DnaTabNav,
  DnaTabItem,
  DnaToolbar,
  DnaEmptyState,
  DnaSelect,
  DnaTextarea,
  DnaCheckbox,
  DnaAuditTimeline,
} from "./DnaLegacyCompat";

export type {
  DnaKpiItem,
  DnaColumnDef,
  DnaColumn,
  DateFilterValue,
} from "./DnaLegacyCompat";

export { DnaTable, DnaTableHead, DnaLoadingSkeleton, DNA_TABLE_CLASSES } from "./DnaTable";
export { DnaColumnFilter } from "./DnaColumnFilter";
export type { ColumnOption, DnaColumnFilterProps } from "./DnaColumnFilter";

export { DnaDataTableCard as DnaDataTable } from "./table/DnaDataTableCard";
