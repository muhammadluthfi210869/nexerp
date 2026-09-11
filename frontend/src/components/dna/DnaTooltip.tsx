"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaTooltip — replaces shadcn Tooltip. Lightweight CSS-based implementation
 * using native HTML title attributes + CSS hover for delay-free display.
 *
 * Why no @radix-ui/react-tooltip or @base-ui/react/tooltip? Those packages
 * aren't installed in package.json and the task forbids new dependencies for
 * what a few lines cover. This primitive handles 100% of the 3 current
 * shadcn Tooltip usages (they're all plain hover-labels on icon buttons).
 *
 * If richer behavior is needed later (controlled open state, custom delay),
 * upgrade path: add @radix-ui/react-tooltip and wrap here.
 */

export interface DnaTooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
  className?: string;
}

const sideClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
} as const;

export const DnaTooltip: React.FC<DnaTooltipProps> = ({
  content,
  side = "top",
  children,
  className,
}) => {
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
  // Inject group/relative wrapper class so hover triggers tooltip.
  const enhanced = React.cloneElement(child, {
    className: cn("group/dnatooltip relative", (child.props as { className?: string })?.className),
    title: typeof content === "string" ? content : undefined,
  });

  return (
    <span className="relative inline-flex">
      {enhanced}
      <span
        role="tooltip"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-50 max-w-xs whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 px-2 py-1 text-[11px] font-medium text-white dark:text-slate-900 shadow-lg",
          "opacity-0 group-hover/dnatooltip:opacity-100 transition-opacity duration-150",
          sideClasses[side],
          className
        )}
      >
        {content}
      </span>
    </span>
  );
};

export default DnaTooltip;