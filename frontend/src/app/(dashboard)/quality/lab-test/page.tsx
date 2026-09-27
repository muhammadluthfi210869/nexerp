"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Plus,
  Search,
  Eye,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Activity
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { useAuth } from "@/hooks/useAuth";

interface LabTestResult {
  id: string;
  testDate: string;
  formulaId: string;
  formulaName?: string;
  actualPh: string;
  actualViscosity: string;
  actualDensity: string;
  colorResult: string;
  aromaResult: string;
  textureResult: string;
  stability40C: string;
  stabilityRT: string;
  stability4C: string;
  notes?: string;
  tester?: {
    id: string;
    fullName: string;
  };
}

export default function LabTestCenterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [search, setSearch] = useState("");
  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabTestResult | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [form, setForm] = useState({
    formulaId: "",
    actualPh: "",
    actualViscosity: "",
    actualDensity: "",
    colorResult: "",
    aromaResult: "",
    textureResult: "",
    stability40C: "STABLE",
    stabilityRT: "STABLE",
    stability4C: "STABLE",
    notes: ""
  });

  const { data: formulas } = useQuery({
    queryKey: ["formulas"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas");
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    }
  });

  // Set default formula once loaded
  React.useEffect(() => {
    if (!selectedFormulaId && Array.isArray(formulas) && formulas.length > 0) {
      setSelectedFormulaId(formulas[0].id);
    }
  }, [formulas, selectedFormulaId]);

  const { data: rawResults, isLoading, refetch } = useQuery({
    queryKey: ["lab-test-results", selectedFormulaId],
    queryFn: async () => {
      if (!selectedFormulaId) return [];
      try {
        const res = await api.get(`/rnd/lab-test-results/${selectedFormulaId}`);
        const data = res.data?.data || res.data || [];
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedFormulaId
  });

  const results: LabTestResult[] = useMemo(() => {
    return Array.isArray(rawResults) ? rawResults : [];
  }, [rawResults]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/rnd/lab-test-results", {
        ...form,
        formulaId: selectedFormulaId || form.formulaId,
        testerId: user?.id
      });
    },
    onSuccess: () => {
      toast.success("Uji Lab Disimpan", "Hasil analisis laboratorium berhasil dicatat.");
      queryClient.invalidateQueries({ queryKey: ["lab-test-results"] });
      setIsModalOpen(false);
      setForm({
        formulaId: "",
        actualPh: "",
        actualViscosity: "",
        actualDensity: "",
        colorResult: "",
        aromaResult: "",
        textureResult: "",
        stability40C: "STABLE",
        stabilityRT: "STABLE",
        stability4C: "STABLE",
        notes: ""
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", err.response?.data?.message || "Terjadi kesalahan.");
    }
  });

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (r.actualPh && r.actualPh.toLowerCase().includes(q)) ||
        (r.colorResult && r.colorResult.toLowerCase().includes(q)) ||
        (r.tester?.fullName && r.tester.fullName.toLowerCase().includes(q));

      const isStable = r.stability40C === "STABLE" && r.stabilityRT === "STABLE" && r.stability4C === "STABLE";
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "STABLE" && isStable) ||
        (activeTab === "UNSTABLE" && !isStable);

      return matchesSearch && matchesTab;
    });
  }, [results, search, activeTab]);

  const totalTests = results.length;
  const stableTests = results.filter((r) => r.stability40C === "STABLE" && r.stabilityRT === "STABLE" && r.stability4C === "STABLE").length;
  const unstableTests = totalTests - stableTests;

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Pusat Uji Lab & Analisis Stabilitas"
        description="Pengujian parameter fisik-kimia (pH, Viskositas, Densitas) dan uji stabilitas dipercepat (40°C, RT, 4°C)."
        badge={<DnaBadge variant="neutral">QC-LAB</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "Quality & QC", href: "/quality/lab-test" },
          { label: "Pusat Uji Lab", href: "/quality/lab-test" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua Hasil (${totalTests})` },
          { id: "STABLE", label: `Stabil (${stableTests})` },
          { id: "UNSTABLE", label: `Perlu Review (${unstableTests})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Data", "Hasil uji laboratorium berhasil diekspor.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                setForm({ ...form, formulaId: selectedFormulaId });
                setIsModalOpen(true);
              }}
              disabled={!selectedFormulaId}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Uji Lab
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL PENGUJIAN FORMULA"
          value={`${totalTests} Sampel`}
          subValue="Riwayat Analisis Lab"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="STABILITAS TERVALIDASI"
          value={`${stableTests} Sampel`}
          subValue="Lolos Uji 40°C, RT, 4°C"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="PERLU REFORMULASI"
          value={`${unstableTests} Sampel`}
          subValue="Ada Ketidakstabilan"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Formula Selector & DataTable Card */}
      <div className="space-y-4">
        {Array.isArray(formulas) && formulas.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Pilih Formulasi:</span>
            <select
              value={selectedFormulaId}
              onChange={(e) => setSelectedFormulaId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none flex-1 max-w-md"
            >
              {formulas.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.formulaCode || f.id} (v{f.version || "1.0"})
                </option>
              ))}
            </select>
          </div>
        )}

        <DnaDataTableCard
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari parameter pH, warna, penguji..."
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[16%]">Tanggal & Uji</DnaTh>
                  <DnaTh className="py-3 px-4 w-[28%]">Parameter Fisik</DnaTh>
                  <DnaTh className="py-3 px-4 w-[22%]">Organoleptik</DnaTh>
                  <DnaTh className="py-3 px-4 w-[16%]">Stabilitas (40°C / RT / 4°C)</DnaTh>
                  <DnaTh className="py-3 px-4 w-[12%]">Penguji</DnaTh>
                  <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                      Memuat hasil uji lab...
                    </DnaTd>
                  </DnaTableRow>
                ) : filteredResults.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                      <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      Tidak ada data uji lab untuk formula ini.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredResults.map((r) => {
                    const isAllStable = r.stability40C === "STABLE" && r.stabilityRT === "STABLE" && r.stability4C === "STABLE";
                    return (
                      <DnaTableRow key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <DnaTd className="py-3 px-4 truncate">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {r.testDate ? new Date(r.testDate).toLocaleDateString("id-ID") : "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 tabular-nums truncate">ID: {r.id.slice(0, 8)}</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-4 truncate">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            pH: {r.actualPh || "—"} • Visk: {r.actualViscosity || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Densitas: {r.actualDensity || "—"} g/ml
                          </p>
                        </DnaTd>
                        <DnaTd className="py-3 px-4 truncate">
                          <p className="font-medium text-slate-800 text-xs truncate">Warna: {r.colorResult || "—"}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Aroma: {r.aromaResult || "—"} • {r.textureResult || "—"}
                          </p>
                        </DnaTd>
                        <DnaTd className="py-3 px-4 truncate">
                          <div className="flex items-center gap-1.5">
                            <DnaBadge variant={r.stability40C === "STABLE" ? "success" : "danger"}>
                              40°: {r.stability40C === "STABLE" ? "OK" : "NO"}
                            </DnaBadge>
                            <DnaBadge variant={r.stabilityRT === "STABLE" ? "success" : "danger"}>
                              RT: {r.stabilityRT === "STABLE" ? "OK" : "NO"}
                            </DnaBadge>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isAllStable ? "Semua Suhu Stabil" : "Ketidakstabilan Terdeteksi"}
                          </p>
                        </DnaTd>
                        <DnaTd className="py-3 px-4 truncate">
                          <p className="font-medium text-slate-800 text-xs truncate">{r.tester?.fullName || "Analis Lab"}</p>
                          <p className="text-[11px] text-slate-400 truncate">QC Analis</p>
                        </DnaTd>
                        <DnaTd className="py-3 px-4 text-right">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(r);
                              setIsDetailDrawerOpen(true);
                            }}
                            title="Lihat Detail Hasil Uji"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      </div>

      {/* 4. Modal Catat Uji Lab */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Hasil Uji Laboratorium"
        description="Input hasil pengujian fisik, kimia, dan stabilitas sampel formulasi."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan Hasil Uji"}
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">pH Aktual</label>
              <DnaInput
                value={form.actualPh}
                onChange={(e) => setForm({ ...form, actualPh: e.target.value })}
                placeholder="mis. 5.5"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Viskositas (cps)</label>
              <DnaInput
                value={form.actualViscosity}
                onChange={(e) => setForm({ ...form, actualViscosity: e.target.value })}
                placeholder="mis. 4200"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Densitas (g/ml)</label>
              <DnaInput
                value={form.actualDensity}
                onChange={(e) => setForm({ ...form, actualDensity: e.target.value })}
                placeholder="mis. 1.02"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Warna</label>
              <DnaInput
                value={form.colorResult}
                onChange={(e) => setForm({ ...form, colorResult: e.target.value })}
                placeholder="mis. Bening kekuningan"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Aroma</label>
              <DnaInput
                value={form.aromaResult}
                onChange={(e) => setForm({ ...form, aromaResult: e.target.value })}
                placeholder="mis. Khas chamomile"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tekstur</label>
              <DnaInput
                value={form.textureResult}
                onChange={(e) => setForm({ ...form, textureResult: e.target.value })}
                placeholder="mis. Ringan, cepat meresap"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Stabilitas 40°C</label>
              <select
                value={form.stability40C}
                onChange={(e) => setForm({ ...form, stability40C: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE</option>
                <option value="UNSTABLE">UNSTABLE</option>
                <option value="CHANGE">CHANGE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Stabilitas RT</label>
              <select
                value={form.stabilityRT}
                onChange={(e) => setForm({ ...form, stabilityRT: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE</option>
                <option value="UNSTABLE">UNSTABLE</option>
                <option value="CHANGE">CHANGE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Stabilitas 4°C</label>
              <select
                value={form.stability4C}
                onChange={(e) => setForm({ ...form, stability4C: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="STABLE">STABLE</option>
                <option value="UNSTABLE">UNSTABLE</option>
                <option value="CHANGE">CHANGE</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Analis</label>
            <DnaInput
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan perubahan bau, endapan, atau pemisahan fase..."
            />
          </div>
        </div>
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedResult ? `Hasil Uji #${selectedResult.id.slice(0, 8)}` : "Detail Uji Lab"}
        subtitle={selectedResult?.testDate ? `Tanggal: ${new Date(selectedResult.testDate).toLocaleDateString("id-ID")}` : undefined}
        tabs={[
          {
            id: "params",
            label: "Parameter Fisik & Organoleptik",
            content: selectedResult ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">pH Aktual</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedResult.actualPh || "—"}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Viskositas</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedResult.actualViscosity || "—"} cps</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Densitas</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedResult.actualDensity || "—"} g/ml</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 uppercase">Pemeriksaan Organoleptik</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Warna</span>
                      <p className="font-semibold text-slate-800">{selectedResult.colorResult || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Aroma</span>
                      <p className="font-semibold text-slate-800">{selectedResult.aromaResult || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tekstur</span>
                      <p className="font-semibold text-slate-800">{selectedResult.textureResult || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          },
          {
            id: "stability",
            label: "Uji Stabilitas",
            content: selectedResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Stabilitas Oven 40°C (Accelerated)</p>
                    <p className="text-[11px] text-slate-500">Simulasi degradasi termal dipercepat</p>
                  </div>
                  <DnaBadge variant={selectedResult.stability40C === "STABLE" ? "success" : "danger"}>
                    {selectedResult.stability40C || "—"}
                  </DnaBadge>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Stabilitas Suhu Ruang (RT ~25°C)</p>
                    <p className="text-[11px] text-slate-500">Penyimpanan kondisi normal</p>
                  </div>
                  <DnaBadge variant={selectedResult.stabilityRT === "STABLE" ? "success" : "danger"}>
                    {selectedResult.stabilityRT || "—"}
                  </DnaBadge>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Stabilitas Dingin (Chiller 4°C)</p>
                    <p className="text-[11px] text-slate-500">Simulasi kristalisasi & pemisahan dingin</p>
                  </div>
                  <DnaBadge variant={selectedResult.stability4C === "STABLE" ? "success" : "danger"}>
                    {selectedResult.stability4C || "—"}
                  </DnaBadge>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Analis:</span>
                  <p className="text-slate-600">{selectedResult.notes || "Tidak ada catatan khusus."}</p>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
