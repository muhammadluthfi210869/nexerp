import React from "react"
import { cn } from "@/lib/utils"

type BadgeStatus = "success" | "info" | "warning" | "critical" | "purple" | "default"

interface DnaBadgeProps {
  status?: BadgeStatus
  variant?: BadgeStatus | string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const statusClasses: Record<string, string> = {
  success: "bg-[#ECFDF5] text-[#059669] border-[#DCFCE7]",
  info: "bg-blue-50 text-blue-600 border-blue-100",
  warning: "bg-amber-50 text-amber-600 border-amber-100",
  critical: "bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  default: "bg-slate-50 text-slate-600 border-slate-100",
}

export function DnaBadge({ status, variant, children, className, onClick }: DnaBadgeProps) {
  const key = (status || variant || "default") as string;
  const badgeStyle = statusClasses[key] || statusClasses.default;
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-black uppercase rounded-lg px-3 py-1 border shadow-sm",
        badgeStyle,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
    >
      {children}
    </span>
  )
}
