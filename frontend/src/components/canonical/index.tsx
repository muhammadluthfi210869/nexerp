/**
 * NEX ERP Canonical UI System — Batch 1 (visual gate pass 2)
 *
 * SINGLE SOURCE OF TRUTH for visual primitives.
 * PAGES MUST IMPORT FROM THIS FILE — no independent KPI/Table/Tabs/Form/Badge markup.
 *
 * Conventions:
 * - 4px-based spacing
 * - 12px radius for cards/tables
 * - 8px radius for controls
 * - typography scale: page 28-32 / section 16-20 / body 14 / helper 12 / kpi-value 24-30
 * - semantic colors only: neutral/info/success/warning/danger
 * - subtle 1px neutral border (#E2E8F0)
 * - no decorative gradients, no shadow-2xl, no thick black borders, no glow, no decorative bg SVG
 */
export { MetricCard } from "./MetricCard";
export type { MetricCardProps, MetricCardVariant } from "./MetricCard";
export { DataTable } from "./DataTable";
export type { DataTableProps } from "./DataTable";
export { KPIGrid as MetricGrid } from "@/components/layout/KPIGrid";
export {
  Card as SectionCard,
  CardHeader as SectionCardHeader,
  CardTitle as SectionCardTitle,
  CardDescription as SectionCardDescription,
  CardContent as SectionCardContent,
  CardFooter as SectionCardFooter,
} from "@/components/ui/card";
export { ModuleHeader as PageHeader } from "@/components/layout/ModuleHeader";
export { DashboardShell as PageShell } from "@/components/layout/DashboardShell";
export { Badge as StatusBadge } from "@/components/ui/badge";
import { badgeVariants } from "@/components/ui/badge";
export {
  Tabs as OperationalTabs,
  TabsList as OperationalTabsList,
  TabsTrigger as OperationalTabsTrigger,
  TabsContent as OperationalTabsContent,
} from "@/components/ui/tabs";
export { FormShell as FormSection } from "@/components/layout/FormShell";
export { EmptyState } from "@/components/empty-state";
export { SegmentLoading as LoadingState } from "@/components/layout/SegmentLoading";
export { PageSection } from "@/components/dna/PageSection";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

/**
 * Canonical semantic mapping for StatusBadge variants.
 * Pages must use one of these values — no custom badges.
 */
export type StatusVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function mapStatus(status: string | null | undefined): StatusVariant {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (["APPROVED", "VERIFIED", "PASSED", "PAID", "SUCCESS", "COMPLETED", "RECEIVED", "FINISHED_GOODS", "DELIVERED", "DONE", "LUNAS", "AKTIF", "ACTIVE"].includes(s)) return "success";
  if (["PENDING", "PENDING_VALIDATION", "WAITING", "WAITING_APPROVAL", "WAITING_MATERIAL", "WAITING_PROCUREMENT", "SUBMITTED", "DRAFT", "BELUM_LUNAS", "MENUNGGU"].includes(s)) return "warning";
  if (["REJECTED", "CANCELLED", "FAILED", "LATE", "QC_HOLD", "PENDING_QC", "CRITICAL", "REWORK", "UNPAID", "DENIED", "BELUM_LUNAS"].includes(s)) return "destructive";
  if (["ORDERED", "SHIPPED", "MIXING", "FILLING", "PACKING", "INFO", "IN_PROGRESS", "DALAM_PROSES"].includes(s)) return "info";
  return "default";
}

/**
 * Canonical MetricGrid — single source of truth for KPI placement.
 *
 * Contract:
 *   - 3 cards → repeat(3, minmax(0, 1fr))
 *   - 4 cards → repeat(4, minmax(0, 1fr))
 *   - gap 16px
 *   - every MetricCard stretches to fill its grid cell (no justify-between,
 *     no max-content columns, no fixed narrow card width).
 */
function columnsFor(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return count;
  // 5+ cards: cap at 4 per row.
  return 4;
}

export interface CanonicalMetricGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CanonicalMetricGrid({ children, className }: CanonicalMetricGridProps) {
  const arr = React.Children.toArray(children);
  const cols = columnsFor(arr.length);
  return (
    <div
      className={cn("grid w-full", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "16px" }}
    >
      {arr.map((child, ci) => (
        <div key={ci} className="min-w-0">
          {child}
        </div>
      ))}
    </div>
  );
}
