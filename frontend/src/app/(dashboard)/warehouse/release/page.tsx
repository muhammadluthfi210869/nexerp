import React, { Suspense } from "react";
import ReleaseClient from "./ReleaseClient";
import { OperationalPageShell } from "@/components/operational";
import { OperationalButton } from "@/components/operational";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Material Release | Warehouse Hub",
  description: "Production material dispatch and release monitoring.",
};

export default function ReleasePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-gray-900 animate-pulse" />
          <div className="text-slate-500 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Dispatch Protocol...</div>
        </div>
      </div>
    }>
      <OperationalPageShell
        title="Material Release"
        subtitle="Production material dispatch and release monitoring."
        actions={
          <OperationalButton variant="primary" type="button">
            <Zap className="h-4 w-4 mr-2" />
            <span>Batch Release</span>
          </OperationalButton>
        }
      >
        <ReleaseClient />
      </OperationalPageShell>
    </Suspense>
  );
}
