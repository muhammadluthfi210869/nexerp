"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  BarChart3,
  Beaker,
  LayoutDashboard,
  PlusCircle,
  Zap,
  History,
  LogOut,
  FileSearch,
  SearchX,
  PhoneCall,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubMenuItem {
  name: string;
  href: string;
  type: "dashboard" | "input" | "action" | "history";
  badge?: string;
  badgeVariant?: "default" | "warning" | "critical";
  children?: SubMenuItem[];
  /** Slug marketing member (aurel, revi, zarka, gusti, edy) — untuk filtering per-member */
  memberSlug?: string;
}

interface NavGroup {
  label: string;
  icon: any;
  items: SubMenuItem[];
  roles?: string[];     // role yang bisa lihat module ini
}

interface TierGroup {
  tier: string;
  groups: string[];
}

/* ─── MODULE REGISTRY ─────────────────────────────────── */

const MODULE_STRUCTURE: NavGroup[] = [
  {
    label: "DIGITAL MARKETING",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "MARKETING", "DIGIMAR", "HEAD_OPS"],
    items: [
      {
        name: "Management Task",
        href: "/marketing/management-task",
        type: "action",
        children: [
          { name: "Aurel", href: "/marketing/management-task/aurel", type: "action", memberSlug: "aurel" },
          { name: "Revita", href: "/marketing/management-task/revi", type: "action", memberSlug: "revi" },
          { name: "Zarkasi", href: "/marketing/management-task/zarka", type: "action", memberSlug: "zarka" },
          { name: "Gusti", href: "/marketing/management-task/gusti", type: "action", memberSlug: "gusti" },
          { name: "Luthfi", href: "/marketing/management-task/luthfi", type: "action", memberSlug: "luthfi" },
          { name: "Rahmat", href: "/marketing/management-task/rahmat", type: "action", memberSlug: "rahmat" },
        ],
      },
      { name: "Toribio Dashboard", href: "/marketing/toribio", type: "dashboard" },
      { name: "Lead Capture", href: "/marketing/lead-capture", type: "dashboard", badge: "NEW", badgeVariant: "default" },
    ]
  },
  {
    label: "RESEARCH & DEV",
    icon: Beaker,
    roles: ["SUPER_ADMIN", "RND", "HEAD_OPS"],
    items: [
      { name: "Analytics Trend", href: "/rnd/analytics", type: "dashboard" },
      { name: "Daily Tracking", href: "/rnd/daily-tracking", type: "action" },
      { name: "Project Monitoring", href: "/rnd/project-monitoring", type: "action" },
    ]
  },
];

/* ─── TIER HIERARCHY ──────────────────────────────────── */
const TIER_STRUCTURE: TierGroup[] = [
  { tier: "CORE INTELLIGENCE",   groups: ["DIGITAL MARKETING"] },
  { tier: "OPERATIONAL EXCELLENCE", groups: ["RESEARCH & DEV"] },
];

/* ─── HELPERS ─────────────────────────────────────────── */
const getIconByType = (type: string) => {
  switch (type) {
    case "dashboard": return LayoutDashboard;
    case "input":    return PlusCircle;
    case "action":   return Zap;
    case "history":  return History;
    default:         return LayoutDashboard;
  }
};

const getBadgeStyle = (variant?: string) => {
  switch (variant) {
    case "warning":  return "bg-amber-50 text-amber-600";
    case "critical": return "bg-red-50 text-red-600";
    default:         return "bg-sidebar-accent text-sidebar-accent-foreground";
  }
};

/* ─── MARKETING VIEWER ─────────────────────────────── */
// Mirror backend resolveViewer logic agar sidebar bisa filter per-member.
const managerRoleSet = new Set(['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING']);

const marketingAliases: Record<string, string[]> = {
  revi: ['revita', 'revi', 'fadhilah', 'nisa'],
  zarka: ['zarkasi', 'zarka'],
  gusti: ['gusti'],
  aurel: ['aurel'],
  edy: ['edy'],
  luthfi: ['luthfi'],
  rahmat: ['rahmat'],
};

