"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DnaCard — Raw Card API (replaces shadcn Card / CardHeader / CardTitle /
 * CardDescription / CardContent / CardFooter).
 *
 * Drop-in compatible: same compound API, same prop shapes, same forwardRef
 * semantics — but no Radix primitives, no shadcn dependency.
 */

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const baseCard =
  "rounded-2xl border bg-white text-slate-900 shadow-sm";

const variantClasses = {
  default: "border-slate-200 shadow-sm",
  bordered: "border-2 border-slate-300 shadow-none",
  elevated: "border-slate-200 shadow-xl shadow-slate-900/5",
} as const;

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
} as const;

export type DnaCardVariant = keyof typeof variantClasses;
export type DnaCardPadding = keyof typeof paddingClasses;

export interface DnaCardProps extends DivProps {
  variant?: DnaCardVariant;
  padding?: DnaCardPadding;
  /** Optional title rendered inside header (compat with old DnaCard API) */
  title?: string;
  /** Optional title color (compat) */
  titleColor?: string;
  /** Optional dot color indicator (compat) */
  dotColor?: string;
  /** Optional icon rendered before title (compat) */
  icon?: React.ReactNode;
}

export const DnaCard = React.forwardRef<HTMLDivElement, DnaCardProps>(
  ({ className, variant = "default", padding = "none", title, titleColor, dotColor, icon, children, ...props }, ref) => {
    const hasCompatHeader = title || icon || dotColor;
    return (
      <div
        ref={ref}
        className={cn(baseCard, variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      >
        {hasCompatHeader && (
          <div className="flex items-center gap-2 p-4 border-b border-slate-100">
            {dotColor && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />}
            {icon}
            {title && <h3 className="text-base font-bold" style={{ color: titleColor }}>{title}</h3>}
          </div>
        )}
        {children}
      </div>
    );
  }
);
DnaCard.displayName = "DnaCard";

export const DnaCardHeader = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-slate-100 text-left", className)}
      {...props}
    />
  )
);
DnaCardHeader.displayName = "DnaCardHeader";

export const DnaCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-[16px] font-bold tracking-tight leading-snug text-slate-900", className)}
      {...props}
    />
  )
);
DnaCardTitle.displayName = "DnaCardTitle";

export const DnaCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-[12px] text-slate-500 font-normal leading-relaxed", className)}
      {...props}
    />
  )
);
DnaCardDescription.displayName = "DnaCardDescription";

export const DnaCardContent = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5", className)} {...props} />
  )
);
DnaCardContent.displayName = "DnaCardContent";

export const DnaCardFooter = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-5 border-t border-slate-100", className)}
      {...props}
    />
  )
);
DnaCardFooter.displayName = "DnaCardFooter";

export default DnaCard;