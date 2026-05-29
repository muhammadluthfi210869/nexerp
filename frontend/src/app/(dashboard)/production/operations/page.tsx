"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  FlaskConical,
  Droplets,
  Package,
  Archive
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

const hubCards = [
  {
    title: "Work Orders",
    desc: "Kelola WO",
    href: "/production/work-orders",
    icon: ClipboardList,
  },
  {
    title: "Mixing",
    desc: "Terminal",
    href: "/production/terminal/mixing",
    icon: FlaskConical,
  },
  {
    title: "Filling",
    desc: "Terminal",
    href: "/production/terminal/filling",
    icon: Droplets,
  },
  {
    title: "Packing",
    desc: "Terminal",
    href: "/production/terminal/packing",
    icon: Package,
  },
  {
    title: "Batch Records",
    desc: "Records",
    href: "/production/batch-records",
    icon: Archive,
  },
];

export default function OperationsHubPage() {
  return (
    <DashboardShell
      title="Operasional"
      titleAccent="Produksi"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
        {hubCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all group"
            >
              <Icon className="h-8 w-8 text-slate-400 group-hover:text-blue-600 mb-3" />
              <h3 className="font-black text-sm text-slate-900">{card.title}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </DashboardShell>
  );
}
