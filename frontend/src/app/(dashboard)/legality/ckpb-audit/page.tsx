"use client";

import React, { useState, useMemo } from "react";
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
  Search,
  Eye,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Plus,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaDetailDrawer,
  DnaModal,
  useDnaToast,
} from "@/components/dna";

const AREAS = ["Produksi", "Gudang", "R&D", "QC", "Kantor"];
const STATUS_OPTIONS = ["DRAFT", "IN_PROGRESS", "COMPLETED"];
const PARAM_STATUS = ["Memenuhi", "Tidak Memenuhi", "Sebagian"];

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
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `san-${Date.now()}-${Math.random()}`,
  parameter: "",
  standar: "",
  hasil: "",
  status: "Memenuhi",
});

const emptyForm: AuditForm = {
  areaAudit: "Produksi",
  tanggalAudit: new Date().toISOString().split("T")[0],
  parameterSanitasi: [emptySanitasi()],
  temuan: "",
  batasPerbaikan: "",
  picPerbaikan: "",
  statusAudit: "DRAFT",
};

export default function CkpbAuditPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useDnaToast();
  const [activeTab, setActiveTab] = useState("log");
  const [form, setForm] = useState<AuditForm>({ ...emptyForm });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const { data: audits = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["ckpb-audits"],
    queryFn: async () => {
      const resp = await api.get("/legality/audits");
      return resp.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/legality/audits", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ckpb-audits"] });
      success("Rekam audit CPKB sanitasi berhasil didaftarkan.");
      setForm({ ...emptyForm });
      setActiveTab("log");
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || "Gagal membuat rekam audit CPKB.");
    },
  });

  const totalAudits = audits.length;
  const draftCount = audits.filter((a: any) => a.statusAudit === "DRAFT").length;
  const inProgressCount = audits.filter((a: any) => a.statusAudit === "IN_PROGRESS").length;
  const completedCount = audits.filter((a: any) => a.statusAudit === "COMPLETED").length;

  const filteredAudits = useMemo(() => {
    if (!searchTerm.trim()) return audits;
    const term = searchTerm.toLowerCase();
    return audits.filter((a: any) => {
      return (
        a.areaAudit?.toLowerCase().includes(term) ||
        a.picPerbaikan?.toLowerCase().includes(term) ||
        a.temuan?.toLowerCase().includes(term) ||
        a.statusAudit?.toLowerCase().includes(term)
      );
    });
  }, [audits, searchTerm]);

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

  const handleSubmit = () => {
    if (!form.areaAudit || !form.tanggalAudit) {
      toastError("Area audit dan tanggal audit wajib diisi.");
      return;
    }
    createMutation.mutate({
      areaAudit: form.areaAudit,
      tanggalAudit: form.tanggalAudit,
      parameterSanitasi: form.parameterSanitasi.map(({ id, ...rest }) => rest),
      temuan: form.temuan,
      batasPerbaikan: form.batasPerbaikan,
      picPerbaikan: form.picPerbaikan,
      statusAudit: form.statusAudit,
    });
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER DENGAN TABS TERPADU (Golden Rule 2) ── */}
      <DnaPageHeader
        backLink={{ href: "/legality/dashboard", label: "Kembali ke Dashboard Legal" }}
        title="AUDIT CPKB & SANITASI PABRIK"
        badge={<DnaBadge variant="info">CPKB BPOM AUDIT</DnaBadge>}
        subtitle="Sistem kepatuhan Cara Pembuatan Kosmetika yang Baik (CPKB) dan verifikasi parameter sanitasi fasilitas"
        tabs={[
          {
            key: "log",
            label: "Log Riwayat Audit",
            count: totalAudits,
            icon: <ClipboardCheck className="w-3.5 h-3.5" />,
          },
          {
            key: "new",
            label: "Formulir Audit Baru",
            icon: <PlusCircle className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="outline"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => success("Laporan audit CPKB sanitasi diekspor.")}
          >
            Export Rekap Audit
          </DnaButton>
        }
      />

      {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL AUDIT DILAKUKAN",
            value: totalAudits.toLocaleString("id-ID"),
            deltaText: "Fasilitas pabrik terinspeksi",
            isDeltaPositive: true,
            icon: <ClipboardCheck className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: false,
          },
          {
            key: "COMPLETED",
            title: "AUDIT MEMENUHI SYARAT",
            value: completedCount.toLocaleString("id-ID"),
            deltaText: "Lolos verifikasi CPKB resmi",
            isDeltaPositive: true,
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: false,
          },
          {
            key: "IN_PROGRESS",
            title: "PERBAIKAN BERJALAN",
            value: `${inProgressCount} Berkas`,
            deltaText: "Dalam masa tenggang perbaikan",
            isDeltaPositive: false,
            icon: <AlertTriangle className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: false,
          },
          {
            key: "DRAFT",
            title: "DRAFT / JADWAL BARU",
            value: `${draftCount} Agenda`,
            deltaText: "Belum difinalisasi",
            isDeltaPositive: true,
            icon: <Clock className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: false,
          },
        ]}
      />

      {/* ── 03. TAB 1: LOG RIWAYAT AUDIT ── */}
      {activeTab === "log" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery: searchTerm,
            onSearchChange: setSearchTerm,
            searchPlaceholder: "Cari area audit, PIC perbaikan, atau catatan temuan...",
            actionButton: {
              label: "Audit Baru",
              onClick: () => setActiveTab("new"),
            },
          }}
        >
          <DnaTable className="table-fixed w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <th className="p-3 w-10 text-slate-400">#</th>
                <th className="p-3 w-[24%]">AREA & FASILITAS AUDIT</th>
                <th className="p-3 w-[18%]">TANGGAL & BATAS WAKTU</th>
                <th className="p-3 w-[20%]">PIC PENANGGUNG JAWAB</th>
                <th className="p-3 w-[24%]">RINGKASAN TEMUAN</th>
                <th className="p-3 text-center w-[14%] whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat log riwayat audit CPKB...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>Gagal memuat log audit CPKB</span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    Belum ada rekam audit yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit: any, idx: number) => (
                  <tr
                    key={audit.id || idx}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAudit(audit);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    <td className="p-3 text-slate-400 tabular-nums text-[11px] tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 truncate uppercase">Area {audit.areaAudit}</div>
                      <div className="text-[11px] text-blue-600 tabular-nums">
                        {audit.parameterSanitasi?.length || 0} Parameter Terinspeksi
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 text-xs">{audit.tanggalAudit || "—"}</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {audit.batasPerbaikan ? `Tenggat: ${audit.batasPerbaikan}` : "Tanpa tenggat"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 truncate">{audit.picPerbaikan || "Tim Sanitasi"}</div>
                      <div className="text-[11px] text-slate-500">PIC Penanggung Jawab</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs text-slate-700 truncate">
                        {audit.temuan || "Tidak ada temuan deviasi kritis"}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">Laporan Inspeksi</div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaBadge
                          variant={
                            audit.statusAudit === "COMPLETED"
                              ? "success"
                              : audit.statusAudit === "IN_PROGRESS"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {audit.statusAudit}
                        </DnaBadge>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedAudit(audit);
                            setIsDetailDrawerOpen(true);
                          }}
                          title="Inspeksi Detail Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </DnaDataTableCard>
      )}

      {/* ── 04. TAB 2: FORMULIR AUDIT BARU ── */}
      {activeTab === "new" && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">Formulir Pemeriksaan CPKB Sanitasi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catat hasil inspeksi kebersihan fasilitas produksi, ruang antara, dan pemenuhan regulasi BPOM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area Fasilitas Pabrik *</label>
              <DnaSelect
                value={form.areaAudit}
                onChange={(val) => updateForm("areaAudit", val)}
                options={AREAS.map((a) => ({ value: a, label: `Area ${a}` }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan Audit *</label>
              <DnaInput
                type="date"
                value={form.tanggalAudit}
                onChange={(e) => updateForm("tanggalAudit", e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Parameter Sanitasi */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Parameter Uji Sanitasi Fasilitas:
              </span>
              <DnaButton
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={addSanitasiRow}
              >
                Tambah Parameter
              </DnaButton>
            </div>

            <div className="space-y-2">
              {form.parameterSanitasi.map((param, i) => (
                <div key={param.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs">
                  <div className="md:col-span-4">
                    <DnaInput
                      value={param.parameter}
                      onChange={(e) => updateSanitasiRow(param.id, "parameter", e.target.value)}
                      placeholder="e.g. Swab test meja mixing"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DnaInput
                      value={param.standar}
                      onChange={(e) => updateSanitasiRow(param.id, "standar", e.target.value)}
                      placeholder="Standar: < 10 CFU/cm2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <DnaInput
                      value={param.hasil}
                      onChange={(e) => updateSanitasiRow(param.id, "hasil", e.target.value)}
                      placeholder="Hasil uji aktual"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <DnaSelect
                      value={param.status}
                      onChange={(val) => updateSanitasiRow(param.id, "status", val)}
                      options={PARAM_STATUS.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                  <div className="md:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeSanitasiRow(param.id)}
                      disabled={form.parameterSanitasi.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIC Penanggung Jawab</label>
              <DnaInput
                value={form.picPerbaikan}
                onChange={(e) => updateForm("picPerbaikan", e.target.value)}
                placeholder="e.g. Wahyu (Supervisor)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Waktu Perbaikan (Deadline)</label>
              <DnaInput
                type="date"
                value={form.batasPerbaikan}
                onChange={(e) => updateForm("batasPerbaikan", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Laporan Audit</label>
              <DnaSelect
                value={form.statusAudit}
                onChange={(val) => updateForm("statusAudit", val)}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Temuan / Rekomendasi Auditor</label>
            <DnaTextarea
              value={form.temuan}
              onChange={(e) => updateForm("temuan", e.target.value)}
              placeholder="Jelaskan temuan ketidaksesuaian atau tindakan korektif yang harus diambil..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={() => setActiveTab("log")}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              Simpan Rekam Audit
            </DnaButton>
          </div>
        </div>
      )}

      {/* ── 05. DETAIL DRAWER QUICK PEEK (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedAudit ? `Audit CPKB: Area ${selectedAudit.areaAudit}` : "Detail Audit"}
        subtitle={`Tanggal: ${selectedAudit?.tanggalAudit || "-"} • PIC: ${selectedAudit?.picPerbaikan || "-"}`}
        badge={
          selectedAudit?.statusAudit === "COMPLETED" ? (
            <DnaBadge variant="success">MEMENUHI SYARAT</DnaBadge>
          ) : selectedAudit?.statusAudit === "IN_PROGRESS" ? (
            <DnaBadge variant="warning">PERBAIKAN BERJALAN</DnaBadge>
          ) : (
            <DnaBadge variant="neutral">DRAFT AUDIT</DnaBadge>
          )
        }
        tabs={[
          {
            id: "params",
            label: "Parameter Sanitasi",
            content: selectedAudit ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Area Fasilitas</span>
                    <span className="font-bold text-slate-900 text-sm">Area {selectedAudit.areaAudit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tanggal Inspeksi</span>
                    <span className="font-semibold text-slate-800">{selectedAudit.tanggalAudit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">PIC Penanggung Jawab</span>
                    <span className="font-semibold text-slate-800">{selectedAudit.picPerbaikan || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tenggat Perbaikan</span>
                    <span className="tabular-nums font-semibold text-rose-600">{selectedAudit.batasPerbaikan || "—"}</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
                    Checklist Hasil Pengujian Sanitasi:
                  </span>
                  <div className="space-y-2">
                    {selectedAudit.parameterSanitasi && selectedAudit.parameterSanitasi.length > 0 ? (
                      selectedAudit.parameterSanitasi.map((param: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{param.parameter}</div>
                            <div className="text-[11px] text-slate-500">Standar: {param.standar} • Hasil: {param.hasil || "OK"}</div>
                          </div>
                          <DnaBadge
                            variant={
                              param.status === "Memenuhi"
                                ? "success"
                                : param.status === "Tidak Memenuhi"
                                ? "critical"
                                : "warning"
                            }
                          >
                            {param.status}
                          </DnaBadge>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 p-3 text-center border border-dashed rounded">
                        Parameter pengujian terindeks dalam lampiran audit
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null,
          },
          {
            id: "findings",
            label: "Temuan & Tindakan Korektif",
            content: selectedAudit ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 block text-xs">Catatan Temuan Auditor:</span>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedAudit.temuan || "Tidak ada temuan penyimpangan kritis pada audit ini. Kebersihan dan sanitasi memenuhi standar baku mutu CPKB."}
                  </p>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              onClick={() => success("Laporan audit CPKB dicetak.")}
            >
              Unduh Berita Acara
            </DnaButton>
            <DnaButton variant="primary" size="sm" onClick={() => setIsDetailDrawerOpen(false)}>
              Selesai
            </DnaButton>
          </div>
        }
      />
    </div>
  );
}
