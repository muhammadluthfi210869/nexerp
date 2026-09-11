"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Production-light's client-side resolver. Routes the entry page to the
// member workspace that matches the logged-in user's email/fullName/role.
// Falls back to `/aurel` if nothing matches (safest default; first member
// in the marketingAliases map).
//
// NOTE: phase-3 previously used a server-side `redirect()` to either
// `/overview` (404, broken) or self (loop). Migrating to this client-side
// resolver matches what production-light ships and what the E2E regression
// test `management-task-redirect-bug.spec.ts` asserts.

const managerRoleSet = new Set(["SUPER_ADMIN", "HEAD_OPS", "MARKETING"]);

const marketingAliases: Record<string, string[]> = {
  aurel: ["aurel"],
  revi: ["revita", "revi", "fadhilah", "nisa"],
  zarka: ["zarkasi", "zarka"],
  gusti: ["gusti"],
  luthfi: ["luthfi"],
  rahmat: ["rahmat"],
};

function resolveManagementTaskPath(user: any) {
  const email = String(user?.email ?? "").toLowerCase().trim();
  const fullName = String(user?.fullName ?? "").toLowerCase().trim();

  for (const [slug, aliases] of Object.entries(marketingAliases)) {
    if (aliases.includes(fullName) || aliases.some((alias) => email.startsWith(`${alias}@`))) {
      return `/marketing/management-task/${slug}`;
    }
  }

  const roles: string[] = user?.roles ?? [];
  const isManager =
    email.startsWith("revita@") ||
    email.startsWith("zaki@") ||
    email.startsWith("admin@") ||
    email.startsWith("nisa@") ||
    roles.some((role) => managerRoleSet.has(role));

  return isManager ? "/marketing/management-task/revi" : "/marketing/management-task/aurel";
}

export default function ManagementTaskRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let user: any = null;
    try {
      const storedUser = window.localStorage.getItem("user");
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      // localStorage korup / bukan JSON → fallback null (BUG-U7/P5.6).
      user = null;
    }
    router.replace(resolveManagementTaskPath(user));
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-400">
      Redirecting...
    </div>
  );
}
