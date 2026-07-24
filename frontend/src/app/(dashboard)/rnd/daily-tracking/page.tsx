import React, { Suspense } from "react";
import DailyTrackingClient from "./DailyTrackingClient";

export default function DailyTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DailyTrackingClient />
    </Suspense>
  );
}
