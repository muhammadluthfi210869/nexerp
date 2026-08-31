import React from "react";

interface ModuleHeaderProps {
  title: string;
  /** Optional legacy visual accent (kept for non-representative pages). */
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Canonical page header — title 30px/36px/700, subtitle 14px/20px/400-500.
 * Every representative page MUST render with the same typography (no
 * titleAccent decoration). Non-representative pages may still pass it.
 */
export function ModuleHeader({ title, titleAccent, subtitle, actions }: ModuleHeaderProps) {
  return (
    <header className="flex justify-between items-start gap-4 pb-4 mb-6">
      <div className="min-w-0">
        <h1
          className="text-slate-900 font-bold tracking-tight truncate"
          style={{ fontSize: "30px", lineHeight: "36px", fontWeight: 700 }}
        >
          {title}
          {titleAccent ? (
            <span className="text-blue-600"> {titleAccent}</span>
          ) : null}
        </h1>
        {subtitle ? (
          <p
            className="text-slate-500 mt-1 truncate"
            style={{ fontSize: "14px", lineHeight: "20px", fontWeight: 400 }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="hidden md:flex items-center gap-3 shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}