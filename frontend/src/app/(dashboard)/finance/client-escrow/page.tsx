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
  formatRupiah,
} from "@/components/dna";
import { ShieldCheck, ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

interface EscrowAccount {
  id: string;
  clientName: string;
  brandName: string;
  purpose: "BPOM_NOTIFIKASI" | "HKI_MEREK" | "HALAL_CERT";
  totalReceived: number;
  totalDisbursed: number;
  balanceRemaining: number;
  lastDisbursementDate?: string;
  status: "ACTIVE" | "SETTLED";
}

const SAMPLE_ESCROW: EscrowAccount[] = [
  { id: "esc-1", clientName: "PT Aura Makmur Kosmetika", brandName: "Aura Glow", purpose: "BPOM_NOTIFIKASI", totalReceived: 35000000, totalDisbursed: 22500000, balanceRemaining: 12500000, lastDisbursementDate: "2026-08-20", status: "ACTIVE" },
  { id: "esc-2", clientName: "CV Derma Medika", brandName: "Derma Pure", purpose: "HKI_MEREK", totalReceived: 15000000, totalDisbursed: 15000000, balanceRemaining: 0, lastDisbursementDate: "2026-07-15", status: "SETTLED" },
  { id: "esc-3", clientName: "PT Aroma Nirwana", brandName: "Conscentra", purpose: "BPOM_NOTIFIKASI", totalReceived: 25000000, totalDisbursed: 10000000, balanceRemaining: 15000000, lastDisbursementDate: "2026-09-02", status: "ACTIVE" },
];

export default function ClientEscrowPage() {
  const [escrows, setEscrows] = useState<EscrowAccount[]>(SAMPLE_ESCROW);
  const [search, setSearch] = useState("");

  const totalRec = escrows.reduce((acc, e) => acc + e.totalReceived, 0);
  const totalDisb = escrows.reduce((acc, e) => acc + e.totalDisbursed, 0);
  const totalBal = escrows.reduce((acc, e) => acc + e.balanceRemaining, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Buku Besar Titipan Klien (Client Escrow & Pass-Through)"
        subtitle="Pencatatan dana titipan pengurusan izin BPOM & HKI klien yang disetorkan ke kas negara (PNBP)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Client Escrow" }]}
      />

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Dana Titipan Diterima"
          value={formatRupiah(totalRec)}
          variant="blue"
          icon={<ArrowDownRight className="h-4 w-4" />}
          delta={{ value: "Penerimaan Kas Non-Revenue", isPositive: true }}
        />
        <DnaStatCard
          label="Total Disetorkan (PNBP Negara)"
          value={formatRupiah(totalDisb)}
          variant="amber"
          icon={<ArrowUpRight className="h-4 w-4" />}
          delta={{ value: "Bukti Bayar Simponi Valid", isPositive: false }}
        />
        <DnaStatCard
          label="Saldo Titipan Mengendap (Escrow)"
          value={formatRupiah(totalBal)}
          variant="emerald"
          icon={<Scale className="h-4 w-4" />}
          delta={{ value: "Kewajiban Lancar di Neraca (21300)", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nama PT klien, brand kosmetik, atau peruntukan izin..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Klien & Brand</th>
                <th className="px-4 py-3">Tujuan Pengurusan</th>
                <th className="px-4 py-3 text-right">Dana Diterima</th>
                <th className="px-4 py-3 text-right">Disetorkan (PNBP)</th>
                <th className="px-4 py-3 text-right">Sisa Titipan Mengendap</th>
                <th className="px-4 py-3">Penyetoran Terakhir</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {escrows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{e.brandName}</div>
                    <div className="text-[11px] text-slate-400">{e.clientName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <DnaBadge variant={e.purpose === "BPOM_NOTIFIKASI" ? "blue" : "purple"}>
                      {e.purpose.replace("_", " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(e.totalReceived)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatRupiah(e.totalDisbursed)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(e.balanceRemaining)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{e.lastDisbursementDate || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={e.status === "ACTIVE" ? "emerald" : "slate"}>
                      {e.status === "ACTIVE" ? "Aktif" : "Lunas / Selesai"}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
