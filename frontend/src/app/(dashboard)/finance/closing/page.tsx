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
  DnaSwitch,
  formatRupiah,
} from "@/components/dna";
import { Lock, Unlock, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet } from "lucide-react";

interface ClosingStep {
  id: string;
  order: number;
  category: "INVENTORY" | "AR_AP" | "FIXED_ASSET" | "PAYROLL" | "GENERAL_LEDGER";
  taskName: string;
  department: string;
  picName: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

const SAMPLE_STEPS: ClosingStep[] = [
  { id: "s-1", order: 1, category: "INVENTORY", taskName: "Rekonsiliasi Stok Opname & Penyesuaian Nilai Persediaan", department: "Gudang & SCM", picName: "Budi Santoso", isCompleted: true, completedAt: "2026-08-31 17:00" },
  { id: "s-2", order: 2, category: "AR_AP", taskName: "Verifikasi Seluruh Faktur Pembelian (3-Way Match) & Faktur Penjualan", department: "Finance AP/AR", picName: "Siti Rahma", isCompleted: true, completedAt: "2026-08-31 18:30" },
  { id: "s-3", order: 3, category: "FIXED_ASSET", taskName: "Posting Penyusutan Garis Lurus Aset Tetap & Amortisasi Izin BPOM", department: "Accounting", picName: "Upii", isCompleted: true, completedAt: "2026-08-31 19:15" },
  { id: "s-4", order: 4, category: "PAYROLL", taskName: "Pencatatan Gaji, Upah Lembur Pabrik, & PPh 21 Tenaga Kerja", department: "HRD & Finance", picName: "Rudi Hartono", isCompleted: true, completedAt: "2026-08-31 20:00" },
  { id: "s-5", order: 5, category: "GENERAL_LEDGER", taskName: "Pencocokan Rekonsiliasi Bank Giro & Brankas Kas Pabrik", department: "Finance Controller", picName: "Upii", isCompleted: true, completedAt: "2026-08-31 20:45" },
  { id: "s-6", order: 6, category: "GENERAL_LEDGER", taskName: "Otorisasi Hard Period Lock (Blokir Seluruh Transaksi Mundur)", department: "Direktur Keuangan", picName: "Direksi", isCompleted: false, notes: "Menunggu final sign-off" },
];

export default function ClosingAndPeriodLockPage() {
  const [steps, setSteps] = useState<ClosingStep[]>(SAMPLE_STEPS);
  const [period, setPeriod] = useState("2026-08");
  const [isHardLocked, setIsHardLocked] = useState(false);

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleToggleStep = (id: string) => {
    setSteps(
      steps.map((s) =>
        s.id === id ? { ...s, isCompleted: !s.isCompleted, completedAt: !s.isCompleted ? new Date().toISOString() : undefined } : s
      )
    );
  };

  const handleLockPeriod = () => {
    if (completedCount < steps.length - 1) {
      alert("Peringatan: Seluruh tahapan checklist pra-closing harus selesai sebelum mengaktifkan Hard Period Lock!");
      return;
    }
    setIsHardLocked(!isHardLocked);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Closing Bulanan & Period Hard Lock"
        subtitle="Manajemen tahapan tutup buku akhir bulan dan penguncian mutasi jurnal mundur (Batch 5B)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Closing & Controls" }]}
        actions={
          <DnaButton
            variant={isHardLocked ? "danger" : "primary"}
            onClick={handleLockPeriod}
          >
            {isHardLocked ? <Unlock className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
            {isHardLocked ? "Buka Hard Lock Periode" : "Kunci Hard Lock Periode"}
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Status Periode Buku"
          value={isHardLocked ? "LOCKED (TERKUNCI)" : "OPEN (DIBUKA)"}
          variant={isHardLocked ? "danger" : "emerald"}
          icon={isHardLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          delta={{ value: isHardLocked ? "Transaksi Mundur Diblokir" : "Transaksi Masih Bisa Masuk", isPositive: !isHardLocked }}
        />
        <DnaStatCard
          label="Progress Checklist Closing"
          value={`${progressPct}%`}
          variant="blue"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delta={{ value: `${completedCount} dari ${steps.length} Selesai`, isPositive: true }}
        />
        <DnaStatCard
          label="Periode Tutup Buku"
          value={`Agustus 2026`}
          variant="slate"
          delta={{ value: "Cut-off: 31 Agustus 2026", isPositive: true }}
        />
        <DnaStatCard
          label="Adjustment Journal"
          value="Otorisasi Khusus"
          variant="amber"
          icon={<ShieldCheck className="h-4 w-4" />}
          delta={{ value: "Hanya Finance Manager", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard title="Checklist Tahapan Tutup Buku (Month-End Closing Protocol)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Urutan</th>
                <th className="px-4 py-3">Tahapan Verifikasi & Closing</th>
                <th className="px-4 py-3">Departemen Terkait</th>
                <th className="px-4 py-3">PIC Bertanggung Jawab</th>
                <th className="px-4 py-3">Waktu Selesai</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {steps.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">#{s.order}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{s.taskName}</div>
                    {s.notes && <div className="text-[11px] text-amber-600 font-medium">{s.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.department}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.picName}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{s.completedAt || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={s.isCompleted ? "emerald" : "amber"}>
                      {s.isCompleted ? "Selesai" : "Pending"}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaButton
                      variant={s.isCompleted ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleToggleStep(s.id)}
                    >
                      {s.isCompleted ? "Batalkan" : "Tandai Selesai"}
                    </DnaButton>
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
