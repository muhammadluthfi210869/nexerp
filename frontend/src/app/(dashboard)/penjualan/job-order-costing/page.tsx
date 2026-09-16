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
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Calculator, Eye, CheckCircle2, Clock, Search, RefreshCw, FileSpreadsheet } from "lucide-react";

interface JobOrderCostRecord {
  id: string;
  joNo: string;
  clientBrand: string;
  product: string;
  qtyOutput: number;
  materialCost: number;
  laborCost: number;
  overheadAllocated: number;
  packagingCost: number;
  scrapCost: number;
  totalCost: number;
  costPerUnit: number;
  status: "OPEN" | "WIP" | "CLOSED";
}

const SAMPLE_JOB_ORDERS: JobOrderCostRecord[] = [
  {
    id: "jo-1",
    joNo: "JO-2026-001",
    clientBrand: "PT Cantika (C-Jelita)",
    product: "Brightening Niacinamide Serum 30ml",
    qtyOutput: 10000,
    materialCost: 45000000,
    laborCost: 12000000,
    overheadAllocated: 8500000,
    packagingCost: 15000000,
    scrapCost: 1200000,
    totalCost: 81700000,
    costPerUnit: 8170,
    status: "WIP"
  },
  {
    id: "jo-2",
    joNo: "JO-2026-002",
    clientBrand: "M. Setyo (Anasera)",
    product: "Massage Cream Herbal 100g",
    qtyOutput: 500,
    materialCost: 6500000,
    laborCost: 2000000,
    overheadAllocated: 1200000,
    packagingCost: 2500000,
    scrapCost: 200000,
    totalCost: 12400000,
    costPerUnit: 24800,
    status: "CLOSED"
  },
  {
    id: "jo-3",
    joNo: "JO-2026-003",
    clientBrand: "Rizka (Skin Haven)",
    product: "Soothing Gel Aloe 50g",
    qtyOutput: 1000,
    materialCost: 8000000,
    laborCost: 2500000,
    overheadAllocated: 1800000,
    packagingCost: 3200000,
    scrapCost: 300000,
    totalCost: 15800000,
    costPerUnit: 15800,
    status: "OPEN"
  },
  {
    id: "jo-4",
    joNo: "JO-2026-004",
    clientBrand: "Farah Derma Clinic",
    product: "Acne Day Cream SPF 30 30g",
    qtyOutput: 3000,
    materialCost: 22000000,
    laborCost: 5500000,
    overheadAllocated: 4200000,
    packagingCost: 7500000,
    scrapCost: 800000,
    totalCost: 40000000,
    costPerUnit: 13333,
    status: "WIP"
  }
];

