"use client";

import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PayrollView } from "./_components/PayrollView";

export default function HrPayrollPage() {
  return (
    <DashboardShell
      title="HR & PAYROLL COMMAND CENTER"
      subtitle="Monthly Compensation Engine, Overtime, Loans, PPh 21 & Official Salary Slips"
    >
      <Suspense
        fallback={
          <div className="p-10 text-center font-bold uppercase text-xs text-slate-400">
            Sinkronisasi Workbench Payroll...
          </div>
        }
      >
        <PayrollView />
      </Suspense>
    </DashboardShell>
  );
}
