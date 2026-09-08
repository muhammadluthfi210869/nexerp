"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaPageContainer — Root page wrapper for operational pages.
 *
 * @example
 * <DnaPageContainer>
 *   <DnaPageHeader title="Faktur Pembelian" />
 *   <DnaKpiGrid>...</DnaKpiGrid>
 *   <DnaToolbar>...</DnaToolbar>
 *   <DnaTable>...</DnaTable>
 * </DnaPageContainer>
 *
 * @see DNA_CHEATSHEET.md for usage patterns
 * @see /dna-visual/golden-reference/page.tsx for live reference
 */
export interface DnaPageContainerProps {
  children: React.ReactNode;
  alert?: React.ReactNode;
  className?: string;
}

/**
 * Canonical Page Container for NEX ERP Operational Views.
 * Fully transparent to inherit dark/light theme background seamlessly.
 */
export function DnaPageContainer({ children, alert, className }: DnaPageContainerProps) {
  return (
    <div className={cn("space-y-6 pb-20 text-slate-900 dark:text-slate-100 bg-transparent min-h-screen", className)}>
      {alert}
      {children}
    </div>
  );
}
