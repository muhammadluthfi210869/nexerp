"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ClipboardCheck,
  PlusCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
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
  DnaDatePicker,
  DnaCell,
} from "@/components/dna";
import { toast } from "sonner";

// SPEC: SCR-LEG-CKPB-001 — CKPB (Cara Kerja Pengawasan Berusaha) Audit dengan parameter sanitasi

const AREAS = ["Produksi", "Gudang", "R&D", "QC", "Kantor"] as const;
const STATUS_OPTIONS = ["DRAFT", "IN_PROGRESS", "COMPLETED"] as const;
const PARAM_STATUS = ["Memenuhi", "Tidak Memenuhi", "Sebagian"] as const;

interface SanitasiRow {
  id: string;
  parameter: string;
  standar: string;
  hasil: string;
  status: string;
}

interface AuditForm {
  areaAudit: string;
  tanggalAudit: string;
  parameterSanitasi: SanitasiRow[];
  temuan: string;
  batasPerbaikan: string;
  picPerbaikan: string;
  statusAudit: string;
}

const emptySanitasi = (): SanitasiRow => ({
  id: crypto.randomUUID(),
  parameter: "",
  standar: "",
  hasil: "",
  status: "Memenuhi",
});

const emptyForm: AuditForm = {
  areaAudit: "",
  tanggalAudit: "",
  parameterSanitasi: [emptySanitasi()],
  temuan: "",
  batasPerbaikan: "",
  picPerbaikan: "",
  statusAudit: "DRAFT",
};

