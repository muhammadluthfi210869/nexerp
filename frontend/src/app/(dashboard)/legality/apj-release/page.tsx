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
import {
  DnaStatCard,
  DnaCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaDataTableCard,
  DnaTabNav,
  DnaModal,
  DnaSelect,
  DnaTextarea,
  DnaCell,
} from "@/components/dna";
import { toast } from "sonner";

// SPEC: SCR-LEG-APJ-001 — APJ Release workflow (Batch record + NIE + dokumen verifikasi)

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
  const [activeTab, setActiveTab] = useState<"log" | "new">("log");
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DnaStatCard label="TOTAL RELEASES" value={totalReleases} icon={<Send />} variant="neutral" />
          <DnaStatCard label="RELEASED" value={releasedCount} icon={<CheckCircle2 />} variant="emerald" />
          <DnaStatCard label="ON HOLD" value={holdCount} icon={<Clock />} variant="amber" />
          <DnaStatCard label="REJECTED" value={rejectCount} icon={<XCircle />} variant="rose" />
        </div>

        <DnaTabNav
          tabs={[
            { key: "log", label: "RELEASE LOG", count: totalReleases, icon: <FileText className="w-4 h-4" /> },
            { key: "new", label: "NEW RELEASE", icon: <PlusCircle className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onTabChange={(k) => setActiveTab(k as "log" | "new")}
          className="mb-4"
        />

        {activeTab === "log" && (
          <DnaDataTableCard
            customToolbar={
              <div className="px-5 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                      APJ RELEASE INDEX
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                      Batch release verification ledger • {filteredReleases.length} Records
                    </p>
                  </div>
                </div>
                <DnaInput
                  icon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="CARI BATCH / KEPUTUSAN / NIE..."
                />
              </div>
            }
          >
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                  <th className="px-4 py-4 text-left">BATCH RECORD</th>
                  <th className="px-4 py-4 text-center">KEPUTUSAN</th>
                  <th className="px-4 py-4 text-left">NIE</th>
                  <th className="px-4 py-4 text-center">STATUS</th>
                  <th className="px-4 py-4 text-left">CREATED</th>
                  <th className="px-4 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    <tr key={release.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm shrink-0">
                            <FileText className="h-4 w-4 text-amber-500" />
                          </div>
                          <span className="font-bold text-slate-900 tracking-tight text-sm uppercase italic">
                            {release.batchRecord}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {keputusanBadge(release.keputusan)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
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
                          className="font-bold text-[9px] px-3.5"
                        >
                          DETAILS
                        </DnaButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DnaDataTableCard>
        )}

        {activeTab === "new" && (
          <div className="space-y-6">
            <DnaCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">DATA BATCH & DOKUMEN</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DnaInput
                  label="Batch Record *"
                  value={form.batchRecord}
                  onChange={(e) => setForm((prev) => ({ ...prev, batchRecord: e.target.value }))}
                  placeholder="Masukkan ID Batch Record"
                />
                <DnaInput
                  label="NIE (Nomor Izin Edar)"
                  value={form.nie}
                  onChange={(e) => setForm((prev) => ({ ...prev, nie: e.target.value }))}
                  placeholder="Opsional untuk HOLD/REJECT"
                />
              </div>

              <div className="space-y-3 pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Jenis Dokumen <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {JENIS_DOKUMEN.map((dok) => {
                    const checked = form.jenisDokumen.includes(dok);
                    return (
                      <button
                        key={dok}
                        type="button"
                        onClick={() => toggleDokumen(dok)}
                        className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
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
            </DnaCard>

            {form.docStatuses.length > 0 && (
              <DnaCard>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">STATUS DOKUMEN</h3>
                </div>
                <div className="space-y-4">
                  {form.docStatuses.map((doc) => (
                    <div key={doc.nama} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
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
                        <DnaSelect
                          label="Status"
                          value={doc.status}
                          onChange={(val) => updateDocStatus(doc.nama, "status", val || "")}
                          options={DOC_STATUS.map((s) => ({ label: s, value: s }))}
                        />
                        <DnaTextarea
                          label="Catatan"
                          value={doc.catatan}
                          onChange={(e) => updateDocStatus(doc.nama, "catatan", e.target.value)}
                          placeholder="Catatan dokumen..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DnaCard>
            )}

            <DnaCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">KEPUTUSAN & VERIFIKASI</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DnaSelect
                  label="Keputusan *"
                  placeholder="Pilih Keputusan"
                  value={form.keputusan}
                  onChange={(val) => setForm((prev) => ({ ...prev, keputusan: val || "" }))}
                  options={KEPUTUSAN_OPTIONS.map((k) => ({ label: k, value: k }))}
                />
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    TTD Digital <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, ttdDigital: !prev.ttdDigital }))}
                    className={`w-full h-11 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
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
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl mt-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[10px] font-bold text-rose-600 uppercase">
                    NIE wajib diisi untuk keputusan RELEASE
                  </span>
                </div>
              )}
            </DnaCard>

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
        )}

        <DnaModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Konfirmasi Submit Release"
          subtitle="Pastikan seluruh data release sudah benar sebelum dikirimkan."
          size="md"
          badge={<ShieldCheck className="w-3 h-3 text-amber-500" />}
          footer={
            <>
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
            </>
          }
        >
          <div className="space-y-2 text-[10px] font-bold text-slate-600 uppercase">
            <p>Batch Record: <span className="text-slate-900">{form.batchRecord || "—"}</span></p>
            <p>Keputusan: <span className="text-slate-900">{form.keputusan || "—"}</span></p>
            <p>NIE: <span className="text-slate-900">{form.nie || "—"}</span></p>
            <p>Dokumen: <span className="text-slate-900">{form.jenisDokumen.length} item</span></p>
            <p>TTD Digital: <span className="text-slate-900">{form.ttdDigital ? "Terkonfirmasi" : "Belum"}</span></p>
          </div>
        </DnaModal>
      </div>
    </DashboardShell>
  );
}
