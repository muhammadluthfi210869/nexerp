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
  DnaModal,
  DnaInput,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { RotateCcw, Package, Eye, CheckCircle2, Clock, Search, History } from "lucide-react";

interface SalesReturnInRecord {
  id: string;
  returnCode: string;
  returnDate: string;
  customerName: string;
  creatorName: string;
  status: "DITERIMA" | "QC_INSPECTION" | "DIKEMBALIKAN_KE_STOK" | "SCRAP_DIMUSNAHKAN";
  itemsCount: number;
  notes?: string;
}

const SAMPLE_RETURN_IN: SalesReturnInRecord[] = [
  {
    id: "sri-1",
    returnCode: "RTR-IN-2026-001",
    returnDate: "2026-09-02",
    customerName: "PT Cantika Jelita Nusantara",
    creatorName: "Fadilah Syahab",
    status: "DIKEMBALIKAN_KE_STOK",
    itemsCount: 150,
    notes: "Kemasan sekunder rusak di ekspedisi; botol primer utuh dan lolos re-packing"
  },
  {
    id: "sri-2",
    returnCode: "RTR-IN-2026-002",
    returnDate: "2026-09-04",
    customerName: "CV Derma Medika",
    creatorName: "Irma Safarina",
    status: "QC_INSPECTION",
    itemsCount: 40,
    notes: "Pengujian viskositas batch toner di Lab QC"
  },
  {
    id: "sri-3",
    returnCode: "RTR-IN-2026-003",
    returnDate: "2026-09-06",
    customerName: "Glow & Shine Co",
    creatorName: "Keviana",
    status: "DITERIMA",
    itemsCount: 80,
    notes: "Barang fisik baru masuk dermaga gudang karantina"
  },
  {
    id: "sri-4",
    returnCode: "RTR-IN-2026-004",
    returnDate: "2026-08-28",
    customerName: "Alpha Men Grooming",
    creatorName: "Vira",
    status: "SCRAP_DIMUSNAHKAN",
    itemsCount: 200,
    notes: "Pecah fisik total, dibuatkan berita acara scrap pemusnahan"
  }
];

export default function SalesReturnInPage() {
  const [data, setData] = useState<SalesReturnInRecord[]>(SAMPLE_RETURN_IN);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SalesReturnInRecord | null>(null);

  const filtered = data.filter(
    (d) =>
      d.returnCode.toLowerCase().includes(search.toLowerCase()) ||
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Penerimaan Barang Masuk: Retur Penjualan"
        subtitle="Pencatatan fisik barang masuk dari klaim retur pelanggan, pemeriksaan QC karantina, dan pelepasan kembali ke stok atau scrap"
        breadcrumbs={[{ label: "Barang Masuk", href: "/inventory" }, { label: "Retur Penjualan" }]}
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Masuk Retur"
          value={`${data.length} Berkas`}
          icon={<RotateCcw className="w-4 h-4" />}
          delta={{ value: "Penerimaan Fisik Gudang", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Sedang Karantina QC"
          value={`${data.filter((d) => d.status === "QC_INSPECTION" || d.status === "DITERIMA").length} Dokumen`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Uji Fisik & Mikrobiologi", isPositive: false }}
          variant="warning"
        />
        <DnaStatCard
          label="Kembali ke Stok Baik"
          value={`${data.filter((d) => d.status === "DIKEMBALIKAN_KE_STOK").length} Selesai`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Barang Layak Restock", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Scrap Pemusnahan"
          value={`${data.filter((d) => d.status === "SCRAP_DIMUSNAHKAN").length} Berita Acara`}
          icon={<Package className="w-4 h-4" />}
          delta={{ value: "Barang Rusak Permanen", isPositive: false }}
          variant="danger"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Barang Masuk Retur Penjualan"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="w-64">
            <DnaInput
              placeholder="Cari kode retur, pelanggan, pembuat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Kode Retur</th>
                <th className="px-4 py-3">Tanggal Retur</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Pembuat</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600">{item.returnCode}</td>
                  <td className="px-4 py-3 text-slate-600">{item.returnDate}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">{item.creatorName}</td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge
                      variant={
                        item.status === "DIKEMBALIKAN_KE_STOK"
                          ? "emerald"
                          : item.status === "QC_INSPECTION"
                          ? "amber"
                          : item.status === "DITERIMA"
                          ? "blue"
                          : "danger"
                      }
                    >
                      {item.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedRecord(item)}
                    >
                      Lihat
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Penerimaan Retur: ${selectedRecord?.returnCode || ""}`}
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Kode Retur</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.returnCode}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Tanggal Penerimaan Fisik</span>
                <span className="font-medium text-slate-800">{selectedRecord.returnDate}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Pelanggan</span>
                <span className="font-semibold text-slate-900">{selectedRecord.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Petugas Pembuat</span>
                <span className="font-medium text-slate-800">{selectedRecord.creatorName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Qty Diterima</span>
                <span className="font-mono font-bold text-blue-600">{selectedRecord.itemsCount} Pcs</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status Karantina/Gudang</span>
                <DnaBadge
                  variant={
                    selectedRecord.status === "DIKEMBALIKAN_KE_STOK"
                      ? "emerald"
                      : selectedRecord.status === "QC_INSPECTION"
                      ? "amber"
                      : selectedRecord.status === "DITERIMA"
                      ? "blue"
                      : "danger"
                  }
                >
                  {selectedRecord.status.replace(/_/g, " ")}
                </DnaBadge>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Catatan Fisik Penerimaan</span>
              <p className="text-slate-700 mt-1">{selectedRecord.notes || "—"}</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
