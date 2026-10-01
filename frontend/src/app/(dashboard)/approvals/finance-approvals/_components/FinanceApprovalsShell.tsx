"use client";

import React, { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export interface FinanceApprovalsShellProps {
  children: ReactNode;
}

export function FinanceApprovalsShell({ children }: FinanceApprovalsShellProps) {
  return (
    <DashboardShell
      title="PERSETUJUAN"
      titleAccent="DANA"
      subtitle="Pengawasan Manajerial & Pelepasan Fiskal"
    >
      <div className="space-y-6 animate-fade-slide-in">
        {children}
      </div>
    </DashboardShell>
  );
}
