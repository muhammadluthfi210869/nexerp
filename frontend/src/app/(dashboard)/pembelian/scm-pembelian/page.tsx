"use client";

/**
 * Daftar Pembelian & Pengadaan (Purchase Orders / PO List)
 * Screen ID: SCR-037 & SCR-175
 *
 * Sesuai Spesifikasi Visual DNA Golden Reference:
 * - DnaPageContainer, DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaDetailDrawer
 * - 3 Pilar Fisik Penerimaan: Kuantitas Bagus (Real Stok), Kuantitas Cacat/Reject, Kuantitas Free (Bonus HPP Rp 0)
 * - Diskon dalam Rupiah (Rp) dan Biaya Ongkir tercatat terpisah
 * - 6 kolom ramping tanpa scroll horizontal, 2 baris per sel
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  Eye,
  FileCheck,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

export interface POItemDetail {
  id: string;
  materialCode: string;
  materialName: string;
  category: "Bahan Baku" | "Kemas Primer" | "Kemas Sekunder" | "Perlengkapan";
  orderedQty: number;
  goodQty: number;     // Pilar 1: Bagus (Real Stok / Bayar)
  rejectQty: number;   // Pilar 2: Reject (Tidak Bayar / Retur)
  freeQty: number;     // Pilar 3: Free / Bonus (HPP Rp 0)
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrderRecord {
  id: string;
  poCode: string;
  date: string;
  supplierName: string;
  supplierCategory: "Bahan Baku" | "Bahan Kemas" | "Bahan Pembantu";
  warehouseTarget: string;
  deadlineDate: string;
  creatorName: string;
  creatorSignatureUrl?: string;
  isSignedDigitally: boolean;
  subtotalAmount: number;
  discountRp: number;
  shippingCostRp: number;
  totalAmount: number;
  paymentStatus: "UNPAID" | "DP_PAID" | "PAID";
  receivingStatus: "PENDING_INBOUND" | "PARTIAL_RECEIVED" | "FULLY_RECEIVED";
  items: POItemDetail[];
  notes?: string;
}

export default function PurchaseOrdersModernPage() {
  const router = useRouter();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderRecord | null>(null);

  // Live query from backend /scm/purchase-orders
  const {
    data: rawPos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["scm-purchase-orders-list"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const poList: PurchaseOrderRecord[] = useMemo(() => {
    return (rawPos as any[]).map((po) => {
      const subtotal = Number(po.subtotal ?? po.totalAmount ?? 0);
      const discount = Number(po.discountAmount ?? 0);
      const shipping = Number(po.shippingCost ?? 0);
      const grandTotal = Number(po.grandTotal ?? po.totalAmount ?? subtotal - discount + shipping);

      return {
        id: po.id,
        poCode: po.poNumber || po.id,
        date: po.createdAt ? new Date(po.createdAt).toLocaleDateString("id-ID") : "-",
        supplierName: po.supplier?.name || po.vendor?.name || "Supplier Rekanan",
        supplierCategory: "Bahan Baku",
        warehouseTarget: po.warehouse?.name || "Gudang Utama",
        deadlineDate: po.dueDate ? new Date(po.dueDate).toLocaleDateString("id-ID") : "-",
        creatorName: po.creator?.name || "Admin Procurement",
        isSignedDigitally: true,
        subtotalAmount: subtotal,
        discountRp: discount,
        shippingCostRp: shipping,
        totalAmount: grandTotal,
        paymentStatus: (po.paymentStatus as any) || (po.status === "PAID" ? "PAID" : "UNPAID"),
        receivingStatus:
          po.status === "RECEIVED"
            ? "FULLY_RECEIVED"
            : po.status === "PARTIALLY_RECEIVED"
            ? "PARTIAL_RECEIVED"
            : "PENDING_INBOUND",
        items: (po.items || []).map((it: any) => ({
          id: it.id,
          materialCode: it.material?.code || it.materialId || "-",
          materialName: it.material?.name || "Item Material",
          category: "Bahan Baku",
          orderedQty: Number(it.quantity ?? it.qty ?? 0),
          goodQty: Number(it.qtyGood ?? it.quantity ?? 0),
          rejectQty: Number(it.qtyReject ?? 0),
          freeQty: Number(it.qtyFree ?? 0),
          unit: it.material?.unit || "kg",
          unitPrice: Number(it.unitPrice ?? it.price ?? 0),
          subtotal: Number(it.totalPrice ?? (it.quantity ?? 0) * (it.unitPrice ?? 0)),
        })),
        notes: po.notes,
      };
    });
  }, [rawPos]);

  // Filters
  const filteredPoList = useMemo(() => {
    return poList.filter((po) => {
      if (activeTab === "pending" && po.receivingStatus !== "PENDING_INBOUND") return false;
      if (activeTab === "partial" && po.receivingStatus !== "PARTIAL_RECEIVED") return false;
      if (activeTab === "completed" && po.receivingStatus !== "FULLY_RECEIVED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        po.poCode.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.creatorName.toLowerCase().includes(q) ||
        po.warehouseTarget.toLowerCase().includes(q) ||
        po.items.some((it) => it.materialName.toLowerCase().includes(q) || it.materialCode.toLowerCase().includes(q))
      );
    });
  }, [poList, activeTab, searchQuery]);

  // KPIs
  const totalPoValue = useMemo(() => poList.reduce((sum, p) => sum + p.totalAmount, 0), [poList]);
  const pendingInboundCount = useMemo(
    () => poList.filter((p) => p.receivingStatus === "PENDING_INBOUND").length,
    [poList]
  );
  const fullyReceivedCount = useMemo(
    () => poList.filter((p) => p.receivingStatus === "FULLY_RECEIVED").length,
    [poList]
  );

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Daftar Pembelian & Pengadaan (Purchase Orders / PO)"
        description="Monitoring Seluruh Pesanan Pembelian Bahan Baku & Kemas Pabrik (3 Pilar Fisik: Bagus, Reject, Free • Digital Signature • OTD Tracking)"
        tabs={[
          { key: "all", label: "Semua PO", count: poList.length },
          { key: "pending", label: "Menunggu Inbound", count: pendingInboundCount },
          { key: "partial", label: "Diterima Sebagian", count: poList.filter((p) => p.receivingStatus === "PARTIAL_RECEIVED").length },
          { key: "completed", label: "Selesai Inbound", count: fullyReceivedCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/purchase/create")}
          >
            + Buat Pembelian (PO)
          </DnaButton>
        }
      />

      {/* Metric Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Nilai PO Aktif"
          value={formatCurrency(totalPoValue)}
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "Akumulasi belanja", isPositive: true }}
        />
        <DnaStatCard
          label="Total Order Pembelian"
          value={`${poList.length} PO`}
          icon={<Package className="w-5 h-5 text-slate-700" />}
        />
        <DnaStatCard
          label="Menunggu Inbound"
          value={`${pendingInboundCount} PO`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={pendingInboundCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Selesai Penerimaan"
          value={`${fullyReceivedCount} PO`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* PO Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Purchase Order"
            message="Terjadi kesalahan saat memuat data PO dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Cari kode PO, supplier, gudang, material...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. Purchase Order</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[150px]">Gudang Tujuan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px]">Deadline Tiba</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-center">Status TTD</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Total Nilai</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-center">Status Inbound</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredPoList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Purchase Order"
                        description="Tidak ada data purchase order pada filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredPoList.map((po) => (
                    <DnaTableRow
                      key={po.id}
                      onClick={() => setSelectedPo(po)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={po.poCode} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={po.date} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{po.supplierName}</span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={po.warehouseTarget} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 tabular-nums text-[11.5px] text-slate-700">
                        {po.deadlineDate}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {po.isSignedDigitally ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <FileCheck className="w-3 h-3" />
                            TTD Valid
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum TTD</span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={po.totalAmount} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <DnaBadge
                          variant={
                            po.paymentStatus === "PAID"
                              ? "success"
                              : po.paymentStatus === "DP_PAID"
                              ? "info"
                              : "critical"
                          }
                        >
                          {po.paymentStatus === "PAID"
                            ? "Lunas"
                            : po.paymentStatus === "DP_PAID"
                            ? "DP Lunas"
                            : "Belum Bayar"}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            po.receivingStatus === "FULLY_RECEIVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : po.receivingStatus === "PARTIAL_RECEIVED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {po.receivingStatus === "FULLY_RECEIVED"
                            ? "Inbound 100%"
                            : po.receivingStatus === "PARTIAL_RECEIVED"
                            ? "Inbound Parsial"
                            : "Menunggu Inbound"}
                        </span>
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => setSelectedPo(po)}
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for PO & 3-Pilar Gudang */}
      <DnaDetailDrawer
        isOpen={!!selectedPo}
        onClose={() => setSelectedPo(null)}
        title={selectedPo?.poCode || "Rincian Purchase Order"}
        subtitle={selectedPo ? `Supplier: ${selectedPo.supplierName} • Gudang: ${selectedPo.warehouseTarget}` : undefined}
        badge={
          selectedPo ? (
            <DnaBadge variant={selectedPo.paymentStatus === "PAID" ? "success" : "warning"}>
              {selectedPo.paymentStatus}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              Dibuat oleh: <span className="font-semibold text-slate-700">{selectedPo?.creatorName}</span>
            </div>
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedPo(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedPo && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Supplier Rekanan</span>
                <span className="font-bold text-slate-900 text-sm block">{selectedPo.supplierName}</span>
                <span className="text-slate-500 text-[11px]">
                  Kategori: {selectedPo.supplierCategory} • Gudang: {selectedPo.warehouseTarget}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Grand Total PO</span>
                <span className="text-base font-bold text-blue-600 tabular-nums block">
                  {formatCurrency(selectedPo.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Tgl Terbit PO</span>
                <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPo.date}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Target Deadline Tiba</span>
                <span className="font-bold text-rose-600 tabular-nums text-xs">{selectedPo.deadlineDate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">PIC & Digital Sign</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {selectedPo.creatorName}
                </span>
              </div>
            </div>

            {/* Sub-tabel Item dengan 3 Pilar Fisik */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rincian 3 Pilar Fisik Penerimaan (Bagus / Reject / Free)
              </h4>
              <div className="overflow-x-auto">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <DnaTh className="py-2 px-2">#</DnaTh>
                      <DnaTh className="py-2 px-2">KODE</DnaTh>
                      <DnaTh className="py-2 px-3">NAMA BAHAN</DnaTh>
                      <DnaTh className="py-2 px-2 text-right">ORDER</DnaTh>
                      <DnaTh className="py-2 px-2 text-right text-emerald-700">BAGUS</DnaTh>
                      <DnaTh className="py-2 px-2 text-right text-rose-600">REJECT</DnaTh>
                      <DnaTh className="py-2 px-2 text-right text-amber-600">FREE</DnaTh>
                      <DnaTh className="py-2 px-3 text-right">SUBTOTAL</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedPo.items.map((it, i) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-2 px-2 text-slate-400 font-bold">{i + 1}</DnaTd>
                        <DnaTd className="py-2 px-2 tabular-nums text-slate-600 text-[11px]">{it.materialCode}</DnaTd>
                        <DnaTd className="py-2 px-3 font-semibold text-slate-900">{it.materialName}</DnaTd>
                        <DnaTd className="py-2 px-2 text-right font-bold text-slate-800">
                          {it.orderedQty} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2 px-2 text-right font-bold text-emerald-700 bg-emerald-50/50">
                          {it.goodQty}
                        </DnaTd>
                        <DnaTd className="py-2 px-2 text-right font-bold text-rose-600 bg-rose-50/50">
                          {it.rejectQty}
                        </DnaTd>
                        <DnaTd className="py-2 px-2 text-right font-bold text-amber-600 bg-amber-50/50">
                          {it.freeQty}
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right font-bold text-blue-600 tabular-nums text-[11px]">
                          {formatCurrency(it.subtotal)}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang:</span>
                <span className="tabular-nums">{formatCurrency(selectedPo.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Diskon Pembelian (Rp):</span>
                <span className="tabular-nums">- {formatCurrency(selectedPo.discountRp)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim:</span>
                <span className="tabular-nums">+ {formatCurrency(selectedPo.shippingCostRp)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Grand Total:</span>
                <span className="text-blue-600 tabular-nums">{formatCurrency(selectedPo.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
