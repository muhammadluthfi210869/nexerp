"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ChevronDown,
  ShieldAlert,
  BarChart3,
  Beaker,
  Layers,
  Factory,
  CreditCard,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Zap,
  History,
  Scale,
  Truck,
  Warehouse,
  FileSearch,
  Users,
  FlaskConical,
  Package,
  RefreshCw,
  PlusCircle,
  ClipboardCheck,
  Archive,
  Palette,
  Box,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SubMenuItem {
  name: string;
  href: string;
  type: "dashboard" | "input" | "action" | "history" | "bussdev_sample" | "bussdev_prod" | "bussdev_ro" | "bussdev_lost" | "settings";
  roles?: string[];
  badge?: string;
  badgeVariant?: "default" | "warning" | "critical";
}

interface NavGroup {
  label: string;
  icon: any;
  items: SubMenuItem[];
  roles?: string[];
}

const MODULE_STRUCTURE: NavGroup[] = [
  {
    label: "MASTER DATA",
    icon: Archive,
    roles: ["SUPER_ADMIN", "ADMIN", "SCM", "FINANCE", "DIRECTOR"],
    items: [
      { name: "Registry Overview", href: "/master", type: "dashboard" },
      { name: "Goods Registry", href: "/master/goods", type: "input" },
      { name: "Warehouse Hub", href: "/master/warehouses", type: "input" },
      { name: "Vendor Network", href: "/master/suppliers", type: "input" },
      { name: "Client Database", href: "/master/customers", type: "input" },
      { name: "Personnel Hub", href: "/master/personnel", type: "input" },
      { name: "Global Categories", href: "/master/categories", type: "action" },
    ]
  },
  {
    label: "EXECUTIVE",
    icon: ShieldAlert,
    roles: ["SUPER_ADMIN", "HEAD_OPS", "MANAGEMENT", "DIRECTOR"],
    items: [
      { name: "Dashboard Eksekutif", href: "/executive/dashboard", type: "dashboard" },
      { name: "Dashboard Notifikasi", href: "/executive/dashboard?tab=notifications", type: "action", badge: "12" },
    ]
  },
  {
    label: "DIGITAL MARKETING",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "MARKETING", "DIRECTOR"],
    items: [
      { name: "Marketing Analytics", href: "/marketing/dashboard", type: "dashboard" },
      { name: "Campaign Input", href: "/marketing/input", type: "input" },
      { name: "Lead Logs", href: "/marketing/logs", type: "history" },
    ]
  },
  {
    label: "BUSSDEV",
    icon: Activity,
    roles: ["SUPER_ADMIN", "COMMERCIAL", "MARKETING", "DIRECTOR"],
    items: [
      { name: "Command Center", href: "/bussdev/dashboard", type: "dashboard" },
      { name: "Sales Pipeline", href: "/bussdev/pipeline", type: "action" },
      { name: "Sales Order Central", href: "/bussdev/sales-orders", type: "action" },
      { name: "Lead Intake Form", href: "/bussdev/intake", type: "input" },
      { name: "Client Sample", href: "/bussdev/client-sample", type: "bussdev_sample" },
      { name: "Client Produksi", href: "/bussdev/client-production", type: "bussdev_prod" },
      { name: "Client RO", href: "/bussdev/client-ro", type: "bussdev_ro" },
      { name: "Lost", href: "/bussdev/lost", type: "bussdev_lost" },
    ]
  },
  {
    label: "FINANCE",
    icon: Landmark,
    roles: ["SUPER_ADMIN", "FINANCE", "DIRECTOR"],
    items: [
      { name: "Pusat Komando", href: "/finance/dashboard", type: "dashboard" },
      { name: "AR Validation Hub", href: "/finance/ar-hub", type: "action", badge: "3" },
      { name: "Laporan Keuangan", href: "/finance/reports", type: "history" },
      { name: "Finance Input", href: "/finance/input", type: "input" },
    ]
  },
  {
    label: "LEGALITAS / APJ",
    icon: Scale,
    roles: ["SUPER_ADMIN", "COMPLIANCE", "DIRECTOR"],
    items: [
      { name: "Watchdog Hub", href: "/legality/dashboard", type: "dashboard" },
      { name: "Regulatory Pipeline", href: "/legality/pipeline", type: "action" },
      { name: "Compliance Inbox", href: "/legality/inbox", type: "input" },
    ]
  },
  {
    label: "RESEARCH & DEV",
    icon: Beaker,
    roles: ["SUPER_ADMIN", "RND", "DIRECTOR"],
    items: [
      { name: "Sample Inbox", href: "/rnd/inbox", type: "input", badge: "New" },
      { name: "Formula Analytics", href: "/rnd/dashboard", type: "dashboard" },
      { name: "Active Pipeline", href: "/rnd/pipeline", type: "action" },
      { name: "Formula Repository", href: "/rnd/repository", type: "history" },
    ]
  },
  {
    label: "SUPPLY CHAIN (SCM)",
    icon: Truck,
    roles: ["SUPER_ADMIN", "SCM", "PURCHASING", "DIRECTOR"],
    items: [
      { name: "Inventory Intel", href: "/scm/dashboard", type: "dashboard" },
      { name: "Purchasing (PR/PO)", href: "/scm/purchasing", type: "action", badge: "5", badgeVariant: "warning" },
      { name: "Receiving (GRN)", href: "/scm/receiving", type: "action" },
      { name: "Purchase Returns", href: "/scm/purchase-returns", type: "action" },
      { name: "Vendor Matrix", href: "/scm/vendors/performance", type: "history" },
      { name: "Materials Registry", href: "/master/goods", type: "input" },
      { name: "Vendor Network", href: "/master/suppliers", type: "input" },
      { name: "Warehouse Map", href: "/warehouse", type: "dashboard" },
    ]
  },
  {
    label: "PRODUCTION Ops",
    icon: Factory,
    roles: ["SUPER_ADMIN", "PRODUCTION", "PRODUCTION_OP", "PPIC", "DIRECTOR"],
    items: [
      { name: "Plant Controller", href: "/production/dashboard", type: "dashboard" },
      { name: "Work Orders (BMR)", href: "/production/work-orders", type: "action" },
      { name: "Batch Schedules", href: "/production/schedules", type: "action" },
      { name: "Batch Records", href: "/production/batch-records", type: "history" },
      { name: "Operator Terminal", href: "/production/terminal", type: "action" },
      { name: "Yield & Loss Intel", href: "/production/analytics", type: "history" },
    ]
  },
  {
    label: "QUALITY CONTROL",
    icon: FlaskConical,
    roles: ["SUPER_ADMIN", "QC_LAB", "DIRECTOR"],
    items: [
      { name: "Quality Analytics", href: "/qc/dashboard", type: "dashboard" },
      { name: "Lab Inspections", href: "/qc/inspections", type: "action" },
      { name: "Stability Tests", href: "/qc/stability", type: "action" },
      { name: "CoA Center", href: "/qc/coa", type: "history" },
      { name: "Audit Trail", href: "/executive/audit", type: "history" },
    ]
  },
  {
    label: "WAREHOUSE Ops",
    icon: Warehouse,
    roles: ["SUPER_ADMIN", "WAREHOUSE", "SCM", "DIRECTOR"],
    items: [
      { name: "Command Dashboard", href: "/warehouse", type: "dashboard" },
      { name: "Workstation (3-Tab)", href: "/warehouse/workstation", type: "action" },
      { name: "Goods Receiving", href: "/warehouse/inbound", type: "input" },
      { name: "Material Release", href: "/warehouse/release", type: "action" },
      { name: "Transfer Orders", href: "/warehouse/transfers", type: "action" },
      { name: "Stock Opname", href: "/warehouse/opname", type: "history" },
      { name: "Stock Adjustment", href: "/warehouse/adjustment", type: "input" },
    ]
  },
  {
    label: "CREATIVE HUB",
    icon: Palette,
    roles: ["SUPER_ADMIN", "CREATIVE", "DIRECTOR"],
    items: [
      { name: "Design Board", href: "/creative/board", type: "dashboard" },
    ]
  },
  {
    label: "HUMAN RESOURCES",
    icon: Users,
    roles: ["SUPER_ADMIN", "HR", "DIRECTOR"],
    items: [
      { name: "HR Intelligence", href: "/hr/dashboard", type: "dashboard" },
    ]
  },
  {
    label: "SYSTEM CONTROL",
    icon: Zap,
    roles: ["SUPER_ADMIN", "MANAGEMENT", "DIRECTOR"],
    items: [
      { name: "Audit Ledger", href: "/system/audit-ledger", type: "history" },
      { name: "Event Protocol", href: "/system/protocol", type: "dashboard" },
      { name: "System Health", href: "/system/health", type: "dashboard" },
    ]
  }
];

