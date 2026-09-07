"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DnaModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

export interface DnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  size?: DnaModalSize;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASSES: Record<DnaModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
  "3xl": "max-w-4xl",
  "4xl": "max-w-5xl",
  full: "max-w-[95vw] h-[90vh]",
};

/**
 * Centered Floating Window (Float Window di Tengah)
 * Visual DNA Standard for all input forms, detail inspections, and workflow dialogues.
 */
export function DnaModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  size = "xl",
  maxWidth,
  children,
  footer,
  className,
  contentClassName,
  closeOnBackdrop = true,
}: DnaModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          "bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150",
          maxWidth || SIZE_CLASSES[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-white dark:bg-[#101726] select-none">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {badge && (
                typeof badge === "string" ? (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded text-[10px] font-bold uppercase tracking-wider">
                    {badge}
                  </span>
                ) : (
                  badge
                )
              )}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-md border-none bg-transparent cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={cn("p-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-4", contentClassName)}>
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-3.5 bg-slate-50/70 dark:bg-[#0c1322] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
