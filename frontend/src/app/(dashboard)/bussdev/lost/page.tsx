"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, XCircle, Search, AlertTriangle, TrendingDown } from "lucide-react";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { Input } from "@/components/ui/input";

const LOST_REASON_LABELS: Record<string, { label: string; color: string }> = {
  PRICE_ISSUE:        { label: "Harga",          color: "bg-rose-100 text-rose-700" },
  MOQ_TOO_HIGH:       { label: "MOQ Tinggi",     color: "bg-orange-100 text-orange-700" },
  QUALITY:            { label: "Kualitas",        color: "bg-amber-100 text-amber-700" },
  GHOSTING:           { label: "Ghosting",        color: "bg-slate-100 text-slate-500" },
  COMPETITOR:         { label: "Kompetitor",      color: "bg-violet-100 text-violet-700" },
  NOT_READY:          { label: "Belum Siap",      color: "bg-blue-100 text-blue-700" },
  OTHER:              { label: "Lainnya",         color: "bg-slate-100 text-slate-600" },
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
    <div className="space-y-8 py-4 bg-base min-h-screen font-inter animate-in fade-in duration-500">
      {/* ── Header HUD ──────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
          Pipeline <span className="text-rose-600">Lost</span>
        </h1>
        <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">
            {leads?.length || 0} Total Lost
          </span>
        </div>
      </div>

      {/* ── Dashboard Cards ──────────────────────────────────────── */}
      <DashboardCards variant="lost" data={analytics} />

      {/* ── Section Toggle ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setSection("prospect")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
            section === "prospect"
              ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
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
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-700"
          )}
        >
          Section B · Churn After Delivery ({churnClient?.length || 0})
        </button>
      </div>

      {/* ── Main Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-1.5 h-6 rounded-full", section === "prospect" ? "bg-rose-600" : "bg-slate-900")} />
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                {section === "prospect" ? "Section A: Lost Sebelum Deal (Prospect Gagal)" : "Section B: Lost Setelah Delivery (Churn Customer)"}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                {section === "prospect" ? "Leads yang tidak pernah mencapai tahap produksi" : "Client yang pernah order namun tidak repeat"}
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              placeholder="Filter brand / client..."
              className="pl-11 h-11 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-rose-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                {section === "prospect" ? (
                  ["No", "Brand & Produk", "PIC BD", "Est. Value Deal", "Stage Terakhir", "Alasan Lost", "FU Terakhir", "Durasi"].map(h => (
                    <TableHead key={h} className="py-2.5 font-bold uppercase text-[9px] text-slate-500 tracking-wider whitespace-nowrap px-3">{h}</TableHead>
                  ))
                ) : (
                  ["No", "Brand & Produk Terakhir", "PIC BD", "Qty Terakhir", "Tgl Terakhir Order", "Est. Value", "Status", "Alasan Churn"].map(h => (
                    <TableHead key={h} className="py-2.5 font-bold uppercase text-[9px] text-slate-500 tracking-wider whitespace-nowrap px-3">{h}</TableHead>
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
                              <p className="font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">{lead.brandName || lead.clientName}</p>
                              <p className="text-[10px] font-bold text-slate-400">{lead.productInterest}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 font-bold text-[9px] text-violet-600">
                          {lead.pic?.name || "Unassigned"}
                        </TableCell>
                        <TableCell className="px-3 font-black text-[10px] text-rose-600 whitespace-nowrap">
                          {formatCurrency(Number(lead.estimatedValue || 0))}
                        </TableCell>
                        <TableCell className="px-3 text-center">
                          <Badge className="bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg px-2 border-none">
                            {STAGE_LABELS[lead.stage] || lead.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 text-center">
                          <Badge className={cn("text-[9px] font-black rounded-lg px-2 border-none", lostReasonCfg.color)}>
                            {lostReasonCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 text-[9px] font-bold text-slate-500 whitespace-nowrap">
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
                            <p className="font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">{lead.brandName || lead.clientName}</p>
                            <p className="text-[10px] font-bold text-slate-400">{lead.productInterest}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 font-bold text-[9px] text-violet-600">
                        {lead.pic?.name || "—"}
                      </TableCell>
                      <TableCell className="px-3 text-center font-black text-[10px] text-slate-900">
                        {lead.moq?.toLocaleString("id-ID") || "—"} pcs
                      </TableCell>
                      <TableCell className="px-3 text-[9px] font-bold text-slate-500 whitespace-nowrap">
                        {lead.wonAt
                          ? new Date(lead.wonAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="px-3 font-black text-[10px] text-slate-700 whitespace-nowrap">
                        {formatCurrency(Number(lead.estimatedValue || 0))}
                      </TableCell>
                      <TableCell className="px-3 text-center">
                        <Badge className="bg-rose-100 text-rose-700 text-[9px] font-black rounded-lg px-2 border-none">
                          LOST
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 text-center">
                        <Badge className={cn("text-[9px] font-black rounded-lg px-2 border-none", lostReasonCfg.color)}>
                          {lostReasonCfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-slate-400 font-bold text-sm">
                    <XCircle className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    Tidak ada data lost di section ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

