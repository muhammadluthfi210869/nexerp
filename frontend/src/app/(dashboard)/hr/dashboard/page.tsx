"use client";

import React, { Suspense } from "react";
import HRDashboardClient from "../HRDashboardClient";

export default function HrDashboardPage() {
  return (
    <div className="bg-[#fafafa] min-h-screen">
      <Suspense fallback={<div className="p-10 text-center font-black uppercase text-slate-400">Synchronizing HR Intelligence...</div>}>
        <HRDashboardClient />
      </Suspense>
    </div>
  );
}

