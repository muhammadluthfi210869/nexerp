"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  BarChart3,
  ShieldAlert,
  Activity,
  ChevronRight
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

const FALLBACK_TRANSACTIONS = [
  { id: 'TX-5001', date: '2024-04-02', type: 'IN', cat: 'REVENUE', ref: 'SALES (INV-2041)', amount: '125,000,000', method: 'BANK TRANSFER', status: 'PAID' },
  { id: 'TX-5002', date: '2024-04-02', type: 'OUT', cat: 'COGS', ref: 'PURCHASE (PO-882)', amount: '45,000,000', method: 'BANK TRANSFER', status: 'PAID' },
  { id: 'TX-5003', date: '2024-04-01', type: 'OUT', cat: 'EXPENSE', ref: 'PAYROLL (APRIL)', amount: '180,000,000', method: 'VIRTUAL ACCOUNT', status: 'PENDING' },
  { id: 'TX-5004', date: '2024-04-01', type: 'IN', cat: 'OTHER', ref: 'MANUAL (INVESTMENT)', amount: '500,000,000', method: 'DIRECT DEP', status: 'PAID' },
];

const FALLBACK_AR = [
  { id: 'INV-2045', name: 'Brand Aesthetic X', total: '150M', out: '50M', due: '2024-04-10', status: 'PARTIAL' },
  { id: 'INV-2041', name: 'Glow Up Clinic', total: '125M', out: '125M', due: '2024-03-25', status: 'OVERDUE' },
  { id: 'INV-2050', name: 'Sun & Skin Co.', total: '80M', out: '80M', due: '2024-04-15', status: 'PARTIAL' },
];

const FALLBACK_AP = [
  { id: 'BILL-401', name: 'PT Surya Kimia', total: '250M', out: '250M', due: '2024-04-05', status: 'PENDING' },
  { id: 'BILL-405', name: 'Global Kemasindo', total: '100M', out: '40M', due: '2024-04-12', status: 'PARTIAL' },
  { id: 'BILL-398', name: 'PLN Persero', total: '45M', out: '45M', due: '2024-03-28', status: 'OVERDUE' },
];

const FALLBACK_EXPENSE = [
  { cat: 'Raw Material', sub: 'SCM | PO-882', amount: 'Rp 2.4 M' },
  { cat: 'Machine Parts', sub: 'PRODUKSI | REQ-M-01', amount: 'Rp 120 Jt' },
  { cat: 'Ads Spend', sub: 'BD | FB-ADS-MAR', amount: 'Rp 450 Jt' },
];

const FALLBACK_REVENUE = [
  { name: 'Glow Up Clinic', prod: 'Serum Glow 30ml', type: 'REPEAT ORDER', amount: 'Rp 450 Jt', color: 'bg-blue-500' },
  { name: 'Brand Aesthetic X', prod: 'Service R&D', type: 'NEW DEAL', amount: 'Rp 150 Jt', color: 'bg-indigo-500' },
  { name: 'Indo Care', prod: 'Moisturizer Gel', type: 'REPEAT ORDER', amount: 'Rp 1.2 M', color: 'bg-blue-500' },
];

const FALLBACK_CASH = [
  { date: '2026-04-02', in: '+Rp 10.2M', out: '-Rp 8.4M', closing: 'Rp 4.5 M' },
  { date: '2026-04-01', in: '+Rp 2.4M', out: '-Rp 1.2M', closing: 'Rp 2.7 M' },
];

const FALLBACK_KPI = [
  { period: 'Q1 2026', status: 'STABLE', margin: '34.3%', coll: '82.5%', score: '94.2', color: 'text-emerald-500' },
  { period: 'Q4 2025', status: 'ALERT', margin: '28.1%', coll: '75.2%', score: '88.5', color: 'text-yellow-500' },
];

function formatMilyarJuta(val: any, defaultStr: string): string {
  if (val === undefined || val === null) return defaultStr;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1)} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  }
  return `Rp ${num.toLocaleString()}`;
}