export default function JobOrderCostingPage() {
  const [data, setData] = useState<JobOrderCostRecord[]>(SAMPLE_JOB_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState<JobOrderCostRecord | null>(null);

  const filtered = data.filter((d) => {
    const matchSearch =
      d.joNo.toLowerCase().includes(search.toLowerCase()) ||
      d.clientBrand.toLowerCase().includes(search.toLowerCase()) ||
      d.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCostAll = data.reduce((acc, c) => acc + c.totalCost, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Job Order Costing (Cost Roll-Up Matrix)"
        subtitle="Kalkulasi HPP akumulatif per batch produksi (Bahan Baku, Tenaga Kerja Langsung, Overhead Pabrik, Kemasan, dan Scrap)"
        breadcrumbs={[{ label: "Pra Produksi", href: "/production" }, { label: "Job Order Costing" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Biaya Akumulasi"
          value={formatRupiah(totalCostAll)}
          icon={<Calculator className="w-4 h-4" />}
          delta={{ value: `${data.length} Job Order Aktif`, isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Job Order Berjalan (WIP)"
          value={`${data.filter((d) => d.status === "WIP").length} JO`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Sedang Mixing / Filling", isPositive: true }}
          variant="warning"
        />
        <DnaStatCard
          label="Job Order Closed (COGS)"
          value={`${data.filter((d) => d.status === "CLOSED").length} JO`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Selesai Posting ke Akuntansi", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Job Order Baru (Open)"
          value={`${data.filter((d) => d.status === "OPEN").length} JO`}
          icon={<RefreshCw className="w-4 h-4" />}
          delta={{ value: "Menunggu Mulai Produksi", isPositive: false }}
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Cost Roll-Up Matrix per Job Order"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari JO, brand, produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua Status JO</option>
              <option value="OPEN">OPEN</option>
              <option value="WIP">WIP (Dalam Proses)</option>
              <option value="CLOSED">CLOSED (Selesai COGS)</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-3">Job Order No</th>
                <th className="px-3 py-3">Client / Brand</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-right">Qty Output</th>
                <th className="px-3 py-3 text-right">Material Cost</th>
                <th className="px-3 py-3 text-right">Labor Cost</th>
                <th className="px-3 py-3 text-right">Overhead Allocated</th>
                <th className="px-3 py-3 text-right">Packaging Cost</th>
                <th className="px-3 py-3 text-right">Scrap/Wastage Cost</th>
                <th className="px-3 py-3 text-right">Total Cost</th>
                <th className="px-3 py-3 text-right">Cost/Unit</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3 font-mono font-semibold text-blue-600 whitespace-nowrap">{item.joNo}</td>
                  <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">{item.clientBrand}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-xs truncate">{item.product}</td>
                  <td className="px-3 py-3 text-right font-mono">{item.qtyOutput.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">{formatRupiah(item.materialCost)}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">{formatRupiah(item.laborCost)}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">{formatRupiah(item.overheadAllocated)}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700">{formatRupiah(item.packagingCost)}</td>
                  <td className="px-3 py-3 text-right font-mono text-rose-600">{formatRupiah(item.scrapCost)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">{formatRupiah(item.totalCost)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-blue-600">{formatRupiah(item.costPerUnit)}</td>
                  <td className="px-3 py-3 text-center">
                    <DnaBadge
                      variant={
                        item.status === "CLOSED"
                          ? "emerald"
                          : item.status === "WIP"
                          ? "amber"
                          : "blue"
                      }
                    >
                      {item.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedRecord(item)}
                    >
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Rollup */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Rincian Cost Roll-Up: ${selectedRecord?.joNo || ""}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Job Order No</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.joNo}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Klien / Brand</span>
                <span className="font-semibold text-slate-900">{selectedRecord.clientBrand}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Produk</span>
                <span className="text-slate-800">{selectedRecord.product}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Target Output</span>
                <span className="font-mono font-bold text-blue-600">{selectedRecord.qtyOutput.toLocaleString("id-ID")} pcs</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-left">Komponen Biaya HPP</th>
                    <th className="p-2.5 text-right">Nominal Subtotal (Rp)</th>
                    <th className="p-2.5 text-right">Proporsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Biaya Bahan Baku (Raw Material)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(selectedRecord.materialCost)}</td>
                    <td className="p-2.5 text-right text-slate-500">{((selectedRecord.materialCost / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Biaya Tenaga Kerja Langsung (Direct Labor)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(selectedRecord.laborCost)}</td>
                    <td className="p-2.5 text-right text-slate-500">{((selectedRecord.laborCost / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Biaya Overhead Dialokasikan (BOH Factory)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(selectedRecord.overheadAllocated)}</td>
                    <td className="p-2.5 text-right text-slate-500">{((selectedRecord.overheadAllocated / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Biaya Bahan Kemas (Packaging Primary & Secondary)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(selectedRecord.packagingCost)}</td>
                    <td className="p-2.5 text-right text-slate-500">{((selectedRecord.packagingCost / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-rose-600">Scrap & Biaya Pembuangan/Reject</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{formatRupiah(selectedRecord.scrapCost)}</td>
                    <td className="p-2.5 text-right text-rose-500">{((selectedRecord.scrapCost / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5 text-slate-900">Total Akumulasi Biaya Produksi (HPP)</td>
                    <td className="p-2.5 text-right text-slate-900">{formatRupiah(selectedRecord.totalCost)}</td>
                    <td className="p-2.5 text-right text-slate-900">100.0%</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold text-blue-800">
                    <td className="p-2.5">HPP per Satuan (Cost / Unit)</td>
                    <td className="p-2.5 text-right text-blue-800">{formatRupiah(selectedRecord.costPerUnit)} / pcs</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                </tbody>
              </table>
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
