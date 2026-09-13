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
export { DnaMacroPillarCard } from "./DnaMacroPillarCard";
export type { DnaMacroPillarCardProps, DnaSubMetric } from "./DnaMacroPillarCard";

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

// Canonical Root DNA Components
export { DnaPageContainer } from "./DnaPageContainer";
export { DnaModal } from "./DnaModal";
export { DnaDrawer } from "./DnaDrawer";
export { DnaTabNav } from "./DnaTabNav";
export type { DnaTabNavProps } from "./DnaTabNav";
export { DnaToolbar } from "./DnaToolbar";
export type { DnaToolbarProps } from "./DnaToolbar";
export { DnaSelect } from "./DnaSelect";
export type { DnaSelectProps } from "./DnaSelect";
export { DnaTextarea } from "./DnaTextarea";
export type { DnaTextareaProps } from "./DnaTextarea";
export { DnaCheckbox } from "./DnaCheckbox";
export {
  DnaDialog,
  DnaDialogContent,
  DnaDialogHeader,
  DnaDialogTitle,
  DnaDialogDescription,
  DnaDialogFooter,
  DnaDialogClose,
  DnaDialogTrigger,
} from "./DnaDialog";
export {
  DnaSheet,
  DnaSheetContent,
  DnaSheetHeader,
  DnaSheetTitle,
  DnaSheetDescription,
  DnaSheetFooter,
  DnaSheetClose,
  DnaSheetTrigger,
} from "./DnaSheet";

// Table primitives (canonical)
export {
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaLoadingSkeleton,
  DNA_TABLE_CLASSES,
} from "./DnaTable";
export type {
  DnaThProps,
  DnaTableRowProps,
  DnaTdProps,
  DnaTdNumberProps,
  DnaTdCodeProps,
} from "./DnaTable";

// Specialized Selects
export { CoaSelect } from "./CoaSelect";
export { CustomerSelect } from "./CustomerSelect";
export { SupplierSelect } from "./SupplierSelect";
export { GoodsSelect } from "./GoodsSelect";
export { CategorySelect } from "./CategorySelect";

// Compatibility exports
export {
  DnaTabItem,
} from "./DnaLegacyCompat";

export { DnaAuditTimeline } from "./DnaAuditTimeline";
export { DnaGateIndicator, DnaGateLabel } from "./DnaGateIndicator";
export type { DnaGateIndicatorProps, DnaGate, DnaGateStatus } from "./DnaGateIndicator";

export type {
  DnaKpiItem,
  DnaColumnDef,
  DnaColumn,
  DateFilterValue,
} from "./DnaLegacyCompat";

export { DnaColumnFilter } from "./DnaColumnFilter";
export type { ColumnOption, DnaColumnFilterProps } from "./DnaColumnFilter";
export { DnaDataTableCard as DnaDataTable } from "./table/DnaDataTableCard";

// ── OPERATIONAL KPI & SHELL ──
export { DnaStatCard } from "./DnaStatCard";
export type { DnaStatCardProps, DnaStatCardVariant } from "./DnaStatCard";
export { MasterPageShell } from "./MasterPageShell";
export type { MasterPageShellProps, MasterStatItem, MasterTab } from "./MasterPageShell";
export { ApprovalPageShell } from "./approval/ApprovalPageShell";
export type { ApprovalColumn, ApprovalPageShellProps } from "./approval/ApprovalPageShell";
export { ApprovalDetailModal } from "./approval/ApprovalDetailModal";
export type { ApprovalDetailData } from "./approval/ApprovalDetailModal";
export { DnaBulkActionBar } from "./DnaBulkActionBar";

// ── RADIX / SHADCN PRIMITIVES RE-EXPORTS PER ADR-007 ──
export * from "./DnaFieldCompat";

// ── INTERACTIVE DNA ELEMENTS ──
export {
  DnaCurrencyInput,
  DnaNumberInput,
  DnaPercentageInput,
  DnaDatePicker,
  DnaSearchableSelect,
  DnaFormSection,
  DnaCrudModal,
  DnaConfirmDialog,
  DnaVoidDialog,
  DnaResultModal,
  DnaPrintModal,
  DnaPrintItem,
  DnaPrintSignature,
  DnaExportButton,
  DnaLineItemsTable,
  DnaWorkflowBar,
  DnaCascadingAddress,
  DnaInfoCard,
  DnaRadioGroup,
  DnaStickyFooter,
  DnaToastProvider,
} from "./DnaInteractiveElements";

export type {
  DnaCurrencyInputProps,
  DnaNumberInputProps,
  DnaDatePickerProps,
  DnaSelectOption,
  DnaSearchableSelectProps,
  DnaConfirmVariant,
  DnaPrintSignature as DnaPrintSignatureType,
  DnaPrintItem as DnaPrintItemType,
  DnaLineItem,
  DnaWorkflowStage,
  DnaWorkflowBarProps,
  DnaStickyFooterProps,
} from "./DnaInteractiveElements";

// ── NEW DNA PRIMITIVES (Phase 3.4, replaces shadcn) ──
export { DnaCard } from "./DnaCard";
export type { DnaCardProps, DnaCardVariant, DnaCardPadding } from "./DnaCard";
export { DnaEmptyState } from "./DnaEmptyState";
export type { DnaEmptyStateProps } from "./DnaEmptyState";
export { DnaSwitch } from "./DnaSwitch";
export type { DnaSwitchProps } from "./DnaSwitch";
export { dnaToastApi, DnaToaster, useDnaToast } from "./DnaToast";
export type { DnaToastOptions, DnaToastVariant } from "./DnaToast";
export {
  DnaAlert,
  DnaAvatar,
  DnaAvatarStack,
  DnaPriorityBadge,
  DnaStatusBadge,
  DnaDaysLeftChip,
  DnaAttachmentList,
  DnaKanban,
  DnaDateRangePicker,
} from "./DnaExtras";
export type { DnaAlertVariant, DnaAttachmentItem, KanbanItem } from "./DnaExtras";