export default function FinanceDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["finance-dashboard-metrics"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });

  if (isLoading) return (
    <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p style={{ fontSize: "10px", fontWeight: 950, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Syncing Fiscal DNA...</p>
    </div>
  );

  return (
    <div className="view-section active" style={{ paddingBottom: "10rem", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h2 className="dashboard-title" style={{ marginBottom: "0.25rem" }}>FINANCIAL COMMAND CENTER</h2>
          <p style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Cash Health & Profit Audit</p>
        </div>
      </div>

      {/* I. EXECUTIVE KPI CARDS (5 COLUMNS GRID) */}
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
              {formatMilyarJuta(metrics?.totalRevenue ?? metrics?.revenue, "Rp 12.8 M")}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>COLLECTION RATE</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#10B981" }}>{metrics?.collectionRate ?? 82.5}%</span>
            </div>
            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${metrics?.collectionRate ?? 82.5}%`, height: "100%", background: "#3B82F6" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>UNCOLLECTED</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#EF4444" }}>
                {formatMilyarJuta(metrics?.uncollected, "Rp 2.2 M")}
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
              {formatMilyarJuta(metrics?.totalExpense ?? metrics?.expense, "Rp 8.4 M")}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>COGS</span>
              <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
                {formatMilyarJuta(metrics?.cogs, "Rp 5.2 M")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>OPERATIONAL</span>
              <span style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
                {formatMilyarJuta(metrics?.operational, "Rp 3.2 M")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#F8FAFC", borderRadius: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#64748B" }}>EXPENSE RATIO</span>
              <span style={{ fontSize: "11px", fontWeight: 950, color: "#EAB308" }}>{metrics?.expenseRatio ?? 65.6}%</span>
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
              {formatMilyarJuta(metrics?.netCashFlow, "Rp 1.8 M")}
            </p>
            <p style={{ fontSize: "9px", fontWeight: 850, color: "#166534", margin: 0 }}>NET CASH FLOW (MTD)</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "white", padding: "10px", borderRadius: "12px", border: "1px solid #DCFCE7" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>CASH IN</p>
              <p style={{ fontSize: "12px", fontWeight: 950, color: "#10B981", margin: 0 }}>
                {formatMilyarJuta(metrics?.cashIn, "Rp 10.2M")}
              </p>
            </div>
            <div style={{ background: "white", padding: "10px", borderRadius: "12px", border: "1px solid #DCFCE7" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>CASH OUT</p>
              <p style={{ fontSize: "12px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
                {formatMilyarJuta(metrics?.cashOut, "Rp 8.4M")}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>
              CURRENT BALANCE: <span style={{ color: "#1E293B", fontWeight: 950 }}>{formatMilyarJuta(metrics?.currentBalance, "Rp 4.5 M")}</span>
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
                {formatMilyarJuta(metrics?.netProfit, "Rp 4.4 M")}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, color: "#64748B", margin: 0 }}>MARGIN</p>
              <p style={{ fontSize: "18px", fontWeight: 950, color: "#8B5CF6", margin: 0 }}>{metrics?.margin ?? 34.3}%</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>GROSS PROFIT</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                {formatMilyarJuta(metrics?.grossProfit, "Rp 7.6 M")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>GP MARGIN</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{metrics?.gpMargin ?? 59.4}%</span>
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
                {formatMilyarJuta(metrics?.overdueAr, "Rp 850 Jt")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "10px" }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#EA580C" }}>OVERDUE A/P</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                {formatMilyarJuta(metrics?.overdueAp, "Rp 420 Jt")}
              </span>
            </div>
            <div style={{ background: "#9F1239", padding: "10px", borderRadius: "12px", marginTop: "2px" }}>
              <p style={{ fontSize: "9px", fontWeight: 950, color: "#ffffff", margin: 0, opacity: 0.9 }}>RISK ALERT</p>
              <p style={{ fontSize: "11px", fontWeight: 950, color: "#ffffff", margin: 0 }}>
                {metrics?.cashRunwayAlert || "CASH RUNWAY < 3 MONTHS"}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* II. TRANSACTION LOG */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label" style={{ marginBottom: "1.25rem" }}>🔴 1. FINANCIAL TRANSACTION LOG (CENTRAL LEDGER)</h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "1200px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>TRANS ID / DATE</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>TYPE / CATEGORY</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>REFERENCE (REF ID)</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>AMOUNT</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>METHOD</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.transactions?.length ? metrics.transactions : FALLBACK_TRANSACTIONS).map((row: any, i: number) => {
                  const isIn = row.type === 'IN';
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{row.id}</div>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748B" }}>{row.date}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", fontWeight: 950, color: isIn ? "#10B981" : "#EF4444" }}>
                          {row.type} / {row.cat || 'COGS'}
                        </div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{row.ref}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontSize: "14px", fontWeight: 950, color: isIn ? "#10B981" : "#1E293B" }}>
                        Rp {row.amount}
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 850 }}>{row.method}</td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <span style={{ 
                          background: row.status === 'PAID' ? "#10B981" : "#F59E0B", 
                          color: "white", 
                          padding: "4px 10px", 
                          borderRadius: "6px", 
                          fontSize: "9px", 
                          fontWeight: 950 
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* III. AR & AP DUAL GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "4rem" }}>
        
        {/* accounts receivable */}
        <div>
          <h3 className="section-label" style={{ color: "#3B82F6", marginBottom: "1.25rem" }}>🔵 2. ACCOUNTS RECEIVABLE (PIUTANG)</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>INVOICE / CUSTOMER</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>OUTSTANDING</th>
                  <th style={{ padding: "1rem", textAlign: "center", fontSize: "9px", fontWeight: 950 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.receivables?.length ? metrics.receivables : FALLBACK_AR).map((row: any, i: number) => {
                  const isOverdue = row.status === 'OVERDUE';
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1rem", textAlign: "left" }}>
                        <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.id}</div>
                        <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.name}</div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ fontSize: "12px", fontWeight: 950, color: isOverdue ? "#EF4444" : "#1E293B" }}>Rp {row.out}</div>
                        <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", marginTop: "2px" }}>{row.due}</div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ 
                          background: isOverdue ? "#EF4444" : "#F59E0B", 
                          color: "white", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "8px", 
                          fontWeight: 950 
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* accounts payable */}
        <div>
          <h3 className="section-label" style={{ color: "#F59E0B", marginBottom: "1.25rem" }}>🟠 3. ACCOUNTS PAYABLE (HUTANG)</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>BILL / SUPPLIER</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>OUTSTANDING</th>
                  <th style={{ padding: "1rem", textAlign: "center", fontSize: "9px", fontWeight: 950 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.payables?.length ? metrics.payables : FALLBACK_AP).map((row: any, i: number) => {
                  const isOverdue = row.status === 'OVERDUE';
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1rem", textAlign: "left" }}>
                        <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.id}</div>
                        <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.name}</div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ fontSize: "12px", fontWeight: 950, color: isOverdue ? "#EF4444" : "#1E293B" }}>Rp {row.out}</div>
                        <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", marginTop: "2px" }}>{row.due}</div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ 
                          background: isOverdue ? "#EF4444" : row.status === 'PARTIAL' ? "#F59E0B" : "#94A3B8", 
                          color: "white", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "8px", 
                          fontWeight: 950 
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* IV. BREAKDOWN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "4rem" }}>
        
        {/* Expense breakdown */}
        <div>
          <h3 className="section-label" style={{ color: "#EAB308", marginBottom: "1.25rem" }}>🟢 4. EXPENSE BREAKDOWN (DEPT AUDIT)</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>CATEGORY / DEPT</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.expenseBreakdown?.length ? metrics.expenseBreakdown : FALLBACK_EXPENSE).map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                      <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.cat}</div>
                      <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.sub}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
                      {row.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div>
          <h3 className="section-label" style={{ color: "#3B82F6", marginBottom: "1.25rem" }}>🔵 5. REVENUE BREAKDOWN (GROWTH AUDIT)</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>CUSTOMER / PRODUCT</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "9px", fontWeight: 950 }}>SOURCE</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.revenueBreakdown?.length ? metrics.revenueBreakdown : FALLBACK_REVENUE).map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                      <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.name}</div>
                      <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.prod}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ background: "#3B82F6", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: 950 }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "13px", fontWeight: 950, color: "#10B981" }}>
                      {row.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* V. CASH & KPI DUAL GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
        
        {/* cash position */}
        <div>
          <h3 className="section-label" style={{ color: "#475569", marginBottom: "1.25rem" }}>📁 6. DAILY CASH POSITION</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>DATE</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "9px", fontWeight: 950 }}>IN / OUT</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>CLOSING</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.cashPosition?.length ? metrics.cashPosition : FALLBACK_CASH).map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                      <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.date}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: 950, color: "#10B981" }}>{row.in}</div>
                      <div style={{ fontSize: "10px", fontWeight: 950, color: "#EF4444", marginTop: "2px" }}>{row.out}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
                      {row.closing}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* kpi performance */}
        <div>
          <h3 className="section-label" style={{ color: "#EC4899", marginBottom: "1.25rem" }}>🌸 7. KPI PERFORMANCE (FINANCIAL SCORE)</h3>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontWeight: 950 }}>PERIOD</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "9px", fontWeight: 950 }}>MARGIN / COLL</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "9px", fontWeight: 950 }}>HEALTH SCORE</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.kpiPerformance?.length ? metrics.kpiPerformance : FALLBACK_KPI).map((row: any, i: number) => {
                  const isStable = row.status === 'STABLE';
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                        <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.period}</div>
                        <div style={{ fontSize: "7px", fontWeight: 950, color: isStable ? "#10B981" : "#EF4444", textTransform: "uppercase", marginTop: "2px" }}>
                          {row.status}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
                        {row.margin} / {row.coll}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "18px", fontWeight: 950, color: isStable ? "#10B981" : "#F59E0B" }}>
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
