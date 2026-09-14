"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

// ponytail: skip noisy/static paths so the log captures only what matters
// for KPI/leakage detection. Add prefixes here as needed.
const SKIP_PREFIXES = ["/_next", "/api/", "/uploads", "/static"];

let lastLogged: string | null = null;

/**
 * Logs PAGE_VIEW on every route change. Mount once near the root.
 *
 * Two guards:
 * - SSR/hydration mismatch (Next.js 16 + nginx rewrite): defer the read
 *   to client via setClientPathname so the server-rendered fallback is
 *   stable.
 * - Duplicate log on initial mount (same path fires useEffect once on
 *   mount even when nothing changed): track lastLogged module-globally.
 */
export function useActivityLog() {
  const pathname = usePathname();
  const [clientPathname, setClientPathname] = useState<string>("");

  // Defer pathname read to post-mount so we don't log during SSR
  // (and so we read the real pathname after rewrite).
  useEffect(() => {
    setClientPathname(pathname ?? "");
  }, [pathname]);

  useEffect(() => {
    const p = clientPathname;
    if (!p) return;
    if (lastLogged === p) return;
    if (SKIP_PREFIXES.some((s) => p.startsWith(s))) return;

    lastLogged = p;
    void api
      .post("/activity-log/log", {
        type: "PAGE_VIEW",
        path: p,
      })
      .catch(() => undefined);
  }, [clientPathname]);
}

/**
 * Drop-in component: mount once inside the React Query provider.
 */
export function ActivityLogger() {
  useActivityLog();
  return null;
}