"use client";

import React from "react";
import {
  TrendingUp,
  BarChart3,
  Factory,
  Wallet,
  ThumbsDown,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatRupiah(value: number): string {
  if (!value) return "—";
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}k`;
  return `Rp ${value.toLocaleString()}`;
}

export default function ExecutiveDashboardClient() {
  const { data: metrics } = useQuery({
    queryKey: ["executive-metrics"],
    queryFn: async () => (await api.get("/executive/metrics")).data,
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery({
    queryKey: ["executive-alerts"],
    queryFn: async () => (await api.get("/executive/alerts")).data,
    refetchInterval: 30000,
  });

  const isLoading = !metrics || !alerts;

  const mtd = metrics?.revenue?.mtd ?? 0;
  const target = metrics?.revenue?.target ?? 0;
  const achievement = metrics?.revenue?.achievement ?? 0;
  const projection = metrics?.revenue?.projection ?? 0;
  const growth = metrics?.revenue?.growth ?? 0;

  const pipeTotal = metrics?.pipeline?.total ?? 0;
  const pipeDeal = metrics?.pipeline?.deal ?? 0;
  const pipeProspect = metrics?.pipeline?.prospect ?? 0;
  const pipeHot = metrics?.pipeline?.hot ?? 0;

  const prodActive = metrics?.production?.activeOrders ?? 0;
  const prodOverdue = metrics?.production?.overdue ?? 0;
  const prodOnProd = metrics?.production?.onProd ?? 0;
  const prodQcFlow = metrics?.production?.qcFlow ?? 0;
  const prodReady = metrics?.production?.ready ?? 0;

  const totalAR = metrics?.cashflow?.totalAR ?? 0;
  const aging = metrics?.cashflow?.aging ?? { "0-30": 0, "31-60": 0, "60+": 0 };

  const lostVal = metrics?.lost?.totalVal ?? 0;
  const churnRate = metrics?.lost?.churnRate ?? 0;

  const roRate = metrics?.repeatOrder?.rate ?? 0;
  const roRevenue = metrics?.repeatOrder?.revenue ?? 0;
  const roReadyToRepeat = metrics?.repeatOrder?.readyToRepeat ?? 0;

  const overdueAlerts = alerts?.production?.overdue ?? 0;
  const overdueInvoices = alerts?.cashflow?.overdueInvoices ?? 0;
  const unfollowedLeads = alerts?.sales?.unfollowed ?? 0;

  // Owner Insight helpers
  const revenueInsight = (() => {
    const shortfall = target - mtd;
    if (achievement < 80 && shortfall > 0) {
      return `Kita tertinggal ${formatRupiah(shortfall)} dari target bulanan. Perlu push deal di minggu terakhir.`;
    }
    return `Progress omset ${achievement.toFixed(1)}% menuju target ${formatRupiah(target)}.`;
  })();

  const pipelineInsight = (() => {
    const rate = pipeTotal > 0 ? ((pipeDeal / pipeTotal) * 100).toFixed(1) : "0";
    return `Conversion rate ${rate}% dari total pipeline. Fokus pada ${pipeProspect} lead di tahap negosiasi.`;
  })();

  const productionInsight = (() => {
    if (prodOverdue > 0) {
      return `Ada ${prodOverdue} order overdue. Perlu manajemen shift tambahan untuk kejar deadline.`;
    }
    return `${prodActive} order aktif dalam proses produksi.`;
  })();

  const cashflowInsight = (() => {
    const overdue60 = aging["60+"] ?? 0;
    if (overdue60 > 0) {
      return `Uang nyangkut di Piutang >60 hari sebesar ${formatRupiah(overdue60)}. Tim Finance harus prioritaskan penagihan.`;
    }
    return `Total piutang ${formatRupiah(totalAR)}. Pantau aging secara berkala.`;
  })();

  const lostInsight = (() => {
    if (lostVal > (pipeTotal > 0 ? mtd * 0.1 : 0)) {
      return `Lost deal signifikan sebesar ${formatRupiah(lostVal)}. Evaluasi pricing dan kualitas sample.`;
    }
    return `Lost deal sebesar ${formatRupiah(lostVal)}. Churn rate ${churnRate.toFixed(1)}%.`;
  })();

  const roInsight = (() => {
    if (roRate < 50) {
      return "Repeat rate perlu perhatian — tingkatkan follow-up ke klien existing.";
    }
    return `Mesin RO sehat. ${roRate.toFixed(1)}% revenue berasal dari repeat order. ${roReadyToRepeat} klien siap repeat.`;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* I. SYSTEM ALERT BANNER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          background: "#FFF1F2",
          border: "1px solid #FECDD3",
          padding: "1rem 1.5rem",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "#DC2626",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <AlertTriangle size={14} color="white" />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 950, color: "#9F1239", letterSpacing: "0.05em" }}>
          SYSTEM ALERT
        </span>
        <div style={{ width: "1px", height: "16px", background: "#FECDD3" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "11px", fontWeight: 900 }}>
          <span style={{ color: "#DC2626" }}>{isLoading ? "—" : `${overdueAlerts} ORDER TELAT PRODUKSI`}</span>
          <span style={{ color: "#94A3B8" }}>•</span>
          <span style={{ color: "#DC2626" }}>{isLoading ? "—" : `${overdueInvoices} CLIENT BELUM BAYAR (OVERDUE)`}</span>
          <span style={{ color: "#94A3B8" }}>•</span>
          <span style={{ color: "#D97706" }}>{isLoading ? "—" : `${unfollowedLeads} LEADS BELUM FOLLOW UP`}</span>
        </div>
      </div>

      {/* II. 2x3 DASHBOARD GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem",
          marginBottom: "2rem"
        }}
      >
        {/* Card 1: REVENUE & TARGET */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#10B981", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                REVENUE & TARGET
              </h3>
            </div>
            <TrendingUp size={16} color="#10B981" />
          </div>

          <div>
            <p style={{ margin: 0, fontSize: "9px", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.05em" }}>
              OMSET BULAN INI (MTD)
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "32px", fontWeight: 950, color: "#0F172A", letterSpacing: "-0.03em" }}>
              {metrics ? formatRupiah(mtd) : "—"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: 900, color: "#10B981" }}>
              {metrics ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` : "—"} <span style={{ color: "#94A3B8", fontWeight: 500 }}>vs bulan lalu</span>
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>TARGET</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{metrics ? formatRupiah(target) : "—"}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>PENCAPAIAN</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: 950, color: "#10B981" }}>{metrics ? `${achievement.toFixed(1)}%` : "—"}</p>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>PROYEKSI AKHIR BULAN</span>
              <span style={{ fontSize: "8px", fontWeight: 900, color: "#1E293B" }}>{metrics ? formatRupiah(projection) : "—"}</span>
            </div>
            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(achievement, 100).toFixed(1)}%`, height: "100%", background: "#10B981" }} />
            </div>
          </div>

          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#166534",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {revenueInsight}
          </div>
        </div>

        {/* Card 2: SALES PIPELINE */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#2563EB", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                SALES PIPELINE
              </h3>
            </div>
            <BarChart3 size={16} color="#2563EB" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: "#EFF6FF", padding: "12px 16px", borderRadius: "16px" }}>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#2563EB" }}>TOTAL LEADS</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 950, color: "#1E293B" }}>{metrics ? pipeTotal : "—"}</p>
            </div>
            <div style={{ background: "#EFF6FF", padding: "12px 16px", borderRadius: "16px" }}>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#2563EB" }}>PIPELINE VALUE</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 950, color: "#1E293B" }}>—</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Leads In", value: pipeTotal, pct: 100, color: "#64748B" },
              { label: "Sample Process", value: pipeHot, pct: pipeTotal > 0 ? (pipeHot / pipeTotal) * 100 : 0, color: "#3B82F6" },
              { label: "Negotiation", value: pipeProspect, pct: pipeTotal > 0 ? (pipeProspect / pipeTotal) * 100 : 0, color: "#8B5CF6" },
              { label: "Deal / SPK", value: pipeDeal, pct: pipeTotal > 0 ? (pipeDeal / pipeTotal) * 100 : 0, color: "#3B82F6" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "90px 1fr 30px", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>{item.label}</span>
                <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${item.pct}%`, height: "100%", background: item.color }} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", textAlign: "right" }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #DBEAFE",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#1E40AF",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {pipelineInsight}
          </div>
        </div>

        {/* Card 3: PRODUCTION STATUS */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#EAB308", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                PRODUCTION STATUS
              </h3>
            </div>
            <Factory size={16} color="#EAB308" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>TOTAL ORDER AKTIF</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "28px", fontWeight: 950, color: "#1E293B" }}>{metrics ? prodActive : "—"}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>TELAT PRODUKSI (OVERDUE)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "28px", fontWeight: 950, color: "#EF4444" }}>{metrics ? prodOverdue : "—"}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { label: "ON PROD", value: metrics ? String(prodOnProd) : "—" },
              { label: "QC FLOW", value: metrics ? String(prodQcFlow) : "—" },
              { label: "READY", value: metrics ? String(prodReady) : "—" }
            ].map((box, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", padding: "10px", borderRadius: "12px", border: "1px solid #F1F5F9", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>{box.label}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{box.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>Avg Prod. Time</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>—</span>
          </div>

          <div
            style={{
              background: "#FEF9C3",
              border: "1px solid #FEF08A",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#854D0E",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {productionInsight}
          </div>
        </div>

        {/* Card 4: CASHFLOW & PAYMENT */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#8B5CF6", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                CASHFLOW & PAYMENT
              </h3>
            </div>
            <Wallet size={16} color="#8B5CF6" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: "#F5F3FF", padding: "12px 16px", borderRadius: "16px" }}>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#8B5CF6" }}>CASH IN (MTD)</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 950, color: "#1E293B" }}>{metrics ? formatRupiah(mtd) : "—"}</p>
            </div>
            <div style={{ background: "#FFF1F2", padding: "12px 16px", borderRadius: "16px" }}>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#EF4444" }}>PIUTANG (AR)</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 950, color: "#EF4444" }}>{metrics ? formatRupiah(totalAR) : "—"}</p>
            </div>
          </div>

          <div>
            <p style={{ margin: "0 0 8px 0", fontSize: "8px", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.05em" }}>
              AGING RECEIVABLE (DRY CASH RISK)
            </p>
            <div style={{ height: "16px", display: "flex", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${totalAR > 0 ? ((aging["0-30"] ?? 0) / totalAR) * 100 : 0}%`, background: "#10B981" }} />
              <div style={{ width: `${totalAR > 0 ? ((aging["31-60"] ?? 0) / totalAR) * 100 : 0}%`, background: "#F59E0B" }} />
              <div style={{ width: `${totalAR > 0 ? ((aging["60+"] ?? 0) / totalAR) * 100 : 0}%`, background: "#EF4444" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "8px", fontWeight: 900 }}>
              <span style={{ color: "#10B981" }}>0-30 Hari</span>
              <span style={{ color: "#F59E0B" }}>31-60 Hari</span>
              <span style={{ color: "#EF4444" }}>60+ Hari</span>
            </div>
          </div>

          <div
            style={{
              background: "#F5F3FF",
              border: "1px solid #EDE9FE",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#5B21B6",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {cashflowInsight}
          </div>
        </div>

        {/* Card 5: LOST & PROBLEMS */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                LOST & PROBLEMS
              </h3>
            </div>
            <ThumbsDown size={16} color="#EF4444" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>LOST DEAL (VAL)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "22px", fontWeight: 950, color: "#EF4444" }}>{metrics ? formatRupiah(lostVal) : "—"}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>CHURN RATE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "22px", fontWeight: 950, color: "#0F172A" }}>{metrics ? `${churnRate.toFixed(1)}%` : "—"}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.05em" }}>
              TOP REASON FOR LOST DEAL
            </p>
            {[
              { label: "Harga Terlalu Mahal", value: "— Case", pct: 0 },
              { label: "Sample Tidak Cocok", value: "— Case", pct: 0 },
              { label: "Produksi Lambat", value: "— Case", pct: 0 }
            ].map((reason, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "110px 1fr 45px", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#1E293B" }}>{reason.label}</span>
                <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${reason.pct}%`, height: "100%", background: "#EF4444" }} />
                </div>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748B", textAlign: "right" }}>{reason.value}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#9F1239",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {lostInsight}
          </div>
        </div>

        {/* Card 6: REPEAT ORDER ENGINE */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "32px",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", background: "#10B981", borderRadius: "50%" }} />
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
                REPEAT ORDER ENGINE
              </h3>
            </div>
            <RefreshCw size={16} color="#10B981" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>REPEAT RATE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "28px", fontWeight: 950, color: "#10B981" }}>{metrics ? `${roRate.toFixed(1)}%` : "—"}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8" }}>RO REVENUE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "28px", fontWeight: 950, color: "#0F172A" }}>{metrics ? formatRupiah(roRevenue) : "—"}</p>
            </div>
          </div>

          <div style={{ background: "#F0FDF4", padding: "12px 16px", borderRadius: "16px", border: "1px solid #DCFCE7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <div style={{ width: "6px", height: "6px", background: "#10B981", borderRadius: "50%" }} />
              <span style={{ fontSize: "8px", fontWeight: 950, color: "#166534" }}>CLIENT SIAP REPEAT (MTD)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "18px", fontWeight: 950, color: "#1E293B" }}>{metrics ? roReadyToRepeat : "—"} <span style={{ fontSize: "10px", fontWeight: 500, color: "#64748B" }}>Client</span></span>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#16A34A" }}>{metrics ? `+${roReadyToRepeat}` : "—"} vs Target Follow-up</span>
            </div>
          </div>

          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              padding: "1rem",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#166534",
              lineHeight: "1.4"
            }}
          >
            💡 <span style={{ fontWeight: 950 }}>OWNER INSIGHT:</span> {roInsight}
          </div>
        </div>
      </div>
    </div>
  );
}
