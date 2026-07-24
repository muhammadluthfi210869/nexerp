"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  BarChart3,
  Beaker,
  LayoutDashboard,
  PlusCircle,
  Zap,
  History,
  LogOut,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SubMenuItem {
  name: string;
  href: string;
  type: "dashboard" | "input" | "action" | "history";
}

interface NavGroup {
  label: string;
  icon: any;
  items: SubMenuItem[];
}

const MODULE_STRUCTURE: NavGroup[] = [
  {
    label: "DIGITAL MARKETING",
    icon: BarChart3,
    items: [
      { name: "Management Task", href: "/marketing/management-task", type: "action" },
    ]
  },
  {
    label: "RESEARCH & DEV",
    icon: Beaker,
    items: [
      { name: "Analytics Trend", href: "/rnd/analytics", type: "dashboard" },
      { name: "Daily Tracking", href: "/rnd/daily-tracking", type: "action" },
      { name: "Project Monitoring", href: "/rnd/project-monitoring", type: "action" },
    ]
  },
];

const getIconByType = (type: string) => {
  switch (type) {
    case "dashboard": return LayoutDashboard;
    case "input": return PlusCircle;
    case "action": return Zap;
    case "history": return History;
    default: return LayoutDashboard;
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const activeGroup = MODULE_STRUCTURE.find(group =>
      group.items.some(item => item.href === pathname)
    );
    if (activeGroup) {
      setOpenGroups([activeGroup.label]);
    }
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="w-72 border-r border-slate-200 bg-white h-screen fixed left-0 top-0 flex flex-col z-50 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Section */}
      <div className="p-7 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-slate-200 ring-4 ring-slate-50 flex items-center justify-center bg-white">
            <img src="/nexerp-logo.jpeg" alt="NEX ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-black tracking-[-0.03em] text-brand-black uppercase leading-tight">
              NEX <span className="text-slate-400 font-bold">ERP</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Production Light</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
            <UserCircle className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 truncate">{user.fullName || user.email}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-5 pb-8 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {MODULE_STRUCTURE.map((group) => {
          const Icon = group.icon;
          const isGroupActive = group.items.some(i => i.href === pathname);
          const isOpen = openGroups.includes(group.label);

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150",
                  isGroupActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4", isGroupActive ? "text-white" : "text-slate-400")} />
                  <span>{group.label}</span>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                  {group.items.map((item) => {
                    const ItemIcon = getIconByType(item.type);
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                          isActive
                            ? "text-slate-900 bg-slate-100"
                            : "text-slate-400 hover:text-slate-600"
                        )}>
                          <ItemIcon className="w-3 h-3" />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-5 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