function computeMarketingViewer(user: any): { slug: string | null; isManager: boolean } {
  const email = ((user?.email ?? '') as string).toLowerCase().trim();
  const fullName = ((user?.fullName ?? '') as string).toLowerCase().trim();
  const roles: string[] = user?.roles ?? [];

  // Determine member slug from email or fullName
  let slug: string | null = null;
  for (const [aliasSlug, aliases] of Object.entries(marketingAliases)) {
    if (aliases.includes(fullName) || aliases.some((a) => email.startsWith(a + '@'))) {
      slug = aliasSlug;
      break;
    }
  }

  const isManager =
    email.startsWith('revita@') ||
    email.startsWith('zaki@') ||
    email.startsWith('admin@') ||
    email.startsWith('nisa@') ||
    roles.some((r) => managerRoleSet.has(r));

  return { slug, isManager };
}

/* ─── COMPONENT ───────────────────────────────────────── */
type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const isSearching = normalizedQuery.length > 0;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  /* ── Filter module by user role + marketing member scope ── */
  const visibleModules = useMemo(() => {
    if (!user) return MODULE_STRUCTURE; // belum login, show all
    const userRoles: string[] = user.roles ?? [];
    const { slug, isManager } = computeMarketingViewer(user);

    // Step 1: filter by module-level roles
    const modules = MODULE_STRUCTURE.filter(g => {
      if (!g.roles) return true;
      return g.roles.some(r => userRoles.includes(r));
    });

    // Step 2: within DIGITAL MARKETING, filter Management Task children
    //         untuk non-manager -> hanya page dia sendiri
    return modules.map(mod => {
      if (mod.label !== 'DIGITAL MARKETING') return mod;
      if (isManager) return mod; // manager sees all

      const filteredItems = mod.items.map(item => {
        // Hanya Management Task yang perlu filtering children-nya
        if (item.name !== 'Management Task' || !item.children) return item;

        const filteredChildren = item.children.filter((child) => {
          // Untuk non-manager: hanya page yang sesuai slug-nya
          if (!child.memberSlug) return false;
          return child.memberSlug === slug;
        });

        return { ...item, children: filteredChildren };
      }).filter(item => {
        // Management Task tanpa children yang relevan -> hidden
        if (item.name === 'Management Task' && item.children && item.children.length === 0) return false;
        return true;
      });

      return { ...mod, items: filteredItems };
    });
  }, [user]);

  /* ── Normal: pastikan grup aktif tetap terbuka — tanpa nutup grup lain ── */
  useEffect(() => {
    if (isSearching) return;
    const activeGroup = visibleModules.find(group =>
      group.items.some(item =>
        item.href === pathname ||
        item.children?.some(c => c.href === pathname)
      )
    );
    if (activeGroup) {
      setOpenGroups(prev =>
        prev.includes(activeGroup.label) ? prev : [...prev, activeGroup.label]
      );
    }
    // Auto-open parent item whose child is active
    const activeParent = visibleModules
      .flatMap(g => g.items)
      .find(item => item.children?.some(c => c.href === pathname));
    if (activeParent) {
      setOpenItems(prev =>
        prev.includes(activeParent.href) ? prev : [...prev, activeParent.href]
      );
    }
  }, [pathname, isSearching, visibleModules]);

  /* ── Search: auto-open matching groups ── */
  useEffect(() => {
    if (!isSearching) return; // normal effect already handles openGroups additively
    const matchingLabels = visibleModules
      .filter(g =>
        g.label.toLowerCase().includes(normalizedQuery) ||
        g.items.some(item =>
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.children?.some(c => c.name.toLowerCase().includes(normalizedQuery))
        )
      )
      .map(g => g.label);
    setOpenGroups(matchingLabels);
  }, [normalizedQuery, isSearching, visibleModules, pathname]);

  const toggleGroup = (label: string) => {
    if (isSearching) return;
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const toggleItem = (href: string) => {
    setOpenItems(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax;";
    window.location.href = "/login";
  };

  const clearSearch = () => setSearchQuery("");

  /* ── Build filtered tier tree ── */
  const filteredTiers = useMemo(() => {
    return TIER_STRUCTURE
      .map(tier => {
        const tierGroups = visibleModules
          .filter(g => tier.groups.includes(g.label))
          .map(g => {
            if (!isSearching) return g;
            const filteredItems = g.items.filter(item =>
              g.label.toLowerCase().includes(normalizedQuery) ||
              item.name.toLowerCase().includes(normalizedQuery) ||
              item.children?.some(c => c.name.toLowerCase().includes(normalizedQuery))
            ).map(item => {
              if (!item.children || isSearching) return item;
              const filteredChildren = item.children.filter(c =>
                c.name.toLowerCase().includes(normalizedQuery)
              );
              return filteredChildren.length < item.children.length
                ? { ...item, children: filteredChildren }
                : item;
            });
            return { ...g, items: filteredItems };
          })
          .filter(g => !isSearching || g.items.length > 0);
        return { ...tier, groups: tierGroups };
      })
      .filter(t => t.groups.length > 0);
  }, [isSearching, normalizedQuery, visibleModules]);

  const totalFilteredItems = filteredTiers.reduce(
    (sum, t) => sum + t.groups.reduce((s, g) => s + g.items.length, 0), 0
  );

  /* ── Get display role ── */
  const displayRole = user?.roles?.includes("RND") ? "R&D Staff"
    : user?.roles?.includes("SUPER_ADMIN") ? "Super Admin"
    : user?.roles?.includes("MARKETING") || user?.roles?.includes("DIGIMAR") ? "Marketing"
    : user?.roles?.includes("HR") ? "HR"
    : "Staff";

  const handleNavigate = () => {
    if (isSearching) clearSearch();
    onClose?.();
  };

  return (
    <>
    {isOpen && (
      <button
        type="button"
        aria-label="Close navigation menu"
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
    )}
    <aside
      className={cn(
        "sidebar-root bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* ═══ BRAND — VISUAL_DNA §1 dashboard-title ═══ */}
      <div className="px-7 pt-7 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-[46px] h-[46px] rounded-[16px] overflow-hidden shadow-lg shadow-slate-200/60 ring-[3px] ring-gray-50 flex items-center justify-center bg-white shrink-0">
            <img src="/nexerp-logo.jpeg" alt="NEX ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] tracking-[-0.05em] text-gray-900 uppercase leading-none" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}>
              NEX <span style={{ fontWeight: 700 }} className="text-gray-400">ERP</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] text-gray-400 mt-1.5" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}>
              Production Light
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══ COMMAND SEARCH — VISUAL_DNA body text ═══ */}
      <div className="px-6 pb-5">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <FileSearch className="w-[15px] h-[15px] text-gray-300 group-focus-within:text-gray-500 transition-colors duration-150" />
          </div>
          <input
            type="text"
            placeholder="Cari menu..."
            className="w-full bg-gray-50 border border-gray-100 rounded-[14px] py-2.5 pl-10 pr-9 text-[13px] tracking-[-0.01em] text-gray-700 focus:outline-none focus:ring-[3px] focus:ring-gray-100 focus:bg-white focus:border-gray-200 transition-all duration-150 placeholder:text-gray-300"
            style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 600 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500 transition-colors duration-150"
              aria-label="Clear search"
            >
              <SearchX className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ NAVIGATION — TIER STRUCTURE ═══ */}
      <nav className="flex-1 overflow-y-auto px-5 pb-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
        {isSearching && totalFilteredItems === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <SearchX className="w-10 h-10 text-gray-300 mb-4" />
            <p className="text-[13px] tracking-[-0.01em] text-gray-400" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 600 }}>
              Tidak ada menu untuk &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-4 px-5 py-2.5 rounded-[12px] text-[10px] uppercase tracking-[0.1em] text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150"
              style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}
            >
              Hapus pencarian
            </button>
          </div>
        ) : (
          filteredTiers.map((tier) => (
            <div key={tier.tier} className="space-y-3">
              {/* Tier separator — VISUAL_DNA §1 micro-label */}
              <div className="flex items-center gap-3 px-1">
                <div className="h-[1px] flex-1 bg-gray-100" />
                <span className="text-[9px] uppercase tracking-[0.1em] text-gray-400 shrink-0" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}>
                  {tier.tier}
                </span>
                <div className="h-[1px] flex-1 bg-gray-100" />
              </div>

              {/* Module groups */}
              <div className="space-y-1">
                {tier.groups.map((group) => {
                  const Icon = group.icon;
                  const isGroupActive = group.items.some(i =>
                    i.href === pathname || i.children?.some(child => child.href === pathname)
                  );
                  const isOpen = openGroups.includes(group.label);

                  return (
                    <div key={group.label}>
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-[14px] transition-all duration-150",
                          "text-[13.5px] tracking-[-0.01em]",
                          isGroupActive
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        )}
                        style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 600 }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn(
                            "w-[18px] h-[18px]",
                            isGroupActive ? "text-white" : "text-slate-400"
                          )} />
                          <span style={{ fontWeight: 600 }}>{group.label}</span>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-150",
                          isOpen && "rotate-180",
                          isGroupActive ? "text-white/60" : "text-slate-300"
                        )} />
                      </button>

                      {isOpen && group.items.length > 0 && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l-[1.5px] border-gray-100 pl-4">
                          {group.items.map((item) => {
                            const ItemIcon = getIconByType(item.type);
                            const isActive = pathname === item.href;
                            const hasChildren = item.children && item.children.length > 0;
                            const isItemOpen = openItems.includes(item.href);

                            // If has children → render as collapsible parent
                            if (hasChildren) {
                              const anyChildActive = item.children!.some(c => c.href === pathname);
                              return (
                                <div key={item.href}>
                                  <button
                                    onClick={() => {
                                      if (isSearching) return;
                                      toggleItem(item.href);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] transition-all duration-150",
                                      "text-[12px] tracking-[-0.01em]",
                                      anyChildActive
                                        ? "text-slate-900 bg-slate-100"
                                        : "text-slate-400 hover:text-slate-600"
                                    )}
                                    style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: anyChildActive ? 700 : 600 }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span style={{ fontWeight: anyChildActive ? 700 : 600 }}>{item.name}</span>
                                    </div>
                                    <ChevronDown className={cn(
                                      "w-3.5 h-3.5 transition-transform duration-150",
                                      isItemOpen && "rotate-180",
                                      "text-slate-300"
                                    )} />
                                  </button>
                                  {isItemOpen && (
                                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-[1.5px] border-gray-100 pl-3">
                                      {item.children!.map((child) => {
                                        const ChildIcon = getIconByType(child.type);
                                        const isChildActive = pathname === child.href;
                                        return (
                                          <Link key={child.href} href={child.href} onClick={handleNavigate}>
                                            <div className={cn(
                                              "flex items-center gap-3 px-4 py-2 rounded-[10px] transition-all duration-150",
                                              "text-[11.5px] tracking-[-0.01em]",
                                              isChildActive
                                                ? "text-slate-900 bg-slate-100"
                                                : "text-slate-400 hover:text-slate-600"
                                            )}
                                              style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: isChildActive ? 700 : 500 }}
                                            >
                                              <ChildIcon className={cn(
                                                "w-[13px] h-[13px]",
                                                isChildActive ? "text-slate-900" : "text-slate-300"
                                              )} />
                                              <span style={{ fontWeight: isChildActive ? 700 : 500 }}>{child.name}</span>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Regular item (no children) — render as link
                            return (
                              <Link key={item.href} href={item.href} onClick={handleNavigate}>
                                <div className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all duration-150",
                                  "text-[12px] tracking-[-0.01em]",
                                  isActive
                                    ? "text-slate-900 bg-slate-100"
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                                  style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: isActive ? 700 : 600 }}
                                >
                                  <ItemIcon className={cn(
                                    "w-[15px] h-[15px]",
                                    isActive ? "text-slate-900" : "text-slate-300"
                                  )} />
                                  <span className="flex-1" style={{ fontWeight: isActive ? 700 : 600 }}>{item.name}</span>
                                  {item.badge && (
                                    <span className={cn(
                                      "text-[9px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-[8px]",
                                      getBadgeStyle(item.badgeVariant)
                                    )}
                                      style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      {isOpen && group.items.length === 0 && isSearching && (
                        <div className="ml-4 mt-1 pl-4 border-l-[1.5px] border-gray-100">
                          <div className="px-4 py-3 text-[10px] text-gray-400 tracking-[-0.01em]" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 500 }}>
                            Tidak ada menu yang cocok
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* ═══ USER INFO + LOGOUT — VISUAL_DNA §1 ═══ */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-[16px] bg-gray-50">
            <div className="w-9 h-9 rounded-[12px] bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-[13px] text-gray-600 uppercase" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}>
                {(user.fullName || user.email || "?").charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] tracking-[-0.01em] text-gray-700 truncate leading-tight" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 600 }}>
                {user.fullName || user.email}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 900 }}>
                {displayRole}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[12px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          style={{ fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif", fontWeight: 600 }}
        >
          <LogOut className="w-[15px] h-[15px]" />
          <span style={{ fontWeight: 600 }}>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
