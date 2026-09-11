"use client";

// Brand layout: provides 5-channel sub-navbar for /marketing/reports/[brand]/* pages.

import { ReactNode, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Camera, Music2, MonitorPlay, Globe, Megaphone } from "lucide-react";

interface BrandContextValue {
  brand: string;
  brandName: string;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandLayout");
  return ctx;
}

const BRAND_DISPLAY: Record<string, string> = {
  dreamlab: "Dreamlab",
  toribio: "Toribio",
};

const CHANNELS = [
  { slug: "instagram", label: "Instagram", icon: Camera },
  { slug: "tiktok", label: "TikTok", icon: Music2 },
  { slug: "youtube", label: "YouTube", icon: MonitorPlay },
  { slug: "website", label: "Website", icon: Globe },
  { slug: "paid-ads", label: "Paid Ads", icon: Megaphone },
];

export default function BrandLayout({ children, params }: { children: ReactNode; params: Promise<{ brand: string }> }) {
  return <BrandLayoutInner params={params}>{children}</BrandLayoutInner>;
}

function BrandLayoutInner({ children, params }: { children: ReactNode; params: Promise<{ brand: string }> }) {
  const { brand } = use(params);
  const pathname = usePathname() ?? "";
  const brandName = BRAND_DISPLAY[brand] ?? brand;

  let activeChannel = "";
  for (const c of CHANNELS) {
    if (pathname.includes(`/${brand}/${c.slug}`)) {
      activeChannel = c.slug;
      break;
    }
  }

  return (
    <BrandContext.Provider value={{ brand, brandName }}>
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" aria-label="Channel">
          <Link href={`/marketing/reports/${brand}`} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${activeChannel === "" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
            Overview
          </Link>
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = activeChannel === c.slug;
            return (
              <Link key={c.slug} href={`/marketing/reports/${brand}/${c.slug}`} className={`text-sm px-4 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
                <Icon className="h-4 w-4" />
                {c.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </BrandContext.Provider>
  );
}
