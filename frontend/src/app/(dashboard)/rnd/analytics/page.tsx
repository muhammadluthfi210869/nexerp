import React, { Suspense } from "react";
import AnalyticsTrendClient from "./AnalyticsTrendClient";

export default function AnalyticsTrendPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <AnalyticsTrendClient />
    </Suspense>
  );
}
