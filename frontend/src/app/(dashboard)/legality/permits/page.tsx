"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Search, 
  PlusCircle, 
  FileText, 
  Clock, 
  ChevronRight,
  Gavel,
  History,
  Download,
  Calendar,
  Zap,
  Globe,
  Verified,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, StatCard, DataCard, DnaBadge, DnaButton } from "@/components/dna";

export default function LegalityHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancePermit, setAdvancePermit] = useState<any>(null);
  const [advanceNotes, setAdvanceNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const resp = await api.get("/legality/permits");
      return resp.data;
    }
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const resp = await api.patch(`/legality/permits/${id}/status`, { status, notes });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      toast.success("Permit Status Updated", {
        description: "The permit has been advanced to the next stage.",
      });
      setAdvancePermit(null);
      setAdvanceNotes("");
    },
    onError: (err: any) => {
      toast.error("Update Failed", {
        description: err.response?.data?.message || "Failed to update permit status.",
      });
    },
  });

  const STATUS_FLOW: Record<string, string[]> = {
    DRAFT: ["PENDING_REVIEW", "ACTIVE"],
    PENDING_REVIEW: ["ACTIVE", "REJECTED"],
    ACTIVE: ["EXPIRING_SOON", "SUSPENDED"],
    EXPIRING_SOON: ["ACTIVE", "EXPIRED"],
    EXPIRED: ["ACTIVE"],
    SUSPENDED: ["ACTIVE"],
    REJECTED: ["DRAFT"],
  };

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    ACTIVE: "Active",
    EXPIRING_SOON: "Expiring Soon",
    EXPIRED: "Expired",
    SUSPENDED: "Suspended",
    REJECTED: "Rejected",
  };

  const activePermits = permits?.filter((p: any) => p.status === 'ACTIVE').length ?? 0;
  const expiringSoon = permits?.filter((p: any) => p.status === 'EXPIRING_SOON').length ?? 0;
  const inProgress = permits?.filter((p: any) => p.status === 'EXPIRED' || p.status === 'EXPIRING_SOON').length ?? 0;
  const healthScore = permits?.length > 0 ? Math.round((activePermits / permits.length) * 100) + '%' : '100%';

  const filteredPermits = permits.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return (
      p.id?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.issuer?.toLowerCase().includes(term) ||
      p.type?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardShell
      title="LEGALITY"
      titleAccent="REGISTRY"
      subtitle="Tracking critical permits, licenses, and regulatory compliance"
      actions={
        <div className="flex gap-3">
          <DnaButton 
            variant="outline" 
            icon={<History className="text-amber-500" />}
          >
            Audit Logs
          </DnaButton>
          <DnaButton 
            variant="primary"
            icon={<PlusCircle className="stroke-[3px]" />}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Add New Permit
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            label="ACTIVE PERMITS" 
            value={activePermits} 
            icon={<Verified className="text-emerald-500" />} 
          />
          <StatCard 
            label="EXPIRING SOON" 
            value={expiringSoon} 
            icon={<Clock className="text-amber-500" />} 
          />
          <StatCard 
            label="IN PROGRESS" 
            value={inProgress} 
            icon={<Zap className="text-blue-500" />} 
          />
          <StatCard 
            label="REGULATORY HEALTH" 
            value={healthScore} 
            icon={<ShieldCheck className="text-slate-500" />} 
          />
        </div>

        {/* Permits Table wrapped in TableWrapper */}
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="status-dot bg-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    PERMITS & LICENSING INDEX
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                    Central regulatory registry ledger • {filteredPermits.length} Records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="CARI PERMIT ID / PENERBIT..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PERMIT ID / REFERENCE</th>
                  <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">LICENSING NAME / ISSUER</th>
                  <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CATEGORY</th>
                  <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">VALID UNTIL</th>
                  <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                  <th className="px-4 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">LEGAL ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Syncing regulatory registry...
                    </td>
                  </tr>
                ) : filteredPermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tidak ada data berkas perizinan yang ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredPermits.map((permit: any) => (
                    <tr key={permit.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                            <FileText className="h-4.5 w-4.5 text-amber-500" />
                          </div>
                          <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{permit.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <p className="font-black text-slate-900 text-xs uppercase italic leading-none">{permit.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 leading-none">{permit.issuer}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-500 bg-slate-100 rounded px-2.5 py-0.5 uppercase">
                          {permit.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase leading-none">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          {permit.expiry}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DnaBadge 
                          status={
                            permit.status === 'ACTIVE' ? "success" : 
                            permit.status === 'EXPIRING_SOON' ? "warning" : "critical"
                          }
                        >
                          {permit.status.replace('_', ' ')}
                        </DnaBadge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton 
                            size="sm" 
                            variant="ghost" 
                            icon={<Download className="w-3.5 h-3.5" />} 
                            onClick={() => console.log("Download permit:", permit.id)}
                          />
                          {STATUS_FLOW[permit.status] && STATUS_FLOW[permit.status].length > 0 && (
                            <DnaButton 
                              size="sm" 
                              variant="primary" 
                              icon={<ArrowRight className="w-3.5 h-3.5" />}
                              onClick={() => setAdvancePermit(permit)}
                              className="font-black text-[9px] px-3.5 bg-amber-600 hover:bg-amber-700"
                            >
                              ADVANCE
                            </DnaButton>
                          )}
                          <DnaButton 
                            size="sm" 
                            variant="outline" 
                            icon={<ChevronRight className="w-3.5 h-3.5" />}
                            onClick={() => console.log("View permit details:", permit.id)}
                            className="font-black text-[9px] px-3.5"
                          >
                            DETAILS
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableWrapper>

        {/* Regulatory Calendar Preview */}
        <DataCard
          dotColor="bg-amber-500"
          title="REGULATORY INTELLIGENCE"
          titleColor="text-slate-400"
          className="relative overflow-hidden !p-5 rounded-2xl group mt-4"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-20 w-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-700 shrink-0">
              <Gavel className="h-10 w-10 text-black" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1.5">
              <h4 className="text-lg font-black italic uppercase tracking-tight text-gray-900 leading-none">REGULATORY INTELLIGENCE DECK</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                Automatically tracking renewal cycles for 12+ international regulatory bodies. Our proactive engine notifies legal counsel 90 days before expiration.
              </p>
              <div className="flex gap-6 justify-center md:justify-start pt-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <Globe className="h-3.5 w-3.5 text-amber-500" /> Global Compliance
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Digital Vault
                </span>
              </div>
            </div>
            <DnaButton 
              variant="secondary"
              icon={<ChevronRight />}
              className="h-11 px-6 rounded-xl font-black bg-slate-800 text-white"
            >
              Regulatory Map
            </DnaButton>
          </div>
        </DataCard>

        {/* Advance Status Dialog */}
        {advancePermit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="p-6 bg-amber-500 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">Advance Permit Status</h3>
                    <p className="text-amber-100 text-xs font-medium mt-0.5">Update the permit's progression stage</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Permit</p>
                  <p className="text-sm font-black text-slate-900">{advancePermit.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{advancePermit.id} • {advancePermit.issuer}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current Status</label>
                  <div className="flex items-center gap-2">
                    <DnaBadge status={advancePermit.status === 'ACTIVE' ? 'success' : advancePermit.status === 'EXPIRED' ? 'critical' : 'warning'}>
                      {STATUS_LABELS[advancePermit.status] || advancePermit.status}
                    </DnaBadge>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400">Advance to:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(STATUS_FLOW[advancePermit.status] || []).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => {
                          setAdvancePermit({ ...advancePermit, _nextStatus: nextStatus });
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          advancePermit._nextStatus === nextStatus
                            ? "bg-amber-500 text-white border-2 border-amber-600"
                            : "bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-300"
                        }`}
                      >
                        {STATUS_LABELS[nextStatus] || nextStatus}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Notes (optional)</label>
                  <textarea
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Add notes for this status change..."
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { setAdvancePermit(null); setAdvanceNotes(""); }}
                  className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (advancePermit._nextStatus) {
                      advanceMutation.mutate({
                        id: advancePermit.id,
                        status: advancePermit._nextStatus,
                        notes: advanceNotes,
                      });
                    }
                  }}
                  disabled={!advancePermit._nextStatus || advanceMutation.isPending}
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {advanceMutation.isPending ? "Updating..." : "Confirm Advance"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
