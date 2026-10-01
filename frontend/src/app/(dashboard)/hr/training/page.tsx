"use client";

import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TrainingView } from "./_components/TrainingView";

export default function HrTrainingPage() {
  return (
    <DashboardShell
      title="HR & COMPETENCY DEVELOPMENT"
      subtitle="Training Hours, 3-Day Onboarding Matrix & CPKB Certification"
    >
      <Suspense
        fallback={
          <div className="p-10 text-center font-bold uppercase text-xs text-slate-400">
            Sinkronisasi Data Pelatihan...
          </div>
        }
      >
        <TrainingView />
      </Suspense>
    </DashboardShell>
  );
}
