import React from "react";
import { KPIGrid } from "@/components/layout/KPIGrid";

export default function HRLoading() {
  return (
    <div className="p-12 space-y-16 animate-pulse bg-white min-h-screen text-gray-900">
      <div className="h-20 w-1/3 bg-gray-100/50 rounded-2xl border border-gray-200" />
      <KPIGrid>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100/50 rounded-3xl border border-gray-200" />
        ))}
      </KPIGrid>
      <div className="h-16 w-full bg-gray-100/50 rounded-2xl border border-gray-200" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-[400px] bg-gray-100/50 rounded-3xl border border-gray-200" />
        <div className="lg:col-span-4 h-[400px] bg-gray-100/50 rounded-3xl border border-gray-200" />
      </div>
    </div>
  );
}

