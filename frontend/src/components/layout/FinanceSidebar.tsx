"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileInput, 
  History,
  LogOut, 
  Landmark,
  BarChart3,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const financeLinks = [
  {
    name: "Command Center",
    href: "/finance/dashboard",
    icon: LayoutDashboard,
    description: "Visualisasi Strategis"
  },
  {
    name: "AR Validation Hub",
    href: "/finance/ar-hub",
    icon: CheckCircle2,
    description: "Validasi Piutang Klien"
  },
  {
    name: "Laporan Keuangan",
    href: "/finance/reports",
    icon: ShieldCheck,
    description: "Pusat Pelaporan Terpadu"
  },
  {
    name: "Finance Input",
    href: "/finance/input",
    icon: FileInput,
    description: "Terminal Input Cepat"
  }
];

export function FinanceSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-slate-100 bg-white h-screen fixed left-0 top-0 flex flex-col z-50">
      {/* Brand Section */}
      <div className="p-8">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-6 h-6 bg-brand-blue rounded-lg flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-white animate-pulse" />
           </div>
           <span className="text-sm font-black tracking-tighter uppercase text-brand-blue">
             Nex
           </span>
        </div>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight pl-1">
          Subsystem Keuangan
        </p>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 space-y-1">
        {financeLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "group flex flex-col p-4 rounded-2xl transition-all duration-300 border mb-2",
                  isActive 
                    ? "bg-brand-blue border-brand-blue text-white shadow-xl shadow-brand-blue/20" 
                    : "border-transparent text-text-muted hover:bg-slate-50 hover:border-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <link.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : "text-brand-blue group-hover:scale-110 transition-transform"
                  )} />
                  <span className="font-bold text-sm tracking-tight">{link.name}</span>
                </div>
                <p className={cn(
                  "text-[10px] ml-8 mt-0.5 font-medium uppercase tracking-tighter opacity-70",
                  isActive ? "text-white/70" : "text-slate-400"
                )}>
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-6 border-t border-slate-50">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-blue border-2 border-white shadow-sm flex items-center justify-center font-black text-[10px] text-white">
                 FIN
              </div>
              <div>
                 <p className="text-xs font-bold text-text-main line-clamp-1">Kontroler Keuangan</p>
                 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Auditor</p>
              </div>
           </div>
           <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
            >
              <LogOut className="w-4 h-4" />
           </Button>
        </div>
      </div>
    </div>
  );
}

