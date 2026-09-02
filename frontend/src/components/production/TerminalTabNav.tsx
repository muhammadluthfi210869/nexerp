"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Zap, Package, Box } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Mixing", href: "/production/terminal/mixing", icon: FlaskConical },
  { label: "Filling", href: "/production/terminal/filling", icon: Zap },
  { label: "Packing", href: "/production/terminal/packing", icon: Package },
  { label: "Reconciliation", href: "/production/terminal/reconciliation", icon: Box },
];

export function TerminalTabNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
