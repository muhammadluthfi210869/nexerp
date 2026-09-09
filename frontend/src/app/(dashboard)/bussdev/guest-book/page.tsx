"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Users,
  Building2,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Clock,
  Plus,
  Phone,
  Mail,
  Sparkles,
  Eye,
  CheckCircle2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface GuestVisitItem {
  id: string;
  date: string;
  clientName: string;
  brandName: string;
  picPhone: string;
  busDevName: string;
  purpose: "KONSULTASI_MAKLON" | "SAMPLING_FORMULA" | "KONTRAK_MOU" | "AUDIT_PABRIK";
  status: "NEW_LEAD" | "SAMPLE_REQUESTED" | "MOU_SIGNED" | "CLOSED";
  notes: string;
}

const FALLBACK_VISITS: GuestVisitItem[] = [
  { id: "1", date: "2026-09-09 10:00", clientName: "Ibu Amanda Putri", brandName: "Glow & Shine Co", picPhone: "0812-9988-7711", busDevName: "Rina BusDev", purpose: "KONSULTASI_MAKLON", status: "SAMPLE_REQUESTED", notes: "Diskusi formula serum retinol nano-liposome 5000 pcs" },
  { id: "2", date: "2026-09-08 13:30", clientName: "dr. Hendra Pratama", brandName: "Dermalife Aesthetic", picPhone: "0811-2233-4455", busDevName: "Doni Senior BusDev", purpose: "SAMPLING_FORMULA", status: "MOU_SIGNED", notes: "Review sample batch 2 sunscreen physical SPF 50. Sign MOU produksi." },
  { id: "3", date: "2026-09-07 15:00", clientName: "Bapak Surya Wijaya", brandName: "Kharisma Herbal Nusantara", picPhone: "0813-5566-7788", busDevName: "Rina BusDev", purpose: "AUDIT_PABRIK", status: "NEW_LEAD", notes: "Plant tour fasilitas Cleanroom CPKB & ruang R&D" },
];

export default function BussDevGuestBookReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Buku Tamu & BusDev (Client Interaction Log)"
        description="Catatan interaksi kunjungan calon klien, konsultasi maklon kosmetik, tindak lanjut R&D formula, dan konversi kontrak MOU."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Kunjungan Terjadwal Hari Ini: 3 Tamu</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Log
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Kunjungan Tamu
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Kunjungan Klien (Bln Ini)"
          value="28 Tamu"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+30% vs bln lalu", isPositive: true }}
          subtext="Prospect Klien Maklon Baru"
          variant="info"
        />
        <DnaStatCard
          label="Permintaan Sample R&D"
          value="18 Batch"
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          delta={{ value: "64% Conversion", isPositive: true }}
          subtext="Lanjut ke Pengembangan Formula"
          variant="purple"
        />
        <DnaStatCard
          label="Konversi MOU / Kontrak"
          value="7 Klien"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Rp 2.8M Est. Contract", isPositive: true }}
          subtext="Deals Signed Bulan Ini"
          variant="success"
        />
        <DnaStatCard
          label="Rata-rata Respon BusDev"
          value="< 2 Jam"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "SLA Excellent", isPositive: true }}
          subtext="Follow-up Pasca Kunjungan"
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Log Tamu & Interaksi Business Development"
        badge={<DnaBadge variant="default">{FALLBACK_VISITS.length} Tamu</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tamu / brand / PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Waktu Kunjungan</th>
                <th className="px-3.5 py-3">Nama Tamu / Klien</th>
                <th className="px-3.5 py-3">Brand Kosmetik</th>
                <th className="px-3.5 py-3">Kontak Phone</th>
                <th className="px-3.5 py-3">BusDev Pendamping</th>
                <th className="px-3.5 py-3">Tujuan Kunjungan</th>
                <th className="px-3.5 py-3">Status Prospek</th>
                <th className="px-3.5 py-3">Catatan / Ringkasan Rapat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_VISITS.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{v.date}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{v.clientName}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-purple-700">{v.brandName}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">{v.picPhone}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{v.busDevName}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {v.purpose.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <DnaBadge variant={v.status === "MOU_SIGNED" ? "success" : v.status === "SAMPLE_REQUESTED" ? "purple" : "info"}>
                      {v.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px] max-w-sm truncate">{v.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* CREATE GUEST VISIT MODAL */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Kunjungan Tamu / Calon Klien Baru"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Tamu / PIC</label>
            <input type="text" placeholder="e.g. Ibu Amanda Putri" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Brand / Perusahaan</label>
            <input type="text" placeholder="e.g. Glow & Shine Skincare" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp</label>
              <input type="text" placeholder="0812-xxxx-xxxx" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">BusDev Pendamping</label>
              <input type="text" placeholder="Nama BusDev" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tujuan Kunjungan</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
              <option value="KONSULTASI_MAKLON">Konsultasi Maklon OEM/ODM</option>
              <option value="SAMPLING_FORMULA">Sampling & Uji Formula Lab</option>
              <option value="AUDIT_PABRIK">Audit Pabrik Cleanroom CPKB</option>
              <option value="KONTRAK_MOU">Penandatanganan Kontrak MOU</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Catatan Pertemuan / Kebutuhan Produk</label>
            <textarea rows={3} placeholder="Tuliskan ringkasan diskusi..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Kunjungan tamu berhasil dicatat!");
                setIsModalOpen(false);
              }}
            >
              Simpan Buku Tamu
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
