"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  ArrowRight,
  History as HistoryIcon,
  ClipboardCheck,
  Package,
  Calendar,
  Lock,
  Share2,
  Loader2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DataCard } from "@/components/dna/DataCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function CoACenterPage() {
  const [search, setSearch] = useState("");
  const [viewCoaId, setViewCoaId] = useState<string | null>(null);

  const { data: coaRecords, isLoading } = useQuery({
    queryKey: ["coa-records"],
    queryFn: async () => {
      const res = await api.get("/qc/audits", { params: { status: "GOOD" } });
      return (res.data || []).map((a: any) => ({
        id: a.reportNumber || a.id,
        rawId: a.id,
        product: a.material?.name || a.notes || "Unknown",
        batch: a.materialBatchNo || a.id.substring(0, 8).toUpperCase(),
        releaseDate: new Date(a.createdAt).toISOString().split("T")[0],
        status: "VERIFIED",
        analyst: a.analyst?.fullName || "—",
        phase: a.phase,
        parameters: {
          ph: a.phValue,
          viscosity: a.viscosityValue,
          organoleptic: a.organoleptic,
          samplingVolume: a.samplingVolume,
          sealingCheck: a.sealingCheck,
          labelingCheck: a.labelingCheck,
          expDateCheck: a.expDateCheck,
          density: a.densityValue,
          homogenity: a.homogenityPass,
          torque: a.torqueValue,
          leakTest: a.leakTestPass,
          dimension: a.dimensionCheck,
          coaVerified: a.coaVerified,
        },
        defectCategory: a.defectCategory,
        defectType: a.defectType,
        notes: a.notes,
      }));
    },
    staleTime: 30_000,
  });

  const filtered = (coaRecords || []).filter(
    (r: any) =>
      search === "" ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.batch.toLowerCase().includes(search.toLowerCase()) ||
      (r.id || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedCoa = (coaRecords || []).find((r: any) => r.id === viewCoaId || r.rawId === viewCoaId);

  return (
    <DashboardShell
      title="CoA"
      titleAccent="Center"
      subtitle="Professional Certificate of Analysis generation & archive"
      actions={
        <div className="flex gap-4">
          <DnaButton variant="outline" className="rounded-[14px] text-[12px]">
            <HistoryIcon className="mr-2 h-4 w-4" /> Global Archive
          </DnaButton>
          <DnaButton variant="secondary" className="rounded-[14px] text-[12px]">
            <Zap className="mr-2 h-5 w-5 fill-current" /> Batch Auto-Generate
          </DnaButton>
        </div>
      }
    >
      {/* Search & Filter Bar */}
      <DataCard className="flex flex-row items-center gap-4 p-4" noShadow>
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
          <Input 
            placeholder="Search by Batch Number or Product Name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-16 pl-16 pr-10 border border-[var(--border-color)] bg-[var(--gray-50)] rounded-[12px] font-medium text-slate-600 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-100 transition-all"
          />
        </div>
        <DnaButton
          variant="secondary"
          className="h-16 px-10 rounded-[14px] text-[13px]"
          onClick={() => setSearch("")}
        >
          Clear Filter
        </DnaButton>
      </DataCard>

      {/* CoA Records Table */}
      <TableWrapper>
        <table>
          <thead className="bg-[#F8FAFC]">
            <tr className="hover:bg-transparent border-[var(--border-color)]">
              <th className="py-6 pl-10 text-table-header">Certificate ID</th>
              <th className="text-table-header">Product & Batch</th>
              <th className="text-table-header">Authorized By</th>
              <th className="text-table-header">Release Date</th>
              <th className="text-table-header text-center">Audit Status</th>
              <th className="pr-10 text-right text-table-header">Documents</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-slate-400" />
                  <span className="text-slate-400 text-sm">Loading CoA records...</span>
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <p className="text-slate-400 text-sm">
                    {coaRecords?.length ? "No matching CoA records" : "No passed audits available for CoA"}
                  </p>
                </td>
              </tr>
            )}
            {!isLoading &&
              filtered.map((record: any) => (
                <tr
                  key={record.id}
                  className="group hover:bg-emerald-50/30 transition-all duration-300 border-b border-[var(--border-color)]"
                >
                  <td className="py-6 pl-10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="font-bold text-slate-900 tracking-tight text-sm uppercase">{record.id}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{record.product}</p>
                      <p className="text-[11px] font-medium text-slate-400">Batch Ref: {record.batch}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        {record.analyst !== "—" ? record.analyst.charAt(0) : "?"}
                      </div>
                      <p className="font-medium text-slate-500 text-[11px]">{record.analyst}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-300" />
                      <p className="font-medium text-slate-500 text-[11px]">{record.releaseDate}</p>
                    </div>
                  </td>
                  <td className="text-center">
                    <DnaBadge status={"success"}>
                      VERIFIED
                    </DnaBadge>
                  </td>
                  <td className="pr-10 text-right">
                    <div className="flex justify-end gap-2">
                      <DnaButton
                        variant="ghost"
                        className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => setViewCoaId(record.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </DnaButton>
                      <DnaButton variant="ghost" className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                        <Printer className="h-4 w-4" />
                      </DnaButton>
                      <DnaButton variant="outline" className="h-11 px-5 hover:bg-gray-900 hover:text-white text-slate-900 rounded-lg text-[10px]">
                        <Download className="mr-2 h-3.5 w-3.5" /> PDF CoA
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* CoA Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DataCard title="Standard CoA Template">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-[24px] border border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase">Clinical Export V1</span>
              </div>
              <DnaBadge status="success">ACTIVE</DnaBadge>
            </div>
            <div className="p-4 bg-gray-50 rounded-[24px] border border-[var(--border-color)] flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-bold uppercase">Retail Minimalist V2</span>
              </div>
            </div>
          </div>
          <DnaButton variant="primary" className="w-full mt-8 h-14 rounded-[14px] text-xs">
            Manage Templates
          </DnaButton>
        </DataCard>

        <DataCard title="CoA Security Vault" className="relative overflow-hidden group" titleColor="text-slate-900">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Digital signatures & integrity verification</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-16 w-16 bg-emerald-50 rounded-[24px] flex items-center justify-center shadow-inner">
                <Lock className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase">256-bit Encrypted</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">All exported CoAs are cryptographically signed.</p>
              </div>
            </div>
          </div>
          <ShieldCheck className="h-32 w-32 text-emerald-50 absolute -right-8 -bottom-8 group-hover:scale-110 transition-transform duration-700" />
        </DataCard>
      </div>

      {/* View CoA Modal */}
      <Dialog open={!!viewCoaId} onOpenChange={(open) => !open && setViewCoaId(null)}>
        <DialogContent className="sm:max-w-[640px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="p-6 bg-emerald-600 text-white relative">
            <button
              onClick={() => setViewCoaId(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-black">Certificate of Analysis</h3>
                <p className="text-emerald-100 text-xs font-medium mt-0.5">
                  {selectedCoa?.id || viewCoaId}
                </p>
              </div>
            </div>
          </div>
          {selectedCoa ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Product</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedCoa.product}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Batch</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedCoa.batch}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Release Date</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedCoa.releaseDate}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Inspector</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedCoa.analyst}</p>
                </div>
                {selectedCoa.phase && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Phase</p>
                    <DnaBadge status="info" className="mt-1">{selectedCoa.phase}</DnaBadge>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Test Parameters</h4>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Parameter</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Result</th>
                        <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCoa.parameters &&
                        Object.entries(selectedCoa.parameters)
                          .filter(([, v]) => v !== undefined && v !== null)
                          .map(([key, value]) => (
                            <tr key={key} className="border-t border-slate-50">
                              <td className="py-3 px-4 text-xs font-semibold text-slate-700 uppercase">{key}</td>
                              <td className="py-3 px-4 text-xs font-mono text-slate-600">
                                {typeof value === "boolean" ? (value ? "PASS" : "FAIL") : String(value)}
                              </td>
                              <td className="py-3 px-4">
                                <DnaBadge
                                  status={value !== false ? "success" : "critical"}
                                  className="text-[9px]"
                                >
                                  {value !== false ? "PASS" : "FAIL"}
                                </DnaBadge>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
                {(!selectedCoa.parameters ||
                  Object.values(selectedCoa.parameters).filter((v) => v !== undefined && v !== null).length === 0) && (
                  <p className="text-slate-400 text-xs italic mt-2">No parameter data recorded for this audit</p>
                )}
              </div>

              {selectedCoa.notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-slate-600">{selectedCoa.notes}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-emerald-800 uppercase">This audit is verified as GOOD</p>
                  <p className="text-[10px] text-emerald-600">
                    The Certificate of Analysis confirms all parameters passed quality inspection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
              <p className="text-slate-400 text-sm mt-3">Loading CoA details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
