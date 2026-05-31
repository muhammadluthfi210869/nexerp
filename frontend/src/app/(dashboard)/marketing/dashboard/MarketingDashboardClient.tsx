"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Calendar,
  TrendingUp,
  Filter,
  Wallet,
  Music,
  Activity,
  Eye,
  MousePointer2,
  MousePointerClick,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Target,
  PenTool,
  Globe,
  Search,
  Heart,
  MessageCircle,
  Share2,
  Bookmark
} from "lucide-react";

// --- Custom Chart matching prototype's aj component ---
interface CustomChartProps {
  data: number[];
  color: string;
  color2?: string;
  data2?: number[];
}

const CustomChart: React.FC<CustomChartProps> = ({ data, color, color2, data2 }) => {
  const maxVal = 150;
  const i = 500 / (data.length - 1);
  const a = data.map((val, idx) => `${idx * i},${150 - (val / maxVal) * 150}`).join(" ");
  const o = data2 ? data2.map((val, idx) => `${idx * i},${150 - (val / maxVal) * 150}`).join(" ") : null;

  return (
    <svg viewBox="0 0 500 150" style={{ width: "100%", height: "180px", overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
        {color2 && (
          <linearGradient id={`grad-${color2.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: color2, stopOpacity: 0 }} />
          </linearGradient>
        )}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
        <line
          key={idx}
          x1="0"
          y1={String(150 * ratio)}
          x2="500"
          y2={String(150 * ratio)}
          stroke="#F1F5F9"
          strokeWidth="1"
        />
      ))}
      <path
        d={`M ${a}`}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={`M ${a} L 500,150 L 0,150 Z`} fill={`url(#grad-${color.replace("#", "")})`} />
      {o && (
        <>
          <path
            d={`M ${o}`}
            fill="none"
            stroke={color2!}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={`M ${o} L 500,150 L 0,150 Z`} fill={`url(#grad-${color2!.replace("#", "")})`} />
        </>
      )}
      {data.map((val, idx) => (
        <circle
          key={idx}
          cx={idx * i}
          cy={150 - (val / maxVal) * 150}
          r="4"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

// --- DATA TRANSFORMATION HELPERS ---
function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}k`;
  return `Rp ${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function scaleTrendData(raw: number[] | undefined, defaultVal: number[]): number[] {
  if (!raw || raw.length === 0) return defaultVal;
  const max = Math.max(...raw, 1);
  return raw.map(v => 40 + (v / max) * 100);
}

export default function MarketingDashboardClient() {
  const [activePlatform, setActivePlatform] = useState<"INSTAGRAM" | "FACEBOOK" | "YOUTUBE" | "TIKTOK">("INSTAGRAM");

  const { data } = useQuery({
    queryKey: ["marketing-analytics"],
    queryFn: () => api.get("/marketing/analytics").then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  // Dynamic values or fallback
  const revenueVal = data?.acquisition?.revenue ? formatRupiah(data.acquisition.revenue) : "—";
  const revenueTargetPercent = data?.acquisition?.revenue
    ? Math.min(Math.round((data.acquisition.revenue / 4500000000) * 100), 100)
    : 0;
  const clientAcqVal = data?.acquisition?.clientsAcquired ? String(data.acquisition.clientsAcquired) : "—";
  const avgCpaVal = data?.acquisition?.avgCpa ? formatRupiah(data.acquisition.avgCpa) : "—";

  const leadsQualifiedVal = data?.funnel?.leadsQualified ? formatNumber(data.funnel.leadsQualified) : "—";
  const leadToSampleRateVal = data?.funnel?.leadToSampleRate ? `${data.funnel.leadToSampleRate}%` : "—";
  const prospectsVal = data?.funnel?.prospects ? String(data.funnel.prospects) : "—";
  const closingRateVal = data?.funnel?.closingRate ? `${data.funnel.closingRate}%` : "—";

  const totalAdSpendVal = data?.budget?.totalAdSpend ? formatRupiah(data.budget.totalAdSpend) : "—";
  const budgetUsagePercentVal = data?.budget?.budgetUsagePercent ? `${Math.round(data.budget.budgetUsagePercent)}%` : "—";
  const costPerLeadVal = data?.budget?.costPerLead ? formatRupiah(data.budget.costPerLead) : "—";
  const costPerSampleVal = data?.budget?.costPerSample ? formatRupiah(data.budget.costPerSample) : "—";

  // Trends
  const rawLeadsTrend = data?.trends?.map((t: any) => t.leads as number);
  const rawCplTrend = data?.trends?.map((t: any) => t.cpl as number);
  const rawClosingTrend = data?.trends?.map((t: any) => t.closing as number);
  const rawCpaTrend = data?.trends?.map((t: any) => t.cpa as number);

  const leadsTrend = scaleTrendData(rawLeadsTrend, []);
  const cplTrend = scaleTrendData(rawCplTrend, []);
  const closingTrend = scaleTrendData(rawClosingTrend, []);
  const cpaTrend = scaleTrendData(rawCpaTrend, []);

  // Product performance
  const productPerformance = data?.productPerformance || [];

  // Vitality & Platform específicos
  const disciplinePostsVal = data?.vitality?.totalPosts ? String(data.vitality.totalPosts) : "—";
  const disciplineTargetVal = data?.vitality?.postTarget ? String(data.vitality.postTarget) : "—";
  const disciplineProgressVal = data?.vitality?.totalPosts && data?.vitality?.postTarget
    ? Math.round((data.vitality.totalPosts / data.vitality.postTarget) * 100)
    : 0;
  const erRateVal = data?.vitality?.avgEngagement ? `${data.vitality.avgEngagement.toFixed(1)}%` : "—";
  const followersVal = data?.vitality?.totalFollowers ? formatNumber(data.vitality.totalFollowers) : "—";
  const engLikes = data?.vitality?.engagementByType?.likes ?? 0;
  const engComments = data?.vitality?.engagementByType?.saves ?? 0;
  const engShares = data?.vitality?.engagementByType?.shares ?? 0;
  const engSaves = data?.vitality?.engagementByType?.saves ?? 0;

  // Platform specific deep dive calculations
  const platformDataMap = {
    INSTAGRAM: {
      color: "#E1306C",
      icon: Globe,
      growth: "—",
      followers: "—"
    },
    FACEBOOK: {
      color: "#1877F2",
      icon: Globe,
      growth: "—",
      followers: "—"
    },
    YOUTUBE: {
      color: "#FF0000",
      icon: Globe,
      growth: "—",
      followers: "—"
    },
    TIKTOK: {
      color: "#000000",
      icon: Music,
      growth: "—",
      followers: "—"
    }
  };

  const selectedPlatformInfo = platformDataMap[activePlatform];
  const SelectedPlatformIcon = selectedPlatformInfo.icon;

  // Search visibility
  const searchImpressions = data?.searchVisibility?.impressions ? formatNumber(data.searchVisibility.impressions) : "—";
  const searchClicks = data?.searchVisibility?.clicks ? formatNumber(data.searchVisibility.clicks) : "—";
  const searchCtr = data?.searchVisibility?.avgCtr ? `${data.searchVisibility.avgCtr}%` : "—";
  const searchPosition = data?.searchVisibility?.avgPosition ? String(data.searchVisibility.avgPosition) : "—";

  return (
    <div
      className="view-section active"
      style={{ paddingBottom: "10rem", background: "#F8FAFC", minHeight: "100vh" }}
    >


      {/* Top 3 Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Card A: Acquisition Hub */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 950,
                color: "#2563EB",
                background: "#EFF6FF",
                padding: "4px 10px",
                borderRadius: "8px",
              }}
            >
              ACQUISITION HUB
            </span>
            <TrendingUp color="#2563EB" size={16} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
              REVENUE SALES (MTD)
            </p>
            <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: "#1E293B" }}>
              {revenueVal}
            </h3>
            <div
              style={{
                height: "6px",
                background: "#F1F5F9",
                borderRadius: "3px",
                position: "relative",
                overflow: "hidden",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  width: `${revenueTargetPercent}%`,
                  height: "100%",
                  background: "#2563EB",
                }}
              />
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "10px", fontWeight: 700, color: "#64748B" }}>
              Target: Rp 4.5M{" "}
              <span style={{ color: "#2563EB" }}>
                ({revenueTargetPercent}%)
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                CLIENT ACQ.
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {clientAcqVal}{" "}
                <span style={{ fontSize: "10px", color: "#10B981" }}>+12%</span>
              </p>
            </div>
            <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                AVG CPA
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {avgCpaVal}
              </p>
            </div>
          </div>
        </div>

        {/* Card B: Funnel Efficiency */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 950,
                color: "#8B5CF6",
                background: "#F5F3FF",
                padding: "4px 10px",
                borderRadius: "8px",
              }}
            >
              FUNNEL EFFICIENCY
            </span>
            <Filter color="#8B5CF6" size={16} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
              LEADS QUALIFIED
            </p>
            <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: "#1E293B" }}>
              {leadsQualifiedVal}
            </h3>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#8B5CF6" }}>
              Conversion Lead-to-Sample: {leadToSampleRateVal}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                PROSPECT
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {prospectsVal}
              </p>
            </div>
            <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                CLOSING RATE
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {closingRateVal}
              </p>
            </div>
          </div>
        </div>

        {/* Card C: Budget Audit */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 950,
                color: "#EF4444",
                background: "#FEF2F2",
                padding: "4px 10px",
                borderRadius: "8px",
              }}
            >
              BUDGET AUDIT
            </span>
            <Wallet color="#EF4444" size={16} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#94A3B8" }}>
              TOTAL AD SPEND
            </p>
            <h3 style={{ margin: "4px 0", fontSize: "28px", fontWeight: 950, color: "#1E293B" }}>
              {totalAdSpendVal}
            </h3>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#EF4444" }}>
              Used: {budgetUsagePercentVal} of Monthly Budget
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                COST PER LEAD
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {costPerLeadVal}
              </p>
            </div>
            <div style={{ flex: 1, borderLeft: "1px solid #F1F5F9", paddingLeft: "1rem" }}>
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                COST / SAMPLE
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
                {costPerSampleVal}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Trend Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Trend Chart A: leads & cpl */}
        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
              II. ANALISA TREN TAHUNAN (LEADS & CPL)
            </h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB" }} />
                <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>LEADS</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06B6D4" }} />
                <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CPL</span>
              </div>
            </div>
          </div>
          <CustomChart data={leadsTrend} color="#2563EB" data2={cplTrend} color2="#06B6D4" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
              (m) => (
                <span key={m} style={{ fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
                  {m}
                </span>
              )
            )}
          </div>
        </div>

        {/* Trend Chart B: samples & cpa */}
        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
              III. TREN SAMPLES & AKUISISI (CPA)
            </h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CLOSING</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
                <span style={{ fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CPA</span>
              </div>
            </div>
          </div>
          <CustomChart data={closingTrend} color="#F59E0B" data2={cpaTrend} color2="#EF4444" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
              (m) => (
                <span key={m} style={{ fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
                  {m}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          border: "1px solid #E2E8F0",
          padding: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
          IV. TOP LIST PRODUCT PERFORMANCE
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #F1F5F9" }}>
              <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
                PRODUCT CATEGORY
              </th>
              <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
                LEADS
              </th>
              <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
                SAMPLES
              </th>
              <th style={{ padding: "12px", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>
                CLIENT DEAL
              </th>
            </tr>
          </thead>
          <tbody>
            {productPerformance.map((p: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 900, color: "#1E293B" }}>
                  {p.cat || p.name}
                </td>
                <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 800 }}>
                  {p.leads}
                </td>
                <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 800 }}>
                  {p.sample || p.samples}
                </td>
                <td style={{ padding: "16px 12px", fontSize: "13px", fontWeight: 950, color: "#2563EB" }}>
                  {p.deal || p.deals}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vitalitas Konten & Platform Deep dive */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Vitalitas Konten */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
            <Activity color="#EC4899" />
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
              V. VITALITAS KONTEN
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "#FDF2F8",
                padding: "1.5rem",
                borderRadius: "24px",
                border: "1px solid #FCE7F3",
              }}
            >
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#BE185D" }}>
                DISIPLIN PRODUKSI
              </p>
              <h4 style={{ margin: "14px 0", fontSize: "24px", fontWeight: 950, color: "#1E293B" }}>
                {disciplinePostsVal}{" "}
                <span style={{ fontSize: "12px", color: "#64748B" }}>/ {disciplineTargetVal} Konten</span>
              </h4>
              <div style={{ height: "6px", background: "white", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${disciplineProgressVal}%`, height: "100%", background: "#EC4899" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "12px",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748B" }}>ER RATE</span>
                <span style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{erRateVal}</span>
              </div>
              <div
                style={{
                  background: "#F0F9FF",
                  padding: "12px",
                  borderRadius: "16px",
                  border: "1px solid #E0F2FE",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#0369A1" }}>FOLLOWERS</span>
                <span style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{followersVal}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { icon: Heart, label: "Likes", value: formatNumber(engLikes) },
              { icon: MessageCircle, label: "Comments", value: formatNumber(engComments) },
              { icon: Share2, label: "Shares", value: formatNumber(engShares) },
              { icon: Bookmark, label: "Save", value: formatNumber(engSaves) },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    textAlign: "center",
                    background: "#F8FAFC",
                    padding: "12px 5px",
                    borderRadius: "16px",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <Icon size={12} color="#94A3B8" style={{ display: "inline", marginBottom: "4px" }} />
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                    {item.value}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Specific Audit */}
        <div
          style={{
            background: "white",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: "160px",
              background: "#F8FAFC",
              borderRight: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem 0",
            }}
          >
            <p style={{ margin: "0 1.5rem 1rem", fontSize: "9px", fontWeight: 950, color: "#94A3B8" }}>
              VI. PLATFORM
            </p>
            {(["INSTAGRAM", "FACEBOOK", "YOUTUBE", "TIKTOK"] as const).map((key) => {
              const info = platformDataMap[key];
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActivePlatform(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 1.5rem",
                    border: "none",
                    background: activePlatform === key ? "white" : "transparent",
                    color: activePlatform === key ? "#1E293B" : "#94A3B8",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <Icon size={14} color={activePlatform === key ? info.color : "#94A3B8"} />
                  <span style={{ fontSize: "9px", fontWeight: 950 }}>{key}</span>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div style={{ flex: 1, padding: "1.5rem" }}>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>
              {activePlatform} Audit
            </h4>
            <div
              style={{
                background: "#F8FAFC",
                padding: "12px",
                borderRadius: "16px",
                border: "1px solid #F1F5F9",
              }}
            >
              <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
                ENGAGEMENT GROWTH
              </p>
              <p style={{ margin: "4px 0", fontSize: "18px", fontWeight: 950, color: "#10B981" }}>
                {selectedPlatformInfo.growth}
              </p>
            </div>
            <div
              style={{
                background: "#F0F9FF",
                padding: "12px",
                borderRadius: "16px",
                border: "1px solid #E0F2FE",
                marginTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#0369A1" }}>TOTAL FOLLOWERS</span>
              <span style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>
                {selectedPlatformInfo.followers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Content Leaders & Ranking Sumber Leads */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Top 5 Content Leaders */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
          }}
        >
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
            VII. TOP 5 CONTENT LEADERS
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {(data?.topContent || []).map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 15px",
                  background: "#F8FAFC",
                  borderRadius: "12px",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 800 }}>{item.title}</span>
                <span style={{ fontSize: "11px", fontWeight: 950, color: "#10B981" }}>
                  {item.engagement}% ER
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking Sumber Leads */}
        <div
          style={{
            background: "#F5F3FF",
            padding: "1.5rem",
            borderRadius: "32px",
            border: "1px solid #DDD6FE",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "12px", fontWeight: 950, color: "#5B21B6" }}>
            VIII. RANKING SUMBER LEADS
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(data?.leadSourceRanking || []).map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "white",
                  padding: "12px 15px",
                  borderRadius: "16px",
                  border: "1px solid #E9D5FF",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 950 }}>{item.name}</span>
                <span style={{ fontSize: "12px", fontWeight: 950, color: "#5B21B6" }}>
                  {item.leads}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Visibility Audit (SEO/Ads Overview) */}
      <div style={{ borderTop: "2px solid #F1F5F9", paddingTop: "2.5rem" }}>
        <h3
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "12px",
            fontWeight: 950,
            color: "#94A3B8",
            letterSpacing: "0.1em",
          }}
        >
          IX. SEARCH VISIBILITY AUDIT (SEO/ADS OVERVIEW)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
          {[
            {
              label: "TOTAL IMPRESSIONS",
              val: searchImpressions,
              sub: "+18.4% vs Prev",
              icon: Eye,
              color: "#6366F1",
              bg: "#EEF2FF",
            },
            {
              label: "TOTAL CLICKS",
              val: searchClicks,
              sub: "+4.2% Growth",
              icon: MousePointer2,
              color: "#10B981",
              bg: "#ECFDF5",
            },
            {
              label: "AVG. CTR",
              val: searchCtr,
              sub: "Target 5.5%",
              icon: MousePointerClick,
              color: "#F59E0B",
              bg: "#FFFBEB",
            },
            {
              label: "AVG. POSITION",
              val: searchPosition,
              sub: "Top 10 Benchmark",
              icon: BarChart3,
              color: "#8B5CF6",
              bg: "#F5F3FF",
            },
          ].map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <div
                key={idx}
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "24px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: card.bg,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardIcon color={card.color} size={18} />
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 950, color: card.color }}>
                    {card.sub}
                  </span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "9px", fontWeight: 900, color: "#94A3B8" }}>
                    {card.label}
                  </p>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: 950, color: "#1E293B" }}>
                    {card.val}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
