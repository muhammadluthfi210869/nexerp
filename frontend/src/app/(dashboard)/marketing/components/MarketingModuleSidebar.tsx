"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Users,
  Target,
  Video,
  Globe,
  Megaphone,
  ChevronLeft,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useMarketingBrands, useMarketingMembers, useMarketingTasks } from "@/hooks/useCanonicalMarketing";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

export const DIGITAL_CHANNELS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: InstagramIcon,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50 border border-pink-200",
    plannerChannel: "Instagram",
    reportTab: "weekly",
    desc: "Feed, Reels & Stories",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Video,
    iconColor: "text-cyan-400",
    iconBg: "bg-slate-900 text-white",
    plannerChannel: "TikTok",
    reportTab: "tiktok",
    desc: "Hooks, Sounds & Views",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: YoutubeIcon,
    iconColor: "text-red-600",
    iconBg: "bg-red-50 border border-red-200",
    plannerChannel: "YouTube",
    reportTab: "youtube",
    desc: "Shorts & Masterclass",
  },
  {
    id: "website",
    name: "Website & SEO",
    icon: Globe,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border border-emerald-200",
    plannerChannel: "Website",
    reportTab: "website",
    desc: "Tasks, SERP & Queries",
  },
  {
    id: "ads",
    name: "Paid Ads",
    icon: Megaphone,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border border-amber-200",
    plannerChannel: "Paid Ads",
    reportTab: "ads",
    desc: "Meta & Google Ads",
  },
];

