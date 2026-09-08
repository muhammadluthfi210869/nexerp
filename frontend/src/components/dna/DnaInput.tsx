import React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaInput — Standard text input with label, icon, suffix, and error state.
 *
 * @example
 * <DnaInput label="Nama Vendor" placeholder="Masukkan nama..." required />
 * <DnaInput icon={<Search />} placeholder="Cari..." />
 * <DnaInput error="Nama wajib diisi" />
 *
 * @see DNA_CHEATSHEET.md for usage patterns
 * @see /dna-visual/golden-reference/page.tsx for live reference
 */
export interface DnaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  helperText?: string;
  sizeVariant?: "sm" | "md" | "lg";
}

export const DnaInput = React.forwardRef<HTMLInputElement, DnaInputProps>(
  function DnaInput(
    {
      className,
      label,
      icon,
      suffix,
      error,
      helperText,
      required,
      sizeVariant = "md",
      disabled,
      ...props
    },
    ref
  ) {
    const sizeClasses = {
      sm: "h-9 text-[12px]",
      md: "h-11 text-sm font-medium",
      lg: "h-12 text-sm font-medium",
    };

    return (
      <div className="w-full relative">
        {label && (
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none [&>svg]:w-3.5 [&>svg]:h-3.5">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full bg-slate-50 dark:bg-[#0c1322] border rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:bg-white dark:focus:bg-[#101726] focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5",
              "disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed transition-all",
              sizeClasses[sizeVariant],
              error
                ? "border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/5"
                : "border-slate-200 dark:border-slate-800",
              icon ? "pl-11" : "px-4",
              suffix ? "pr-11" : "pr-4",
              className
            )}
            {...props}
          />

          {required && !error && !label && (
            <span className="absolute right-3 top-1.5 text-rose-500 text-sm font-black pointer-events-none select-none">
              *
            </span>
          )}

          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {suffix}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-1 ml-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ml-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

export default DnaInput;
