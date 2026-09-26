"use client";

import React from "react";
import {
  Activity, BarChart3, Beaker, Cog, Factory, FileSearch,
  Landmark, Scale, ShieldAlert, Truck, Users, Warehouse, Zap,
  Heart, AlertOctagon, Bell, ArrowRightLeft, ArrowUp, FileText,
  Lock, Briefcase, TrendingDown, DollarSign, Clock, TrendingUp,
  BookOpen, AlertTriangle, GitCompare, Scan, Package, Droplets,
  Trash2, Ban, ClipboardList, Star, Wallet, Barcode, Box, ArrowUpRight,
  ArrowUpFromLine
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardCard } from "@/components/dna/DashboardCard";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { StatCard } from "@/components/dna/StatCard";
import { MetricRow } from "@/components/dna/MetricRow";

// Katalog roadmap otomasi (rencana fase, bukan status implementasi).
// TIDAK ada kolom status: backend belum mengekspos status per-automation,
// jadi angka "ready"/"config" yang dulu dipakai sudah dihapus.
interface AutomationItem {
  slug: string;
  title: string;
  fase: number;
  type: "Non-AI" | "AI";
  icon: any;
}

interface DivisionGroup {
  name: string;
  icon: any;
  items: AutomationItem[];
}

const AUTOMATIONS: DivisionGroup[] = [
  {
    name: "Foundation",
    icon: ShieldAlert,
    items: [
      { slug: "system/audit-trail", title: "Audit Trail Otomatis", fase: 0, type: "Non-AI", icon: FileSearch },
      { slug: "system/access-control", title: "Access Control Auto-Provisioning", fase: 0, type: "Non-AI", icon: ShieldAlert },
      { slug: "finance/tax-invoice", title: "Auto Tax Invoice Number", fase: 0, type: "Non-AI", icon: FileText },
      { slug: "finance/period-close", title: "Period Auto-Close", fase: 0, type: "Non-AI", icon: Lock },
    ]
  },
  {
    name: "BussDev",
    icon: Briefcase,
    items: [
      { slug: "bussdev/auto-invoice", title: "Auto DO + Invoice from SO", fase: 1, type: "Non-AI", icon: FileText },
      { slug: "bussdev/komisi-sales", title: "Auto Komisi Sales", fase: 1, type: "Non-AI", icon: DollarSign },
      { slug: "bussdev/churn-prediction", title: "Churn Prediction", fase: 5, type: "AI", icon: TrendingDown },
    ]
  },
  {
    name: "Finance",
    icon: Landmark,
    items: [
      { slug: "finance/piutang-notif", title: "Piutang Aging Auto-Notif", fase: 1, type: "Non-AI", icon: Bell },
      { slug: "finance/denda-keterlambatan", title: "Auto Denda Keterlambatan", fase: 1, type: "Non-AI", icon: Clock },
      { slug: "finance/margin-alert", title: "Margin Protection Alert", fase: 1, type: "Non-AI", icon: TrendingUp },
      { slug: "finance/coa-generator", title: "COA Auto Generator", fase: 2, type: "Non-AI", icon: BookOpen },
      { slug: "finance/invoice-generator", title: "Invoice Generator (PDF)", fase: 2, type: "Non-AI", icon: FileText },
      { slug: "finance/over-budget", title: "Over Budget Notification", fase: 2, type: "Non-AI", icon: AlertTriangle },
      { slug: "finance/ap-ar-match", title: "AP/AR Auto-Matching", fase: 5, type: "AI", icon: GitCompare },
      { slug: "finance/auto-jurnal-ocr", title: "Auto Jurnal OCR", fase: 5, type: "AI", icon: Scan },
    ]
  },
  {
    name: "Warehouse",
    icon: Warehouse,
    items: [
      { slug: "warehouse/reorder-alert", title: "Auto Reorder Point Alert", fase: 1, type: "Non-AI", icon: Bell },
      { slug: "warehouse/fifo-fefo", title: "FIFO/FEFO Suggestion", fase: 1, type: "Non-AI", icon: ArrowUpFromLine },
      { slug: "warehouse/auto-barcode", title: "Auto Barcode/Label", fase: 2, type: "Non-AI", icon: Barcode },
    ]
  },
  {
    name: "Production",
    icon: Factory,
    items: [
      { slug: "production/material-deduct", title: "Material Consumption Auto Deduct", fase: 2, type: "Non-AI", icon: Package },
      { slug: "production/leakage-alert", title: "Production Leakage Auto-Alert", fase: 2, type: "Non-AI", icon: Droplets },
      { slug: "production/scrap-tracking", title: "Scrap/Waste Auto Tracking", fase: 2, type: "Non-AI", icon: Trash2 },
      { slug: "production/utility-monitor", title: "Utility Monitoring per Batch", fase: 2, type: "Non-AI", icon: Zap },
      { slug: "production/reject-stop", title: "Auto Reject Stop", fase: 2, type: "Non-AI", icon: Ban },
      { slug: "production/mass-balance", title: "Mass Balance Automation", fase: 3, type: "Non-AI", icon: Scale },
      { slug: "production/oee", title: "OEE Dashboard", fase: 3, type: "Non-AI", icon: BarChart3 },
    ]
  },
  {
    name: "SCM",
    icon: Truck,
    items: [
      { slug: "scm/auto-mrp", title: "Auto MRP Generation", fase: 3, type: "Non-AI", icon: ClipboardList },
      { slug: "scm/supplier-score", title: "Supplier Performance Score", fase: 3, type: "Non-AI", icon: Star },
    ]
  },
  {
    name: "HR & All Divisions",
    icon: Users,
    items: [
      { slug: "hr/kpi-score", title: "KPI Auto Score", fase: 2, type: "Non-AI", icon: Activity },
      { slug: "hr/auto-payroll", title: "Auto Payroll", fase: 3, type: "Non-AI", icon: Wallet },
    ]
  },
  {
    name: "Executive",
    icon: BarChart3,
    items: [
      { slug: "executive/health-dashboard", title: "Executive Health Dashboard", fase: 4, type: "Non-AI", icon: Heart },
      { slug: "executive/anomaly-detection", title: "Anomaly Detection", fase: 4, type: "Non-AI", icon: AlertOctagon },
    ]
  },
  {
    name: "System",
    icon: Cog,
    items: [
      { slug: "system/notification-engine", title: "Notification Engine", fase: 3, type: "Non-AI", icon: Bell },
      { slug: "system/inter-dept", title: "Inter-Dept Handover", fase: 1, type: "Non-AI", icon: ArrowRightLeft },
      { slug: "system/approval-escalation", title: "Approval Escalation", fase: 2, type: "Non-AI", icon: ArrowUp },
    ]
  },
  {
    name: "Legality",
    icon: Scale,
    items: [
      { slug: "legality/contract-extractor", title: "Contract Clause Extractor", fase: 5, type: "AI", icon: FileSearch },
    ]
  }
];

