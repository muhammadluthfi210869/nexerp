import React from "react";
import {
  TrendingUp,
  CreditCard,
  ShieldCheck,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import {
  FinanceDashboardMetrics,
  formatMilyarJuta,
} from "../_types/dashboard.types";

interface FinanceDashboardKpiCardsProps {
  metrics: FinanceDashboardMetrics | undefined;
}

export function FinanceDashboardKpiCards({ metrics }: FinanceDashboardKpiCardsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}>
      {/* Card A: REVENUE & COLLECTION */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>A. REVENUE & COLLECTION</p>
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>TOTAL REVENUE</p>
          <p style={{ fontSize: "22px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>
            {formatMilyarJuta(metrics?.totalRevenue ?? metrics?.revenue, "Rp 0")}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>COLLECTION RATE</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#10B981" }}>{metrics?.collectionRate ?? 0}%</span>
          </div>
          <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${metrics?.collectionRate ?? 0}%`, height: "100%", background: "#3B82F6" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>UNCOLLECTED</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#EF4444" }}>
              {formatMilyarJuta(metrics?.uncollected, "Rp 0")}
            </span>
          </div>
        </div>
      </div>

      {/* Card B: EXPENSE CONTROL */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <CreditCard className="w-4 h-4 text-yellow-500" style={{ color: "#EAB308" }} />
          <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>B. EXPENSE CONTROL</p>
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>TOTAL EXPENSE (MTD)</p>
          <p style={{ fontSize: "22px", fontWeight: 950, color: "#EAB308", margin: "4px 0" }}>
            {formatMilyarJuta(metrics?.totalExpense ?? metrics?.expense, "Rp 0")}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>COGS</span>
            <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
              {formatMilyarJuta(metrics?.cogs, "Rp 0")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>OPERATIONAL</span>
            <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
              {formatMilyarJuta(metrics?.operational, "Rp 0")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#F8FAFC", borderRadius: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#64748B" }}>EXPENSE RATIO</span>
            <span style={{ fontSize: "11px", fontWeight: 950, color: "#EAB308" }}>{metrics?.expenseRatio ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* Card C: CASH FLOW HEALTH */}
      <div style={{ background: "#F0FDF4", padding: "1.5rem", borderRadius: "24px", border: "1px solid #DCFCE7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" style={{ color: "#10B981" }} />
          <p style={{ fontSize: "11px", fontWeight: 950, color: "#166534", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>C. CASH FLOW HEALTH</p>
        </div>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
            {formatMilyarJuta(metrics?.netCashFlow, "Rp 0")}
          </p>
          <p style={{ fontSize: "9px", fontWeight: 850, color: "#166534", margin: 0 }}>NET CASH FLOW (MTD)</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div style={{ background: "white", padding: "10px", borderRadius: "12px", border: "1px solid #DCFCE7" }}>
            <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>CASH IN</p>
            <p style={{ fontSize: "12px", fontWeight: 950, color: "#10B981", margin: 0 }}>
              {formatMilyarJuta(metrics?.cashIn, "Rp 0")}
            </p>
          </div>
          <div style={{ background: "white", padding: "10px", borderRadius: "12px", border: "1px solid #DCFCE7" }}>
            <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>CASH OUT</p>
            <p style={{ fontSize: "12px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
              {formatMilyarJuta(metrics?.cashOut, "Rp 0")}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>
            CURRENT BALANCE: <span style={{ color: "#1E293B", fontWeight: 950 }}>{formatMilyarJuta(metrics?.currentBalance, "Rp 0")}</span>
          </p>
        </div>
      </div>

      {/* Card D: PROFITABILITY */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <BarChart3 className="w-4 h-4 text-purple-500" style={{ color: "#8B5CF6" }} />
          <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>D. PROFITABILITY</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "#64748B", margin: 0 }}>NET PROFIT</p>
            <p style={{ fontSize: "18px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
              {formatMilyarJuta(metrics?.netProfit, "Rp 0")}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "#64748B", margin: 0 }}>MARGIN</p>
            <p style={{ fontSize: "18px", fontWeight: 950, color: "#8B5CF6", margin: 0 }}>{metrics?.margin ?? 0}%</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>GROSS PROFIT</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
              {formatMilyarJuta(metrics?.grossProfit, "Rp 0")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>GP MARGIN</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{metrics?.gpMargin ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* Card E: FINANCIAL RISK */}
      <div style={{ background: "#FFF1F2", padding: "1.5rem", borderRadius: "24px", border: "1px solid #FECDD3", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <ShieldAlert className="w-4 h-4 text-rose-600" style={{ color: "#E11D48" }} />
          <p style={{ fontSize: "11px", fontWeight: 950, color: "#9F1239", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>E. FINANCIAL RISK</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "10px" }}>
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#EF4444" }}>OVERDUE A/R</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
              {formatMilyarJuta(metrics?.overdueAr, "Rp 0")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "10px" }}>
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#EA580C" }}>OVERDUE A/P</span>
            <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
              {formatMilyarJuta(metrics?.overdueAp, "Rp 0")}
            </span>
          </div>
          <div style={{ background: "#9F1239", padding: "10px", borderRadius: "12px", marginTop: "2px" }}>
            <p style={{ fontSize: "9px", fontWeight: 950, color: "#ffffff", margin: 0, opacity: 0.9 }}>RISK ALERT</p>
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#ffffff", margin: 0 }}>
              {metrics?.cashRunwayAlert || "HEALTHY RUNWAY"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
