"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DnaButton } from "./DnaButton";

export interface DnaDetailDrawerTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface DnaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  badgeVariant?: string;
  width?: string;
  children?: React.ReactNode;
  tabs?: DnaDetailDrawerTab[];
  footerActions?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * DnaDetailDrawer — Ergonomic Right Slide-Over Panel
 *
 * Provides a context-preserving detail view for operational records.
 * Tables remain visible on the left behind a soft backdrop.
 * Features a fixed header with badge, optional sub-tabs, scrollable body, and sticky bottom action bar.
 */
export function DnaDetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  badgeVariant,
  width = "max-w-xl", // default ~576px
  children,
  tabs,
  footerActions,
  footer,
  actions,
}: DnaDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const finalFooter = footerActions || footer || actions;
  const [activeTabId, setActiveTabId] = useState<string>("");

  useEffect(() => {
    if (tabs && tabs.length > 0) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTab = tabs?.find((t) => t.id === (activeTabId || tabs[0]?.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          ref={drawerRef}
          className={cn(
            "pointer-events-auto w-screen bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300",
            width
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Optional Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 shrink-0">
              {tabs.map((tab) => {
                const active = (activeTabId || tabs[0].id) === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={cn(
                      "py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors",
                      active
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-slate-700">
            {tabs && tabs.length > 0 ? currentTab?.content : children}
          </div>

          {/* Sticky Bottom Action Footer */}
          <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <DnaButton variant="outline" size="sm" onClick={onClose}>
                Tutup
              </DnaButton>
            </div>
            {finalFooter && (
              <div className="flex items-center gap-2">{finalFooter}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
