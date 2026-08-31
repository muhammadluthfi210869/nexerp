"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionCard, SectionCardContent } from "@/components/canonical";

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
  filters?: React.ReactNode;
}

/**
 * Canonical-aligned TableWrapper. Wraps canonical SectionCard.
 * Provides optional legacy `filters` slot above the table content.
 */
export function TableWrapper({ children, className, filters }: TableWrapperProps) {
  return (
    <SectionCard className={cn("overflow-hidden", className)}>
      {filters && (
        <div className="border-b border-[#E2E8F0] bg-white">{filters}</div>
      )}
      <SectionCardContent className="p-0">{children}</SectionCardContent>
    </SectionCard>
  );
}
