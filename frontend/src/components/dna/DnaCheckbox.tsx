import React from "react"
import { cn } from "@/lib/utils"

export interface DnaCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode
}

export const DnaCheckbox = React.forwardRef<HTMLInputElement, DnaCheckboxProps>(
  function DnaCheckbox({ className, label, id, ...props }, ref) {
    const inputId = id || (typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : undefined)

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-800 dark:text-slate-200",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 dark:bg-[#0c1322] cursor-pointer transition-all"
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
    )
  }
)
