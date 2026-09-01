"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  XCircle,
  PlusCircle,
  ClipboardCheck,
  Archive,
  Palette,
  Box,
  Landmark,
  Cog,
  Heart,
  AlertOctagon,
  Bell,
  BookOpen,
  TrendingDown,
  DollarSign,
  Package,
  ClipboardList,
  Star,
  Wallet,
  Briefcase,
  Barcode
} from "lucide-react";
import { Search, X } from "lucide-react";
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
    label: "Executive",
    icon: ShieldAlert,
    roles: ["SUPER_ADMIN", "HEAD_OPS", "MANAGEMENT", "DIRECTOR"],
    items: [
      { name: "Dasbor Eksekutif", href: "/executive/dashboard", type: "dashboard" },
      { name: "Notifikasi", href: "/executive/dashboard?tab=notifications", type: "action", badge: "12" },
    ]
  },
  {
    label: "Digital Marketing",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "MARKETING", "DIGIMAR", "DIRECTOR"],
    items: [
      { name: "Dasbor Marketing", href: "/marketing/dashboard", type: "dashboard" },
      { name: "Input Kampanye", href: "/marketing/input", type: "input" },
      { name: "Tugas Marketing", href: "/marketing/management-task", type: "action" },
      { name: "WhatsApp Sales", href: "/marketing/whatsapp-sales", type: "action" },
      { name: "Riwayat Lead", href: "/marketing/logs", type: "history" },
    ]
  },
  {
    label: "BusDev",
    icon: Activity,
    roles: ["SUPER_ADMIN", "COMMERCIAL", "MARKETING", "DIRECTOR"],
    items: [
      { name: "Dasbor BusDev", href: "/bussdev/dashboard", type: "dashboard" },
      { name: "Pipeline Penjualan", href: "/bussdev/client-manager", type: "action" },
      { name: "Form Intake Lead", href: "/bussdev/intake", type: "input" },
      { name: "Lost", href: "/bussdev/lost", type: "bussdev_lost" },
    ]
  },
  {
    label: "Finance",
    icon: Landmark,
    roles: ["SUPER_ADMIN", "FINANCE", "DIRECTOR"],
    items: [
      { name: "Dasbor Keuangan", href: "/finance/dashboard", type: "dashboard" },
      { name: "Kas & Bank", href: "/finance/kas", type: "input" },
      { name: "Jurnal & COA", href: "/finance/jurnal", type: "history" },
      { name: "Uang Muka (DP)", href: "/finance/dp", type: "input" },
      { name: "Pembayaran", href: "/finance/bayar", type: "input" },
      { name: "Piutang & Hutang", href: "/finance/piutang", type: "action", badge: "3" },
      { name: "Dana & Persetujuan", href: "/finance/fund", type: "action" },
      { name: "Laporan Keuangan", href: "/finance/reports", type: "history" },
    ]
  },
  {
    label: "Legal / APJ",
    icon: Scale,
    roles: ["SUPER_ADMIN", "COMPLIANCE", "DIRECTOR"],
    items: [
      { name: "Dasbor Legal / APJ", href: "/legality/dashboard", type: "dashboard" },
      { name: "Pipeline Legalitas", href: "/legality/pipeline", type: "action" },
      { name: "Inbox Compliance", href: "/legality/inbox", type: "input" },
    ]
  },
  {
    label: "RnD",
    icon: Beaker,
    roles: ["SUPER_ADMIN", "RND", "DIRECTOR"],
    items: [
      { name: "Pipeline Aktif", href: "/rnd/pipeline", type: "action" },
      { name: "Repository Formula", href: "/rnd/repository", type: "history" },
      { name: "Inbox Sampel", href: "/rnd/inbox", type: "input", badge: "Baru" },
      { name: "Analitik Formula", href: "/rnd/dashboard", type: "dashboard" },
    ]
  },
  {
    label: "Supply Chain",
    icon: Truck,
    roles: ["SUPER_ADMIN", "SCM", "PURCHASING", "DIRECTOR"],
    items: [
      { name: "Dasbor Supply Chain", href: "/scm/dashboard", type: "dashboard" },
      { name: "Pembelian", href: "/scm/pembelian", type: "action", badge: "5", badgeVariant: "warning" },
      { name: "Kebutuhan Barang", href: "/scm/kebutuhan-barang", type: "action" },
      { name: "Barang", href: "/master/goods", type: "input" },
      { name: "Supplier", href: "/master/suppliers", type: "input" },
    ]
  },
  {
    label: "Production",
    icon: Factory,
    roles: ["SUPER_ADMIN", "PRODUCTION", "PRODUCTION_OP", "PPIC", "DIRECTOR"],
    items: [
      { name: "Dasbor Produksi", href: "/production", type: "dashboard" },
      { name: "Penjadwalan", href: "/production/schedule", type: "dashboard" },
      { name: "Operasional", href: "/production/operations", type: "dashboard" },
      { name: "Work Orders", href: "/production/work-orders", type: "action" },
      { name: "Batch Records", href: "/production/batch-records", type: "history" },
      { name: "Gudang Produksi", href: "/production/warehouse", type: "history" },
      { name: "Audit Produksi", href: "/production/audit", type: "history" },
      { name: "Pipeline", href: "/production/operations?tab=pipeline", type: "history" },
      { name: "Leakage", href: "/production/leakage", type: "history", badge: "!", badgeVariant: "critical" },
    ]
  },
  {
    label: "Quality Control",
    icon: FlaskConical,
    roles: ["SUPER_ADMIN", "QC_LAB", "DIRECTOR"],
    items: [
      { name: "Dasbor Quality Control", href: "/qc/dashboard", type: "dashboard" },
      { name: "Workbench QC", href: "/qc/workbench", type: "action" },
      { name: "Inspeksi Lab", href: "/qc/inspections", type: "action" },
      { name: "Checklist", href: "/qc/checklist", type: "input" },
      { name: "Uji Stabilitas", href: "/qc/stability", type: "action" },
      { name: "Pusat CoA", href: "/qc/coa", type: "history" },
      { name: "Report QC", href: "/qc/report", type: "history" },
      { name: "Audit Trail", href: "/executive/audit", type: "history" },
    ]
  },
  {
    label: "Warehouse",
    icon: Warehouse,
    roles: ["SUPER_ADMIN", "WAREHOUSE", "SCM", "DIRECTOR"],
    items: [
      { name: "Dasbor Gudang", href: "/warehouse", type: "dashboard" },
      { name: "Gudang", href: "/warehouse/gudang", type: "action" },
      { name: "Stok", href: "/warehouse/stok", type: "history" },
      { name: "Inbound", href: "/warehouse/inbound", type: "action" },
      { name: "Shipment", href: "/logistics/shipments", type: "action" },
      { name: "Data Gudang", href: "/master/warehouses", type: "input" },
    ]
  },
  {
    label: "Creative",
    icon: Palette,
    roles: ["SUPER_ADMIN", "CREATIVE", "DIRECTOR"],
    items: [
      { name: "Design Board", href: "/creative/board", type: "dashboard" },
    ]
  },
  {
    label: "HR",
    icon: Users,
    roles: ["SUPER_ADMIN", "HR", "DIRECTOR"],
    items: [
      { name: "Dasbor HR", href: "/hr/dashboard", type: "dashboard" },
      { name: "Personalia", href: "/master/personnel", type: "input" },
      { name: "Kehadiran", href: "/hr/attendance", type: "action" },
      { name: "Penggajian", href: "/hr/payroll", type: "history" },
    ]
  },
  {
    label: "System",
    icon: Zap,
    roles: ["SUPER_ADMIN", "MANAGEMENT", "DIRECTOR"],
    items: [
      { name: "Audit Ledger", href: "/system/audit-ledger", type: "history" },
      { name: "Event Protocol", href: "/system/protocol", type: "dashboard" },
      { name: "System Health", href: "/system/health", type: "dashboard" },
      { name: "Global Categories", href: "/master/categories", type: "action" },
    ]
  },
  {
    label: "Automation",
    icon: Cog,
    items: [
      { name: "Pusat Dokumen", href: "/documents/drafts", type: "action", badge: "Baru" },
      { name: "Ringkasan", href: "/automation", type: "dashboard" },
      { name: "Foundation", href: "/automation", type: "action" },
      { name: "Business Development", href: "/automation", type: "action" },
      { name: "Keuangan", href: "/automation", type: "action" },
      { name: "Gudang", href: "/automation", type: "action" },
      { name: "Produksi", href: "/automation", type: "action" },
      { name: "Supply Chain", href: "/automation", type: "action" },
      { name: "HR & Semua Divisi", href: "/automation", type: "action" },
      { name: "Eksekutif", href: "/automation", type: "action" },
      { name: "Sistem", href: "/automation", type: "action" },
      { name: "Legalitas", href: "/automation", type: "action" },
    ]
  }
];

