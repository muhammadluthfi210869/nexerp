"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionCard, SectionCardContent } from "@/components/canonical";

interface DataCardProps {
  dotColor?: string;
  title?: string;
  titleColor?: string;
  children: React.ReactNode;
  className?: string;
  noShadow?: boolean;
}

/**
 * Canonical-aligned DataCard. Wraps canonical SectionCard.
 * Provides optional legacy `dotColor`, `title`, `titleColor` headers.
 */
export function DataCard({
  dotColor,
  title,
  titleColor,
  children,
  className,
  noShadow: _noShadow,
}: DataCardProps) {
  const dotClass = dotColor
    ? dotColor.startsWith("bg-")
      ? dotColor
      : `bg-${dotColor}`
    : null;

  return (
    <SectionCard className={className}>
      {(dotClass || title) && (
        <div className="px-5 pt-4 flex items-center gap-2">
          {dotClass && (
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dotClass)} />
          )}
          {title && (
            <h3
              className={cn(
                "text-[11px] font-semibold tracking-wide uppercase",
                titleColor || "text-slate-500",
              )}
            >
              {title}
            </h3>
          )}
        </div>
      )}
      <SectionCardContent>{children}</SectionCardContent>
    </SectionCard>
  );
}
