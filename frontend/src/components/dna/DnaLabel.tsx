"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaLabel — replaces shadcn Label. Pure <label> with DNA typography tokens
 * and an optional required indicator. Native htmlFor binding works unchanged.
 */

export interface DnaLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const DnaLabel = React.forwardRef<HTMLLabelElement, DnaLabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[12px] font-semibold text-slate-700 leading-none tracking-tight",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-rose-500 ml-0.5">*</span>
      )}
    </label>
  )
);
DnaLabel.displayName = "DnaLabel";

export default DnaLabel;