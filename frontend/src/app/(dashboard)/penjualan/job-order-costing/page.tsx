"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaCell,
  DnaDetailDrawer,
  formatRupiah,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import { Calculator, CheckCircle2, Clock, RefreshCw, FileSpreadsheet } from "lucide-react";

interface JobOrderCostRecord {
  id: string;
  joNo: string;
  description: string;
  totalCost: number;
  totalRevenue: number;
  recordedAt: string;
  closed: boolean;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default function JobOrderCostingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState<JobOrderCostRecord | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<JobOrderCostRecord[]>({
    queryKey: ["finance-job-order-costings"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/job-order-costings");
        const list = res.data?.data || res.data || [];
        if (!Array.isArray(list)) return [];
        return list.map(
          (item: any): JobOrderCostRecord => ({
            id: item.id,
            joNo: item.jobOrderNumber || "—",
            description: item.description || "—",
            totalCost: Number(item.totalCost ?? 0),
            totalRevenue: Number(item.totalRevenue ?? 0),
            recordedAt: formatDateTime(item.recordedAt),
            closed: Boolean(item.closedAt),
          })
        );
      } catch {
        return [];
      }
    },
  });

  const filtered = data.filter((d) => {
    const matchSearch =
      d.joNo.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CLOSED" ? d.closed : !d.closed);
    return matchSearch && matchStatus;
  });

  const countAll = data.length;
  const countClosed = data.filter((d) => d.closed).length;
  const countOpen = data.filter((d) => !d.closed).length;
  const totalCostAll = data.reduce((acc, c) => acc + c.totalCost, 0);
  const totalRevenueAll = data.reduce((acc, c) => acc + c.totalRevenue, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
        <DnaPageHeader
          title="JOB ORDER COSTING (COST ROLL-UP MATRIX)"
          description="Kalkulasi HPP akumulatif per batch produksi maklon kosmetik."
        />
        <DnaLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
        <DnaPageHeader
          title="JOB ORDER COSTING (COST ROLL-UP MATRIX)"
          description="Kalkulasi HPP akumulatif per batch produksi maklon kosmetik."
        />
        <DnaErrorState
          title="Gagal Memuat Job Order Costing"
          message="Tidak dapat mengambil data dari /finance/job-order-costings."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="JOB ORDER COSTING (COST ROLL-UP MATRIX)"
        description="Kalkulasi HPP akumulatif per batch produksi maklon kosmetik (total biaya tercatat dan status posting ke akuntansi)."
        tabs={[
          { key: "ALL", label: "Semua Status", count: countAll },
          { key: "OPEN", label: "Berjalan (Open)", count: countOpen },
          { key: "CLOSED", label: "Selesai (Closed)", count: countClosed },
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
            subtitle: `${countAll} Job Order`,
            trend: "Estimasi HPP",
            icon: Calculator,
            variant: "blue",
          },
          {
            label: "Job Order Berjalan (Open)",
            value: `${countOpen} JO`,
            subtitle: "Belum diposting closing",
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
            label: "Total Revenue Tercatat",
            value: formatRupiah(totalRevenueAll),
            subtitle: "Akumulasi totalRevenue",
            trend: "Nilai Order",
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
          searchPlaceholder: "Cari nomor JO atau deskripsi...",
          searchValue: search,
          onSearchChange: setSearch,
        }}
      >
        {data.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Job Order Costing"
            description="Tidak ada catatan job order costing yang tercatat di sistem."
          />
        ) : (
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <DnaTh className="py-3 px-3 w-[22%]">No. JO & Status</DnaTh>
                  <DnaTh className="py-3 px-3 w-[34%]">Deskripsi</DnaTh>
                  <DnaTh className="py-3 px-3 w-[16%]">Tanggal Tercatat</DnaTh>
                  <DnaTh className="py-3 px-3 w-[14%] text-right">Revenue</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-right">Total Biaya</DnaTh>
                  <DnaTh className="py-3 px-3 w-[8%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filtered.map((item) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-3">
                      <p className="tabular-nums font-bold text-blue-600 truncate">{item.joNo}</p>
                      <div className="mt-0.5">
                        <DnaCell.Badge
                          status={item.closed ? "success" : "warning"}
                          label={item.closed ? "CLOSED" : "OPEN"}
                        />
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-3">
                      <p className="font-medium text-slate-800 truncate">{item.description}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 tabular-nums text-slate-600 text-[12px]">
                      {item.recordedAt}
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-right tabular-nums text-slate-700">
                      {formatRupiah(item.totalRevenue)}
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-right">
                      <p className="tabular-nums font-bold text-slate-900">{formatRupiah(item.totalCost)}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(item)}
                        >
                          Detail
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>

      {/* Drawer Detail */}
      <DnaDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.joNo || "Rincian Job Order Costing"}
        subtitle={selectedRecord?.description}
        badge={
          selectedRecord ? (
            <DnaCell.Badge
              status={selectedRecord.closed ? "success" : "warning"}
              label={selectedRecord.closed ? "CLOSED" : "OPEN"}
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">No. Job Order</span>
                <span className="tabular-nums font-semibold text-slate-900 text-xs">{selectedRecord.joNo}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Tercatat</span>
                <span className="tabular-nums font-bold text-slate-800 text-xs">{selectedRecord.recordedAt}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deskripsi</span>
                <span className="text-slate-800 text-xs">{selectedRecord.description}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="p-2.5 text-left">Ringkasan Nilai</DnaTh>
                    <DnaTh className="p-2.5 text-right">Nominal (Rp)</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  <DnaTableRow>
                    <DnaTd className="p-2.5 font-medium text-slate-800">Total Biaya Produksi (HPP)</DnaTd>
                    <DnaTd className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(selectedRecord.totalCost)}
                    </DnaTd>
                  </DnaTableRow>
                  <DnaTableRow>
                    <DnaTd className="p-2.5 font-medium text-slate-800">Total Revenue</DnaTd>
                    <DnaTd className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(selectedRecord.totalRevenue)}
                    </DnaTd>
                  </DnaTableRow>
                  <DnaTableRow className="bg-blue-50/70 font-bold text-blue-900">
                    <DnaTd className="p-2.5">Laba Kotor</DnaTd>
                    <DnaTd className="p-2.5 text-right text-blue-800">
                      {formatRupiah(selectedRecord.totalRevenue - selectedRecord.totalCost)}
                    </DnaTd>
                  </DnaTableRow>
                </DnaTableBody>
              </DnaTable>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Catatan: rincian komponen biaya (bahan baku, tenaga kerja, overhead, kemasan, scrap)
              belum tersedia pada endpoint <code className="font-mono">/finance/job-order-costings</code> —
              model hanya menyimpan total biaya dan total revenue per job order.
            </p>
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}