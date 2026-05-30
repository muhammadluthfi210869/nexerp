"use client";

import React from "react";
import { 
  Activity,
  Check,
  Clock,
  Cpu,
  Beaker,
  ShieldAlert,
  Target,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ProductionDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["prodDashboard"],
    queryFn: async () => (await api.get("/production/dashboard")).data,
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
         <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Production DNA...</p>
      </div>
    );
  }

  const cards = data?.cards;
  const workshops = data?.workshops;
  const workshopsDetail = data?.workshops_detail;
  const precisionTracking = data?.precisionTracking || [];

  return (
    <DashboardShell
      title="PRODUCTION COMMAND CENTER"
      subtitle="Shop Floor & Efficiency Audit"
    >
      {/* I. EXECUTIVE KPI CARDS (5 COLUMNS GRID) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}>
        
        {/* Card A: OUTPUT & ACHIEVEMENT */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Target className="w-4 h-4 text-blue-500" />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>A. OUTPUT & ACHIEVEMENT</p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
              {cards?.achievement?.rate ?? 0}%
            </p>
            <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>ACHIEVEMENT RATE</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>PLANNED</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                {cards?.achievement?.planned ? (cards.achievement.planned).toLocaleString() : "0"} Units
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>ACTUAL</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#10B981" }}>
                {cards?.achievement?.actual ? (cards.achievement.actual).toLocaleString() : "0"} Units
              </span>
            </div>
            <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "4px" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>COMPLETED ORDERS</p>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                {cards?.achievement?.completedOrders ?? 0} / {cards?.achievement?.totalOrders ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Card B: TIMELINESS AUDIT */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Clock className="w-4 h-4 text-yellow-500" />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>B. TIMELINESS AUDIT</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>ON-TIME RATE</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#EAB308" }}>{cards?.timeliness?.rate ?? 0}%</span>
            </div>
            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${cards?.timeliness?.rate ?? 0}%`, height: "100%", background: "#EAB308" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#FFF1F2", padding: "8px", borderRadius: "10px" }}>
                <p style={{ fontSize: "7px", fontWeight: 850, color: "#EF4444", margin: 0 }}>DELAYED</p>
                <p style={{ fontSize: "12px", fontWeight: 950, color: "#E11D48", margin: 0 }}>{cards?.timeliness?.delayed ?? 0}</p>
              </div>
              <div style={{ background: "#F0FDF4", padding: "8px", borderRadius: "10px" }}>
                <p style={{ fontSize: "7px", fontWeight: 850, color: "#166534", margin: 0 }}>AVG CYCLE</p>
                <p style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{cards?.timeliness?.avgCycleHours ?? 0}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card C: RESOURCE EFFICIENCY */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Cpu className="w-4 h-4 text-purple-500" />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>C. RESOURCE EFFICIENCY</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>MACHINE UTIL.</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#8B5CF6" }}>{cards?.efficiency?.utilization ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>LABOR PROD.</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{cards?.efficiency?.labor ?? 92.5}%</span>
            </div>
            <div style={{ background: "#FFF7ED", padding: "10px", borderRadius: "12px", border: "1px solid #FFEDD5", marginTop: "4px" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#C2410C", margin: 0 }}>DOWNTIME (MTD)</p>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#EA580C", margin: "2px 0 0 0" }}>{cards?.efficiency?.downtime ?? "0h"}</p>
            </div>
          </div>
        </div>

        {/* Card D: QUALITY CONTROL */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Beaker className="w-4 h-4 text-emerald-500" />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>D. QUALITY CONTROL</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>GOOD UNITS</p>
                <p style={{ fontSize: "18px", fontWeight: 950, color: "#10B981", margin: 0 }}>
                  {cards?.quality?.goodUnits ? ((cards.quality.goodUnits) / 1000).toFixed(0) : "0"}k
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>DEFECT RATE</p>
                <p style={{ fontSize: "18px", fontWeight: 950, color: "#EF4444", margin: 0 }}>{cards?.quality?.defectRate ?? 0}%</p>
              </div>
            </div>
            <div style={{ background: "#F1F5F9", height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${100 - (cards?.quality?.defectRate ?? 0)}%`, height: "100%", background: "#10B981" }} />
              <div style={{ width: `${cards?.quality?.defectRate ?? 0}%`, height: "100%", background: "#EF4444" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>REWORK COUNT</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                {cards?.quality?.reworkCount ? (cards.quality.reworkCount).toLocaleString() : "0"} Pcs
              </span>
            </div>
          </div>
        </div>

        {/* Card E: CRITICAL ALERTS */}
        <div style={{ background: "#FFF1F2", padding: "1.5rem", borderRadius: "24px", border: "1px solid #FECDD3", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#9F1239", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>E. CRITICAL ALERTS</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: "10px", border: "1px solid #FECDD3" }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#E11D48" }}>BREAKDOWNS</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{cards?.alerts?.breakdown ?? 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: "10px", border: "1px solid #FECDD3" }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#EF4444" }}>SHORTAGES</span>
              <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{cards?.alerts?.shortages ?? 0}</span>
            </div>
            <div style={{ background: "#9F1239", padding: "8px 12px", borderRadius: "10px", marginTop: "2px" }}>
              <p style={{ fontSize: "8px", fontWeight: 950, color: "#ffffff", margin: 0, opacity: 0.9 }}>URGENT ALERT</p>
              <p style={{ fontSize: "10px", fontWeight: 950, color: "#ffffff", margin: 0 }}>
                {cards?.alerts?.urgent ?? 0} ORDERS OVERDUE &gt; 48H
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* II. PENYIAPAN BAHAN (FROM WAREHOUSE) */}
      <div style={{ marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 className="section-label">II. PENYIAPAN BAHAN (FROM WAREHOUSE)</h3>
          <button style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "6px 16px", borderRadius: "99px", fontSize: "11px", fontWeight: 950, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            MONITORING GUDANG
          </button>
        </div>
        <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>WORK ORDER / PRODUK</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>STATUS PICKING</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>KELENGKAPAN</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>ESTIMASI KIRIM</th>
                </tr>
              </thead>
              <tbody>
                {precisionTracking.slice(0, 3).map((row: any, i: number) => {
                  const isDefect = row.anomaly === 'DEFECT_DETECTED';
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ fontSize: "14px", fontWeight: 950, color: "#0F172A", textTransform: "uppercase" }}>{row.batchId}</div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>{row.productName}</div>
                      </td>
                      <td style={{ padding: "1.5rem 2rem", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: 950, color: isDefect ? "#EF4444" : "#10B981" }}>
                          {isDefect ? "IN PROGRESS" : "READY"}
                        </span>
                      </td>
                      <td style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: isDefect ? "65%" : "100%", height: "100%", background: isDefect ? "#3B82F6" : "#10B981" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 950, color: "#0F172A", minWidth: "35px" }}>
                            {isDefect ? "65%" : "100%"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
                        <span style={{ fontSize: "12px", fontWeight: 950, color: row.deadline > 0 ? "#1E293B" : "#10B981" }}>
                          {row.deadline > 0 ? `H-${row.deadline}` : "READY"}
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

      {/* III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK) */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label" style={{ marginBottom: "1.5rem" }}>III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK)</h3>
        <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {[
            { label: "ANTREAN WO", val: workshops?.queue ?? 0, sub: "BATCHES" },
            { label: "MIXING", val: workshops?.mixing ?? 0, sub: "BATCHES" },
            { label: "FILLING", val: workshops?.filling ?? 0, sub: "BATCHES" },
            { label: "PACKING", val: workshops?.packing ?? 0, sub: "BATCHES" },
            { label: "FINISHED GOODS", val: (cards?.achievement?.actual ?? 0).toLocaleString(), sub: "PCS" }
          ].map((node, t, arr) => (
            <React.Fragment key={t}>
              <div style={{ width: "180px", padding: "1.5rem", borderRadius: "16px", border: "1px solid #F1F5F9", background: "white", textAlign: "center", position: "relative", boxShadow: "0 4px 15px -5px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: "11px", fontWeight: 800, color: "#94A3B8", marginBottom: "8px", textTransform: "uppercase" }}>{node.label}</p>
                <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{node.val}</p>
                <p style={{ fontSize: "10px", fontWeight: 900, color: "#94A3B8", margin: 0 }}>{node.sub}</p>
              </div>
              {t < arr.length - 1 && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 950, color: t % 2 === 0 ? "#E11D48" : "#94A3B8", background: t % 2 === 0 ? "#FFF1F2" : "#F8FAFC", padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {t === 0 ? `IDLE: ${workshopsDetail?.[0]?.idleTime || "13h"}` : t === 1 ? `WAIT: ${workshopsDetail?.[1]?.waitTime || "0.2d"}` : t === 2 ? `IDLE: ${workshopsDetail?.[2]?.idleTime || "14h"}` : `WAIT: ${workshopsDetail?.[3]?.waitTime || "0.1d"}`}
                  </span>
                  <ArrowRight className="w-5 h-5" style={{ color: t % 2 === 0 ? "#EF4444" : "#E2E8F0" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING) */}
      <div style={{ marginBottom: "4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 className="section-label">IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING)</h3>
          <span style={{ background: "#4F46E5", color: "white", padding: "4px 12px", borderRadius: "99px", fontSize: "10px", fontWeight: 950 }}>
            CHAIN OF CUSTODY
          </span>
        </div>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#4F46E5" }}>DEADLINE (H-MINUS)</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#4F46E5" }}>PRODUCT ID / NAME</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#4F46E5" }}>CHAIN OF CUSTODY (UNIT FLOW)</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#4F46E5" }}>ANOMALY STATUS</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#4F46E5" }}>STATUS & REASON</th>
                </tr>
              </thead>
              <tbody>
                {precisionTracking.map((row: any, i: number) => {
                  const isDefect = row.anomaly === 'DEFECT_DETECTED';
                  const phaseLabel = (row.status || '').replace('PHASE_', '');
                  const flowParts = (row.unitFlow || '0 >> 0').split('>>');
                  const inputQty = flowParts[0]?.trim() || '0';
                  const outputQty = flowParts[1]?.trim() || '0';
                  
                  let activeIdx = 1;
                  if (row.status === 'PHASE_FILLING') activeIdx = 2;
                  else if (row.status === 'PHASE_PACKING') activeIdx = 3;
                  else if (row.status === 'PHASE_FINISHED_GOODS' || row.status === 'FINISHED') activeIdx = 4;

                  const steps = [
                    inputQty,
                    activeIdx >= 2 ? inputQty : '-',
                    activeIdx >= 3 ? inputQty : '-',
                    activeIdx >= 4 ? outputQty : '-'
                  ];

                  const diff = parseInt(inputQty) - parseInt(outputQty);
                  const anomalyText = isDefect ? (diff > 0 ? `REJECT: ${diff} UNIT` : 'DEFECT DETECTED') : `PROSES ${phaseLabel || 'NORMAL'}`;
                  const anomalyColor = isDefect ? '#FFF1F2' : '#D1FAE5';
                  const anomalyTextColor = isDefect ? '#E11D48' : '#059669';

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ fontSize: "13px", fontWeight: 950, color: "#0F172A" }}>
                          {row.deadline > 0 ? `H-${row.deadline}` : "OVERDUE"}
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 900, color: row.deadline <= 2 ? "#E11D48" : "#64748B", background: row.deadline <= 2 ? "#FFF1F2" : "#F8FAFC", padding: "2px 8px", borderRadius: "4px" }}>
                          {row.deadline > 0 ? `Sisa ${row.deadline} Hari` : "OVERDUE"}
                        </span>
                      </td>
                      <td style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ fontSize: "14px", fontWeight: 950, color: "#0F172A", textTransform: "uppercase" }}>{row.productName}</div>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>{row.batchId}</div>
                      </td>
                      <td style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                          {["MIXING", "FILLING", "PACKING", "FINISH"].map((tLabel, nIdx) => (
                            <div key={nIdx} style={{ display: "flex", alignItems: "center" }}>
                              <div style={{ textAlign: "center", width: "60px" }}>
                                <div style={{ 
                                  width: "32px", 
                                  height: "32px", 
                                  borderRadius: "50%", 
                                  border: "1px solid #E2E8F0", 
                                  margin: "0 auto 6px", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center", 
                                  background: nIdx + 1 === activeIdx ? "#4F46E5" : nIdx + 1 < activeIdx ? "#EEF2FF" : "white", 
                                  color: nIdx + 1 === activeIdx ? "white" : nIdx + 1 < activeIdx ? "#4F46E5" : "#94A3B8" 
                                }}>
                                  {nIdx + 1 < activeIdx ? <Check className="w-3.5 h-3.5" /> : nIdx + 1}
                                </div>
                                <p style={{ fontSize: "8px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{tLabel}</p>
                                <p style={{ fontSize: "9px", fontWeight: 950, color: nIdx + 1 <= activeIdx ? "#4F46E5" : "#94A3B8", margin: 0 }}>{steps[nIdx]}</p>
                              </div>
                              {nIdx < 3 && (
                                <div style={{ width: "40px", height: "2px", background: nIdx + 1 < activeIdx ? "#4F46E5" : "#F1F5F9", marginTop: "-20px" }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "1.5rem 2rem", textAlign: "center" }}>
                        <span style={{ 
                          background: anomalyColor, 
                          color: anomalyTextColor, 
                          padding: "8px 16px", 
                          borderRadius: "20px", 
                          fontSize: "10px", 
                          fontWeight: 950,
                          boxShadow: isDefect ? "0 4px 12px -2px rgba(225,29,72,0.2)" : "none"
                        }}>
                          {anomalyText}
                        </span>
                      </td>
                      <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 950, color: isDefect ? "#EF4444" : "#10B981" }}>{phaseLabel || row.status}</span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#94A3B8" }}>100%</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", maxWidth: "180px", marginLeft: "auto" }}>
                          {row.notes || "Processing normally"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI) */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label" style={{ marginBottom: "1.5rem" }}>V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI)</h3>
        <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>NO. WORK ORDER</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>NAMA KLIEN & PRODUK</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>TAHAPAN SAAT INI</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>ESTIMASI SELESAI</th>
                  <th style={{ padding: "1.25rem 2rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#94A3B8" }}>QTY DEFECT</th>
                </tr>
              </thead>
              <tbody>
                {precisionTracking.map((row: any, i: number) => {
                  const phaseLabel = (row.status || '').replace('PHASE_', '');
                  const flowParts = (row.unitFlow || '0 >> 0').split('>>');
                  const inputQty = parseInt(flowParts[0]?.trim() || '0');
                  const outputQty = parseInt(flowParts[1]?.trim() || '0');
                  const defect = Math.max(0, inputQty - outputQty);

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.25rem 2rem", fontSize: "12px", fontWeight: 800, color: "#94A3B8" }}>{row.batchId}</td>
                      <td style={{ padding: "1.25rem 2rem" }}>
                        <div style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.productName}</div>
                      </td>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "center" }}>
                        <span style={{ background: "#F1F5F9", color: "#1E293B", padding: "6px 14px", borderRadius: "99px", fontSize: "10px", fontWeight: 950 }}>
                          {phaseLabel || row.status}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "center", fontSize: "13px", fontWeight: 800, color: "#1E293B" }}>
                        {row.deadline > 0 ? `2026-06-${String(row.deadline).padStart(2, '0')}` : "OVERDUE"}
                      </td>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "right" }}>
                        <span style={{ fontSize: "13px", fontWeight: 950, color: defect > 0 ? "#E11D48" : "#10B981" }}>
                          {defect} Pcs
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

    </DashboardShell>
  );
}
