"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Users,
  Activity as ActivityIcon,
  Calendar,
  Target,
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Timer,
  Award,
  RefreshCw,
  Star,
  AlertTriangle,
  ArrowUpRight,
  Factory,
  XCircle,
  Percent,
  BarChart3,
  Shield,
  Clock,
  Music,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Droplets,
  TrendingDown,
  ChevronRight,
  Trophy
} from "lucide-react";

interface DashboardCardsProps {
  variant: 'guest' | 'sample' | 'production' | 'ro' | 'dashboard' | 'lost' | 'pipeline';
  data: any;
}

// Helper to format currency
function formatRupiah(value: number): string {
  if (!value) return "—";
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}k`;
  return `Rp ${value.toLocaleString()}`;
}

export function DashboardCards({ variant, data }: DashboardCardsProps) {
  if (!data && variant === 'dashboard') {
    return null;
  }

  // 🔴 1. MAIN BD DASHBOARD
  if (variant === 'dashboard') {
    const overview = data?.overview || {};
    const revenue = data?.revenuePipeline || {};
    const activity = data?.activityPerformance || {};
    const alerts = data?.criticalAlerts || {};

    const contactRate = overview.contactRate ?? 68;
    const sampleRate = overview.sampleRate ?? 25;
    const dpRate = overview.dpRate ?? 50;
    const dealRate = overview.dealRate ?? 77;
    const retentionRate = overview.retentionRate ?? 49;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        {/* Card A: Funnel Overview */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
              🔴 A. FUNNEL OVERVIEW
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Total Leads", val: overview.totalLeads ? String(overview.totalLeads) : "1,245", sub: "Inflow" },
              { label: "Leads Contacted", val: overview.leadsContacted ? String(overview.leadsContacted) : "850", sub: `${contactRate}%`, highlight: true },
              { label: "Sample Process", val: overview.sampleProcess ? String(overview.sampleProcess) : "220", sub: `${sampleRate}%` },
              { label: "DP Received", val: overview.dpReceived ? String(overview.dpReceived) : "110", sub: `${dpRate}%` },
              { label: "Deal Confirmed", val: overview.dealConfirmed ? String(overview.dealConfirmed) : "85", sub: `${dealRate}%` },
              { label: "Repeat Order", val: overview.repeatOrder ? String(overview.repeatOrder) : "42", sub: `${retentionRate}%` }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: idx < 5 ? "1px solid #F1F5F9" : "none",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>{item.label}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{item.val}</span>
                  {item.sub && (
                    <span style={{ fontSize: "9px", fontWeight: 900, color: "#10B981", marginLeft: "6px" }}>
                      ({item.sub})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Revenue Pipeline */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#F59E0B", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
              🟠 B. REVENUE PIPELINE
            </p>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>
              TOTAL PIPELINE VALUE
            </p>
            <p style={{ fontSize: "24px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
              {revenue.totalPipelineValue ? formatRupiah(revenue.totalPipelineValue) : "Rp 12.5 M"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Potential Sample", val: revenue.potentialSample ? formatRupiah(revenue.potentialSample) : "Rp 4.2M" },
              { label: "Potential Deal", val: revenue.potentialDeal ? formatRupiah(revenue.potentialDeal) : "Rp 2.8M" },
              { label: "Confirmed Deal", val: revenue.confirmedDeal ? formatRupiah(revenue.confirmedDeal) : "Rp 3.5M", color: "#2563EB" },
              { label: "Repeat Order Value", val: revenue.repeatOrderValue ? formatRupiah(revenue.repeatOrderValue) : "Rp 1.5M", color: "#10B981" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B" }}>{item.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 950, color: item.color || "#1E293B" }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card C: Activity Performance */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#EAB308", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
              🟡 C. ACTIVITY PERFORMANCE
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "#FEFCE8", padding: "1rem", borderRadius: "16px", border: "1px solid #FEF9C3" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#854D0E", margin: 0 }}>
                FOLLOW-UP TODAY
              </p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
                {activity.followUpToday ?? "45"}
              </p>
            </div>
            <div style={{ background: "#F0FDF4", padding: "1rem", borderRadius: "16px", border: "1px solid #DCFCE7" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#166534", margin: 0 }}>
                AVG RESPONSE
              </p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
                {activity.avgResponse ? activity.avgResponse.toFixed(1) : "1.2"}
                <span style={{ fontSize: "10px" }}>h</span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>Active Leads</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                {activity.activeLeads ?? "320"}
              </span>
            </div>
            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, ((activity.activeLeads ?? 320) / 30) * 100)}%`,
                  height: "100%",
                  background: "#EAB308",
                }}
              />
            </div>
          </div>
        </div>

        {/* Card D: Critical Alert */}
        <div
          style={{
            background: "#FFF1F2",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #FECDD3",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#E11D48", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#9F1239", letterSpacing: "0.05em", margin: 0 }}>
              🔵 D. CRITICAL ALERT
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Unfollowed Leads", val: alerts.unfollowedLeads ?? "12", color: "#E11D48" },
              { label: "Stuck Samples (>14d)", val: alerts.stuckSamples ?? "8", color: "#E11D48" },
              { label: "Stuck Negotiation", val: alerts.stuckNego ?? "5", color: "#B45309" },
              { label: "At Risk Clients", val: alerts.atRiskClients ?? "3", color: "#9F1239" }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "white",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(225, 29, 72, 0.1)",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>{item.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 950, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 🔴 2. GUEST BOOK (Buku Tamu) Sub-dashboard
  if (variant === 'guest') {
    const totalLeads = data?.totalLeads ?? 428;
    const increment = data?.increment ?? 12;
    const completedTasks = data?.completedTasks ?? 182;
    const taskPercentage = data?.taskPercentage ?? 92;
    const meetingCount = data?.meetingCount ?? 15;
    const conversionRate = data?.conversionRate ?? 14.2;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Card 1: Total Leads */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#94A3B8", letterSpacing: "0.1em", margin: 0 }}>
              TOTAL LEADS
            </p>
            <Users size={16} color="#6366F1" />
          </div>
          <div>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
              {totalLeads}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 950, color: "#10B981" }}>+{increment}</span>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#64748B" }}>DARI KEMARIN</span>
            </div>
          </div>
        </div>

        {/* Card 2: Follow Up Aktivitas */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#94A3B8", letterSpacing: "0.1em", margin: 0 }}>
              FOLLOW UP AKTIVITAS
            </p>
            <ActivityIcon size={16} color="#F59E0B" />
          </div>
          <div>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
              {completedTasks}
            </p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#64748B", margin: 0 }}>
              TASK SELESAI / {taskPercentage}% PERSENTASE
            </p>
          </div>
        </div>

        {/* Card 3: Jumlah Meeting */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#94A3B8", letterSpacing: "0.1em", margin: 0 }}>
              JUMLAH MEETING
            </p>
            <Calendar size={16} color="#EC4899" />
          </div>
          <div>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
              {meetingCount}
            </p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#64748B", margin: 0 }}>
              OFFLINE & ONLINE (PERIOD INI)
            </p>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div
          style={{
            background: "#F0F9FF",
            padding: "1.5rem",
            borderRadius: "24px",
            border: "1px solid #BAE6FD",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#0369A1", letterSpacing: "0.1em", margin: 0 }}>
              CONVERSION RATE
            </p>
            <Target size={16} color="#0369A1" />
          </div>
          <div>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#0C4A6E", margin: "4px 0" }}>
              {conversionRate}%
            </p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#0369A1", margin: 0 }}>
              LEAD TO DEAL (CLOSE RATIO)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🔴 3. CLIENT SAMPLE Sub-dashboard
  if (variant === 'sample') {
    const activeSamples = data?.activeSamples ?? 42;
    const revenueForecast = data?.revenueForecast ?? 1190000000;
    const sampleApproved = data?.sampleApproved ?? 12;
    const dealRate = data?.conversionToProd ?? 28.5;
    const totalOmset = data?.totalOmset ?? 450000000;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1.5rem",
          marginBottom: "4rem",
        }}
      >
        {[
          { label: "SAMPLE DALAM PROSES", val: String(activeSamples), meta: "SEDANG DI R&D", color: "#F59E0B", icon: FlaskConical },
          { label: "RENCANA OMSET", val: formatRupiah(revenueForecast), meta: "PIPELINE AKTIF", color: "#2563EB", icon: TrendingUp },
          { label: "SAMPLE APPROVED", val: String(sampleApproved), meta: "APP. RATE: 64%", color: "#059669", icon: CheckCircle2 },
          { label: "DEAL RATE", val: `${dealRate}%`, meta: "SAMPLE → DEAL", color: "#10B981", icon: Target },
          { label: "TOTAL OMSET", val: formatRupiah(totalOmset), meta: "DARI DEAL PILOT", color: "#1D4ED8", icon: DollarSign }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid #E2E8F0",
                padding: "1.5rem",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ fontSize: "10px", fontWeight: 800, color: "#94A3B8", letterSpacing: "0.15em", margin: 0 }}>
                  {item.label}
                </p>
                <div style={{ padding: "8px", background: item.color + "15", borderRadius: "12px" }}>
                  <Icon size={18} color={item.color} />
                </div>
              </div>
              <div>
                <p className="tabular-nums" style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>
                  {item.val}
                </p>
                <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", margin: 0 }}>
                  {item.meta}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 🔴 4. CLIENT PRODUKSI (Production) Sub-dashboard
  if (variant === 'production') {
    const conversionRate = data?.conversionRate ?? 18.4;
    const avgClosingTime = data?.avgClosingTime ?? "24 Days";
    const onTimeDelivery = data?.onTimeDelivery ?? "96.5%";

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: "4rem",
        }}
      >
        {[
          { label: "CONVERSION RATE", val: `${conversionRate}%`, meta: "LEADS → DEAL TOTAL", color: "#10B981", icon: Target },
          { label: "AVG. CLOSING TIME", val: avgClosingTime, meta: "CONSULT → SPK SIGNED", color: "#F59E0B", icon: Timer },
          { label: "ON-TIME DELIVERY", val: onTimeDelivery, meta: "BATCH SLA COMPLIANCE", color: "#2563EB", icon: Shield }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid #E2E8F0",
                padding: "1.5rem",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ fontSize: "10px", fontWeight: 800, color: "#94A3B8", letterSpacing: "0.15em", margin: 0 }}>
                  {item.label}
                </p>
                <div style={{ padding: "8px", background: item.color + "15", borderRadius: "12px" }}>
                  <Icon size={18} color={item.color} />
                </div>
              </div>
              <div>
                <p className="tabular-nums" style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>
                  {item.val}
                </p>
                <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", margin: 0 }}>
                  {item.meta}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 🔴 5. CLIENT REPEAT ORDER (RO) Sub-dashboard
  if (variant === 'ro') {
    const activeRoLeads = data?.activeRoLeads ?? 18;
    const roRevenue = data?.roRevenue ?? 8420000000;
    const retentionRate = data?.retentionRate ?? 72.4;
    const avgOrderPerClient = data?.avgOrderPerClient ?? 4.2;
    const reorderInterval = data?.reorderInterval ?? 58;
    const churnClients = data?.churnClients ?? 4;
    const inactiveClients = data?.inactiveClients ?? 12;
    const bdScore = data?.bdScore ?? 84.5;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Card 1: Retention */}
        <div
          style={{
            background: "#F0FDF4",
            padding: "1.25rem",
            borderRadius: "24px",
            border: "1px solid #DCFCE7",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <RefreshCw size={14} color="#166534" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#166534", letterSpacing: "0.05em", margin: 0 }}>
              A. RETENTION (CORE LOYALTY)
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: "7px", fontWeight: 800, color: "#166534", margin: 0 }}>
                  REPEAT CLIENTS
                </p>
                <p style={{ fontSize: "18px", fontWeight: 950, color: "#064E3B", margin: 0 }}>
                  24 ENTITAS
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "7px", fontWeight: 800, color: "#166534", margin: 0 }}>
                  REPEAT RATE
                </p>
                <p style={{ fontSize: "18px", fontWeight: 950, color: "#064E3B", margin: 0 }}>
                  {retentionRate}%
                </p>
              </div>
            </div>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#64748B", margin: 0 }}>
              *UTAMA UNTUK MENJAGA RELASI
            </p>
          </div>
        </div>

        {/* Card 2: Activity */}
        <div
          style={{
            background: "white",
            padding: "1.25rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <ActivityIcon size={14} color="#6366F1" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
              B. ACTIVITY (BD ENGAGEMENT)
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>
                ACTIVE RO CLIENTS
              </p>
              <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                {activeRoLeads}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>
                FOLLOW-UP RATE
              </p>
              <p style={{ fontSize: "16px", fontWeight: 950, color: "#10B981", margin: 0 }}>
                94.2%
              </p>
            </div>
            <div
              style={{
                gridColumn: "span 2",
                background: "#F8FAFC",
                padding: "6px",
                borderRadius: "8px",
                border: "1px solid #F1F5F9",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "8px", fontWeight: 950, color: "#64748B" }}>
                MAINTENANCE CONSISTENCY
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Frequency */}
        <div
          style={{
            background: "white",
            padding: "1.25rem",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <ActivityIcon size={14} color="#F59E0B" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
              C. FREQUENCY (RELASI)
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>AVG ORDER / CLIENT</span>
              <span style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{avgOrderPerClient}x</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>REORDER INTERVAL</span>
              <span style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444" }}>{reorderInterval} HARI</span>
            </div>
            <div style={{ height: "4px", background: "#F1F5F9", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "85%", height: "100%", background: "#F59E0B" }} />
            </div>
          </div>
        </div>

        {/* Card 4: Value */}
        <div
          style={{
            background: "#FFF7ED",
            padding: "1.25rem",
            borderRadius: "24px",
            border: "1px solid #FFEDD5",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <DollarSign size={14} color="#9A3412" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#9A3412", letterSpacing: "0.05em", margin: 0 }}>
              D. VALUE (BUSINESS IMPACT)
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <p style={{ fontSize: "7px", fontWeight: 850, color: "#9A3412", margin: 0 }}>
                TOTAL RO VALUE
              </p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#7C2D12", margin: 0 }}>
                {formatRupiah(roRevenue)}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "6px", fontWeight: 800, color: "#9A3412", margin: 0 }}>
                  AVG RO / CLIENT
                </p>
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#7C2D12", margin: 0 }}>
                  Rp 350 JT
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "6px", fontWeight: 800, color: "#9A3412", margin: 0 }}>
                  GROWTH RO (%)
                </p>
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#059669", margin: 0 }}>
                  +12.4%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Risk */}
        <div
          style={{
            background: "#FEF2F2",
            padding: "1.25rem",
            borderRadius: "24px",
            border: "1px solid #FEE2E2",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <AlertTriangle size={14} color="#B91C1C" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#B91C1C", letterSpacing: "0.05em", margin: 0 }}>
              E. RISK (ANTIPASI)
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "white", padding: "8px", borderRadius: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444", margin: 0 }}>{churnClients}</p>
              <p style={{ fontSize: "7px", fontWeight: 850, color: "#EF4444", margin: 0 }}>CHURN CLIENT</p>
            </div>
            <div style={{ background: "white", padding: "8px", borderRadius: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#B45309", margin: 0 }}>{inactiveClients}</p>
              <p style={{ fontSize: "7px", fontWeight: 850, color: "#B45309", margin: 0 }}>INACTIVE CLIENT</p>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <p style={{ fontSize: "7px", fontWeight: 800, color: "#B91C1C", margin: 0 }}>
                *WARNING: NO ORDER &gt; 90 DAYS
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: BD Performance Score */}
        <div
          style={{
            background: "#1E293B",
            padding: "1.25rem",
            borderRadius: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.1 }}>
            <Award size={80} color="white" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Trophy size={14} color="#FBBF24" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "white", letterSpacing: "0.05em", margin: 0 }}>
              BD PERFORMANCE SCORE
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "32px", fontWeight: 950, color: "white", margin: 0 }}>{bdScore}</p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0, textTransform: "uppercase" }}>
              Weighted Retention Score
            </p>
          </div>
          <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "10px" }}>
            <p style={{ fontSize: "7px", color: "#CBD5E1", margin: 0 }}>
              WEIGHT: RATE(25%) | VALUE(25%) | FREQ(20%)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🔴 6. LOST Sub-dashboard
  if (variant === 'lost') {
    const lostLeads = data?.lostLeads ?? 189;
    const lostValue = data?.lostValue ?? 2050000000;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.25rem",
          marginBottom: "3rem",
        }}
      >
        {/* Card 1: Funnel Conversion */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                A. FUNNEL CONVERSION
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0F172A", margin: "4px 0" }}>
                RETENTION CORE
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#F0F9FF", borderRadius: "10px" }}>
              <ActivityIcon size={16} color="#0EA5E9" />
            </div>
          </div>
          <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ padding: "6px", background: "#F8FAFC", borderRadius: "8px" }}>
              <p style={{ fontSize: "8px", fontWeight: 700, color: "#94A3B8", margin: 0 }}>LEAD→SMPL</p>
              <p style={{ fontSize: "12px", fontWeight: 900, color: "#0F172A", margin: 0 }}>42.5%</p>
            </div>
            <div style={{ padding: "6px", background: "#F8FAFC", borderRadius: "8px" }}>
              <p style={{ fontSize: "8px", fontWeight: 700, color: "#94A3B8", margin: 0 }}>SMPL→PROD</p>
              <p style={{ fontSize: "12px", fontWeight: 900, color: "#0F172A", margin: 0 }}>18.2%</p>
            </div>
          </div>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#10B981", marginTop: "8px", margin: 0 }}>
            PROD→RO: <span style={{ fontWeight: 900 }}>65.4%</span>
          </p>
        </div>

        {/* Card 2: Leakage Rate */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                B. LEAKAGE RATE
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#EF4444", margin: "4px 0" }}>
                BOCOR RATE
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#FEF2F2", borderRadius: "10px" }}>
              <Droplets size={16} color="#EF4444" />
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ height: "4px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "58%", background: "#EF4444" }} />
            </div>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", marginTop: "6px", marginBottom: 0 }}>
              LEAD DROP: <span style={{ color: "#EF4444", fontWeight: 900 }}>58.5%</span>
            </p>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", margin: 0 }}>
              SMPL DROP: <span style={{ color: "#EF4444", fontWeight: 900 }}>81.8%</span>
            </p>
          </div>
        </div>

        {/* Card 3: Lost Count */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                C. LOST COUNT
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0F172A", margin: "4px 0" }}>
                TOTAL {lostLeads}
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#F1F5F9", borderRadius: "10px" }}>
              <Users size={16} color="#475569" />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "12px" }}>
            <span style={{ fontSize: "8px", fontWeight: 800, padding: "2px 6px", background: "#F1F5F9", borderRadius: "4px" }}>
              LEAD: 124
            </span>
            <span style={{ fontSize: "8px", fontWeight: 800, padding: "2px 6px", background: "#F1F5F9", borderRadius: "4px" }}>
              SMPL: 45
            </span>
            <span style={{ fontSize: "8px", fontWeight: 800, padding: "2px 6px", background: "#F1F5F9", borderRadius: "4px" }}>
              PROD: 12
            </span>
            <span style={{ fontSize: "8px", fontWeight: 800, padding: "2px 6px", background: "#F1F5F9", borderRadius: "4px" }}>
              RO: 8
            </span>
          </div>
        </div>

        {/* Card 4: Lost Value */}
        <div
          style={{
            background: "#0F172A",
            borderRadius: "16px",
            border: "1px solid #1E293B",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.15em", margin: 0 }}>
                D. LOST VALUE
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#F59E0B", margin: "4px 0" }}>
                {formatRupiah(lostValue)}
              </h3>
            </div>
            <div style={{ padding: "8px", background: "rgba(245, 158, 11, 0.2)", borderRadius: "10px" }}>
              <TrendingDown size={16} color="#F59E0B" />
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1E293B", paddingTop: "8px", marginTop: "8px" }}>
            <p style={{ fontSize: "8px", fontWeight: 700, color: "#64748B", margin: "2px 0" }}>
              SMPL→PROD: <span style={{ color: "#E2E8F0" }}>Rp 1.2B</span>
            </p>
            <p style={{ fontSize: "8px", fontWeight: 700, color: "#64748B", margin: "2px 0" }}>
              PROD→RO: <span style={{ color: "#E2E8F0" }}>Rp 850M</span>
            </p>
          </div>
        </div>

        {/* Card 5: Speed Failure */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                E. SPEED FAILURE
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0F172A", margin: "4px 0" }}>
                BOTTLENECK
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#FDF2F8", borderRadius: "10px" }}>
              <Timer size={16} color="#DB2777" />
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              4.2 Hrs <span style={{ fontWeight: 600, color: "#94A3B8", fontSize: "8px" }}>AVG RESPONSE</span>
            </p>
            <p style={{ fontSize: "10px", fontWeight: 800, color: "#0F172A", margin: "4px 0 0 0" }}>
              12 Days <span style={{ fontWeight: 600, color: "#94A3B8", fontSize: "8px" }}>SAMPLE TAT</span>
            </p>
          </div>
        </div>

        {/* Card 6: Reason Analysis */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                F. REASON ANALYSIS
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0F172A", margin: "4px 0" }}>
                TOP: PRICE
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#F8FAFC", borderRadius: "10px" }}>
              <BarChart3 size={16} color="#6366F1" />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", gap: "4px", overflow: "hidden", marginTop: "12px" }}>
              <div style={{ height: "12px", width: "40%", background: "#6366F1", borderRadius: "2px" }} title="Price" />
              <div style={{ height: "12px", width: "25%", background: "#818CF8", borderRadius: "2px" }} title="Product" />
              <div style={{ height: "12px", width: "20%", background: "#A5B4FC", borderRadius: "2px" }} title="Comp" />
              <div style={{ height: "12px", width: "15%", background: "#C7D2FE", borderRadius: "2px" }} title="Ghost" />
            </div>
            <p style={{ fontSize: "8px", fontWeight: 700, color: "#94A3B8", marginTop: "4px", margin: 0 }}>
              PRICE ISSUE: 40% | PROD: 25%
            </p>
          </div>
        </div>

        {/* Card 7: Recovery Perf */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                G. RECOVERY PERF.
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#10B981", margin: "4px 0" }}>
                14 SAVED
              </h3>
            </div>
            <div style={{ padding: "8px", background: "#ECFDF5", borderRadius: "10px" }}>
              <RefreshCw size={16} color="#10B981" />
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", margin: 0 }}>
              RECOVERY RATE: <span style={{ color: "#10B981", fontWeight: 900 }}>12.5%</span>
            </p>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", margin: "2px 0 0 0" }}>
              VALUE: <span style={{ color: "#0F172A", fontWeight: 900 }}>Rp 450M</span>
            </p>
          </div>
        </div>

        {/* Card 8: Lost Control Score */}
        <div
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
            borderRadius: "16px",
            border: "none",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#C7D2FE", letterSpacing: "0.15em", margin: 0 }}>
                LOST CONTROL SCORE
              </p>
              <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", margin: "4px 0" }}>
                78.4 <span style={{ fontSize: "14px", fontWeight: 400, opacity: 0.8 }}>/100</span>
              </h3>
            </div>
            <div style={{ padding: "8px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "10px" }}>
              <Award size={18} color="#FFFFFF" />
            </div>
          </div>
          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#C7D2FE" }}>GRADE: B+</span>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#C7D2FE" }}>TOP 15%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "10px", marginTop: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "78%", background: "#FFFFFF" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback or pipeline tab
  return null;
}
