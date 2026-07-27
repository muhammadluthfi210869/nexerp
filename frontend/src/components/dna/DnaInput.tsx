import React from "react"
import { cn } from "@/lib/utils"

interface DnaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

export const DnaInput = React.forwardRef<HTMLInputElement, DnaInputProps>(
  function DnaInput({ className, icon, error, required, ...props }, ref) {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          data-dna="input"
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full h-11 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300",
            "focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5",
            "transition-all",
            error ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-200",
            icon ? "pl-11 pr-4" : "px-4",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[9px] font-bold text-rose-600 mt-1 ml-1">{error}</p>
        )}
        {required && !error && (
          <span className="absolute right-3 top-1.5 text-rose-500 text-sm font-black">*</span>
        )}
      </div>
    )
  }
)
