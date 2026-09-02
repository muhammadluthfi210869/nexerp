"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Send,
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ChevronDown,
  ShieldCheck,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, StatCard, DataCard, DnaBadge, DnaButton, DnaInput, SectionLabel } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const JENIS_DOKUMEN = ["Desain Label", "Desain Kemasan", "Formula", "BPOM", "Halal"] as const;
const DOC_STATUS = ["APPROVED", "REVISION_NEEDED", "PENDING"] as const;
const KEPUTUSAN_OPTIONS = ["RELEASE", "HOLD", "REJECT"] as const;

interface DocStatus {
  nama: string;
  status: string;
  catatan: string;
}

interface ReleaseForm {
  batchRecord: string;
  jenisDokumen: string[];
  docStatuses: DocStatus[];
  nie: string;
  keputusan: string;
  ttdDigital: boolean;
}

const emptyForm: ReleaseForm = {
  batchRecord: "",
  jenisDokumen: [],
  docStatuses: [],
  nie: "",
  keputusan: "",
  ttdDigital: false,
};

export default function ApjReleasePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("log");
  const [form, setForm] = useState<ReleaseForm>({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["apj-releases"],
    queryFn: async () => {
      const resp = await api.get("/legality/apj-releases");
      return resp.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/legality/apj-releases", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apj-releases"] });
      toast.success("APJ Release Record Created Successfully");
      setForm({ ...emptyForm });
      setActiveTab("log");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create release record");
    },
  });

  const totalReleases = releases?.length ?? 0;
  const releasedCount = releases?.filter((r: any) => r.keputusan === "RELEASE").length ?? 0;
  const holdCount = releases?.filter((r: any) => r.keputusan === "HOLD").length ?? 0;
  const rejectCount = releases?.filter((r: any) => r.keputusan === "REJECT").length ?? 0;

  const filteredReleases = releases?.filter((r: any) => {
    const term = searchTerm.toLowerCase();
    return (
      r.batchRecord?.toLowerCase().includes(term) ||
      r.keputusan?.toLowerCase().includes(term) ||
      r.nie?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  }) ?? [];

  const toggleDokumen = (dokumen: string) => {
    setForm((prev) => {
      const checked = prev.jenisDokumen.includes(dokumen);
      const nextDocs = checked
        ? prev.jenisDokumen.filter((d) => d !== dokumen)
        : [...prev.jenisDokumen, dokumen];

      const nextStatuses = prev.docStatuses.filter((ds) =>
        nextDocs.includes(ds.nama)
      );

      nextDocs.forEach((d) => {
        if (!nextStatuses.find((ds) => ds.nama === d)) {
          nextStatuses.push({ nama: d, status: "PENDING", catatan: "" });
        }
      });

      return { ...prev, jenisDokumen: nextDocs, docStatuses: nextStatuses };
    });
  };

  const updateDocStatus = (nama: string, field: "status" | "catatan", value: string) => {
    setForm((prev) => ({
      ...prev,
      docStatuses: prev.docStatuses.map((ds) =>
        ds.nama === nama ? { ...ds, [field]: value } : ds
      ),
    }));
  };

  const canSubmit =
    form.batchRecord &&
    form.jenisDokumen.length > 0 &&
    form.keputusan &&
    form.ttdDigital &&
    (form.keputusan !== "RELEASE" || form.nie.trim() !== "");

  const handleSubmit = () => {
    createMutation.mutate({
      batchRecord: form.batchRecord,
      docStatuses: form.docStatuses,
      nie: form.nie,
      keputusan: form.keputusan,
      ttdDigital: form.ttdDigital,
    });
    setConfirmOpen(false);
  };

  const keputusanBadge = (k: string) => {
    switch (k) {
      case "RELEASE":
        return <DnaBadge status="success">{k}</DnaBadge>;
      case "HOLD":
        return <DnaBadge status="warning">{k}</DnaBadge>;
      case "REJECT":
        return <DnaBadge status="critical">{k}</DnaBadge>;
      default:
        return <DnaBadge status="default">{k}</DnaBadge>;
    }
  };

  return (
    <DashboardShell
      title="APJ"
      titleAccent="RELEASE"
      subtitle="Batch record release control & document verification"
      actions={
        <DnaButton
          variant="primary"
          icon={<PlusCircle className="stroke-[3px]" />}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => setActiveTab("new")}
        >
          NEW RELEASE
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="TOTAL RELEASES"
            value={totalReleases}
            icon={<Send className="text-slate-500" />}
          />
          <StatCard
            label="RELEASED"
            value={releasedCount}
            icon={<CheckCircle2 className="text-emerald-500" />}
          />
          <StatCard
            label="ON HOLD"
            value={holdCount}
            icon={<Clock className="text-amber-500" />}
          />
          <StatCard
            label="REJECTED"
            value={rejectCount}
            icon={<XCircle className="text-red-500" />}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 flex gap-2 w-fit">
            <TabsTrigger
              value="log"
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <FileText className="w-4 h-4" />
              RELEASE LOG
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[8px] font-mono text-amber-600 font-black">
                {totalReleases}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              NEW RELEASE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="outline-none m-0 focus:outline-none">
            <TableWrapper
              filters={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="status-dot bg-amber-500 animate-pulse" />
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                        APJ RELEASE INDEX
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                        Batch release verification ledger &bull; {filteredReleases.length} Records
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="CARI BATCH / KEPUTUSAN / NIE..."
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">BATCH RECORD</th>
                      <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">KEPUTUSAN</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">NIE</th>
                      <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CREATED</th>
                      <th className="px-4 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Syncing release records...
                        </td>
                      </tr>
                    ) : filteredReleases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tidak ada data release APJ ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredReleases.map((release: any) => (
                        <tr key={release.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                                <FileText className="h-4.5 w-4.5 text-amber-500" />
                              </div>
                              <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">
                                {release.batchRecord}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {keputusanBadge(release.keputusan)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-black text-slate-700 uppercase">
                              {release.nie || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DnaBadge
                              status={
                                release.status === "RELEASED"
                                  ? "success"
                                  : release.status === "PENDING"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {release.status || "—"}
                            </DnaBadge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {release.createdAt
                                ? new Date(release.createdAt).toLocaleDateString("id-ID")
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DnaButton
                              size="sm"
                              variant="outline"
                              onClick={() => console.log("View release:", release.id)}
                              className="font-black text-[9px] px-3.5"
                            >
                              DETAILS
                            </DnaButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableWrapper>
          </TabsContent>

          <TabsContent value="new" className="outline-none m-0 focus:outline-none">
            <div className="space-y-6">
              <DataCard dotColor="bg-amber-500" title="DATA BATCH & DOKUMEN">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Batch Record <span className="text-red-500">*</span>
                    </Label>
                    <DnaInput
                      value={form.batchRecord}
                      onChange={(e) => setForm((prev) => ({ ...prev, batchRecord: e.target.value }))}
                      placeholder="Masukkan ID Batch Record"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      NIE (Nomor Izin Edar)
                    </Label>
                    <DnaInput
                      value={form.nie}
                      onChange={(e) => setForm((prev) => ({ ...prev, nie: e.target.value }))}
                      placeholder="Opsional untuk HOLD/REJECT"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                    Jenis Dokumen <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {JENIS_DOKUMEN.map((dok) => {
                      const checked = form.jenisDokumen.includes(dok);
                      return (
                        <button
                          key={dok}
                          type="button"
                          onClick={() => toggleDokumen(dok)}
                          className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                            checked
                              ? "bg-amber-50 border-amber-300 text-amber-700"
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              checked ? "bg-amber-500 border-amber-500" : "border-slate-300"
                            }`}
                          >
                            {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          {dok}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </DataCard>

              {form.docStatuses.length > 0 && (
                <DataCard dotColor="bg-blue-500" title="STATUS DOKUMEN">
                  <div className="space-y-4">
                    {form.docStatuses.map((doc) => (
                      <div key={doc.nama} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
                            {doc.nama}
                          </span>
                          <DnaBadge
                            status={
                              doc.status === "APPROVED"
                                ? "success"
                                : doc.status === "REVISION_NEEDED"
                                ? "critical"
                                : "default"
                            }
                          >
                            {doc.status}
                          </DnaBadge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">Status</Label>
                            <div className="relative">
                              <select
                                value={doc.status}
                                onChange={(e) => updateDocStatus(doc.nama, "status", e.target.value)}
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 px-4 pr-10 appearance-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                              >
                                {DOC_STATUS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">Catatan</Label>
                            <Textarea
                              value={doc.catatan}
                              onChange={(e) => updateDocStatus(doc.nama, "catatan", e.target.value)}
                              placeholder="Catatan dokumen..."
                              className="rounded-xl bg-white border border-slate-200 min-h-[60px] text-[10px] font-bold focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DataCard>
              )}

              <DataCard dotColor="bg-amber-500" title="KEPUTUSAN & VERIFIKASI">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Keputusan <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        value={form.keputusan}
                        onChange={(e) => setForm((prev) => ({ ...prev, keputusan: e.target.value }))}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 px-4 pr-10 appearance-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                      >
                        <option value="">Pilih Keputusan</option>
                        {KEPUTUSAN_OPTIONS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      TTD Digital <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, ttdDigital: !prev.ttdDigital }))}
                      className={`w-full h-11 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        form.ttdDigital
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {form.ttdDigital ? "SUDAH TANDA TANGAN" : "KLIK UNTUK TANDA TANGAN"}
                    </button>
                  </div>
                </div>
                {form.keputusan === "RELEASE" && !form.nie && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mt-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-[9px] font-bold text-red-600 uppercase">
                      NIE wajib diisi untuk keputusan RELEASE
                    </span>
                  </div>
                )}
              </DataCard>

              <div className="flex justify-end">
                <DnaButton
                  variant="primary"
                  size="lg"
                  disabled={!canSubmit || createMutation.isPending}
                  icon={createMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setConfirmOpen(true)}
                >
                  SUBMIT RELEASE
                </DnaButton>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-800">
              Konfirmasi Submit Release
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] uppercase font-bold mt-1">
              Pastikan seluruh data release sudah benar sebelum dikirimkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-[10px] font-bold text-slate-600 uppercase">
            <p>Batch Record: <span className="text-slate-900">{form.batchRecord || "—"}</span></p>
            <p>Keputusan: <span className="text-slate-900">{form.keputusan || "—"}</span></p>
            <p>NIE: <span className="text-slate-900">{form.nie || "—"}</span></p>
            <p>Dokumen: <span className="text-slate-900">{form.jenisDokumen.length} item</span></p>
            <p>TTD Digital: <span className="text-slate-900">{form.ttdDigital ? "Terkonfirmasi" : "Belum"}</span></p>
          </div>
          <DialogFooter>
            <DnaButton variant="ghost" onClick={() => setConfirmOpen(false)}>
              BATAL
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              icon={createMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              YA, SUBMIT
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
