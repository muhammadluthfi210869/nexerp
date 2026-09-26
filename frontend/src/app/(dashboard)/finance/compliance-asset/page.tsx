"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaModal,
  DnaInput,
  DnaSelect,
  formatRupiah,
  useDnaToast,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Plus, ShieldAlert, Award, FileText, Clock } from "lucide-react";

interface ComplianceAsset {
  id: string;
  code: string;
  name: string;
  type: "BPOM" | "HALAL" | "ISO" | "HKI" | "LAINNYA";
  productBrand: string;
  issueDate: string;
  expiryDate: string;
  cost: number;
  monthlyAmortization: number;
  accumulatedAmortization: number;
  daysToExpiry: number;
  status: "ACTIVE" | "WARNING" | "EXPIRED";
}

export default function ComplianceAssetPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<ComplianceAsset["type"]>("BPOM");
  const [formBrand, setFormBrand] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMonths, setFormMonths] = useState("36");
  const [formCost, setFormCost] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // 1. Fetch live intangible & compliance assets
  const { data: rawAssets = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-intangible-assets"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/intangible-assets");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const assets: ComplianceAsset[] = useMemo(() => {
    const now = new Date();
    return rawAssets.map((a: any) => {
      const issue = a.acquisitionDate ? new Date(a.acquisitionDate) : new Date();
      const periodMonths = Number(a.amortizationPeriod || 36);
      const expiry = new Date(issue);
      expiry.setMonth(expiry.getMonth() + periodMonths);

      const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
      const cost = Number(a.acquisitionCost || 0);
      const monthlyAmortization = periodMonths > 0 ? cost / periodMonths : 0;

      // Extract type and brand from notes if formatted as "TYPE - BRAND - NOTES"
      let type: ComplianceAsset["type"] = "BPOM";
      let brand = "-";
      if (a.notes && typeof a.notes === "string") {
        const parts = a.notes.split(" - ");
        if (["BPOM", "HALAL", "ISO", "HKI"].includes(parts[0])) {
          type = parts[0] as any;
          brand = parts[1] || "-";
        }
      }

      let status: ComplianceAsset["status"] = "ACTIVE";
      if (a.status === "RETIRED" || daysToExpiry < 0) {
        status = "EXPIRED";
      } else if (daysToExpiry <= 60) {
        status = "WARNING";
      }

      return {
        id: a.id,
        code: a.assetNumber || a.id.slice(0, 8),
        name: a.assetName || "Izin / Sertifikasi",
        type,
        productBrand: brand,
        issueDate: issue.toISOString().split("T")[0],
        expiryDate: expiry.toISOString().split("T")[0],
        cost,
        monthlyAmortization,
        accumulatedAmortization: Math.max(0, cost - Number(a.bookValue || 0)),
        daysToExpiry,
        status,
      };
    });
  }, [rawAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.productBrand.toLowerCase().includes(search.toLowerCase())
    );
  }, [assets, search]);

  const activeCount = assets.filter((a) => a.status === "ACTIVE").length;
  const warningCount = assets.filter((a) => a.status === "WARNING").length;
  const expiredCount = assets.filter((a) => a.status === "EXPIRED").length;
  const totalAmortMonth = assets.reduce(
    (acc, a) => acc + (a.status !== "EXPIRED" ? a.monthlyAmortization : 0),
    0
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/intangible-assets", {
        assetNumber: formCode.trim() || undefined,
        assetName: formName.trim(),
        acquisitionDate: formDate,
        acquisitionCost: Number(formCost),
        amortizationPeriod: Number(formMonths),
        notes: `${formType} - ${formBrand || "Umum"} - ${formNotes}`,
      });
    },
    onSuccess: () => {
      toast.success("Registrasi Berhasil", "Aset tak berwujud berhasil didaftarkan ke sistem.");
      queryClient.invalidateQueries({ queryKey: ["finance-intangible-assets"] });
      setIsModalOpen(false);
      setFormName("");
      setFormCode("");
      setFormBrand("");
      setFormCost("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error("Registrasi Gagal", err?.response?.data?.message || err.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCost || Number(formCost) <= 0) {
      toast.error("Validasi Gagal", "Nama sertifikasi dan biaya perolehan wajib diisi valid.");
      return;
    }
    createMutation.mutate();
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Aset Tak Berwujud & Amortisasi Legalitas"
        subtitle="Pelacakan masa berlaku perizinan BPOM, sertifikasi Halal, ISO, dan skedul amortisasi biaya kepatuhan"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Compliance & Intangible Assets" }]}
        actions={
          <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> + Registrasi Izin / Sertifikasi
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Sertifikasi Aktif"
          value={`${activeCount} Sertifikat`}
          variant="emerald"
          icon={<Award className="h-4 w-4" />}
          delta={{ value: "Dalam Masa Berlaku", isPositive: true }}
        />
        <DnaStatCard
          label="Mendekati Kadaluarsa (< 60 Hari)"
          value={`${warningCount} Izin`}
          variant="amber"
          icon={<Clock className="h-4 w-4" />}
          delta={{ value: "Perlu Perpanjangan Segera", isPositive: false }}
        />
        <DnaStatCard
          label="Telah Kadaluarsa"
          value={`${expiredCount} Dokumen`}
          variant="danger"
          icon={<ShieldAlert className="h-4 w-4" />}
          delta={{ value: "Segera Proses Ulang", isPositive: false }}
        />
        <DnaStatCard
          label="Total Beban Amortisasi Bulanan"
          value={formatRupiah(totalAmortMonth)}
          variant="blue"
          icon={<FileText className="h-4 w-4" />}
          delta={{ value: "Beban Amortisasi Berjalan", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nomor registrasi, nama izin, atau brand produk..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">No. Registrasi / Izin</th>
                <th className="px-4 py-3">Nama Sertifikasi / Brand</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Tgl Terbit & Berakhir</th>
                <th className="px-4 py-3 text-right">Biaya Legalitas</th>
                <th className="px-4 py-3 text-right">Amortisasi / Bln</th>
                <th className="px-4 py-3 text-center">Sisa Hari</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Belum ada aset tak berwujud atau izin legalitas yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <DnaCell.Code value={a.code} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{a.name}</div>
                      <div className="text-[11px] text-slate-400">{a.productBrand}</div>
                    </td>
                    <td className="px-4 py-3">
                      <DnaBadge
                        variant={
                          a.type === "BPOM"
                            ? "blue"
                            : a.type === "HALAL"
                            ? "emerald"
                            : a.type === "ISO"
                            ? "purple"
                            : "slate"
                        }
                      >
                        {a.type}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{a.issueDate} s/d</div>
                      <div className="font-medium text-slate-900">{a.expiryDate}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      {formatRupiah(a.cost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatRupiah(a.monthlyAmortization)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {a.daysToExpiry > 0 ? (
                        <span className={a.daysToExpiry <= 60 ? "text-amber-600 font-bold" : "text-slate-700"}>
                          {a.daysToExpiry} Hari
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">Kadaluarsa</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge
                        variant={
                          a.status === "ACTIVE"
                            ? "emerald"
                            : a.status === "WARNING"
                            ? "amber"
                            : "danger"
                        }
                      >
                        {a.status}
                      </DnaBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL REGISTRASI IZIN / ASET */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrasi Aset Tak Berwujud / Sertifikasi Baru"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nama Sertifikasi / Izin / Lisensi *</label>
            <DnaInput
              placeholder="Misal: Izin Edar BPOM NA Serum Brightening"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor Izin / Registrasi</label>
              <DnaInput
                placeholder="Misal: BPOM-NA-182601990"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kategori Dokumen *</label>
              <DnaSelect
                value={formType}
                onChange={(v) => setFormType(v as any)}
                options={[
                  { value: "BPOM", label: "Izin Edar BPOM" },
                  { value: "HALAL", label: "Sertifikasi Halal MUI / BPJPH" },
                  { value: "ISO", label: "Sertifikasi ISO / CPKB" },
                  { value: "HKI", label: "Hak Kekayaan Intelektual (Merk/Paten)" },
                  { value: "LAINNYA", label: "Lisensi Software & Lainnya" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Brand / Entitas Terkait</label>
              <DnaInput
                placeholder="Misal: Glow & Co"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Masa Amortisasi (Bulan) *</label>
              <DnaInput
                type="number"
                min="1"
                value={formMonths}
                onChange={(e) => setFormMonths(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tanggal Terbit / Perolehan *</label>
              <DnaInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Biaya Perolehan / Retribusi (Rp) *</label>
              <DnaInput
                type="number"
                min="1000"
                placeholder="Misal: 7500000"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan</label>
            <DnaInput
              placeholder="Keterangan perpanjangan atau batch terkait"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Daftarkan Aset"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
