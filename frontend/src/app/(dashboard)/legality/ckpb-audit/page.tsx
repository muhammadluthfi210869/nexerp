"use client";
// Day-1 SCOPE DECISION: CPKB Audit is NOT_IN_INITIAL_ROLLOUT.
// Per audit §5: backend endpoints `/legality/ckpb-audits` are not implemented
// in current scope. This page is preserved as a redirect target so any deep
// links land on the canonical Legalitas workspace rather than a 404.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CkpbAuditRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/legality/pipeline");
  }, [router]);
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        CPKB Audit · Not in initial rollout
      </p>
      <p className="text-[11px] font-medium text-slate-500">
        Dialihkan ke Pipeline Legalitas...
      </p>
    </div>
  );
}