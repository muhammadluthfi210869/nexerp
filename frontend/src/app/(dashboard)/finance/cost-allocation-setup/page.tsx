"use client";

/**
 * Cost Allocation Setup — Master Akuntansi Biaya Pabrik
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 24: /cost-allocation-setup)
 *
 * Table Columns (Strict 1:1 Parity):
 * Overhead Pool | Allocation Base | Formula | Active | #
 */

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Calculator,
  Sliders,
  Percent,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";

interface AllocationRule {
  id: string;
  poolName: string;
  accountCode: string;
  accountName: string;
  allocationBase: "Machine Hours" | "Volume Produksi (L/Kg)" | "Headcount Operator" | "Direct Labor Hours";
  formula: string;
  weight: number;
  isActive: boolean;
  notes?: string;
}

const INITIAL_RULES: AllocationRule[] = [
  {
    id: "pool-1",
    poolName: "Listrik Pabrik & Utilitas Cleanroom",
    accountCode: "5-2101",
    accountName: "Beban Listrik Pabrik",
    allocationBase: "Machine Hours",
    formula: "Bobot kW Mesin Mixing / Total Jam Operasional",
    weight: 40,
    isActive: true,
    notes: "Alokasi otomatis ke Work Order Mixing dan Homogenizer",
  },
  {
    id: "pool-2",
    poolName: "Laboratorium QC & IPC Testing",
    accountCode: "5-2104",
    accountName: "Beban Reagen & Uji Lab QC",
    allocationBase: "Volume Produksi (L/Kg)",
    formula: "Volume Batch Curah (Kg) * Tarif Uji Standar",
    weight: 25,
    isActive: true,
    notes: "Alokasi per batch release oleh formulator R&D/QC",
  },
  {
    id: "pool-3",
    poolName: "Maintenance & Kalibrasi Mesin Filling",
    accountCode: "5-2103",
    accountName: "Beban Pemeliharaan Mesin",
    allocationBase: "Machine Hours",
    formula: "Jam Kerja Line Filling Otomatis & Semi-Auto",
    weight: 20,
    isActive: true,
    notes: "Pemeliharaan preventif nozzle filling dan sealing box",
  },
  {
    id: "pool-4",
    poolName: "Supervisi & Sanitasi Ruang Produksi CPKB",
    accountCode: "5-2102",
    accountName: "Beban Sanitasi & APD Pabrik",
    allocationBase: "Headcount Operator",
    formula: "Jumlah Operator per Shift / Total Batch",
    weight: 15,
    isActive: true,
    notes: "Beban APD, disinfektan steril, dan pengolahan limbah",
  },
];

function CostAllocationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

  const [rules, setRules] = useState<AllocationRule[]>(INITIAL_RULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBaseFilter, setSelectedBaseFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null);

  React.useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const [formPoolName, setFormPoolName] = useState("");
  const [formAccount, setFormAccount] = useState("5-2101 - Beban Listrik Pabrik");
  const [formBase, setFormBase] = useState<AllocationRule["allocationBase"]>("Machine Hours");
  const [formFormula, setFormFormula] = useState("");
  const [formWeight, setFormWeight] = useState("20");

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchSearch =
        r.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accountCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBase = selectedBaseFilter === "ALL" || r.allocationBase === selectedBaseFilter;
      return matchSearch && matchBase;
    });
  }, [rules, searchQuery, selectedBaseFilter]);

  const activeCount = rules.filter((r) => r.isActive).length;
  const totalWeight = rules.reduce((acc, r) => (r.isActive ? acc + r.weight : acc), 0);

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    toast.success("Status Diperbarui", "Status keaktifan allocation rule berhasil diubah.");
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPoolName) {
      toast.error("Validasi Gagal", "Nama Overhead Pool wajib diisi.");
      return;
    }

    const [accCode, ...accNameParts] = formAccount.split(" - ");
    const newRule: AllocationRule = {
      id: `pool-${Date.now()}`,
      poolName: formPoolName,
      accountCode: accCode || "5-2199",
      accountName: accNameParts.join(" - ") || "Beban Overhead Lainnya",
      allocationBase: formBase,
      formula: formFormula || `${formBase} * Tarif Standar Alokasi`,
      weight: Number(formWeight) || 10,
      isActive: true,
      notes: "Aturan alokasi overhead baru dikonfigurasi",
    };

    setRules((prev) => [newRule, ...prev]);
    toast.success("Berhasil Disimpan", `Aturan alokasi '${formPoolName}' berhasil ditambahkan.`);
    setIsCreateModalOpen(false);
    setFormPoolName("");
    setFormFormula("");
    if (searchParams.get("action") === "create") {
      router.replace("/finance/cost-allocation-setup");
    }
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Cost Allocation Setup (Kelola Akuntansi Biaya)"
        description="Konfigurasi Pool Overhead Pabrik dan Dasar Pembebanan Biaya ke Job Order Costing (Mixing & Packaging)"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Calculator className="w-3.5 h-3.5" />
            JOB ORDER COSTING (0.5)
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              size="sm"
              onClick={() => setIsTestModalOpen(true)}
              className="gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Run Allocation Test
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              + Buat Allocation Rule
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid
        columns={4}
        items={[
          {
            label: "TOTAL OVERHEAD POOL",
            value: `${rules.length} Pool`,
            subtext: "Kategori biaya tidak langsung",
            icon: Layers,
            status: "neutral",
          },
          {
            label: "ATURAN AKTIF",
            value: `${activeCount} Rule`,
            subtext: "Terhubung ke kalkulasi HPP",
            icon: CheckCircle2,
            status: "success",
          },
          {
            label: "TOTAL BOBOT ALOKASI",
            value: `${totalWeight}%`,
            subtext: totalWeight === 100 ? "Alokasi tepat 100%" : "Perlu penyesuaian bobot",
            icon: Percent,
            status: totalWeight === 100 ? "success" : "warning",
          },
          {
            label: "METODE DASAR UTAMA",
            value: "Machine Hours",
            subtext: "Driver dominan di CPKB",
            icon: Sliders,
            status: "neutral",
          },
        ]}
      />

      <DnaDataTableCard
        title="Daftar Aturan Alokasi Biaya Overhead Pabrik"
        count={filteredRules.length}
        totalItems={rules.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari overhead pool, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={selectedBaseFilter}
              onChange={(e) => setSelectedBaseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Dasar Alokasi</option>
              <option value="Machine Hours">Machine Hours</option>
              <option value="Volume Produksi (L/Kg)">Volume Produksi (L/Kg)</option>
              <option value="Headcount Operator">Headcount Operator</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3.5">OVERHEAD POOL</th>
                <th className="p-3.5">ALLOCATION BASE</th>
                <th className="p-3.5">FORMULA</th>
                <th className="p-3.5 text-center">ACTIVE</th>
                <th className="p-3.5 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800">{rule.poolName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {rule.allocationBase}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600">
                    {rule.formula}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        rule.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {rule.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <DnaCell.Actions
                      onView={() => {
                        setEditingRule(rule);
                        setIsTestModalOpen(true);
                      }}
                      onEdit={() => {
                        setEditingRule(rule);
                        setFormPoolName(rule.poolName);
                        setFormFormula(rule.formula);
                        setFormBase(rule.allocationBase);
                        setIsCreateModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT / EDIT ALLOCATION RULE */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? "Sunting Aturan Alokasi Overhead" : "Buat Overhead Allocation Rule Baru"}
        size="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Overhead Pool *
            </label>
            <DnaInput
              placeholder="Contoh: Pemakaian Listrik Pabrik Mixing & QC"
              value={formPoolName}
              onChange={(e) => setFormPoolName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Akun Biaya (GL CoA) *
            </label>
            <DnaSelect
              value={formAccount}
              onChange={(val) => setFormAccount(val)}
              options={[
                { value: "5-2101 - Beban Listrik Pabrik", label: "5-2101 — Beban Listrik Pabrik" },
                { value: "5-2102 - Beban Sanitasi & APD Pabrik", label: "5-2102 — Beban Sanitasi & APD Pabrik" },
                { value: "5-2103 - Beban Pemeliharaan Mesin", label: "5-2103 — Beban Pemeliharaan Mesin" },
                { value: "5-2104 - Beban Reagen & Uji Lab QC", label: "5-2104 — Beban Reagen & Uji Lab QC" },
                { value: "5-2199 - Beban Overhead Pabrik Lainnya", label: "5-2199 — Beban Overhead Pabrik Lainnya" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dasar Alokasi (Allocation Base) *
              </label>
              <DnaSelect
                value={formBase}
                onChange={(val) => setFormBase(val as any)}
                options={[
                  { value: "Machine Hours", label: "Machine Hours (Jam Mesin)" },
                  { value: "Volume Produksi (L/Kg)", label: "Volume Produksi (L/Kg)" },
                  { value: "Headcount Operator", label: "Headcount Operator" },
                  { value: "Direct Labor Hours", label: "Direct Labor Hours" },
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bobot Alokasi (%) *
              </label>
              <DnaInput
                type="number"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                placeholder="20"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Formula Pembebanan *
            </label>
            <DnaInput
              placeholder="Contoh: (Jam Operasi Mesin / Total Jam Shift) * Tarif Beban"
              value={formFormula}
              onChange={(e) => setFormFormula(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <DnaButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingRule(null);
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Simpan Aturan Alokasi
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL RUN ALLOCATION TEST */}
      <DnaModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Simulasi Alokasi Biaya Overhead ke Batch Produksi"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Sampel Batch: WO-202609-001 (Brightening Serum 500 Kg)</div>
            <div className="text-slate-600 text-[11px]">
              Estimasi total overhead yang dibebankan ke batch ini berdasarkan 4 pool aktif:
            </div>
            <div className="text-base font-black text-amber-700">Rp 12.450.000 (Rp 24.900 / Kg Curah)</div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th className="py-2">Pool Overhead</th>
                <th className="py-2">Dasar Alokasi</th>
                <th className="py-2 text-right">Nilai Aktual</th>
                <th className="py-2 text-right">Alokasi ke Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 font-medium">Listrik Pabrik & Cleanroom</td>
                <td className="py-2">12 Jam Mesin (kW)</td>
                <td className="py-2 text-right font-mono">Rp 18.000.000</td>
                <td className="py-2 text-right font-bold text-slate-800 font-mono">Rp 5.400.000</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Laboratorium QC Lab</td>
                <td className="py-2">500 Kg Uji Curah</td>
                <td className="py-2 text-right font-mono">Rp 10.000.000</td>
                <td className="py-2 text-right font-bold text-slate-800 font-mono">Rp 3.250.000</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Maintenance Mesin Filling</td>
                <td className="py-2">8 Jam Filling</td>
                <td className="py-2 text-right font-mono">Rp 8.500.000</td>
                <td className="py-2 text-right font-bold text-slate-800 font-mono">Rp 2.100.000</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Sanitasi & APD Operator</td>
                <td className="py-2">4 Operator Shift</td>
                <td className="py-2 text-right font-mono">Rp 6.000.000</td>
                <td className="py-2 text-right font-bold text-slate-800 font-mono">Rp 1.700.000</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <DnaButton
              variant="secondary"
              size="sm"
              onClick={() => setIsTestModalOpen(false)}
            >
              Tutup Simulasi
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </div>
  );
}

export default function CostAllocationSetupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Memuat Cost Allocation Setup...</div>}>
      <CostAllocationContent />
    </Suspense>
  );
}
