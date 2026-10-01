"use client";

import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RecruitmentView } from "./_components/RecruitmentView";

export default function HrRecruitmentPage() {
  return (
    <DashboardShell
      title="HR & TALENT ACQUISITION"
      subtitle="Applicant Tracking System, CV Review & Recruitment Pipeline"
    >
      <Suspense
        fallback={
          <div className="p-10 text-center font-bold uppercase text-xs text-slate-400">
            Sinkronisasi Pipeline Rekrutmen...
          </div>
        }
      >
        <RecruitmentView />
      </Suspense>
    </DashboardShell>
  );
}
