"use client";

import React, { useState } from "react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaCell,
  DnaDetailDrawer,
  formatRupiah,
} from "@/components/dna";
import { Calculator, CheckCircle2, Clock, RefreshCw, FileSpreadsheet } from "lucide-react";

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
  const [data] = useState<JobOrderCostRecord[]>(SAMPLE_JOB_ORDERS);
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

  const countAll = data.length;
  const countWip = data.filter((d) => d.status === "WIP").length;
  const countClosed = data.filter((d) => d.status === "CLOSED").length;
  const countOpen = data.filter((d) => d.status === "OPEN").length;
  const totalCostAll = data.reduce((acc, c) => acc + c.totalCost, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="JOB ORDER COSTING (COST ROLL-UP MATRIX)"
        description="Kalkulasi HPP akumulatif per batch produksi maklon kosmetik (Bahan Baku, Tenaga Kerja Langsung, Overhead Pabrik, Kemasan, dan Scrap)."
        tabs={[
          { key: "ALL", label: "Semua Status", count: countAll },
          { key: "WIP", label: "Dalam Proses (WIP)", count: countWip },
          { key: "CLOSED", label: "Selesai (COGS)", count: countClosed },
          { key: "OPEN", label: "Baru (Open)", count: countOpen },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Biaya Akumulasi",
            value: formatRupiah(totalCostAll),
            subtitle: `${countAll} Job Order aktif`,
            trend: "Estimasi HPP",
            icon: Calculator,
            variant: "blue",
          },
          {
            label: "Job Order Berjalan (WIP)",
            value: `${countWip} JO`,
            subtitle: "Sedang mixing / filling",
            trend: "Produksi Aktif",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Job Order Closed (COGS)",
            value: `${countClosed} JO`,
            subtitle: "Selesai posting ke akuntansi",
            trend: "Realized COGS",
            icon: CheckCircle2,
            variant: "emerald",
          },
          {
            label: "Job Order Baru (Open)",
            value: `${countOpen} JO`,
            subtitle: "Menunggu jadwal batch",
            trend: "Antrean Batch",
            icon: RefreshCw,
            variant: "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        count={filtered.length}
        totalItems={data.length}
        toolbarProps={{
          searchPlaceholder: "Cari nomor JO, brand, atau produk...",
          searchValue: search,
          onSearchChange: setSearch,
        }}
      >
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-[18%]">No. JO & Status</th>
                <th className="py-3 px-3 w-[24%]">Klien & Produk</th>
                <th className="py-3 px-3 w-[16%]">Output & HPP/Unit</th>
                <th className="py-3 px-3 w-[18%] text-right">Bahan & Kemasan</th>
                <th className="py-3 px-3 w-[14%] text-right">Total Biaya</th>
                <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-mono font-bold text-blue-600 truncate">{item.joNo}</p>
                    <div className="mt-0.5">
                      <DnaCell.Badge
                        status={
                          item.status === "CLOSED"
                            ? "success"
                            : item.status === "WIP"
                            ? "warning"
                            : "info"
                        }
                        label={item.status}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 truncate">{item.clientBrand}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.product}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-mono font-bold text-slate-800">{item.qtyOutput.toLocaleString("id-ID")} pcs</p>
                    <p className="text-[10px] font-mono font-bold text-blue-600">{formatRupiah(item.costPerUnit)}/pcs</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-mono text-slate-800">Mat: {formatRupiah(item.materialCost)}</p>
                    <p className="text-[10px] font-mono text-slate-400">Pkg: {formatRupiah(item.packagingCost)}</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-mono font-bold text-slate-900">{formatRupiah(item.totalCost)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Roll-Up</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(item)}
                      >
                        Detail
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Drawer Detail Rollup */}
      <DnaDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.joNo || "Rincian Cost Roll-Up"}
        subtitle={selectedRecord ? `${selectedRecord.clientBrand} • ${selectedRecord.product}` : undefined}
        badge={
          selectedRecord ? (
            <DnaCell.Badge
              status={
                selectedRecord.status === "CLOSED"
                  ? "success"
                  : selectedRecord.status === "WIP"
                  ? "warning"
                  : "info"
              }
              label={selectedRecord.status}
            />
          ) : undefined
        }
        actions={
          selectedRecord ? (
            <div className="flex items-center justify-end w-full">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Klien / Brand</span>
                <span className="font-semibold text-slate-900 text-xs">{selectedRecord.clientBrand}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Output</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedRecord.qtyOutput.toLocaleString("id-ID")} pcs</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nama Produk</span>
                <span className="text-slate-800 text-xs">{selectedRecord.product}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">HPP per Satuan</span>
                <span className="font-mono font-bold text-emerald-600 text-xs">{formatRupiah(selectedRecord.costPerUnit)} / pcs</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Komponen Biaya HPP</th>
                    <th className="p-2.5 text-right">Nominal (Rp)</th>
                    <th className="p-2.5 text-right">Proporsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
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
                    <td className="p-2.5 font-medium text-rose-600">Scrap & Biaya Reject</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{formatRupiah(selectedRecord.scrapCost)}</td>
                    <td className="p-2.5 text-right text-rose-500">{((selectedRecord.scrapCost / selectedRecord.totalCost) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5 text-slate-900">Total Akumulasi Biaya Produksi (HPP)</td>
                    <td className="p-2.5 text-right text-slate-900">{formatRupiah(selectedRecord.totalCost)}</td>
                    <td className="p-2.5 text-right text-slate-900">100.0%</td>
                  </tr>
                  <tr className="bg-blue-50/70 font-bold text-blue-900">
                    <td className="p-2.5">HPP per Satuan (Cost / Unit)</td>
                    <td className="p-2.5 text-right text-blue-800">{formatRupiah(selectedRecord.costPerUnit)} / pcs</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}
