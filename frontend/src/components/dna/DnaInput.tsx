"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DnaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

/**
 * Canonical-aligned DnaInput.
 * - 40px height
 * - subtle 1px border
 * - 8px radius
 * - icon leading padding
 * - error/helper states consistent with canonical form pattern
 */
export const DnaInput = React.forwardRef<HTMLInputElement, DnaInputProps>(
  function DnaInput({ className, icon, error, required, ...props }, ref) {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full h-10 bg-white border rounded-lg text-[12px] font-medium text-slate-700 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-all",
            error
              ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-[#E2E8F0] focus:border-blue-500/50",
            icon ? "pl-10 pr-3" : "px-3",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-[10px] text-rose-600 mt-1">{error}</p>
        )}
        {required && !error && (
          <span className="absolute right-2 top-2 text-rose-500 text-[10px] font-medium">*</span>
        )}
      </div>
    );
  },
);
