"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PipelineFlow: React.FC<{ stage: string }> = ({ stage }) => {
  const steps = ["NOT START", "REV 1", "REV 2", "EXTRA", "DEAL"];
  const stageMap: Record<string, number> = {
    REQUEST: 0,
    DEVELOPMENT: 1,
    TESTING: 2,
    REVISION: 3,
    SAMPLE: 3,
    APPROVED: 4,
  };
  const current = stageMap[stage] ?? 0;

  return (
    <div style={{ display: "flex", gap: "3px", justifyContent: "center", alignItems: "center" }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div
            style={{
              width: "32px",
              height: "6px",
              borderRadius: "3px",
              background: i <= current ? (i === current ? "#2563EB" : "#93C5FD") : "#F1F5F9",
              border: i === current ? "1px solid #1D4ED8" : "none",
            }}
          />
          <span style={{ fontSize: "7px", fontWeight: 950, color: i === current ? "#1E293B" : "#94A3B8" }}>{step}</span>
        </div>
      ))}
    </div>
  );
};

export default function RndDashboardPage() {
  const { data: metrics } = useQuery({
    queryKey: ["rnd-dashboard-metrics"],
    queryFn: async () => {
      try {
        const res = await api.get("/dashboards/rnd");
        return res.data;
      } catch {
        const res2 = await api.get("/rnd/dashboard");
        return res2.data;
      }
    },
    staleTime: 30000,
  });

  const pipelineRows = metrics?.tables?.pipelineMaster || [];
  const staffRows = metrics?.tables?.performanceEvaluation || [];
  const rejectRows = metrics?.tables?.failureLogs || [];

  return (
    <DashboardShell
      title="DIVISI R&D"
      titleAccent="(Product Innovation Lab)"
      subtitle="Pusat Kendali Formula, Sampel & Flow Velocity"
    >
      {/* 🚀 OVERVIEW GRID: R&D VITALITY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "3rem" }}>

        {/* 🔴 A. TIMELINESS */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>🔴 A. TIMELINESS</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "16px" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", margin: 0 }}>ON-TIME SAMPLE RATE</p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#10B981", margin: "4px 0" }}>
                {metrics?.timeliness?.onTimeRate !== undefined ? `${metrics.timeliness.onTimeRate}%` : "0%"}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <div>
                <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>AVG CYCLE</p>
                <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                  {metrics?.timeliness?.avgCycleTime ?? 0} <span style={{ fontSize: "9px" }}>DAYS</span>
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>OVERDUE</p>
                <p style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
                  {metrics?.timeliness?.overdueCount ?? 0} <span style={{ fontSize: "9px" }}>SAMPLES</span>
                </p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8", marginTop: "1rem", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginBottom: 0 }}>
            Insight: <span style={{ color: "#1E293B" }}>{metrics?.timeliness?.insight || "Menunggu data operasional"}</span>
          </p>
        </div>

        {/* 🟠 B. ACCURACY */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#F59E0B", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>🟠 B. ACCURACY</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "16px" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", margin: 0 }}>FIRST-TIME APPROVAL</p>
              <p style={{ fontSize: "20px", fontWeight: 950, color: "#2563EB", margin: "4px 0" }}>
                {metrics?.accuracy?.firstTimeApprovalRate !== undefined ? `${metrics.accuracy.firstTimeApprovalRate}%` : "0%"}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <div>
                <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>AVG REVISION</p>
                <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                  {metrics?.accuracy?.avgRevision ?? 0} <span style={{ fontSize: "9px" }}>X</span>
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>FAILED</p>
                <p style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
                  {metrics?.accuracy?.failedItemsCount ?? 0} <span style={{ fontSize: "9px" }}>ITEMS</span>
                </p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8", marginTop: "1rem", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginBottom: 0 }}>
            Insight: <span style={{ color: "#1E293B" }}>{metrics?.accuracy?.insight || "Menunggu data formulasi"}</span>
          </p>
        </div>

        {/* 🟡 C. APPROVAL PERFORMANCE */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#EAB308", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>🟡 C. APPROVAL PERFORMANCE</p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
              {metrics?.approval?.overallRate !== undefined ? `${metrics.approval.overallRate}%` : "0%"}
            </p>
            <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>OVERALL APPROVAL RATE</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", background: "#FFFBEB", padding: "10px", borderRadius: "12px" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ fontSize: "8px", fontWeight: 800, color: "#B45309", margin: 0 }}>SUBMITTED</p>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{metrics?.approval?.submitted ?? 0}</p>
            </div>
            <div style={{ width: "1px", background: "#FEF3C7" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ fontSize: "8px", fontWeight: 800, color: "#B45309", margin: 0 }}>APPROVED</p>
              <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{metrics?.approval?.approved ?? 0}</p>
            </div>
          </div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8", marginTop: "1rem", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginBottom: 0 }}>
            Insight: <span style={{ color: "#1E293B" }}>{metrics?.approval?.insight || "Alur persetujuan sampel normal"}</span>
          </p>
        </div>

        {/* 🔵 D. R&D PERFORMANCE */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#3B82F6", borderRadius: "50%" }} />
            <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>🔵 D. R&D PERFORMANCE</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#EFF6FF", padding: "10px", borderRadius: "12px" }}>
              <p style={{ fontSize: "8px", fontWeight: 800, color: "#1D4ED8", margin: 0 }}>ACTIVE PJKT</p>
              <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{metrics?.performance?.activeProjects ?? 0}</p>
            </div>
            <div style={{ background: "#F0FDF4", padding: "10px", borderRadius: "12px" }}>
              <p style={{ fontSize: "8px", fontWeight: 800, color: "#166534", margin: 0 }}>COMPLETED</p>
              <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{metrics?.performance?.completedProjects ?? 0}</p>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>UTILIZATION RATE</span>
              <span style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B" }}>{metrics?.performance?.utilizationRate ?? 0}%</span>
            </div>
            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(metrics?.performance?.utilizationRate ?? 0, 100)}%`, height: "100%", background: "#3B82F6" }} />
            </div>
          </div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8", marginTop: "1rem", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginBottom: 0 }}>
            Insight: <span style={{ color: "#1E293B" }}>{metrics?.performance?.insight || "Kapasitas R&D teroptimalisasi"}</span>
          </p>
        </div>

      </div>

      {/* 🔴 1. RND PIPELINE TABLE */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>🔴 1. R&D PIPELINE MASTER (FLOW VELOCITY)</h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "1200px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>RND ID / BRAND</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>PRODUCT NAME</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>TEAM (BD / PIC)</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>CURRENT STAGE</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>TIME AUDIT</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>QUALITY (REV)</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {pipelineRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8", fontSize: "12px", fontWeight: 600 }}>
                      Belum ada sampel dalam pipeline R&D.
                    </td>
                  </tr>
                ) : (
                  pipelineRows.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontSize: "11px", fontWeight: 900, color: "#64748B" }}>#{row.id}</div>
                        <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{row.brand}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", fontSize: "13px", fontWeight: 900, color: "#1E293B" }}>{row.product || row.prod}</td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#1E293B" }}>{row.pic}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>BD: {row.bd}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <PipelineFlow stage={row.stage} />
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", fontWeight: 900, color: "#1E293B" }}>{row.timeAudit || `In Stage: ${row.days || "-"}`}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>{row.totalTime || `Total: ${row.total || "-"}`}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 950, color: "#F59E0B" }}>{row.revisions || row.rev || "0"}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <span style={{
                          background: row.status === "APPROVED" ? "#10B981" : (row.status === "REJECTED" ? "#EF4444" : "#64748B"),
                          color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950
                        }}>{row.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🟠 2 & 🟡 3. RND EVALUATION & REJECT LOG */}
      <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "2rem" }}>

        {/* 🟠 2. RND PERFORMANCE TABLE */}
        <div>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>🟠 2. R&D PERFORMANCE EVALUATION (PER PERSON)</h3>
          <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>PIC NAME / PERIOD</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>OUTPUT (COMP/APP)</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>EFFICIENCY</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>QUALITY</th>
                  <th style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>UTILIZATION</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94A3B8", fontSize: "12px", fontWeight: 600 }}>
                      Belum ada data evaluasi staf R&D.
                    </td>
                  </tr>
                ) : (
                  staffRows.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1.25rem 1.5rem", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{row.picName || row.name}</td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{row.output || row.comp}</td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#10B981" }}>{row.efficiency || row.ot}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", fontWeight: 950, color: "#2563EB" }}>{row.quality || row.first}</div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{row.utilization || row.util}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🟡 3. RND FAILURE / REJECT TABLE */}
        <div>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>🟡 3. FAILURE / REJECT LOG</h3>
          <div style={{ background: "#FFF1F2", borderRadius: "32px", border: "1px solid #FECDD3", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FFF1F2", borderBottom: "1px solid #FECDD3" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#9F1239" }}>PRODUCT / STAGE</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#9F1239" }}>REASON</th>
                </tr>
              </thead>
              <tbody>
                {rejectRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: "2rem", textAlign: "center", color: "#9F1239", fontSize: "11px", fontWeight: 600 }}>
                      Tidak ada log kegagalan sampel.
                    </td>
                  </tr>
                ) : (
                  rejectRows.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(225, 29, 72, 0.1)" }}>
                      <td style={{ padding: "1rem" }}>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{row.productName || row.prod}</p>
                        <p style={{ margin: 0, fontSize: "8px", fontWeight: 700, color: "#64748B" }}>STAGE: {row.stage}</p>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#E11D48" }}>{row.reason}</p>
                        <p style={{ margin: 0, fontSize: "8px", fontWeight: 700, color: "#94A3B8" }}>PIC: {row.picName || row.pic}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