const MEMBER_COLORS = [
  "#e0f2fe", "#fef3c7", "#dcfce7", "#f3e8ff", "#ffe4e6", "#f1f5f9", "#ffedd5"
];

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface MarketingModuleSidebarProps {
  activeMemberSlug?: string;
  activeBrandId?: string;
  activeChannel?: string;
  activeReportTab?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function MarketingModuleSidebar({
  activeMemberSlug,
  activeBrandId,
  activeChannel,
  activeReportTab,
  isCollapsed = false,
  onToggleCollapse,
}: MarketingModuleSidebarProps) {
  const router = useRouter();
  const membersQuery = useMarketingMembers();
  const brandsQuery = useMarketingBrands();
  const tasksQuery = useMarketingTasks({ page: 1, limit: 100 });

  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

  const members = membersQuery.data ?? [];
  const brands = brandsQuery.data ?? [];
  const tasks = tasksQuery.data?.data ?? [];

  const lateTasksCount = tasks.filter(
    (t) => !["DONE", "CANCELLED"].includes(t.status) && new Date(t.dueDate) < new Date()
  ).length;

  const toggleBrand = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBrands((prev) => ({
      ...prev,
      [brandId]: prev[brandId] === undefined ? false : !prev[brandId],
    }));
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-white border-r border-slate-200 flex flex-col shrink-0 py-4 items-center justify-between transition-all duration-300">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onToggleCollapse}
            title="Buka Menu Navigasi Marketing"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <PanelLeftOpen className="w-5 h-5 text-blue-600" />
          </button>

          <Link
            href="/marketing/management-task/overview"
            title="Management Task Overview"
            className={`p-2.5 rounded-xl transition ${
              activeMemberSlug === "overview"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
          </Link>

          <Link
            href="/marketing/social-tracker"
            title="Social Media Planner"
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Sparkles className="w-4 h-4" />
          </Link>

          <Link
            href="/marketing/social-tracker/reporting"
            title="Marketing Reporting"
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-[10px] font-black text-slate-300 transform -rotate-90 py-4">
          ERP MKT
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-300">
      {/* Module Workspace Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center font-black text-xs shadow-sm">
            DL
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
              Marketing Workspace
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
              <span>ERP CANONICAL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Sembunyikan Sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* SECTION 1: MANAGEMENT TASK */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              Management Task
            </span>
            {lateTasksCount > 0 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                {lateTasksCount} Late
              </span>
            )}
          </div>

          <div className="space-y-1">
            {/* Overview & All Tasks */}
            <Link
              href="/marketing/management-task/overview"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeMemberSlug === "overview"
                  ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Overview & Semua Task</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                {tasksQuery.data?.total ?? tasks.length}
              </span>
            </Link>

            {/* Team Members List */}
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3 text-slate-400" />
                Team Members ({members.length})
              </div>

              <div className="space-y-0.5 mt-1">
                {members.map((m, idx) => {
                  const mSlug = slug(m.fullName);
                  const isSelected = activeMemberSlug === mSlug;
                  const mTasks = tasks.filter((t) => t.assigneeId === m.id);
                  const mDone = mTasks.filter((t) => t.status === "DONE").length;
                  const mHasLate = mTasks.some(
                    (t) => !["DONE", "CANCELLED"].includes(t.status) && new Date(t.dueDate) < new Date()
                  );
                  const bgCol = MEMBER_COLORS[idx % MEMBER_COLORS.length];

                  return (
                    <Link
                      key={m.id}
                      href={`/marketing/management-task/${mSlug}`}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                        isSelected
                          ? "bg-blue-50 text-blue-800 font-bold border border-blue-200/80 shadow-xs"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-slate-800 shrink-0 border border-slate-200 shadow-2xs"
                          style={{ backgroundColor: bgCol }}
                        >
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate leading-tight font-medium text-[11px]">
                          {m.fullName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {mHasLate && (
                          <span
                            className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                            title="Ada task yang melewati deadline!"
                          />
                        )}
                        <span className="text-[10px] font-semibold text-slate-400">
                          {mDone}/{mTasks.length}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SOCIAL MEDIA BRANDS & CHANNELS */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Social Media Brands
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
              {brands.length} Brand
            </span>
          </div>

          <div className="space-y-2.5">
            {brands.map((brand) => {
              const isExpanded = expandedBrands[brand.id] !== false;
              const isBrandActive = activeBrandId === brand.id;

              return (
                <div
                  key={brand.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1.5 shadow-2xs"
                >
                  {/* Brand Row Header */}
                  <div
                    onClick={() => router.push(`/marketing/social-tracker?brand=${brand.id}`)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isBrandActive
                        ? "bg-white shadow-xs text-slate-900 font-bold border border-slate-200"
                        : "text-slate-800 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs"
                        style={{ backgroundColor: brand.accentToken || "#3b82f6" }}
                      >
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate leading-tight">{brand.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {brand.code || `@${brand.name.toLowerCase()}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleBrand(brand.id, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Submenus */}
                  {isExpanded && (
                    <div className="mt-2 pl-1 space-y-1.5">
                      {/* Leads Funnel Link */}
                      <Link
                        href={`/marketing/social-tracker/reporting?brand=${brand.id}&tab=funnel`}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                          activeBrandId === brand.id && activeReportTab === "funnel"
                            ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                            : "text-slate-700 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold">Leads Funnel</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                          GOALS
                        </span>
                      </Link>

                      {/* Executive Summary Link */}
                      <Link
                        href={`/marketing/social-tracker/reporting?brand=${brand.id}&tab=overview`}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                          activeBrandId === brand.id && (activeReportTab === "overview" || !activeReportTab)
                            ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                            : "text-slate-700 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Executive Summary</span>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          ALL
                        </span>
                      </Link>

                      {/* Digital Sub-Channels Grid */}
                      <div className="pt-1.5 border-t border-slate-200/80">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-1.5 flex items-center justify-between">
                          <span>Sub-Kanal Digital</span>
                          <span className="text-[8px] font-normal text-slate-400">Direct Action</span>
                        </div>

                        <div className="space-y-1.5">
                          {DIGITAL_CHANNELS.map((ch) => {
                            const isChActive =
                              activeBrandId === brand.id && activeChannel?.toLowerCase() === ch.id;

                            const Icon = ch.icon;

                            return (
                              <div
                                key={ch.id}
                                className={`rounded-lg border p-1.5 transition ${
                                  isChActive
                                    ? "bg-white border-blue-300 shadow-xs ring-1 ring-blue-100"
                                    : "bg-white/90 border-slate-200/70 hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${ch.iconBg}`}
                                    >
                                      <Icon className={`w-2.5 h-2.5 ${ch.iconColor}`} />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-800 truncate">
                                      {ch.name}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 truncate max-w-[70px]">
                                    {ch.desc}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                  <Link
                                    href={`/marketing/social-tracker?brand=${brand.id}&channel=${ch.plannerChannel}`}
                                    className="flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
                                  >
                                    <Calendar className="w-2.5 h-2.5 text-blue-600" />
                                    <span>Planner</span>
                                  </Link>

                                  <Link
                                    href={`/marketing/social-tracker/reporting?brand=${brand.id}&tab=${ch.reportTab}`}
                                    className="flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
                                  >
                                    <BarChart3 className="w-2.5 h-2.5 text-purple-600" />
                                    <span>Report</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-slate-500 text-[11px] flex items-center justify-between">
        <span className="font-semibold text-slate-700">NexERP Marketing</span>
        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Database Live
        </span>
      </div>
    </aside>
  );
}
