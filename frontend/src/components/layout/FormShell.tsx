"use client";

import * as React from "react";
import { PageShell } from "@/components/canonical";

interface FormShellProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Canonical-aligned FormShell. Wraps canonical PageShell.
 * Optional sticky right sidebar for action panels.
 */
export function FormShell({
  title,
  titleAccent,
  subtitle,
  actions,
  sidebar,
  fullWidth = false,
  children,
}: FormShellProps) {
  const resolvedTitle = [title, titleAccent].filter(Boolean).join(" ");

  return (
    <PageShell title={resolvedTitle} subtitle={subtitle} actions={actions}>
      {sidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">{children}</div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 flex flex-col gap-4">
              {sidebar}
            </div>
          </div>
        </div>
      ) : (
        <div className={fullWidth ? "w-full flex flex-col gap-6" : "max-w-4xl flex flex-col gap-6"}>
          {children}
        </div>
      )}
    </PageShell>
  );
}
