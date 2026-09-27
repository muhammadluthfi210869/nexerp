"use client";

import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaEmptyState,
  DnaBadge,
} from "@/components/dna";

import React from "react";
import * as Lucide from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

const Icon = ({ name, size = 18, color, style, className }: { name: string; size?: number; color?: string; style?: React.CSSProperties; className?: string }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} className={className} />;
};

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "1.5rem",
  borderRadius: "24px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
};

const thStyle: React.CSSProperties = { padding: "1.25rem 2rem", fontSize: "10px", fontWeight: 950, color: "#94A3B8" };
const tdStyle: React.CSSProperties = { padding: "1.5rem 2rem" };

const asArray = (body: any): any[] => (Array.isArray(body) ? body : (body?.data ?? []));

export default function ProductionDashboardPage() {
  const dashboard = useQuery<any>({
    queryKey: ["production-dashboard"],
    queryFn: async () => {
      const res = await api.get("/production/dashboard");
      return unwrapResponse<any>(res) ?? {};
    },
  });

  const preparation = useQuery<any[]>({
    queryKey: ["production-warehouse-preparation"],
    queryFn: async () => asArray(unwrapResponse<any>(await api.get("/production/warehouse-preparation"))),
  });

  const microFlow = useQuery<any[]>({
    queryKey: ["production-micro-flow"],
    queryFn: async () => asArray(unwrapResponse<any>(await api.get("/production/micro-flow"))),
  });

  const granular = useQuery<any[]>({
    queryKey: ["production-batch-audit"],
    queryFn: async () => asArray(unwrapResponse<any>(await api.get("/production/batch-audit"))),
  });

  const cards = dashboard.data?.cards;
  const isLoading = dashboard.isLoading;
  const isError = dashboard.isError;

  const achievement = cards?.achievement;
  const timeliness = cards?.timeliness;
  const efficiency = cards?.efficiency;
  const quality = cards?.quality;
  const alerts = cards?.alerts;

  const precision = (dashboard.data?.precisionTracking ?? []) as any[];

  return (
    <DashboardShell
      title="PRODUCTION COMMAND CENTER"
      subtitle="Shop Floor & Efficiency Audit — sumber: /production/dashboard, /warehouse-preparation, /micro-flow, /batch-audit"
    >
      {isError ? (
        <DnaErrorState
          title="Gagal Memuat Dasbor Produksi"
          message="Tidak dapat mengambil metrik produksi dari server."
          onRetry={() => dashboard.refetch()}
        />
      ) : isLoading ? (
        <DnaLoadingSkeleton rows={8} />
      ) : (
        <>
          {/* 🚀 I. EXECUTIVE OVERVIEW (Manufacturing Command) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}>

            {/* 🎯 1. PRODUCTION OUTPUT */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Icon name="Target" size={16} color="#3B82F6" />
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>A. OUTPUT & ACHIEVEMENT</p>
              </div>
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                  {achievement ? `${achievement.rate.toFixed(1)}%` : "—"}
                </p>
                <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>ACHIEVEMENT RATE</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>PLANNED</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                    {achievement ? `${achievement.planned.toLocaleString("id-ID")} Units` : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>ACTUAL</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#10B981" }}>
                    {achievement ? `${achievement.actual.toLocaleString("id-ID")} Units` : "—"}
                  </span>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", marginTop: "4px" }}>
                  <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>COMPLETED ORDERS</p>
                  <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                    {achievement ? `${achievement.completedOrders} / ${achievement.totalOrders}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ⏱️ 2. TIMELINESS */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Icon name="Clock" size={16} color="#EAB308" />
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>B. TIMELINESS AUDIT</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>ON-TIME RATE</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#EAB308" }}>
                    {timeliness ? `${timeliness.rate}%` : "—"}
                  </span>
                </div>
                <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Number(timeliness?.rate ?? 0))}%`, height: "100%", background: "#EAB308" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ background: "#FFF1F2", padding: "8px", borderRadius: "10px" }}>
                    <p style={{ fontSize: "7px", fontWeight: 850, color: "#EF4444", margin: 0 }}>DELAYED</p>
                    <p style={{ fontSize: "12px", fontWeight: 950, color: "#E11D48", margin: 0 }}>
                      {timeliness ? timeliness.delayed : "—"}
                    </p>
                  </div>
                  <div style={{ background: "#F0FDF4", padding: "8px", borderRadius: "10px" }}>
                    <p style={{ fontSize: "7px", fontWeight: 850, color: "#166534", margin: 0 }}>AVG CYCLE</p>
                    <p style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
                      {timeliness ? `${timeliness.avgCycleHours}h` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ⚙️ 3. EFFICIENCY */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Icon name="Cpu" size={16} color="#8B5CF6" />
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>C. RESOURCE EFFICIENCY</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>MACHINE UTIL.</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#8B5CF6" }}>
                    {efficiency ? `${efficiency.utilization}%` : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>LABOR PROD.</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                    {efficiency ? `${efficiency.labor}%` : "—"}
                  </span>
                </div>
                <div style={{ background: "#FFF7ED", padding: "10px", borderRadius: "12px", border: "1px solid #FFEDD5", marginTop: "4px" }}>
                  <p style={{ fontSize: "8px", fontWeight: 850, color: "#C2410C", margin: 0 }}>DOWNTIME (MTD)</p>
                  <p style={{ fontSize: "14px", fontWeight: 950, color: "#EA580C", margin: "2px 0 0 0" }}>
                    {efficiency ? `${efficiency.downtime}` : "—"}
                  </p>
                </div>
                <p style={{ fontSize: "8px", color: "#94A3B8", margin: 0, fontStyle: "italic" }}>
                  Utilisasi & labor masih baseline backend, belum dari OEE mesin.
                </p>
              </div>
            </div>

            {/* 🧪 4. QUALITY */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Icon name="Beaker" size={16} color="#10B981" />
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>D. QUALITY CONTROL</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>GOOD UNITS</p>
                  <p style={{ fontSize: "18px", fontWeight: 950, color: "#10B981", margin: 0 }}>
                    {quality ? quality.goodUnits.toLocaleString("id-ID") : "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", margin: 0 }}>DEFECT RATE</p>
                  <p style={{ fontSize: "18px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
                    {quality ? `${quality.defectRate}%` : "—"}
                  </p>
                </div>
              </div>
              <div style={{ background: "#F1F5F9", height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${Math.max(0, 100 - Number(quality?.defectRate ?? 0))}%`, height: "100%", background: "#10B981" }} />
                <div style={{ width: `${Math.min(100, Number(quality?.defectRate ?? 0))}%`, height: "100%", background: "#EF4444" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 850, color: "#64748B" }}>REWORK COUNT</span>
                <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>
                  {quality ? `${quality.reworkCount} Pcs` : "—"}
                </span>
              </div>
            </div>

            {/* ⚠️ 5. RISK ALERT */}
            <div style={{ ...cardStyle, background: "#FFF1F2", border: "1px solid #FECDD3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <Icon name="ShieldAlert" size={16} color="#E11D48" />
                <p style={{ fontSize: "11px", fontWeight: 950, color: "#9F1239", letterSpacing: "0.05em", margin: 0 }}>E. CRITICAL ALERTS</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: "10px", border: "1px solid #FECDD3" }}>
                  <span style={{ fontSize: "9px", fontWeight: 900, color: "#E11D48" }}>BREAKDOWNS</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{alerts ? alerts.breakdown : "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: "10px", border: "1px solid #FECDD3" }}>
                  <span style={{ fontSize: "9px", fontWeight: 900, color: "#EF4444" }}>SHORTAGES</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{alerts ? alerts.shortages : "—"}</span>
                </div>
                <div style={{ background: "#9F1239", padding: "8px 12px", borderRadius: "10px", marginTop: "2px" }}>
                  <p style={{ fontSize: "8px", fontWeight: 950, color: "#ffffff", margin: 0, opacity: 0.9 }}>ANOMALI TERDETEKSI</p>
                  <p style={{ fontSize: "10px", fontWeight: 950, color: "#ffffff", margin: 0 }}>
                    {alerts ? `${alerts.urgent} LOG REJECT > 5%` : "—"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 📦 II. PENYIAPAN BAHAN (FROM WAREHOUSE) */}
          <div style={{ marginBottom: "3.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#64748B", letterSpacing: "0.05em" }}>II. PENYIAPAN BAHAN (FROM WAREHOUSE)</h3>
              <Link href="/warehouse" style={{
                background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                padding: "6px 16px", borderRadius: "99px", fontSize: "11px", fontWeight: 950,
                display: "flex", alignItems: "center", gap: "6px", textDecoration: "none"
              }}>
                MONITORING GUDANG
              </Link>
            </div>
            <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {preparation.isLoading ? (
                <DnaLoadingSkeleton rows={3} />
              ) : preparation.isError ? (
                <DnaErrorState
                  title="Gagal Memuat Penyiapan Bahan"
                  message="Tidak dapat mengambil data picking dari server."
                  onRetry={() => preparation.refetch()}
                />
              ) : (preparation.data ?? []).length === 0 ? (
                <DnaEmptyState
                  title="Tidak Ada Work Order Menunggu Bahan"
                  description="Belum ada work order berstatus WAITING_MATERIAL pada sistem."
                />
              ) : (
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <DnaTh style={{ ...thStyle, textAlign: "left" }}>WORK ORDER / PRODUK</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center" }}>STATUS PICKING</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center" }}>KELENGKAPAN</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "right" }}>ESTIMASI KIRIM</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {(preparation.data ?? []).map((row) => {
                      const color =
                        row.status === "READY" ? "#10B981" : row.status === "PICKING" ? "#3B82F6" : "#94A3B8";
                      return (
                        <DnaTableRow key={row.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <DnaTd style={tdStyle}>
                            <div style={{ fontSize: "14px", fontWeight: 950, color: "#0F172A" }}>{row.woNumber}</div>
                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>{row.productName}</div>
                          </DnaTd>
                          <DnaTd style={{ ...tdStyle, textAlign: "center" }}>
                            <span style={{ fontSize: "10px", fontWeight: 950, color }}>{row.status}</span>
                          </DnaTd>
                          <DnaTd style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ flex: 1, height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(100, Number(row.completeness || 0))}%`, height: "100%", background: color }} />
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 950, color: "#0F172A", minWidth: "45px" }}>{row.completeness}%</span>
                            </div>
                          </DnaTd>
                          <DnaTd style={{ ...tdStyle, textAlign: "right" }}>
                            <div style={{ fontSize: "12px", fontWeight: 950, color: row.status === "READY" ? "#10B981" : "#1E293B" }}>
                              {row.status === "READY" ? "READY" : new Date(row.estimatedDelivery).toLocaleDateString("id-ID")}
                            </div>
                            <div style={{ fontSize: "10px", color: row.diffDays < 0 ? "#E11D48" : "#94A3B8" }}>
                              {row.diffDays < 0 ? `LEWAT ${Math.abs(row.diffDays)} HARI` : `H-${row.diffDays}`}
                            </div>
                          </DnaTd>
                        </DnaTableRow>
                      );
                    })}
                  </DnaTableBody>
                </DnaTable>
              )}
            </div>
          </div>

          {/* 🧪 III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK) */}
          <div style={{ marginBottom: "4rem" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "13px", fontWeight: 950, color: "#64748B", letterSpacing: "0.05em" }}>III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK)</h3>
            {microFlow.isLoading ? (
              <DnaLoadingSkeleton rows={2} />
            ) : microFlow.isError ? (
              <DnaErrorState
                title="Gagal Memuat Alur Mikro"
                message="Tidak dapat mengambil diagnostik lantai pabrik."
                onRetry={() => microFlow.refetch()}
              />
            ) : (microFlow.data ?? []).length === 0 ? (
              <DnaEmptyState title="Belum Ada Alur Aktif" description="Tidak ada work order aktif di lantai produksi." />
            ) : (
              <div style={{ background: "white", padding: "2.5rem", borderRadius: "32px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {(microFlow.data ?? []).map((item, i, arr) => {
                  const icons: Record<string, string> = {
                    WAITING_MATERIAL: "ClipboardList",
                    MIXING: "Workflow",
                    FILLING: "Pipette",
                    PACKING: "Package",
                  };
                  const heatColor =
                    item.heat === "CRITICAL" ? "#E11D48" : item.heat === "BUSY" ? "#EAB308" : "#94A3B8";
                  return (
                    <React.Fragment key={item.stage}>
                      <div style={{
                        width: "180px", padding: "1.5rem", borderRadius: "16px", border: "1px solid #F1F5F9",
                        background: "white", textAlign: "center", position: "relative",
                        boxShadow: "0 4px 15px -5px rgba(0,0,0,0.05)"
                      }}>
                        <p style={{ fontSize: "11px", fontWeight: 800, color: "#94A3B8", marginBottom: "8px", margin: 0 }}>
                          {item.stage.replace("_", " ")}
                        </p>
                        <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: "4px 0" }}>{item.batchCount}</p>
                        <p style={{ fontSize: "10px", fontWeight: 900, color: "#94A3B8", margin: 0 }}>
                          {item.totalUnits.toLocaleString("id-ID")} UNIT
                        </p>
                        <p style={{ fontSize: "9px", fontWeight: 900, color: heatColor, margin: "4px 0 0 0" }}>{item.heat}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 950, color: heatColor, background: item.heat === "CRITICAL" ? "#FFF1F2" : "#F8FAFC", padding: "2px 8px", borderRadius: "4px" }}>
                            WAIT: {item.waitTime}
                          </span>
                          <Icon name="ArrowRight" size={20} color={item.heat === "CRITICAL" ? "#EF4444" : "#CBD5E1"} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            <p style={{ fontSize: "10px", color: "#94A3B8", marginTop: "10px", fontStyle: "italic" }}>
              Catatan: nilai wait time masih estimasi kasar dari backend (bukan selisih waktu antar tahap sebenarnya).
            </p>
          </div>

          {/* 📊 IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING) */}
          <div style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING)</h3>
              <span style={{ background: "#4F46E5", color: "white", padding: "4px 12px", borderRadius: "99px", fontSize: "10px", fontWeight: 950 }}>CHAIN OF CUSTODY</span>
            </div>
            <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {precision.length === 0 ? (
                <DnaEmptyState
                  title="Belum Ada Log Produksi Bulan Ini"
                  description="Tidak ada production log yang tercatat pada periode month-to-date."
                />
              ) : (
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <DnaTh style={{ ...thStyle, textAlign: "left", color: "#4F46E5" }}>DEADLINE (H-MINUS)</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "left", color: "#4F46E5" }}>PRODUCT ID / NAME</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center", color: "#4F46E5" }}>UNIT FLOW (IN &gt;&gt; GOOD)</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center", color: "#4F46E5" }}>ANOMALY STATUS</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "right", color: "#4F46E5" }}>TAHAP</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {precision.map((row, i) => (
                      <DnaTableRow key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <DnaTd style={tdStyle}>
                          <div style={{ fontSize: "13px", fontWeight: 950, color: "#0F172A" }}>
                            {row.deadline < 0 ? `LEWAT ${Math.abs(row.deadline)} HARI` : `H-${row.deadline}`}
                          </div>
                        </DnaTd>
                        <DnaTd style={tdStyle}>
                          <div style={{ fontSize: "14px", fontWeight: 950, color: "#0F172A" }}>{row.productName}</div>
                          <div style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>{row.batchId}</div>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, textAlign: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 950, color: "#4F46E5", background: "#EEF2FF", padding: "4px 12px", borderRadius: "8px" }}>
                            {row.unitFlow}
                          </span>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, textAlign: "center" }}>
                          <DnaBadge variant={row.anomaly === "DEFECT_DETECTED" ? "critical" : "success"}>
                            {row.anomaly}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, textAlign: "right" }}>
                          <span style={{ fontSize: "11px", fontWeight: 950, color: "#4F46E5" }}>{row.status}</span>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              )}
            </div>
          </div>

          {/* 🧪 V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI) */}
          <div style={{ marginBottom: "4rem" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "13px", fontWeight: 950, color: "#64748B", letterSpacing: "0.05em" }}>V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI)</h3>
            <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {granular.isLoading ? (
                <DnaLoadingSkeleton rows={4} />
              ) : granular.isError ? (
                <DnaErrorState
                  title="Gagal Memuat Audit Batch"
                  message="Tidak dapat mengambil audit granular batch produksi."
                  onRetry={() => granular.refetch()}
                />
              ) : (granular.data ?? []).length === 0 ? (
                <DnaEmptyState
                  title="Belum Ada Work Order Aktif"
                  description="Tidak ada work order berjalan untuk diaudit saat ini."
                />
              ) : (
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <DnaTh style={{ ...thStyle, textAlign: "left" }}>NO. WORK ORDER</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "left" }}>NAMA KLIEN &amp; PRODUK</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center" }}>TAHAPAN SAAT INI</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "center" }}>ESTIMASI SELESAI</DnaTh>
                      <DnaTh style={{ ...thStyle, textAlign: "right" }}>QTY DEFECT</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {(granular.data ?? []).map((row) => (
                      <DnaTableRow key={row.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <DnaTd style={{ ...tdStyle, padding: "1.25rem 2rem", fontSize: "12px", fontWeight: 800, color: "#94A3B8" }}>
                          {row.woNumber}
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, padding: "1.25rem 2rem" }}>
                          <div style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B" }}>{row.clientName}</div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>{row.productName}</div>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, padding: "1.25rem 2rem", textAlign: "center" }}>
                          <span style={{
                            background: row.healthScore === "ANOMALY" ? "#E11D48" : "#F1F5F9",
                            color: row.healthScore === "ANOMALY" ? "white" : "#1E293B",
                            padding: "6px 14px", borderRadius: "99px", fontSize: "10px", fontWeight: 950
                          }}>{row.currentStage}</span>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, padding: "1.25rem 2rem", textAlign: "center" }}>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1E293B" }}>
                            {new Date(row.estCompletion).toLocaleDateString("id-ID")}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 900, color: row.healthScore === "ANOMALY" ? "#E11D48" : "#64748B" }}>
                            {row.deadlineHeader}
                          </div>
                        </DnaTd>
                        <DnaTd style={{ ...tdStyle, padding: "1.25rem 2rem", textAlign: "right" }}>
                          <span style={{ fontSize: "13px", fontWeight: 950, color: row.qtyDefect > 0 ? "#E11D48" : "#10B981" }}>
                            {row.qtyDefect} Pcs
                          </span>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}