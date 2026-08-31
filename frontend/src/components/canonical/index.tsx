/**
 * NEX ERP Canonical UI System — Batch 1
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
 * - no decorative gradients, no shadow-2xl, no thick black borders, no glow
 */
export { StatCard as MetricCard } from "@/components/dna/StatCard";
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
export { Badge as StatusBadge } from "@/components/ui/badge";
import { badgeVariants } from "@/components/ui/badge";
export {
  Tabs as OperationalTabs,
  TabsList as OperationalTabsList,
  TabsTrigger as OperationalTabsTrigger,
  TabsContent as OperationalTabsContent,
} from "@/components/ui/tabs";
export { ErpDataTable as DataTable } from "@/components/dna/ErpDataTable";
export type { ErpDataTableProps as DataTableProps } from "@/components/dna/ErpDataTable";
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

/**
 * Map a domain status string to a canonical StatusBadge variant.
 */
export function mapStatus(status: string | null | undefined): StatusVariant {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (["APPROVED", "VERIFIED", "PASSED", "PAID", "SUCCESS", "COMPLETED", "RECEIVED", "FINISHED_GOODS", "DELIVERED", "DONE"].includes(s)) return "success";
  if (["PENDING", "PENDING_VALIDATION", "WAITING", "WAITING_APPROVAL", "WAITING_MATERIAL", "WAITING_PROCUREMENT", "SUBMITTED", "DRAFT"].includes(s)) return "warning";
  if (["REJECTED", "CANCELLED", "FAILED", "LATE", "QC_HOLD", "PENDING_QC", "CRITICAL", "REWORK", "UNPAID"].includes(s)) return "destructive";
  if (["ORDERED", "SHIPPED", "MIXING", "FILLING", "PACKING", "INFO"].includes(s)) return "info";
  return "default";
}

/**
 * Anti-orphan MetricGrid: enforces the grid rule by row shape.
 * 1->1, 2->2, 3->3, 4->4, 5->3+2, 6->3+3, 7->4+3, 8->4+4.
 */
const ANTI_ORPHAN_ROWS: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [3],
  4: [4],
  5: [3, 2],
  6: [3, 3],
  7: [4, 3],
  8: [4, 4],
};

export interface CanonicalMetricGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CanonicalMetricGrid({ children, className }: CanonicalMetricGridProps) {
  const arr = React.Children.toArray(children);
  const total = Math.min(arr.length, 8);
  const rows = ANTI_ORPHAN_ROWS[total] ?? [total];
  const slices: React.ReactNode[][] = [];
  let cursor = 0;
  for (const cols of rows) {
    slices.push(arr.slice(cursor, cursor + cols));
    cursor += cols;
  }
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {slices.map((row, ri) => {
        const cols = rows[ri];
        return (
          <div
            key={ri}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.map((child, ci) => (
              <div key={ci} className="min-w-0">
                {child}
              </div>
            ))}
          </div>
        );
      })}
      {arr.length > 8 && (
        <div className="grid grid-cols-4 gap-3">
          {arr.slice(8).map((child, ci) => (
            <div key={`o-${ci}`} className="min-w-0">
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}