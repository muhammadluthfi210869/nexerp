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

  const currentData = section === "prospect" ? prospectFail : churnClient;

  const filtered = currentData?.filter(l =>
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

        {/* ── Section Toggle ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setSection("prospect")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
              section === "prospect"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            Section A · Prospect Gagal ({prospectFail?.length || 0})
          </button>
          <button
            onClick={() => setSection("churn")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
              section === "churn"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            Section B · Churn After Delivery ({churnClient?.length || 0})
          </button>
        </div>

        {/* ── Main Table ───────────────────────────────────────────── */}
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-1.5 h-6 rounded-full animate-pulse", section === "prospect" ? "bg-rose-600" : "bg-slate-800")} />
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    {section === "prospect" ? "Section A: Lost Sebelum Deal (Prospect Gagal)" : "Section B: Lost Setelah Delivery (Churn Customer)"}
                  </h3>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                    {section === "prospect" ? "Leads yang tidak pernah mencapai tahap produksi" : "Client yang pernah order namun tidak repeat"}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-80">
                <DnaInput
                  placeholder="Filter brand / client..."
                  icon={<Search className="h-4 w-4" />}
                  className="font-black"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  {section === "prospect" ? (
                    ["No", "Brand & Produk", "PIC BD", "Est. Value Deal", "Stage Terakhir", "Alasan Lost", "FU Terakhir", "Durasi"].map(h => (
                      <TableHead key={h} className="py-2.5 font-black uppercase text-[9px] text-slate-500 tracking-wider whitespace-nowrap px-3">{h}</TableHead>
                    ))
                  ) : (
                    ["No", "Brand & Produk Terakhir", "PIC BD", "Qty Terakhir", "Tgl Terakhir Order", "Est. Value", "Status", "Alasan Churn"].map(h => (
                      <TableHead key={h} className="py-2.5 font-black uppercase text-[9px] text-slate-500 tracking-wider whitespace-nowrap px-3">{h}</TableHead>
                    ))
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered && filtered.length > 0 ? (
                  filtered.map((lead: any, idx: number) => {
                    const lostReasonCfg = LOST_REASON_LABELS[lead.lostReason] || LOST_REASON_LABELS.OTHER;
                    const days = Math.floor((renderTimestamp - new Date(lead.updatedAt || lead.createdAt).getTime()) / (1000 * 3600 * 24));

                    if (section === "prospect") {
                      return (
                        <TableRow key={lead.id} className="group hover:bg-rose-50/20 transition-colors border-slate-50">
                          <TableCell className="px-3 text-[10px] font-black text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-rose-500" />
                              </div>
                              <div className="whitespace-nowrap">
                                <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{lead.brandName || lead.clientName}</p>
                                <p className="text-[10px] font-medium text-slate-400">{lead.productInterest}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 font-black text-[9px] text-blue-600">
                            {lead.pic?.name || "Unassigned"}
                          </TableCell>
                          <TableCell className="px-3 font-black text-[10px] text-rose-600 whitespace-nowrap">
                            {formatCurrency(Number(lead.estimatedValue || 0))}
                          </TableCell>
                          <TableCell className="px-3 text-center">
                            <DnaBadge status="default">{STAGE_LABELS[lead.stage] || lead.stage}</DnaBadge>
                          </TableCell>
                          <TableCell className="px-3 text-center">
                            <DnaBadge status={lostReasonCfg.status}>{lostReasonCfg.label}</DnaBadge>
                          </TableCell>
                          <TableCell className="px-3 text-[9px] font-black text-slate-500 whitespace-nowrap">
                            {lead.lastFollowUpAt
                              ? new Date(lead.lastFollowUpAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </TableCell>
                          <TableCell className="px-3 text-center">
                            <span className="text-[10px] font-black text-slate-700">{days}h</span>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Section B
                    return (
                      <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="px-3 text-[10px] font-black text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="px-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <TrendingDown className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="whitespace-nowrap">
                              <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{lead.brandName || lead.clientName}</p>
                              <p className="text-[10px] font-medium text-slate-400">{lead.productInterest}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 font-black text-[9px] text-blue-600">
                          {lead.pic?.name || "—"}
                        </TableCell>
                        <TableCell className="px-3 text-center font-black text-[10px] text-slate-900">
                          {lead.moq?.toLocaleString("id-ID") || "—"} pcs
                        </TableCell>
                        <TableCell className="px-3 text-[9px] font-black text-slate-500 whitespace-nowrap">
                          {lead.wonAt
                            ? new Date(lead.wonAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </TableCell>
                        <TableCell className="px-3 font-black text-[10px] text-slate-700 whitespace-nowrap">
                          {formatCurrency(Number(lead.estimatedValue || 0))}
                        </TableCell>
                        <TableCell className="px-3 text-center">
                          <DnaBadge status="critical">LOST</DnaBadge>
                        </TableCell>
                        <TableCell className="px-3 text-center">
                          <DnaBadge status={lostReasonCfg.status}>{lostReasonCfg.label}</DnaBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-slate-400 font-black text-sm">
                      <XCircle className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                      Tidak ada data lost di section ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TableWrapper>
      </div>
    </TableShell>
  );
}
