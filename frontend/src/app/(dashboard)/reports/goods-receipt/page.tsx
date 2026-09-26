"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { DnaCell } from "@/components/dna/cells/DnaCell";
import { PackageCheck, AlertTriangle, Gift, Calendar, FileSpreadsheet, Eye, Printer } from "lucide-react";

interface GoodsReceiptReportItem {
  id: string;
  date: string;
  grnNumber: string;
  poNumber: string;
  status: string;
  materialName: string;
  qtyReceived: number;
  qtyGood: number;
  qtyReject: number;
  qtyFree: number;
  unit: string;
}

export default function GoodsReceiptReportPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<GoodsReceiptReportItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/purchase/goods-receipts");
      return res.data;
    },
  });

  const rows: GoodsReceiptReportItem[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const out: GoodsReceiptReportItem[] = [];
    for (const inbound of raw) {
      const date = inbound.receivedAt ? String(inbound.receivedAt).split("T")[0] : "-";
      for (const item of inbound.items || []) {
        out.push({
          id: item.id,
          date,
          grnNumber: inbound.inboundNumber || "-",
          poNumber: inbound.po?.poNumber || "-",
          status: inbound.status || "PENDING",
          materialName: item.material?.name || "-",
          qtyReceived: Number(item.qtyActual ?? 0),
          qtyGood: Number(item.qtyGood ?? 0),
          qtyReject: Number(item.qtyReject ?? 0),
          qtyFree: Number(item.qtyFree ?? 0),
          unit: item.material?.unit || "",
        });
      }
    }
    return out;
  }, [data]);

  const filteredData = rows.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.grnNumber.toLowerCase().includes(q) ||
      item.poNumber.toLowerCase().includes(q) ||
      item.materialName.toLowerCase().includes(q);
    const matchDate = !dateFilter || item.date === dateFilter;
    return matchSearch && matchDate;
  });

  const totalDiterima = filteredData.reduce((acc, curr) => acc + curr.qtyReceived, 0);
  const totalBagus = filteredData.reduce((acc, curr) => acc + curr.qtyGood, 0);
  const totalReject = filteredData.reduce((acc, curr) => acc + curr.qtyReject, 0);
  const totalFree = filteredData.reduce((acc, curr) => acc + curr.qtyFree, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Report Penerimaan Barang (GRN 3-Pilar)"
        description="Laporan audit fisik logistik inbound gudang maklon memisahkan kondisi Bagus (layak bayar), Reject (retur), dan Free sample."
        actions={
          <div className="flex gap-2">
            <DnaButton variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak Laporan
            </DnaButton>
            <DnaButton variant="primary">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Ekspor Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Fisik Diterima"
          value={totalDiterima.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Total kuantitas item masuk"
        />
        <DnaStatCard
          label="Kondisi Bagus (Acc Pay)"
          value={totalBagus.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Layak masuk stok & dibayar"
        />
        <DnaStatCard
          label="Kondisi Reject (No Pay)"
          value={totalReject.toLocaleString("id-ID")}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={totalReject > 0 ? "warning" : "default"}
          subtext="Rusak / cacat / retur supplier"
        />
        <DnaStatCard
          label="Barang Gratis / Free"
          value={totalFree.toLocaleString("id-ID")}
          icon={<Gift className="w-5 h-5 text-amber-600" />}
          variant="warning"
          subtext="Sample gratis & toleransi bonus"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery: search,
          onSearchChange: setSearch,
          searchPlaceholder: "Cari No. GRN, PO, Bahan...",
          extraActions: (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[110px]">Tanggal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[150px]">No. GRN</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. PO</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Nama Barang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Qty Diterima</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[90px]">Bagus</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[90px]">Reject</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[90px]">Free</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px] text-center w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                    Memuat data penerimaan barang...
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-12 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan penerimaan barang dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                    <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data penerimaan barang yang sesuai kriteria filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((row) => (
                  <DnaTableRow
                    key={row.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    <DnaTd className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {row.date}
                    </DnaTd>

                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={row.grnNumber} />
                    </DnaTd>

                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={row.poNumber} />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-slate-900 truncate max-w-[220px]">
                      {row.materialName}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.qtyReceived}
                        unit={row.unit}
                      />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.qtyGood}
                        colorClass="text-emerald-700 font-semibold"
                      />
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {row.qtyReject > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {row.qtyReject.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-right">
                      {row.qtyFree > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          +{row.qtyFree.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </DnaTd>

                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge
                        variant={
                          row.status === "APPROVED"
                            ? "success"
                            : row.status === "REJECTED"
                            ? "critical"
                            : "warning"
                        }
                      >
                        {row.status}
                      </DnaBadge>
                    </DnaTd>

                    <DnaTd className="px-4 py-2 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(row)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-800">
                Detail Bukti Audit GRN: {selectedItem.grnNumber}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">No. Purchase Order:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Penerimaan:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Dokumen:</span>
                  <span className="font-semibold text-slate-800">{selectedItem.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Fisik:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedItem.qtyReceived.toLocaleString("id-ID")} {selectedItem.unit}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-slate-800">{selectedItem.materialName}</div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                    <span className="text-emerald-700 block font-semibold">Bagus</span>
                    <span className="text-sm font-bold text-emerald-800">{selectedItem.qtyGood} {selectedItem.unit}</span>
                  </div>
                  <div className="bg-rose-50 p-2 rounded border border-rose-100">
                    <span className="text-rose-700 block font-semibold">Reject</span>
                    <span className="text-sm font-bold text-rose-800">{selectedItem.qtyReject} {selectedItem.unit}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-100">
                    <span className="text-amber-700 block font-semibold">Free</span>
                    <span className="text-sm font-bold text-amber-800">{selectedItem.qtyFree} {selectedItem.unit}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 bg-slate-50 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedItem(null)}>
                Tutup
              </DnaButton>
              <DnaButton variant="primary" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />
                Cetak Lembar GRN
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}