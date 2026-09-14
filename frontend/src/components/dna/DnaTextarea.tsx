import React from "react"
import { cn } from "@/lib/utils"

export interface DnaTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  showCount?: boolean
}

export const DnaTextarea = React.forwardRef<HTMLTextAreaElement, DnaTextareaProps>(
  function DnaTextarea({ className, error, label, showCount, required, value, maxLength, ...props }, ref) {
    const valLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="relative space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            required={required}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full bg-slate-50 dark:bg-[#0c1322] border rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "focus:border-blue-500 focus:bg-white dark:focus:bg-[#111c35] focus:outline-none focus:ring-4 focus:ring-blue-500/5",
              "transition-all resize-none",
              error ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-200 dark:border-slate-800",
              className
            )}
            {...props}
          />
          {required && !error && !label && (
            <span className="absolute right-3 top-2 text-rose-500 text-sm font-black">*</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px]">
          {error ? (
            <p className="font-bold text-rose-600 ml-1">{error}</p>
          ) : <span />}
          {showCount && maxLength && (
            <span className="text-slate-400 font-mono">
              {valLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)