const TIER_STRUCTURE = [
  {
    tier: "DASHBOARDS & COMMERCIAL",
    groups: ["Executive", "Digital Marketing", "BusDev"]
  },
  {
    tier: "OPERATIONS",
    groups: ["Finance", "Supply Chain", "Production", "Quality Control", "Warehouse", "RnD"]
  },
  {
    tier: "SUPPORT",
    groups: ["Legal / APJ", "HR", "Creative", "System"]
  },
  {
    tier: "AUTOMATION",
    groups: ["Automation"]
  }
];

const getIconByType = (type: string) => {
  switch (type) {
    case "dashboard": return LayoutDashboard;
    case "input": return PlusCircle;
    case "action": return Zap;
    case "history": return History;
    case "settings": return Cog;
    case "bussdev_lost": return XCircle;
    default: return Activity;
  }
};

const isItemActive = (href: string, pathname: string, queryString: string) => {
  const [itemPath, itemQuery] = href.split("?");
  if (itemQuery) return pathname === itemPath && queryString === itemQuery;
  return (pathname === itemPath && !queryString) || pathname.startsWith(`${itemPath}/`);
};

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    // Navigation is role-scoped; remove legacy global personalization state.
    localStorage.removeItem("nexerp.sidebar.favorites");
    localStorage.removeItem("nexerp.sidebar.recent");
  }, []);

  useEffect(() => {
    const activeGroup = MODULE_STRUCTURE.find(group =>
      group.items.some(item => isItemActive(item.href, pathname, searchParams.toString()))
    );
    if (activeGroup && !searchQuery) {
      setOpenGroups([activeGroup.label]);
    }
  }, [pathname, searchParams, searchQuery]);

  // Director tetap dapat melihat seluruh menu yang diizinkan agar tidak kehilangan akses transaksi.
  const isExecutive = false;
  const isRevitaMarketingOnly = user?.email?.toLowerCase?.() === "revita@nexerp.id";

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? [] : [label]);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleItemsForGroup = (group: NavGroup) => group.items.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return item.name.toLowerCase().includes(query) || group.label.toLowerCase().includes(query);
  });

  return (
    <aside className="erp-sidebar border-r border-slate-200 bg-white h-screen fixed left-0 top-0 flex flex-col z-50 font-sans">
      {/* Brand Section */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-slate-200 ring-4 ring-slate-50 flex items-center justify-center bg-white">
            <img src="/nexerp-logo.jpeg" alt="NEX ERP Logo" className="w-full h-full object-cover" />
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
      <div className="px-4 py-3">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-300 group-focus-within:text-brand-black transition-colors" />
          </div>
          <input
            ref={searchRef}
            aria-label="Search navigation"
            type="text"
            placeholder="Cari menu... (Ctrl + K)"
            onKeyDown={(event) => event.key === "Escape" && setSearchQuery("")}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-10 pr-9 text-[12px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder:text-slate-300 placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian menu"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {TIER_STRUCTURE.map((tier) => {
          const tierGroups = MODULE_STRUCTURE.filter(group => 
            tier.groups.includes(group.label) && 
            (!user || !group.roles || group.roles.some(role => user.roles.includes(role))) &&
            (!isRevitaMarketingOnly || group.label === "Digital Marketing")
          );

          if (tierGroups.length === 0) return null;

          return (
            <div key={tier.tier} className="space-y-2.5">
              <div className="px-3 text-left">
                <span className="text-[9px] font-black text-slate-400 tracking-[0.16em] uppercase whitespace-nowrap">
                  {tier.tier}
                </span>
              </div>

              <div className="space-y-1">
                {tierGroups.map((group) => {
                  const visibleItems = visibleItemsForGroup(group);
                  if (visibleItems.length === 0) return null;
                  const dashItems = group.items.filter(i => i.type === "dashboard");
                  const isGroupActive = group.items.some(i => isItemActive(i.href, pathname, searchParams.toString()));

                  // --- EXECUTIVE MODE (DIRECTOR role) ---
                  if (isExecutive) {
                    if (dashItems.length === 0) return null;
                    const primaryHref = dashItems[0].href;
                    const isPrimaryActive = pathname === primaryHref;
                    const extraItems = dashItems.slice(1);

                    return (
                      <div key={group.label} className="space-y-1">
                        <Link
                          href={primaryHref}
                          onMouseEnter={() => router.prefetch(primaryHref)}
                          className={cn(
                            "w-full min-w-0 flex items-center justify-between gap-2 overflow-hidden px-3 py-2.5 rounded-xl text-left transition-colors duration-200 group",
                            isPrimaryActive
                              ? "bg-brand-black text-white shadow-md shadow-slate-200"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <div className="min-w-0 flex flex-1 items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                              isPrimaryActive ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                            )}>
                              <group.icon className={cn(
                                "w-4 h-4",
                                isPrimaryActive ? "text-white" : "text-slate-400 group-hover:text-brand-black"
                              )} />
                            </div>
                            <span className={cn(
                              "min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight",
                              isPrimaryActive ? "text-white" : "text-inherit"
                            )}>
                              {group.label}
                            </span>
                          </div>
                        </Link>

                        {extraItems.length > 0 && (
                          <div className="ml-6 border-l-2 border-slate-100 pl-4 space-y-1 mt-1.5">
                            {extraItems.map((item) => {
                              const isExtraActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onMouseEnter={() => router.prefetch(item.href)}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg transition-all duration-200 group relative",
                                    isExtraActive
                                      ? "bg-slate-50 text-brand-black font-bold"
                                      : "text-slate-400 hover:text-brand-black hover:bg-slate-50/50 hover:translate-x-[4px]"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <Zap className={cn(
                                      "w-3.5 h-3.5 transition-colors",
                                      isExtraActive ? "text-brand-black" : "text-slate-300 group-hover:text-brand-black"
                                    )} />
                                    <span className="text-[12px] font-medium tracking-tight whitespace-nowrap truncate">
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
                                  {isExtraActive && (
                                    <div className="absolute -left-[18px] w-1 h-4 bg-brand-black rounded-full" />
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // --- NORMAL MODE (non-DIRECTOR) ---
                  const isOpen = searchQuery.trim().length > 0 || openGroups.includes(group.label);
                  return (
                    <div key={group.label} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className={cn(
                            "w-full min-w-0 flex items-center justify-between gap-2 overflow-hidden px-3 py-2.5 rounded-xl text-left transition-colors duration-200 group",
                          isGroupActive
                            ? "bg-brand-black text-white shadow-md shadow-slate-200"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="min-w-0 flex flex-1 items-center gap-3">
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
                            "min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight",
                            isGroupActive ? "text-white" : "text-inherit"
                          )}>
                            {group.label}
                          </span>
                        </div>
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-transform duration-300",
                          isOpen ? "rotate-180" : "text-slate-300"
                        )} />
                      </button>
                        {isOpen && (
                          <div className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ml-6 border-l-2 border-slate-100 pl-4 space-y-1 mt-1.5">
                            {visibleItems.map((item) => {
                              const isActive = isItemActive(item.href, pathname, searchParams.toString());
                              const IconType = getIconByType(item.type);
                              return (
                                <div key={item.name} className="flex items-center gap-1">
                                  <Link
                                    href={item.href}
                                    onMouseEnter={() => router.prefetch(item.href)}
                                    className={cn(
                                      "min-w-0 flex-1 flex items-center justify-between overflow-hidden p-2 rounded-lg transition-colors duration-200 group relative",
                                      isActive
                                        ? "bg-slate-50 text-brand-black font-bold"
                                        : "text-slate-400 hover:text-brand-black hover:bg-slate-50/50"
                                    )}
                                  >
                                  <div className="min-w-0 flex flex-1 items-center gap-3">
                                    <IconType className={cn(
                                      "w-3.5 h-3.5 transition-colors",
                                      isActive ? "text-brand-black" : "text-slate-300 group-hover:text-brand-black"
                                    )} />
                                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-tight">
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
                                    <div className="absolute -left-[18px] w-1 h-4 bg-brand-black rounded-full" />
                                  )}
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
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
            aria-label="Sign out"
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