export default function CkpbAuditPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"log" | "new">("log");
  const [form, setForm] = useState<AuditForm>({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["ckpb-audits"],
    queryFn: async () => {
      const resp = await api.get("/legality/ckpb-audits");
      return resp.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/legality/ckpb-audits", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ckpb-audits"] });
      toast.success("CKPB Audit Record Created Successfully");
      setForm({ ...emptyForm });
      setActiveTab("log");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create audit record");
    },
  });

  const totalAudits = audits?.length ?? 0;
  const draftCount = audits?.filter((a: any) => a.statusAudit === "DRAFT").length ?? 0;
  const inProgressCount = audits?.filter((a: any) => a.statusAudit === "IN_PROGRESS").length ?? 0;
  const completedCount = audits?.filter((a: any) => a.statusAudit === "COMPLETED").length ?? 0;

  const filteredAudits = audits?.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    return (
      a.areaAudit?.toLowerCase().includes(term) ||
      a.picPerbaikan?.toLowerCase().includes(term) ||
      a.temuan?.toLowerCase().includes(term) ||
      a.statusAudit?.toLowerCase().includes(term)
    );
  }) ?? [];

  const updateForm = <K extends keyof AuditForm>(key: K, value: AuditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addSanitasiRow = () => {
    setForm((prev) => ({
      ...prev,
      parameterSanitasi: [...prev.parameterSanitasi, emptySanitasi()],
    }));
  };

  const removeSanitasiRow = (id: string) => {
    if (form.parameterSanitasi.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      parameterSanitasi: prev.parameterSanitasi.filter((r) => r.id !== id),
    }));
  };

  const updateSanitasiRow = (id: string, field: keyof SanitasiRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      parameterSanitasi: prev.parameterSanitasi.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const canSubmit =
    form.areaAudit &&
    form.tanggalAudit &&
    form.parameterSanitasi.length > 0 &&
    form.parameterSanitasi.every((r) => r.parameter && r.standar);

  const handleSubmit = () => {
    createMutation.mutate({
      areaAudit: form.areaAudit,
      tanggalAudit: form.tanggalAudit,
      parameterSanitasi: form.parameterSanitasi.map(({ id, ...rest }) => rest),
      temuan: form.temuan,
      batasPerbaikan: form.batasPerbaikan,
      picPerbaikan: form.picPerbaikan,
      statusAudit: form.statusAudit,
    });
    setConfirmOpen(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge status="success">{status}</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge status="info">{status}</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  return (
    <DashboardShell
      title="CKPB"
      titleAccent="AUDIT"
      subtitle="Sanitation parameter compliance audit tracking"
      actions={
        <DnaButton
          variant="primary"
          icon={<PlusCircle className="stroke-[3px]" />}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => setActiveTab("new")}
        >
          NEW AUDIT
        </DnaButton>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DnaStatCard label="TOTAL AUDITS" value={totalAudits} icon={<ClipboardCheck />} variant="neutral" />
          <DnaStatCard label="DRAFT" value={draftCount} icon={<Clock />} variant="slate" />
          <DnaStatCard label="IN PROGRESS" value={inProgressCount} icon={<AlertTriangle />} variant="amber" />
          <DnaStatCard label="COMPLETED" value={completedCount} icon={<CheckCircle2 />} variant="emerald" />
        </div>

        <DnaTabNav
          tabs={[
            { id: "log", label: "AUDIT LOG", count: totalAudits, icon: ClipboardCheck },
            { id: "new", label: "NEW AUDIT", icon: PlusCircle },
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
                      CKPB AUDIT INDEX
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                      Sanitation compliance audit records • {filteredAudits.length} Records
                    </p>
                  </div>
                </div>
                <DnaInput
                  icon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="CARI AREA / PIC / STATUS..."
                />
              </div>
            }
          >
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                  <th className="px-4 py-4 text-left">AREA</th>
                  <th className="px-4 py-4 text-left">TANGGAL</th>
                  <th className="px-4 py-4 text-center">STATUS</th>
                  <th className="px-4 py-4 text-left">PIC</th>
                  <th className="px-4 py-4 text-left">TEMUAN</th>
                  <th className="px-4 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Syncing audit records...
                    </td>
                  </tr>
                ) : filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tidak ada data audit CKPB ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit: any) => (
                    <tr key={audit.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm shrink-0">
                            <ClipboardCheck className="h-4 w-4 text-amber-500" />
                          </div>
                          <span className="font-bold text-slate-900 tracking-tight text-sm uppercase italic">
                            {audit.areaAudit}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase leading-none">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          {audit.tanggalAudit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {statusBadge(audit.statusAudit)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {audit.picPerbaikan || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-slate-500 line-clamp-1 max-w-[200px]">
                          {audit.temuan || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DnaButton
                          size="sm"
                          variant="outline"
                          onClick={() => console.log("View audit:", audit.id)}
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">FORM DATA AUDIT CKPB</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DnaSelect
                  label="Area Audit *"
                  placeholder="Pilih Area"
                  value={form.areaAudit}
                  onChange={(val) => updateForm("areaAudit", val || "")}
                  options={AREAS.map((a) => ({ label: a, value: a }))}
                />
                <DnaDatePicker
                  label="Tanggal Audit *"
                  value={form.tanggalAudit}
                  onChange={(val: string) => updateForm("tanggalAudit", val)}
                />
                <DnaDatePicker
                  label="Batas Perbaikan"
                  value={form.batasPerbaikan}
                  onChange={(val: string) => updateForm("batasPerbaikan", val)}
                />
                <DnaInput
                  label="PIC Perbaikan"
                  value={form.picPerbaikan}
                  onChange={(e) => updateForm("picPerbaikan", e.target.value)}
                  placeholder="Nama PIC"
                />
                <DnaSelect
                  label="Status Audit"
                  value={form.statusAudit}
                  onChange={(val) => updateForm("statusAudit", val || "DRAFT")}
                  options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
                />
              </div>
              <div className="pt-4">
                <DnaTextarea
                  label="Temuan"
                  value={form.temuan}
                  onChange={(e) => updateForm("temuan", e.target.value)}
                  placeholder="Deskripsi temuan audit..."
                  rows={3}
                />
              </div>
            </DnaCard>

            <DnaCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">PARAMETER SANITASI</h3>
              </div>
              <div className="space-y-4">
                {form.parameterSanitasi.map((row, idx) => (
                  <div key={row.id} className="relative bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Parameter #{idx + 1}
                      </span>
                      {form.parameterSanitasi.length > 1 && (
                        <DnaButton
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => removeSanitasiRow(row.id)}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <DnaInput
                        label="Parameter *"
                        value={row.parameter}
                        onChange={(e) => updateSanitasiRow(row.id, "parameter", e.target.value)}
                        placeholder="Nama parameter"
                      />
                      <DnaInput
                        label="Standar *"
                        value={row.standar}
                        onChange={(e) => updateSanitasiRow(row.id, "standar", e.target.value)}
                        placeholder="Standar yang berlaku"
                      />
                      <DnaInput
                        label="Hasil"
                        value={row.hasil}
                        onChange={(e) => updateSanitasiRow(row.id, "hasil", e.target.value)}
                        placeholder="Hasil pemeriksaan"
                      />
                    </div>
                    <DnaSelect
                      label="Status"
                      value={row.status}
                      onChange={(val) => updateSanitasiRow(row.id, "status", val || "Memenuhi")}
                      options={PARAM_STATUS.map((s) => ({ label: s, value: s }))}
                    />
                  </div>
                ))}
                <DnaButton
                  variant="outline"
                  icon={<PlusCircle className="w-4 h-4" />}
                  onClick={addSanitasiRow}
                >
                  TAMBAH PARAMETER
                </DnaButton>
              </div>
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
                SUBMIT AUDIT
              </DnaButton>
            </div>
          </div>
        )}

        <DnaModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Konfirmasi Submit Audit"
          subtitle="Pastikan seluruh data audit sudah benar sebelum dikirimkan."
          size="md"
          badge={<ClipboardCheck className="w-3 h-3 text-amber-500" />}
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
            <p>Area: <span className="text-slate-900">{form.areaAudit || "—"}</span></p>
            <p>Tanggal: <span className="text-slate-900">{form.tanggalAudit || "—"}</span></p>
            <p>Parameters: <span className="text-slate-900">{form.parameterSanitasi.length}</span></p>
            <p>Status: <span className="text-slate-900">{form.statusAudit}</span></p>
          </div>
        </DnaModal>
      </div>
    </DashboardShell>
  );
}
