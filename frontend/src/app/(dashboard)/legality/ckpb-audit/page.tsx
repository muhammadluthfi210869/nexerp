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
  ChevronDown,
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
  const [activeTab, setActiveTab] = useState("log");
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
      <div className="space-y-6 animate-fade-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="TOTAL AUDITS"
            value={totalAudits}
            icon={<ClipboardCheck className="text-slate-500" />}
          />
          <StatCard
            label="DRAFT"
            value={draftCount}
            icon={<Clock className="text-slate-400" />}
          />
          <StatCard
            label="IN PROGRESS"
            value={inProgressCount}
            icon={<AlertTriangle className="text-amber-500" />}
          />
          <StatCard
            label="COMPLETED"
            value={completedCount}
            icon={<CheckCircle2 className="text-emerald-500" />}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 flex gap-2 w-fit">
            <TabsTrigger
              value="log"
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              AUDIT LOG
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[8px] font-mono text-amber-600 font-black">
                {totalAudits}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              NEW AUDIT
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
                        CKPB AUDIT INDEX
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                        Sanitation compliance audit records &bull; {filteredAudits.length} Records
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="CARI AREA / PIC / STATUS..."
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
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">AREA</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TANGGAL</th>
                      <th className="px-4 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PIC</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TEMUAN</th>
                      <th className="px-4 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
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
                        <tr key={audit.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                                <ClipboardCheck className="h-4.5 w-4.5 text-amber-500" />
                              </div>
                              <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">
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
                            <span className="text-[10px] font-black text-slate-700 uppercase">
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
              <DataCard dotColor="bg-amber-500" title="FORM DATA AUDIT CKPB">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Area Audit <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        value={form.areaAudit}
                        onChange={(e) => updateForm("areaAudit", e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 px-4 pr-10 appearance-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                      >
                        <option value="">Pilih Area</option>
                        {AREAS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Tanggal Audit <span className="text-red-500">*</span>
                    </Label>
                    <DnaInput
                      type="date"
                      value={form.tanggalAudit}
                      onChange={(e) => updateForm("tanggalAudit", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Batas Perbaikan
                    </Label>
                    <DnaInput
                      type="date"
                      value={form.batasPerbaikan}
                      onChange={(e) => updateForm("batasPerbaikan", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      PIC Perbaikan
                    </Label>
                    <DnaInput
                      value={form.picPerbaikan}
                      onChange={(e) => updateForm("picPerbaikan", e.target.value)}
                      placeholder="Nama PIC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                      Status Audit
                    </Label>
                    <div className="relative">
                      <select
                        value={form.statusAudit}
                        onChange={(e) => updateForm("statusAudit", e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 px-4 pr-10 appearance-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                    Temuan
                  </Label>
                  <Textarea
                    value={form.temuan}
                    onChange={(e) => updateForm("temuan", e.target.value)}
                    placeholder="Deskripsi temuan audit..."
                    className="rounded-xl bg-slate-50 border border-slate-200 min-h-[80px] text-[10px] font-bold focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </DataCard>

              <DataCard dotColor="bg-blue-500" title="PARAMETER SANITASI">
                <div className="space-y-4">
                  {form.parameterSanitasi.map((row, idx) => (
                    <div key={row.id} className="relative bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
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
                        <div className="space-y-1">
                          <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                            Parameter <span className="text-red-500">*</span>
                          </Label>
                          <DnaInput
                            value={row.parameter}
                            onChange={(e) => updateSanitasiRow(row.id, "parameter", e.target.value)}
                            placeholder="Nama parameter"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                            Standar <span className="text-red-500">*</span>
                          </Label>
                          <DnaInput
                            value={row.standar}
                            onChange={(e) => updateSanitasiRow(row.id, "standar", e.target.value)}
                            placeholder="Standar yang berlaku"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                            Hasil
                          </Label>
                          <DnaInput
                            value={row.hasil}
                            onChange={(e) => updateSanitasiRow(row.id, "hasil", e.target.value)}
                            placeholder="Hasil pemeriksaan"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                          Status
                        </Label>
                        <div className="relative">
                          <select
                            value={row.status}
                            onChange={(e) => updateSanitasiRow(row.id, "status", e.target.value)}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 px-4 pr-10 appearance-none focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                          >
                            {PARAM_STATUS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
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
                  SUBMIT AUDIT
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
              Konfirmasi Submit Audit
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] uppercase font-bold mt-1">
              Pastikan seluruh data audit sudah benar sebelum dikirimkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-[10px] font-bold text-slate-600 uppercase">
            <p>Area: <span className="text-slate-900">{form.areaAudit || "—"}</span></p>
            <p>Tanggal: <span className="text-slate-900">{form.tanggalAudit || "—"}</span></p>
            <p>Parameters: <span className="text-slate-900">{form.parameterSanitasi.length}</span></p>
            <p>Status: <span className="text-slate-900">{form.statusAudit}</span></p>
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
