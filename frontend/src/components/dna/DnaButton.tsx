import React from "react"
import { cn } from "@/lib/utils"

interface DnaButtonProps {
  variant: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  type?: "button" | "submit"
  loading?: boolean
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm hover:shadow-md",
  secondary:
    "bg-slate-800 hover:bg-slate-900 text-white border-none shadow-sm hover:shadow-md",
  outline:
    "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md",
  ghost:
    "bg-slate-50 border border-transparent text-slate-500 hover:bg-blue-600 hover:text-white shadow-none",
  danger:
    "bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white shadow-sm hover:shadow-md",
}

const sizeClasses: Record<string, string> = {
  sm: "h-8 px-3 text-[9px]",
  md: "h-11 px-4 text-[10px]",
  lg: "h-14 px-8 text-[11px]",
}

export function DnaButton({
  variant,
  size = "md",
  icon,
  children,
  className,
  loading,
  ...props
}: DnaButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isGhost = variant === "ghost"

  return (
    <button
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-black uppercase rounded-xl tracking-wider transition-all",
        variantClasses[variant],
        isGhost ? "h-8 px-4 text-[10px]" : sizeClasses[size],
        loading && "opacity-60 cursor-wait",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:stroke-[3px] shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  )
}