const TIER_STRUCTURE = [
  {
    tier: "CORE INTELLIGENCE",
    groups: ["EXECUTIVE", "DIGITAL MARKETING", "BUSSDEV"]
  },
  {
    tier: "OPERATIONAL EXCELLENCE",
    groups: ["FINANCE", "SUPPLY CHAIN (SCM)", "PRODUCTION Ops", "QUALITY CONTROL", "WAREHOUSE Ops", "RESEARCH & DEV"]
  },
  {
    tier: "STRATEGIC SUPPORT",
    groups: ["MASTER DATA", "LEGALITAS / APJ", "HUMAN RESOURCES", "CREATIVE HUB", "SYSTEM CONTROL"]
  }
];

const getIconByType = (type: string) => {
  switch (type) {
    case "dashboard": return LayoutDashboard;
    case "input": return PlusCircle;
    case "action": return Zap;
    case "history": return History;
    case "bussdev_sample": return FlaskConical;
    case "bussdev_prod": return Package;
    case "bussdev_ro": return RefreshCw;
    default: return Activity;
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <aside className="w-72 border-r border-slate-200 bg-white h-screen fixed left-0 top-0 flex flex-col z-50 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Section */}
      <div className="p-7 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-slate-200 ring-4 ring-slate-50 flex items-center justify-center bg-white">
            <img src="/N letter logo.jpeg" alt="NEX ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-black tracking-[-0.03em] text-brand-black uppercase leading-tight">
              NEX <span className="text-slate-400 font-bold">ERP</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Intelligence Hub</span>
          </div>
        </div>
      </div>

      {/* Command Search */}
      <div className="px-6 py-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FileSearch className="w-4 h-4 text-slate-300 group-focus-within:text-brand-black transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Command + K..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[12px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder:text-slate-300 placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 overflow-y-auto px-5 pb-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
        {TIER_STRUCTURE.map((tier) => {
          const tierGroups = MODULE_STRUCTURE.filter(group => 
            tier.groups.includes(group.label) && 
            (!user || !group.roles || group.roles.some(role => user.roles.includes(role)))
          );

          if (tierGroups.length === 0) return null;

          return (
            <div key={tier.tier} className="space-y-4">
              <div className="flex items-center gap-3 px-3">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase whitespace-nowrap">
                  {tier.tier}
                </span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>

              <div className="space-y-1.5">
                {tierGroups.map((group) => {
                  const isGroupActive = group.items.some(i => i.href === pathname);
                  const isOpen = openGroups.includes(group.label);

                  return (
                    <div key={group.label} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group",
                          isGroupActive
                            ? "bg-brand-black text-white shadow-md shadow-slate-200"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                            isGroupActive ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                          )}>
                            <group.icon className={cn(
                              "w-4 h-4",
                              isGroupActive ? "text-white" : "text-slate-400 group-hover:text-brand-black"
                            )} />
                          </div>
                          <span className={cn(
                            "text-[12px] font-bold tracking-tight whitespace-nowrap truncate",
                            isGroupActive ? "text-white" : "text-inherit"
                          )}>
                            {group.label}
                          </span>
                        </div>
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 transition-transform duration-500",
                          isOpen ? "rotate-180" : "text-slate-300"
                        )} />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, x: -10 }}
                            animate={{ height: "auto", opacity: 1, x: 0 }}
                            exit={{ height: 0, opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="overflow-hidden ml-6 border-l-2 border-slate-100 pl-4 space-y-1 mt-1.5"
                          >
                            {group.items.filter(item => {
                              if (user?.roles?.includes("DIRECTOR")) {
                                return item.type === "dashboard";
                              }
                              return true;
                            }).map((item) => {
                              const isActive = pathname === item.href;
                              const IconType = getIconByType(item.type);
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onMouseEnter={() => router.prefetch(item.href)}
                                  className={cn(
                                    "flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                      ? "bg-slate-50 text-brand-black font-bold"
                                      : "text-slate-400 hover:text-brand-black hover:bg-slate-50/50 hover:translate-x-[4px]"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <IconType className={cn(
                                      "w-3.5 h-3.5 transition-colors",
                                      isActive ? "text-brand-black" : "text-slate-300 group-hover:text-brand-black"
                                    )} />
                                    <span className="text-[11px] font-bold tracking-tight whitespace-nowrap truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  {item.badge && (
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                                      item.badgeVariant === "critical" ? "bg-rose-100 text-rose-600" :
                                      item.badgeVariant === "warning" ? "bg-amber-100 text-amber-600" :
                                      "bg-slate-100 text-slate-500"
                                    )}>
                                      {item.badge}
                                    </span>
                                  )}
                                  {isActive && (
                                    <motion.div 
                                      layoutId="activeIndicator"
                                      className="absolute -left-[18px] w-1 h-4 bg-brand-black rounded-full"
                                    />
                                  )}
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm relative overflow-hidden group">
              <UserCircle className="w-6 h-6 text-slate-300 group-hover:text-brand-black transition-colors" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <p className="text-[12px] font-black text-brand-black line-clamp-1 leading-none mb-1">
                {user?.full_name || "Authorized"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {user?.roles?.[0] || "Active Session"}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 shadow-none"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

