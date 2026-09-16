"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Production-light's client-side resolver. Routes the entry page to the
// member workspace that matches the logged-in user's email/fullName/role.
// Falls back to `/aurel` if nothing matches (safest default; first member
// in the marketingAliases map).

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

  // ponytail: 'aurel' doesn't match any seeded roster member — fall back to
  // overview which renders the management-task workspace for any marketing viewer.
  return isManager
    ? "/marketing/management-task/revi"
    : "/marketing/management-task/overview";
}

export default function ManagementTaskRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let user: any = null;
    try {
      const storedUser = window.localStorage.getItem("user");
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
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
