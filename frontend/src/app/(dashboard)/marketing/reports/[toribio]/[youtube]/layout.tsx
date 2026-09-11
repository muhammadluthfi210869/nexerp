"use client";

import { ReactNode, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Calendar, ListTodo, Database } from "lucide-react";

interface BrandChannelContextValue {
  brand: string;
  channel: string;
}

const BrandChannelContext = createContext<BrandChannelContextValue | null>(null);

export function useBrandChannel() {
  const ctx = useContext(BrandChannelContext);
  if (!ctx) throw new Error("useBrandChannel must be used inside BrandChannelLayout");
  return ctx;
}

export default function BrandChannelLayout({ children, params }: { children: ReactNode; params: Promise<{ brand: string; channel: string }> }) {
  return <BrandChannelLayoutInner params={params}>{children}</BrandChannelLayoutInner>;
}

function BrandChannelLayoutInner({ children, params }: { children: ReactNode; params: Promise<{ brand: string; channel: string }> }) {
  const { brand, channel } = use(params);
  const pathname = usePathname() ?? "";
  let activeView: "calendar" | "planner" | "database" = "planner";
  if (pathname.endsWith("/calendar")) activeView = "calendar";
  else if (pathname.endsWith("/database")) activeView = "database";

  const basePath = `/marketing/reports/${brand}/${channel}`;
  const tabs = [
    { id: "calendar", label: "Kalender", href: `${basePath}/calendar` },
    { id: "planner", label: "Planner", href: basePath },
    { id: "database", label: "Database", href: `${basePath}/database` },
  ];

  return (
    <BrandChannelContext.Provider value={{ brand, channel }}>
      <div className="space-y-4">
        <nav className="flex gap-2" aria-label="View mode">
          {tabs.map((t) => (
            <Link key={t.id} href={t.href} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${activeView === t.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </BrandChannelContext.Provider>
  );
}
