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
import { DnaTable } from "@/components/dna";
import { PhoneCall, AlertCircle, Clock, CheckCircle2, Send, MessageSquare } from "lucide-react";

interface CollectionRecord {
  id: string;
  invoiceNo: string;
  customerName: string;
  brandName: string;
  picPhone: string;
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  lastContactDate: string;
  promiseToPayDate?: string;
  status: "FOLLOW_UP" | "PROMISED" | "DISPUTED" | "COLLECTED";
  notes: string;
}

const SAMPLE_COLLECTIONS: CollectionRecord[] = [
  { id: "col-1", invoiceNo: "INV-202608-0021", customerName: "PT Aura Makmur Kosmetika", brandName: "Aura Glow", picPhone: "0812-9876-5432", amountDue: 185000000, dueDate: "2026-08-25", daysOverdue: 14, lastContactDate: "2026-09-05", promiseToPayDate: "2026-09-12", status: "PROMISED", notes: "Klien menjanjikan transfer pelunasan tanggal 12 September setelah termin distributor masuk" },
  { id: "col-2", invoiceNo: "INV-202608-0044", customerName: "CV Derma Medika", brandName: "Derma Pure", picPhone: "0813-1122-3344", amountDue: 62000000, dueDate: "2026-08-28", daysOverdue: 11, lastContactDate: "2026-09-04", status: "FOLLOW_UP", notes: "Telepon PIC belum diangkat; pesan WhatsApp konfirmasi tagihan sudah terkirim" },
  { id: "col-3", invoiceNo: "INV-202607-0099", customerName: "CV Herbal Alami Indonesia", brandName: "Botanical Herbs", picPhone: "0815-5566-7788", amountDue: 45000000, dueDate: "2026-08-10", daysOverdue: 29, lastContactDate: "2026-09-02", status: "DISPUTED", notes: "Ada selisih retur 20 pcs botol pecah di ekspedisi, menunggu verifikasi credit memo" },
];

export default function CollectionsPage() {
  const [records, setRecords] = useState<CollectionRecord[]>(SAMPLE_COLLECTIONS);
  const [search, setSearch] = useState("");

  const totalOverdue = records.reduce((acc, r) => acc + (r.status !== "COLLECTED" ? r.amountDue : 0), 0);
  const totalCases = records.filter((r) => r.status !== "COLLECTED").length;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pusat Penagihan Piutang (AR Collections Hub)"
        subtitle="Monitoring penagihan faktur jatuh tempo, jadwal janji bayar klien, dan log komunikasi BusDev"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Collections" }]}
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Piutang Overdue Aktif"
          value={formatRupiah(totalOverdue)}
          variant="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          delta={{ value: `${totalCases} Kasus Penagihan`, isPositive: false }}
        />
        <DnaStatCard
          label="Menunggu Janji Bayar (Promised)"
          value="1 Faktur"
          variant="blue"
          icon={<Clock className="h-4 w-4" />}
          delta={{ value: "Komitmen Cair Pekan Ini", isPositive: true }}
        />
        <DnaStatCard
          label="Perlu Follow-Up Intensif"
          value="1 Faktur"
          variant="amber"
          icon={<PhoneCall className="h-4 w-4" />}
          delta={{ value: "Hubungi PIC Hari Ini", isPositive: false }}
        />
        <DnaStatCard
          label="Status Sengketa (Disputed)"
          value="1 Kasus"
          variant="slate"
          delta={{ value: "Klarifikasi Selisih Retur", isPositive: false }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nomor invoice, nama brand, atau PIC..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-3">Invoice No</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3 text-center">Days Overdue</th>
                <th className="px-3 py-3">Last Contact Date</th>
                <th className="px-3 py-3">Next Action Date</th>
                <th className="px-3 py-3">PIC BusDev</th>
                <th className="px-3 py-3 text-center">Status Collection</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                  <td className="px-3 py-3 font-mono font-semibold text-blue-600 whitespace-nowrap">
                    {r.invoiceNo}
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {r.customerName}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-rose-600 whitespace-nowrap">
                    +{r.daysOverdue} Hari
                  </td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap font-mono">
                    {r.lastContactDate}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-700">
                    {r.promiseToPayDate || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                    Irma Safarina
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <DnaBadge
                      variant={
                        r.status === "PROMISED"
                          ? "blue"
                          : r.status === "FOLLOW_UP"
                          ? "amber"
                          : r.status === "DISPUTED"
                          ? "danger"
                          : "emerald"
                      }
                    >
                      {r.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3 py-3 text-slate-600 max-w-xs truncate" title={r.notes}>
                    {r.notes}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <DnaButton variant="ghost" size="sm">
                      Follow Up
                    </DnaButton>
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
