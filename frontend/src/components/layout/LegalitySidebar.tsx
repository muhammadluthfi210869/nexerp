"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldCheck,
  Scale,
  History,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const legalityLinks = [
  {
    name: "Watchdog Hub",
    href: "/legality/dashboard",
    icon: ShieldCheck,
    description: "Compliance Overview"
  },
  {
    name: "Regulatory Pipeline",
    href: "/legality/pipeline",
    icon: LayoutDashboard,
    description: "Live Control Tower"
  },
  {
    name: "Compliance Inbox",
    href: "/legality/inbox",
    icon: History,
    description: "Meja Kurasi APJ"
  }
];

export function LegalitySidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-slate-100 bg-white h-screen fixed left-0 top-0 flex flex-col z-50">
      {/* Brand Section */}
      <div className="p-8">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
           </div>
           <span className="text-sm font-black tracking-tighter uppercase text-slate-900">
             Nex
           </span>
        </div>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight pl-1">
          Legality Watchdog
        </p>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 space-y-1">
        {legalityLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "group flex flex-col p-4 rounded-2xl transition-all duration-300 border mb-2",
                  isActive 
                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20" 
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <link.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : "text-blue-600 group-hover:scale-110 transition-transform"
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
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center font-black text-[10px] text-white">
                 LO
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-900 line-clamp-1">Legal Officer</p>
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Compliance</p>
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

