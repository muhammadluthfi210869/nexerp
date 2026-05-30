"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, XCircle, Search, AlertTriangle, TrendingDown } from "lucide-react";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { DnaInput, TableWrapper, DnaBadge } from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";

const LOST_REASON_LABELS: Record<string, { label: string; status: "success" | "info" | "warning" | "critical" | "purple" | "default" }> = {
  PRICE_ISSUE:        { label: "Harga",          status: "critical" },
  MOQ_TOO_HIGH:       { label: "MOQ Tinggi",     status: "warning"  },
  QUALITY:            { label: "Kualitas",        status: "warning"  },
  GHOSTING:           { label: "Ghosting",        status: "default"  },
  COMPETITOR:         { label: "Kompetitor",      status: "info"     },
  NOT_READY:          { label: "Belum Siap",      status: "info"     },
  OTHER:              { label: "Lainnya",         status: "default"  },
};

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD:           "Buku Tamu",
  CONTACTED:          "Contacted",
  NEGOTIATION:        "Negosiasi",
  SAMPLE_PROCESS:     "Sample",
  SAMPLE_REVISION:    "Sample Revisi",
  SAMPLE_APPROVED:    "Sample Approved",
  SPK_SIGNED:         "SPK Signed",
  PRODUCTION_PROCESS: "Produksi",
  READY_TO_SHIP:      "Ready Ship",
  WON_DEAL:           "Won Deal",
  LOST:               "Lost",
};

