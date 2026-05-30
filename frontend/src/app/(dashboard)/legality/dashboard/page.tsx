"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Activity, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  Beaker,
  BookOpen,
  Award,
  Stethoscope,
  Bookmark,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DataCard, DnaBadge, DnaButton } from "@/components/dna";
import { KpiCard } from "@/components/dna/KpiCard";

export default function LegalityDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["legality-dashboard"],
    queryFn: async () => {
      const [dashboard, pipeline, expiry] = await Promise.all([
        api.get("/legality/dashboard"),
        api.get("/legality/pipeline/stats"),
        api.get("/legality/expiry?limit=10"),
      ]);
      return { 
        ...dashboard.data, 
        pipeline: pipeline.data,
        expiryData: expiry.data,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Compliance DNA...</p>
    </div>
  );

  return (
    <DashboardShell
      title="LEGALITY & COMPLIANCE"
      subtitle="Regulatory Surveillance & HKI Audit"
    >
      {/* I. EXECUTIVE CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}>
        
        {/* Card 1: OVERALL REGISTRATION */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase" }}>OVERALL REGISTRATION</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 950, margin: 0, color: "#1E293B" }}>{metrics?.overall?.activeTotal ?? 142}</p>
              <p style={{ fontSize: "8px", color: "#64748B", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>ACTIVE TOTAL</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "18px", fontWeight: 950, margin: 0, color: "#10B981" }}>{metrics?.overall?.thisMonth ?? 12}</p>
              <p style={{ fontSize: "8px", color: "#64748B", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>THIS MONTH</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <div style={{ flex: 1, background: "#F1F5F9", padding: "8px", borderRadius: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", fontWeight: 950, margin: 0, color: "#1E293B" }}>{metrics?.overall?.onProgress ?? 24}</p>
              <p style={{ fontSize: "7px", color: "#64748B", margin: 0, textTransform: "uppercase" }}>ON PROGRESS</p>
            </div>
            <div style={{ flex: 1, background: "#FFF1F2", padding: "8px", borderRadius: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", fontWeight: 950, margin: 0, color: "#EF4444" }}>{metrics?.overall?.delayed ?? 8}</p>
              <p style={{ fontSize: "7px", color: "#EF4444", margin: 0, textTransform: "uppercase" }}>DELAYED</p>
            </div>
          </div>
        </div>

        {/* Card 2: BPOM PERFORMANCE */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase" }}>BPOM PERFORMANCE</p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
              {metrics?.bpomStats?.avgTime?.replace(" Days", "") ?? "45.2"}<span style={{ fontSize: "12px", fontWeight: 400 }}> days</span>
            </p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#64748B", margin: "2px 0 0 0", textTransform: "uppercase" }}>AVG PROCESSING TIME</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 500 }}>LAB TEST</span>
              <span style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{metrics?.bpomStats?.labTest ?? "14d"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 500 }}>GOV EVAL</span>
              <span style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{metrics?.bpomStats?.govEval ?? "31d"}</span>
            </div>
          </div>
        </div>

        {/* Card 3: HKI PERFORMANCE */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Bookmark className="w-3.5 h-3.5 text-purple-500" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", margin: 0, textTransform: "uppercase" }}>HKI PERFORMANCE</p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
              {metrics?.hkiStats?.avgTime?.replace(" Days", "") ?? "120"}<span style={{ fontSize: "12px", fontWeight: 400 }}> days</span>
            </p>
            <p style={{ fontSize: "8px", fontWeight: 800, color: "#64748B", margin: "2px 0 0 0", textTransform: "uppercase" }}>AVG PROCESSING TIME</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 500 }}>DOC PREP</span>
              <span style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{metrics?.hkiStats?.docPrep ?? "7d"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 500 }}>GOV PROCESS</span>
              <span style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{metrics?.hkiStats?.govProcess ?? "113d"}</span>
            </div>
          </div>
        </div>

        {/* Card 4: RISK MONITOR */}
        <div style={{ background: "#FFF1F2", padding: "1.5rem", borderRadius: "24px", border: "1px solid #FECDD3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#9F1239", margin: 0, textTransform: "uppercase" }}>RISK MONITOR</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "white", padding: "12px", borderRadius: "16px", border: "1px solid #FECDD3", textAlign: "center" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0, textTransform: "uppercase" }}>EXPIRED</p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#E11D48", margin: 0 }}>{metrics?.riskMonitor?.expired ?? 2}</p>
            </div>
            <div style={{ background: "white", padding: "12px", borderRadius: "16px", border: "1px solid #FECDD3", textAlign: "center" }}>
              <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0, textTransform: "uppercase" }}>&lt; 90 DAYS</p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#D97706", margin: 0 }}>{metrics?.riskMonitor?.under90Days ?? 5}</p>
            </div>
          </div>
        </div>
      </div>

      {/* II. HKI TRACKING HUB - ULTRA COMPACT TABLE */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label">1. HKI (HAK KEKAYAAN INTELEKTUAL) TRACKING HUB</h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>BRAND / PRODUCT (HKI ID)</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TYPE / CLIENT</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PIC / APPLY</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>FLOW STATE (DAYS)</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>STATUS</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>AUDIT RISK</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.tables?.hkiTracking?.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50/50 transition-colors">
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.brand}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.id}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.type}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#64748B" }}>{row.client}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#8B5CF6", textTransform: "uppercase" }}>{row.pic}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.apply}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.flow}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#64748B" }}>{row.days}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <span style={{ 
                        background: row.status === "DONE" ? "#ECFDF5" : row.status === "REJECT" ? "#FEF2F2" : "#FFFBEB", 
                        color: row.status === "DONE" ? "#059669" : row.status === "REJECT" ? "#DC2626" : "#D97706", 
                        padding: "4px 10px", 
                        borderRadius: "6px", 
                        fontSize: "8px", 
                        fontWeight: 950 
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {row.risk === "OK" ? (
                          <>
                            <span style={{ fontSize: "9px", fontWeight: 950, color: "#10B981" }}>OK</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span style={{ fontSize: "9px", fontWeight: 950, color: "#D97706", fontStyle: "italic" }}>DELAY AUDIT</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* III. BPOM PROGRESS AUDIT */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label">2. BPOM (NOTIFIKASI KOSMETIK) PROGRESS AUDIT</h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PRODUCT NAME (BPOM ID)</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CATEGORY / CLIENT</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PIC / APPLY</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>STAGE (BOTTLENECK)</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>STATUS</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>DAYS ELAPSED</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.tables?.bpomProgress?.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50/50 transition-colors">
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.name}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.id}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{row.cat}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#64748B" }}>{row.client}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#10B981", textTransform: "uppercase" }}>{row.pic}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{row.date}</p>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "11px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>
                      {row.stage}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <span style={{ 
                        background: row.status === "DONE" ? "#ECFDF5" : row.status === "IN_PROGRESS_ROSE" ? "#FEF2F2" : "#FFFBEB", 
                        color: row.status === "DONE" ? "#059669" : row.status === "IN_PROGRESS_ROSE" ? "#DC2626" : "#D97706", 
                        padding: "4px 10px", 
                        borderRadius: "6px", 
                        fontSize: "8px", 
                        fontWeight: 950 
                      }}>
                        {row.status.replace("IN_PROGRESS_ROSE", "IN PROGRESS")}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "11px", fontWeight: 950, color: row.days.includes("52") ? "#EF4444" : "#1E293B" }}>
                      {row.days}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* IV. NEAREST EXPIRING RADAR */}
      <div style={{ marginBottom: "4rem" }}>
        <h3 className="section-label">EXPIRY RADAR — NEAREST EXPIRING CERTIFICATES</h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TYPE</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CERTIFICATE / NAME</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>CERT NUMBER</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>EXPIRY DATE</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>DAYS LEFT</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.expiryData?.nearestExpiring?.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50/50 transition-colors">
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                      <span style={{ 
                        background: item.type === "HKI" ? "#F3E8FF" : item.type === "BPOM" ? "#E0F2FE" : "#FEF3C7", 
                        color: item.type === "HKI" ? "#7E22CE" : item.type === "BPOM" ? "#0369A1" : "#B45309", 
                        padding: "4px 8px", 
                        borderRadius: "6px", 
                        fontSize: "9px", 
                        fontWeight: 950 
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "11px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>{item.certNumber}</td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>{item.expiry}</td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <span style={{ 
                        background: item.daysLeft <= 30 ? "#FEF2F2" : item.daysLeft <= 60 ? "#FFFBEB" : "#ECFDF5", 
                        color: item.daysLeft <= 30 ? "#DC2626" : item.daysLeft <= 60 ? "#D97706" : "#059669", 
                        padding: "4px 10px", 
                        borderRadius: "20px", 
                        fontSize: "9px", 
                        fontWeight: 950 
                      }}>
                        {item.daysLeft}d
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <span style={{ 
                        background: item.status === "EXPIRED" || item.status === "CRITICAL" ? "#FEF2F2" : item.status === "WARNING" ? "#FFFBEB" : "#ECFDF5", 
                        color: item.status === "EXPIRED" || item.status === "CRITICAL" ? "#DC2626" : item.status === "WARNING" ? "#D97706" : "#059669", 
                        padding: "4px 10px", 
                        borderRadius: "6px", 
                        fontSize: "8px", 
                        fontWeight: 950 
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* V. DUAL SECTION: EXPIRY + PERFORMANCE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "2rem" }}>
        
        {/* CRITICAL EXPIRY AUDIT */}
        <div>
          <h3 className="section-label">3. CRITICAL EXPIRY AUDIT (PROTECTION)</h3>
          <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FFF1F2", borderBottom: "1px solid #FECDD3" }}>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#9F1239" }}>TYPE / REGISTRATION (BRAND)</th>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#9F1239" }}>CERT NUMBER / EXPIRY</th>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#9F1239" }}>DAYS LEFT</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.tables?.criticalExpiry?.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #FFF1F2" }} className="hover:bg-rose-50/10 transition-colors">
                      <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 950, color: "#9F1239", textTransform: "uppercase" }}>{row.type}</p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#E11D48" }}>{row.sub}</p>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 950, color: "#9F1239" }}>{row.cert}</p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "9px", fontWeight: 950, color: "#E11D48" }}>{row.expiry}</p>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        <span style={{ background: "#E11D48", color: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 950 }}>
                          {row.left}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LEGAL STAFF PERFORMANCE */}
        <div>
          <h3 className="section-label">4. LEGAL STAFF PERFORMANCE</h3>
          <div style={{ background: "white", padding: "1.5rem 2rem", borderRadius: "32px", border: "1px solid #E2E8F0" }}>
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 950, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: "10px", borderBottom: "1px solid #F1F5F9" }}>
                <span>STAFF NAME</span>
                <span style={{ textAlign: "center" }}>DONE/TOTAL</span>
                <span style={{ textAlign: "right" }}>WIN RATE</span>
              </div>
              {metrics?.tables?.staffHistory?.map((staff: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < metrics.tables.staffHistory.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{staff.name}</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{staff.avg}</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{staff.stat}</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "8px", fontWeight: 800, color: "#EF4444", textTransform: "uppercase" }}>{staff.delay}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "16px", fontWeight: 950, color: staff.color === "text-emerald-500" ? "#10B981" : "#EF4444" }}>{staff.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
