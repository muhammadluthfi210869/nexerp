"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaCrudModal,
  DnaInput,
  DnaCurrencyInput,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Plus, ShieldAlert, Award, FileText, AlertCircle, Clock } from "lucide-react";

interface ComplianceAsset {
  id: string;
  code: string;
  name: string;
  type: "BPOM" | "HALAL" | "ISO" | "HKI";
  productBrand: string;
  issueDate: string;
  expiryDate: string;
  cost: number;
  monthlyAmortization: number;
  accumulatedAmortization: number;
  daysToExpiry: number;
  status: "ACTIVE" | "WARNING" | "EXPIRED";
}

const SAMPLE_COMPLIANCE: ComplianceAsset[] = [
  {
    id: "comp-1",
    code: "BPOM-NA-1824010992",
    name: "Izin Edar BPOM NA - Serum Brightening Niacinamide 10%",
    type: "BPOM",
    productBrand: "Glow & Co",
    issueDate: "2024-03-01",
    expiryDate: "2027-03-01",
    cost: 7500000,
    monthlyAmortization: 208333,
    accumulatedAmortization: 3750000,
    daysToExpiry: 540,
    status: "ACTIVE",
  },
  {
    id: "comp-2",
    code: "HALAL-ID00123984",
    name: "Sertifikasi Halal Pabrik Kosmetik (LPPOM MUI)",
    type: "HALAL",
    productBrand: "PT Karya Impian Laboratoris",
    issueDate: "2023-10-15",
    expiryDate: "2026-10-15",
    cost: 35000000,
    monthlyAmortization: 972222,
    accumulatedAmortization: 34027777,
    daysToExpiry: 37,
    status: "WARNING",
  },
  {
    id: "comp-3",
    code: "ISO-22716-GMP",
    name: "Sertifikasi ISO 22716:2007 (Cosmetics GMP)",
    type: "ISO",
    productBrand: "Seluruh Fasilitas Produksi",
    issueDate: "2023-01-10",
    expiryDate: "2026-01-10",
    cost: 50000000,
    monthlyAmortization: 1388888,
    accumulatedAmortization: 50000000,
    daysToExpiry: -241,
    status: "EXPIRED",
  },
];

export default function ComplianceAssetPage() {
  const [assets, setAssets] = useState<ComplianceAsset[]>(SAMPLE_COMPLIANCE);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCount = assets.filter((a) => a.status === "ACTIVE").length;
  const warningCount = assets.filter((a) => a.status === "WARNING").length;
  const expiredCount = assets.filter((a) => a.status === "EXPIRED").length;
  const totalAmortMonth = assets.reduce((acc, a) => acc + (a.status !== "EXPIRED" ? a.monthlyAmortization : 0), 0);

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
          delta={{ value: "Perlu Perpanjangan", isPositive: false }}
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
          delta={{ value: "Dr Beban Amortisasi / Cr Akum.", isPositive: true }}
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
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <DnaCell.Code value={a.code} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{a.name}</div>
                    <div className="text-[11px] text-slate-400">{a.productBrand}</div>
                  </td>
                  <td className="px-4 py-3">
                    <DnaBadge variant={a.type === "BPOM" ? "blue" : a.type === "HALAL" ? "emerald" : "purple"}>
                      {a.type}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{a.issueDate} s/d</div>
                    <div className="font-medium text-slate-900">{a.expiryDate}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(a.cost)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatRupiah(a.monthlyAmortization)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    {a.daysToExpiry > 0 ? (
                      <span className={a.daysToExpiry <= 60 ? "text-amber-600 font-bold" : "text-slate-700"}>
                        {a.daysToExpiry} Hari
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Kadaluarsa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={a.status === "ACTIVE" ? "emerald" : a.status === "WARNING" ? "amber" : "danger"}>
                      {a.status}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
