"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DnaButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type DnaButtonSize = "sm" | "md" | "lg";

interface DnaButtonProps {
  variant: DnaButtonVariant;
  size?: DnaButtonSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit";
  loading?: boolean;
}

const variantClasses: Record<DnaButtonVariant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600",
  secondary:
    "bg-slate-800 hover:bg-slate-900 text-white border border-slate-800",
  outline:
    "bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50",
  ghost:
    "bg-transparent border border-transparent text-slate-500 hover:bg-slate-100",
  danger:
    "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white",
};

const sizeClasses: Record<DnaButtonSize, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-10 px-4 text-[12px]",
  lg: "h-12 px-6 text-[13px]",
};

/**
 * Canonical-aligned DnaButton.
 * - 8px radius
 * - subtle border, no decorative shadow
 * - primary: blue-600, danger: rose, ghost: transparent
 * - matches canonical form button language
 */
export function DnaButton({
  variant,
  size = "md",
  icon,
  children,
  className,
  loading,
  type = "button",
  ...props
}: DnaButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof DnaButtonProps>) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        loading && "opacity-60 cursor-wait",
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
