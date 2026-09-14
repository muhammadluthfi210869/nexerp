import React from "react"
import { cn } from "@/lib/utils"

export interface DnaSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  icon?: React.ReactNode
  error?: string
  label?: string
  placeholder?: string
  options?: Array<{ label: string; value: string | number } | string>
  onChange?: (value: string) => void
}

export const DnaSelect = React.forwardRef<HTMLSelectElement, DnaSelectProps>(
  function DnaSelect({ className, icon, error, label, placeholder, required, children, options, onChange, ...props }, ref) {
    return (
      <div className="relative space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5 pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          className={cn(
            "w-full h-11 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900",
            "focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5",
            "transition-all appearance-none pr-10",
            error ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-200",
            icon ? "pl-11 pr-10" : "px-4",
            className
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {children}
          {options?.map((opt) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const lbl = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={String(val)} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
        {error && (
          <p className="text-[9px] font-bold text-rose-600 mt-1 ml-1">{error}</p>
        )}
        {required && !error && (
          <span className="absolute right-8 top-1.5 text-rose-500 text-sm font-black">*</span>
        )}
      </div>
    </div>
  )
  }
)
