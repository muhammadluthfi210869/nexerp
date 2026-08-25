"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Activity, BarChart3, Beaker, ChevronRight, Cog, Factory, FileSearch,
  Landmark, Scale, ShieldAlert, Truck, Users, Warehouse, Zap,
  Heart, AlertOctagon, Bell, ArrowRightLeft, ArrowUp, FileText,
  Lock, Briefcase, TrendingDown, DollarSign, Clock, TrendingUp,
  BookOpen, AlertTriangle, GitCompare, Scan, Package, Droplets,
  Trash2, Ban, ClipboardList, Star, Wallet, Barcode, Box, ArrowUpRight,
  ArrowUpFromLine
} from "lucide-react";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
} from "@/components/operational";

interface AutomationItem {
  slug: string;
  title: string;
  fase: number;
  type: "Non-AI" | "AI";
  status: "ready" | "config";
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
      { slug: "system/audit-trail", title: "Audit Trail Otomatis", fase: 0, type: "Non-AI", status: "ready", icon: FileSearch },
      { slug: "system/access-control", title: "Access Control Auto-Provisioning", fase: 0, type: "Non-AI", status: "ready", icon: ShieldAlert },
      { slug: "finance/tax-invoice", title: "Auto Tax Invoice Number", fase: 0, type: "Non-AI", status: "ready", icon: FileText },
      { slug: "finance/period-close", title: "Period Auto-Close", fase: 0, type: "Non-AI", status: "ready", icon: Lock },
    ]
  },
  {
    name: "BussDev",
    icon: Briefcase,
    items: [
      { slug: "bussdev/auto-invoice", title: "Auto DO + Invoice from SO", fase: 1, type: "Non-AI", status: "ready", icon: FileText },
      { slug: "bussdev/komisi-sales", title: "Auto Komisi Sales", fase: 1, type: "Non-AI", status: "config", icon: DollarSign },
      { slug: "bussdev/churn-prediction", title: "Churn Prediction", fase: 5, type: "AI", status: "ready", icon: TrendingDown },
    ]
  },
  {
    name: "Finance",
    icon: Landmark,
    items: [
      { slug: "finance/piutang-notif", title: "Piutang Aging Auto-Notif", fase: 1, type: "Non-AI", status: "ready", icon: Bell },
      { slug: "finance/denda-keterlambatan", title: "Auto Denda Keterlambatan", fase: 1, type: "Non-AI", status: "config", icon: Clock },
      { slug: "finance/margin-alert", title: "Margin Protection Alert", fase: 1, type: "Non-AI", status: "config", icon: TrendingUp },
      { slug: "finance/coa-generator", title: "COA Auto Generator", fase: 2, type: "Non-AI", status: "ready", icon: BookOpen },
      { slug: "finance/invoice-generator", title: "Invoice Generator (PDF)", fase: 2, type: "Non-AI", status: "config", icon: FileText },
      { slug: "finance/over-budget", title: "Over Budget Notification", fase: 2, type: "Non-AI", status: "ready", icon: AlertTriangle },
      { slug: "finance/ap-ar-match", title: "AP/AR Auto-Matching", fase: 5, type: "AI", status: "ready", icon: GitCompare },
      { slug: "finance/auto-jurnal-ocr", title: "Auto Jurnal OCR", fase: 5, type: "AI", status: "config", icon: Scan },
    ]
  },
  {
    name: "Warehouse",
    icon: Warehouse,
    items: [
      { slug: "warehouse/reorder-alert", title: "Auto Reorder Point Alert", fase: 1, type: "Non-AI", status: "ready", icon: Bell },
      { slug: "warehouse/fifo-fefo", title: "FIFO/FEFO Suggestion", fase: 1, type: "Non-AI", status: "ready", icon: ArrowUpFromLine },
      { slug: "warehouse/auto-barcode", title: "Auto Barcode/Label", fase: 2, type: "Non-AI", status: "config", icon: Barcode },
    ]
  },
  {
    name: "Production",
    icon: Factory,
    items: [
      { slug: "production/material-deduct", title: "Material Consumption Auto Deduct", fase: 2, type: "Non-AI", status: "ready", icon: Package },
      { slug: "production/leakage-alert", title: "Production Leakage Auto-Alert", fase: 2, type: "Non-AI", status: "ready", icon: Droplets },
      { slug: "production/scrap-tracking", title: "Scrap/Waste Auto Tracking", fase: 2, type: "Non-AI", status: "ready", icon: Trash2 },
      { slug: "production/utility-monitor", title: "Utility Monitoring per Batch", fase: 2, type: "Non-AI", status: "config", icon: Zap },
      { slug: "production/reject-stop", title: "Auto Reject Stop", fase: 2, type: "Non-AI", status: "config", icon: Ban },
      { slug: "production/mass-balance", title: "Mass Balance Automation", fase: 3, type: "Non-AI", status: "ready", icon: Scale },
      { slug: "production/oee", title: "OEE Dashboard", fase: 3, type: "Non-AI", status: "ready", icon: BarChart3 },
    ]
  },
  {
    name: "SCM",
    icon: Truck,
    items: [
      { slug: "scm/auto-mrp", title: "Auto MRP Generation", fase: 3, type: "Non-AI", status: "ready", icon: ClipboardList },
      { slug: "scm/supplier-score", title: "Supplier Performance Score", fase: 3, type: "Non-AI", status: "ready", icon: Star },
    ]
  },
  {
    name: "HR & All Divisions",
    icon: Users,
    items: [
      { slug: "hr/kpi-score", title: "KPI Auto Score", fase: 2, type: "Non-AI", status: "ready", icon: Activity },
      { slug: "hr/auto-payroll", title: "Auto Payroll", fase: 3, type: "Non-AI", status: "ready", icon: Wallet },
    ]
  },
  {
    name: "Executive",
    icon: BarChart3,
    items: [
      { slug: "executive/health-dashboard", title: "Executive Health Dashboard", fase: 4, type: "Non-AI", status: "ready", icon: Heart },
      { slug: "executive/anomaly-detection", title: "Anomaly Detection", fase: 4, type: "Non-AI", status: "ready", icon: AlertOctagon },
    ]
  },
  {
    name: "System",
    icon: Cog,
    items: [
      { slug: "system/notification-engine", title: "Notification Engine", fase: 3, type: "Non-AI", status: "ready", icon: Bell },
      { slug: "system/inter-dept", title: "Inter-Dept Handover", fase: 1, type: "Non-AI", status: "ready", icon: ArrowRightLeft },
      { slug: "system/approval-escalation", title: "Approval Escalation", fase: 2, type: "Non-AI", status: "config", icon: ArrowUp },
    ]
  },
  {
    name: "Legality",
    icon: Scale,
    items: [
      { slug: "legality/contract-extractor", title: "Contract Clause Extractor", fase: 5, type: "AI", status: "config", icon: FileSearch },
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
  const router = useRouter();
  const totalNonAI = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.type === "Non-AI").length, 0);
  const totalAI = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.type === "AI").length, 0);
  const totalReady = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.status === "ready").length, 0);
  const totalConfig = AUTOMATIONS.reduce((sum, g) => sum + g.items.filter(i => i.status === "config").length, 0);
  const totalItems = AUTOMATIONS.reduce((s, g) => s + g.items.length, 0);

  return (
    <OperationalPageShell
      title="Automation Engine"
      subtitle={`34 Automations · ${totalNonAI} Non-AI · ${totalAI} AI/Hybrid · ${totalReady} Data Ready · ${totalConfig} Needs Config`}
    >
      {/* Fase Progress Cards */}
      <OperationalMetricGrid>
        {FASE_INFO.map((f) => {
          const count = AUTOMATIONS.reduce((s, g) => s + g.items.filter(i => i.fase === f.fase).length, 0);
          return (
            <OperationalMetricCard
              key={f.fase}
              label={f.label}
              value={count}
              helper={`Fase ${f.fase} · ${f.desc}`}
              tone={f.fase === 5 ? "purple" : f.fase >= 3 ? "blue" : "neutral"}
            />
          );
        })}
      </OperationalMetricGrid>

      {/* Per Division Grid */}
      <div className="operational-stack">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {AUTOMATIONS.map((group) => (
            <OperationalPanel key={group.name}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <group.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{group.name}</h3>
                </div>
                <OperationalStatusBadge status="process">{group.items.length}</OperationalStatusBadge>
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.slug}
                    onClick={() => router.push(`/automation/${item.slug}`)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                            Fase {item.fase}
                          </span>
                          <span className="text-[8px] text-slate-300">·</span>
                          <OperationalStatusBadge status={item.type === "AI" ? "purple" : "success"}>
                            {item.type}
                          </OperationalStatusBadge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <OperationalStatusBadge status={item.status === "ready" ? "success" : "pending"}>
                        {item.status === "ready" ? "Ready" : "Config"}
                      </OperationalStatusBadge>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </OperationalPanel>
          ))}
        </div>
      </div>

      {/* Legend Card */}
      <OperationalPanel>
        <div className="flex flex-wrap gap-6 text-[12px]">
          <div className="flex items-center gap-2">
            <OperationalStatusBadge status="success">Data Ready</OperationalStatusBadge>
            <span className="text-slate-500">Data sudah ada, tinggal logic</span>
          </div>
          <div className="flex items-center gap-2">
            <OperationalStatusBadge status="pending">Needs Config</OperationalStatusBadge>
            <span className="text-slate-500">Butuh setting awal (1x)</span>
          </div>
          <div className="flex items-center gap-2">
            <OperationalStatusBadge status="purple">AI / Hybrid</OperationalStatusBadge>
            <span className="text-slate-500">Pakai AI (bisa local LLM)</span>
          </div>
          <div className="flex items-center gap-2">
            <OperationalStatusBadge status="process">Non-AI</OperationalStatusBadge>
            <span className="text-slate-500">Logic murni, tanpa API AI</span>
          </div>
        </div>
      </OperationalPanel>
    </OperationalPageShell>
  );
}
