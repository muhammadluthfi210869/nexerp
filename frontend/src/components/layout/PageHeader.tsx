"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Search, Bell, Settings, User } from "lucide-react";
import Link from "next/link";

export function PageHeader() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header className="mb-4 space-y-2">
      {/* Top Bar with Search */}
      <div className="flex items-center justify-between py-2">
        <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Home className="w-3 h-3" />
            Nex
          </Link>
          {paths.map((path, index) => (
            <React.Fragment key={path}>
              <ChevronRight className="w-3 h-3 text-slate-200" />
              <Link 
                href={`/${paths.slice(0, index + 1).join("/")}`}
                className={index === paths.length - 1 ? "text-brand-black font-bold" : "hover:text-primary transition-colors"}
              >
                {path.replace("-", " ")}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* Centered Search Pill */}
        <div className="hidden md:flex flex-1 max-w-sm mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="SEARCH ANYTHING..."
              className="w-full bg-white border border-slate-100 rounded-lg py-2 pl-9 pr-3 text-[10px] font-bold tracking-tight uppercase focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
           <button className="p-1.5 rounded-full hover:bg-white transition-colors relative">
              <Bell className="w-4 h-4 text-slate-400" />
              <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-rose-500 rounded-full" />
           </button>
           <button className="p-1.5 rounded-full hover:bg-white transition-colors">
              <Settings className="w-4 h-4 text-slate-400" />
           </button>
           <div className="w-px h-3 bg-slate-200 mx-1" />
           <div className="flex items-center gap-2 pl-1">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-bold text-brand-black uppercase leading-none">Luthfi Nex</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Admin</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center text-white text-[10px] font-bold">
                 LA
              </div>
           </div>
        </div>
      </div>

      {/* Page Title Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-brand-black tracking-tight uppercase">
            {paths[paths.length - 1]?.replace("-", " ") || "Dashboard"}
          </h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-right">
           {/* Metrics removed for minimalist design */}
        </div>
      </div>
    </header>
  );
}

function TimeDisplay() {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (!time) return <span className="opacity-0">00:00</span>;

  return <>{time}</>;
}

