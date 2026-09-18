import React from "react";

export interface ModuleHeaderProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Standardized module header for ALL ERP pages.
 * Replaces per-page custom headers to ensure visual consistency.
 */
export function ModuleHeader({ title, titleAccent, subtitle, actions }: ModuleHeaderProps) {
  return (
    <header className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
      <div>
        <h1 className="text-dashboard-title uppercase">
          {title}{' '}
          {titleAccent && <span className="text-status-action">{titleAccent}</span>}
        </h1>
        {subtitle && (
          <p className="font-bold text-slate-400 text-xs tracking-tight mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="hidden md:flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}

