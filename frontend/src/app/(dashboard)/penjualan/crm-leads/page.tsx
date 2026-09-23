import React, { Suspense } from "react";
import CRMLeadsClient from "./CRMLeadsClient";

export default function CRMLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <CRMLeadsClient />
    </Suspense>
  );
}
