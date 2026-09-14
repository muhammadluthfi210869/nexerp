"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaSwitch — replaces shadcn Switch. Pure HTML button + state implementation
 * (no @radix-ui/react-switch dep — not installed). Keyboard accessible
 * (Space/Enter toggles), ARIA switch role, optional label+description slot.
 */

export interface DnaSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const DnaSwitch = React.forwardRef<HTMLButtonElement, DnaSwitchProps>(
  (
    {
      checked = false,
      onCheckedChange,
      onChange,
      label,
      description,
      disabled = false,
      className,
      id,
    },
    ref
  ) => {
    const handleToggle = () => {
      if (disabled) return;
      const next = !checked;
      onCheckedChange?.(next);
      onChange?.(next);
    };

    const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleToggle();
      }
    };

    const toggle = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKey}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
          className
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );

    if (!label) return toggle;

    return (
      <label
        className={cn(
          "flex items-start gap-3 cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className="mt-0.5">{toggle}</span>
        <span className="flex-1">
          <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 block">
            {label}
          </span>
          {description && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              {description}
            </span>
          )}
        </span>
      </label>
    );
  }
);
export { DnaSwitch as Switch };
export default DnaSwitch;