export default function LostPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [section, setSection] = useState<"prospect" | "churn">("prospect");
  const [renderTimestamp] = useState(() => Date.now());

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "lost"],
    queryFn: async () => {
      try { return (await api.get("/bussdev/analytics/lost")).data; }
      catch { return null; }
    },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "lost"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/lost")).data,
  });

  // Section A: Lost before deal (prospect fail) = never reached SPK_SIGNED
  const prospectFail = leads?.filter(l =>
    !["SPK_SIGNED", "PRODUCTION_PROCESS", "READY_TO_SHIP", "WON_DEAL"].includes(l.stage)
  );

  // Section B: Lost after delivery (churn) = reached at least SPK_SIGNED
  const churnClient = leads?.filter(l =>
    ["SPK_SIGNED", "PRODUCTION_PROCESS", "READY_TO_SHIP", "WON_DEAL"].includes(l.lastKnownStage || l.stage)
  );

  const filteredProspects = prospectFail?.filter(l =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChurn = churnClient?.filter(l =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 text-rose-600" />
    </div>
  );

  return (
    <TableShell
      title="PIPELINE"
      titleAccent="Lost"
      subtitle=""
      actions={
        <DnaBadge status="critical" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          {leads?.length || 0} Total Lost
        </DnaBadge>
      }
    >
      <div className="animate-fade-slide-in space-y-10">
        {/* ── Dashboard Cards ──────────────────────────────────────── */}
        <DashboardCards variant="lost" data={analytics} />

        {/* ── Search bar ───────────────────────────────────────────── */}
        <div className="flex justify-end bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-full md:w-80">
            <DnaInput
              placeholder="FILTER BRAND / CLIENT..."
              icon={<Search className="h-4 w-4" />}
              className="font-black text-xs uppercase"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Section A: Prospect Gagal ─────────────────────────────── */}
        <div style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%" }} />
            <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
              SECTION A: LOST SEBELUM DEAL (PROSPECT GAGAL)
            </h2>
          </div>
          
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B" }}>BRAND & PRODUK</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B" }}>PIC BD</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B", textAlign: "right" }}>EST. VALUE DEAL</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B", textAlign: "center" }}>STAGE TERAKHIR</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#DC2626" }}>ALASAN LOST (CRITICAL)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects && filteredProspects.length > 0 ? (
                  filteredProspects.map((lead: any) => {
                    const lostReasonCfg = LOST_REASON_LABELS[lead.lostReason] || LOST_REASON_LABELS.OTHER;
                    return (
                      <tr key={lead.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "1.2rem" }}>
                          <p style={{ fontSize: "13px", fontWeight: 900, color: "#1E293B", margin: 0 }}>
                            {(lead.brandName || lead.clientName || "—").toUpperCase()}
                          </p>
                          <p style={{ fontSize: "10px", fontWeight: 600, color: "#64748B", margin: "2px 0 0 0" }}>
                            {lead.productInterest || "—"}
                          </p>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "20px", height: "20px", background: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                              👤
                            </div>
                            <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", margin: 0 }}>
                              {lead.pic?.name || "Unassigned"}
                            </p>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ padding: "1.2rem", textAlign: "right", fontSize: "13px", fontWeight: 900, color: "#EF4444" }}>
                          {formatCurrency(Number(lead.estimatedValue || 0))}
                        </td>
                        <td style={{ padding: "1.2rem", textAlign: "center" }}>
                          <span style={{ fontSize: "9px", fontWeight: 900, padding: "4px 10px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "100px", color: "#64748B" }}>
                            {(STAGE_LABELS[lead.stage] || lead.stage || "—").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px" }}>
                            <XCircle className="h-3 w-3 text-red-600 shrink-0" />
                            <span style={{ fontSize: "11px", fontWeight: 900, color: "#DC2626" }}>
                              {(lostReasonCfg.label || "Lainnya").toUpperCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                      Tidak ada data lost sebelum deal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section B: Churn Customer ────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div style={{ width: "8px", height: "8px", background: "#7C3AED", borderRadius: "50%" }} />
            <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
              SECTION B: LOST SETELAH DELIVERY (CHURN CUSTOMER)
            </h2>
          </div>
          
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B" }}>BRAND & PRODUK TERAKHIR</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B" }}>QTY TERAKHIR</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B" }}>TGL TERAKHIR ORDER</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#64748B", textAlign: "center" }}>STATUS</th>
                  <th style={{ padding: "1.2rem", fontSize: "10px", fontWeight: 900, color: "#DC2626" }}>ALASAN CHURN</th>
                </tr>
              </thead>
              <tbody>
                {filteredChurn && filteredChurn.length > 0 ? (
                  filteredChurn.map((lead: any) => {
                    const lostReasonCfg = LOST_REASON_LABELS[lead.lostReason] || LOST_REASON_LABELS.OTHER;
                    
                    // Formatting order date
                    const lastDateStr = lead.wonAt
                      ? new Date(lead.wonAt).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "—";

                    // Estimated repeat order date (e.g. last order date + 60 days)
                    const estNextStr = lead.wonAt
                      ? new Date(new Date(lead.wonAt).getTime() + 60 * 24 * 3600 * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "—";

                    return (
                      <tr key={lead.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "1.2rem" }}>
                          <p style={{ fontSize: "13px", fontWeight: 900, color: "#1E293B", margin: 0 }}>
                            {(lead.brandName || lead.clientName || "—").toUpperCase()}
                          </p>
                          <p style={{ fontSize: "10px", fontWeight: 600, color: "#64748B", margin: "2px 0 0 0" }}>
                            {lead.productInterest || "—"}
                          </p>
                        </td>
                        <td className="tabular-nums" style={{ padding: "1.2rem", fontSize: "12px", fontWeight: 800, color: "#1E293B" }}>
                          {lead.moq ? `${Number(lead.moq).toLocaleString()} Pcs` : "—"}
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <p className="tabular-nums" style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", margin: 0 }}>
                            {lastDateStr}
                          </p>
                          <p style={{ fontSize: "8px", color: "#94A3B8", margin: 0 }}>
                            EST. REPEAT: {estNextStr}
                          </p>
                        </td>
                        <td style={{ padding: "1.2rem", textAlign: "center" }}>
                          <span style={{
                            fontSize: "9px",
                            fontWeight: 900,
                            padding: "4px 10px",
                            borderRadius: "100px",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FEE2E2"
                          }}>
                            LOST
                          </span>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px" }}>
                            <XCircle className="h-3 w-3 text-red-600 shrink-0" />
                            <span style={{ fontSize: "11px", fontWeight: 900, color: "#DC2626" }}>
                              {(lostReasonCfg.label || "Lainnya").toUpperCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                      Tidak ada data churn customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TableShell>
  );
}