const FASE_INFO = [
  { fase: 0, label: "Foundation", desc: "Wajib — enterprise ready" },
  { fase: 1, label: "Revenue & Speed", desc: "Cash flow impact" },
  { fase: 2, label: "Efficiency & Control", desc: "Operational savings" },
  { fase: 3, label: "Operational Excellence", desc: "Systematic operations" },
  { fase: 4, label: "Executive Visibility", desc: "Real-time insights" },
  { fase: 5, label: "AI / Hybrid", desc: "Intelligent optimization" },
];

export default function AutomationOverviewPage() {
  const totalNonAI = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.type === "Non-AI").length, 0);
  const totalAI = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.type === "AI").length, 0);
  const totalItems = totalNonAI + totalAI;

  // Satu-satunya angka otomasi NYATA yang diekspos backend saat ini:
  // status draft dokumen otomatis. GET /document-automation/drafts/stats
  const draftsStats = useQuery<{
    total?: number; drafts?: number; reviewing?: number;
    approved?: number; rejected?: number; converted?: number;
  }>({
    queryKey: ["document-automation-drafts-stats"],
    queryFn: async () => (await api.get("/document-automation/drafts/stats")).data,
    staleTime: 30_000,
  });

  const s = draftsStats.data;
  const statsUnavailable = draftsStats.isError || !s;

  return (
    <DashboardShell
      title="Automation Engine"
      titleAccent={`${totalItems} Roadmap Items`}
      subtitle={`${totalNonAI} Non-AI · ${totalAI} AI/Hybrid · katalog roadmap, status implementasi tidak diekspos backend`}
    >
      {/* Live automation counters — dari backend, bukan karangan. */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Draft Dokumen"
          value={draftsStats.isLoading ? "…" : statsUnavailable ? "—" : String(s?.total ?? 0)}
          subValue="GET /document-automation/drafts/stats"
        />
        <StatCard
          label="Menunggu Review"
          value={draftsStats.isLoading ? "…" : statsUnavailable ? "—" : String(s?.reviewing ?? 0)}
          subValue="status REVIEWING"
        />
        <StatCard
          label="Terkonversi"
          value={draftsStats.isLoading ? "…" : statsUnavailable ? "—" : String(s?.converted ?? 0)}
          subValue="status CONVERTED"
        />
      </div>

      {/* Fase Progress Cards — hitungan katalog roadmap (bukan status implementasi) */}
      <div className="grid grid-cols-6 gap-4">
        {FASE_INFO.map((f) => {
          const count = AUTOMATIONS.reduce((s, g) => s + g.items.filter(i => i.fase === f.fase).length, 0);
          return (
            <StatCard
              key={f.fase}
              label={f.label}
              value={String(count)}
              subValue={`Fase ${f.fase}`}
            />
          );
        })}
      </div>

      {/* Per Division Grid — katalog referensi, tidak bisa diklik: route
          /automation/<slug> belum ada di frontend maupun backend. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AUTOMATIONS.map((group) => (
          <DashboardCard key={group.name}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <group.icon className="w-4 h-4 text-slate-600" />
                </div>
                <SectionLabel>{group.name}</SectionLabel>
              </div>
              <DnaBadge status="info">{group.items.length}</DnaBadge>
            </div>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-700">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          Fase {item.fase}
                        </span>
                        <span className="text-[8px] text-slate-300">·</span>
                        <DnaBadge status={item.type === "AI" ? "purple" : "success"}>{item.type}</DnaBadge>
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">{item.slug}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Legend Card */}
      <DashboardCard label="Legend">
        <div className="flex flex-wrap gap-6 text-[12px]">
          <div className="flex items-center gap-2">
            <DnaBadge status="purple">AI / Hybrid</DnaBadge>
            <span className="text-slate-500">Pakai AI (bisa local LLM)</span>
          </div>
          <div className="flex items-center gap-2">
            <DnaBadge status="success">Non-AI</DnaBadge>
            <span className="text-slate-500">Logic murni, tanpa API AI</span>
          </div>
          <div className="flex items-center gap-2">
            <DnaBadge status="info">Roadmap</DnaBadge>
            <span className="text-slate-500">Rencana fase, bukan status implementasi</span>
          </div>
        </div>
      </DashboardCard>
    </DashboardShell>
  );
}
