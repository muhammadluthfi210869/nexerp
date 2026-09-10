"use client";

/**
 * Daftar Pembelian & Pengadaan (Purchase Orders / PO List)
 * Screen ID: SCR-037 & SCR-175
 *
 * Sesuai Spesifikasi:
 * - Visual DNA Design System (DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaModal, DnaCell, useDnaToast)
 * - 3 Pilar Fisik Penerimaan: Kuantitas Bagus (Real Stok), Kuantitas Cacat/Reject, Kuantitas Free (Bonus HPP Rp 0)
 * - Diskon dalam Rupiah (Rp) dan Biaya Ongkir tercatat terpisah (Poin 101-102)
 * - Label Jatuh Tempo diganti Deadline (Poin 37, 95)
 * - Tanda Tangan Digital Penanggung Jawab PO (Poin 135)
 * - Format Kode Universal Global (DL-SCM-PO-DDMMYYYY-0001 / PO-DDMMYYYY-0001)
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Truck,
  ShieldCheck,
  Eye,
  Calendar,
  Building2,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

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
  discountRp: number; // Diskon dalam Rupiah
  shippingCostRp: number; // Ongkir terpisah
  totalAmount: number;
  paymentStatus: "UNPAID" | "DP_PAID" | "PAID";
  receivingStatus: "PENDING_INBOUND" | "PARTIAL_RECEIVED" | "FULLY_RECEIVED";
  items: POItemDetail[];
  notes?: string;
}

const INITIAL_PO_DATA: PurchaseOrderRecord[] = [
  {
    id: "po-1",
    poCode: "DL-SCM-PO-09092026-0001",
    date: "09/09/2026",
    supplierName: "PT Chemindo Natural Indonesia",
    supplierCategory: "Bahan Baku",
    warehouseTarget: "Gudang Bahan Baku A1 (Pabrik)",
    deadlineDate: "18/09/2026",
    creatorName: "Dimas Pratama (SCM Buyer)",
    isSignedDigitally: true,
    subtotalAmount: 48500000,
    discountRp: 500000,
    shippingCostRp: 1200000,
    totalAmount: 49200000,
    paymentStatus: "DP_PAID",
    receivingStatus: "PENDING_INBOUND",
    notes: "Pengiriman via ekspedisi thermo control untuk bahan aktif sensitif suhu.",
    items: [
      {
        id: "poi-1",
        materialCode: "RAW-ACT-001",
        materialName: "Niacinamide PC Grade (DSM)",
        category: "Bahan Baku",
        orderedQty: 100,
        goodQty: 0,
        rejectQty: 0,
        freeQty: 0,
        unit: "kg",
        unitPrice: 350000,
        subtotal: 35000000,
      },
      {
        id: "poi-2",
        materialCode: "RAW-EXT-004",
        materialName: "Centella Asiatica Extract 10:1",
        category: "Bahan Baku",
        orderedQty: 30,
        goodQty: 0,
        rejectQty: 0,
        freeQty: 0,
        unit: "kg",
        unitPrice: 450000,
        subtotal: 13500000,
      },
    ],
  },
  {
    id: "po-2",
    poCode: "DL-SCM-PO-05092026-0002",
    date: "05/09/2026",
    supplierName: "CV Packaging Primatama",
    supplierCategory: "Bahan Kemas",
    warehouseTarget: "Gudang Kemasan B2 (Pabrik)",
    deadlineDate: "12/09/2026",
    creatorName: "Siti Rahma (Packaging Specialist)",
    isSignedDigitally: true,
    subtotalAmount: 85000000,
    discountRp: 1500000,
    shippingCostRp: 2000000,
    totalAmount: 85500000,
    paymentStatus: "DP_PAID",
    receivingStatus: "PARTIAL_RECEIVED",
    notes: "Pengiriman batch 1 tiba 10.000 pcs botol. Terdapat 200 pcs reject retak leher.",
    items: [
      {
        id: "poi-3",
        materialCode: "KEM-BOT-012",
        materialName: "Botol Dropper 30ml Frosted Amber",
        category: "Kemas Primer",
        orderedQty: 20000,
        goodQty: 9800,
        rejectQty: 200,
        freeQty: 100,
        unit: "pcs",
        unitPrice: 4250,
        subtotal: 85000000,
      },
    ],
  },
  {
    id: "po-3",
    poCode: "DL-SCM-PO-01092026-0003",
    date: "01/09/2026",
    supplierName: "PT Multi Bintang Printing",
    supplierCategory: "Bahan Kemas",
    warehouseTarget: "Gudang Kemasan B2 (Pabrik)",
    deadlineDate: "08/09/2026",
    creatorName: "Dimas Pratama (SCM Buyer)",
    isSignedDigitally: true,
    subtotalAmount: 23000000,
    discountRp: 0,
    shippingCostRp: 500000,
    totalAmount: 23500000,
    paymentStatus: "PAID",
    receivingStatus: "FULLY_RECEIVED",
    notes: "Lolos QC 100%. Inner box batch FYS Beauty.",
    items: [
      {
        id: "poi-4",
        materialCode: "KEM-BOX-008",
        materialName: "Inner Box Hologram Ivory 350gsm",
        category: "Kemas Sekunder",
        orderedQty: 10000,
        goodQty: 10000,
        rejectQty: 0,
        freeQty: 250,
        unit: "pcs",
        unitPrice: 2300,
        subtotal: 23000000,
      },
    ],
  },
];

export default function PurchaseOrdersModernPage() {
  const router = useRouter();
  const toast = useDnaToast();
  const [poList, setPoList] = useState<PurchaseOrderRecord[]>(INITIAL_PO_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderRecord | null>(null);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <div className="p-6 lg:p-8 space-y-6">
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
            <div className="flex items-center gap-2">
              <DnaButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => router.push("/scm/pembelian/create")}
              >
                + Buat Pembelian (PO)
              </DnaButton>
            </div>
          }
        />

        {/* 4 KPI Grid */}
        <DnaKpiGrid
          items={[
            {
              label: "Total Nilai Pengadaan PO",
              value: formatCurrency(totalPoValue),
              subtitle: "Akumulasi komitmen belanja pabrik",
              trend: `${poList.length} Purchase Orders`,
              icon: DollarSign,
              variant: "blue",
            },
            {
              label: "Menunggu Inbound Gudang",
              value: `${pendingInboundCount} PO In-Transit`,
              subtitle: "Sedang dikirim supplier / otw",
              trend: "Dalam Perjalanan",
              icon: Truck,
              variant: "amber",
            },
            {
              label: "Penerimaan Selesai (GR)",
              value: `${fullyReceivedCount} PO Tuntas`,
              subtitle: "Fisik masuk real stok gudang",
              trend: "100% Verified",
              icon: CheckCircle2,
              variant: "emerald",
            },
            {
              label: "On-Time Delivery (OTD)",
              value: "95.2%",
              subtitle: "Kepatuhan deadline tiba supplier",
              trend: "Target > 90%",
              icon: Clock,
              variant: "purple",
            },
          ]}
        />

        {/* Search & Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="w-80">
            <DnaInput
              placeholder="Cari kode PO, supplier, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Menampilkan <span className="text-slate-900 font-bold">{filteredPoList.length}</span> dari{" "}
            {poList.length} Order Pembelian
          </div>
        </div>

        {/* PO Table */}
        <DnaDataTableCard
          title="Tabel Monitoring Purchase Order (PO)"
          count={filteredPoList.length}
          description="Daftar pengadaan resmi dengan kalkulasi Diskon Rp, Ongkir terpisah, dan status 3 pilar fisik penerimaan."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider select-none whitespace-nowrap text-[10px]">
                  <th className="py-3 px-3 w-8 text-center">#</th>
                  <th className="py-3 px-3">KODE PO</th>
                  <th className="py-3 px-3">TANGGAL PO</th>
                  <th className="py-3 px-3">SUPPLIER & KATEGORI</th>
                  <th className="py-3 px-3">GUDANG TUJUAN</th>
                  <th className="py-3 px-3 text-center">DEADLINE TIBA</th>
                  <th className="py-3 px-3 text-right">TOTAL NILAI (RP)</th>
                  <th className="py-3 px-3 text-center">STATUS BAYAR</th>
                  <th className="py-3 px-3 text-center">STATUS TERIMA</th>
                  <th className="py-3 px-3 text-center">TANDA TANGAN</th>
                  <th className="py-3 px-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPoList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-slate-400">
                      Tidak ada data purchase order pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredPoList.map((po, idx) => (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPo(po)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {po.poCode}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[10px]">
                        {po.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{po.supplierName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{po.supplierCategory}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {po.warehouseTarget}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600 whitespace-nowrap text-[10px]">
                        {po.deadlineDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(po.totalAmount)}
                        {po.discountRp > 0 && (
                          <span className="block text-[9px] text-emerald-600 font-normal">
                            Disc: -{formatCurrency(po.discountRp)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            po.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : po.paymentStatus === "DP_PAID"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {po.paymentStatus === "PAID"
                            ? "LUNAS"
                            : po.paymentStatus === "DP_PAID"
                            ? "DP DIBAYAR"
                            : "BELUM BAYAR"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            po.receivingStatus === "FULLY_RECEIVED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : po.receivingStatus === "PARTIAL_RECEIVED"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {po.receivingStatus === "FULLY_RECEIVED"
                            ? "DITERIMA 100%"
                            : po.receivingStatus === "PARTIAL_RECEIVED"
                            ? "PARSIAL"
                            : "BELUM TIBA"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {po.isSignedDigitally ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Digital TTD
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Manual</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPo(po);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Lihat Detail PO"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>

      {/* Modal Detail PO & 3 Pilar Fisik */}
      <DnaModal
        isOpen={!!selectedPo}
        onClose={() => setSelectedPo(null)}
        title="Rincian Dokumen Purchase Order (PO)"
        size="lg"
      >
        {selectedPo && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {selectedPo.poCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedPo.supplierName}</h3>
                <p className="text-xs text-slate-500">
                  Kategori: <span className="font-semibold text-slate-700">{selectedPo.supplierCategory}</span> •
                  Target Gudang: <span className="font-semibold text-slate-700">{selectedPo.warehouseTarget}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Grand Total PO</span>
                <span className="text-base font-black text-blue-600">{formatCurrency(selectedPo.totalAmount)}</span>
              </div>
            </div>

            {/* Matrix Data PO */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Tanggal Input PO (Hari Ini)</span>
                <span className="font-bold text-slate-800 font-mono">{selectedPo.date}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Target Deadline Tiba</span>
                <span className="font-bold text-rose-600 font-mono">{selectedPo.deadlineDate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Penanggung Jawab PIC</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {selectedPo.creatorName}
                </span>
              </div>
            </div>

            {/* Sub-tabel Item dengan 3 Pilar Fisik Penerimaan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rincian 3 Pilar Fisik Penerimaan Barang (Bagus / Reject / Free)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">KODE</th>
                      <th className="py-2 px-3">NAMA BAHAN</th>
                      <th className="py-2 px-2 text-right">PESAN</th>
                      <th className="py-2 px-2 text-right text-emerald-700 bg-emerald-50/50">BAGUS (REAL STOK)</th>
                      <th className="py-2 px-2 text-right text-rose-700 bg-rose-50/50">REJECT (RETUR)</th>
                      <th className="py-2 px-2 text-right text-purple-700 bg-purple-50/50">FREE (BONUS)</th>
                      <th className="py-2 px-2 text-right">HARGA (RP)</th>
                      <th className="py-2 px-3 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPo.items.map((it, i) => (
                      <tr key={it.id}>
                        <td className="py-2 px-2 text-slate-400 font-bold">{i + 1}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{it.materialCode}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{it.materialName}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-800">
                          {it.orderedQty} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-700 bg-emerald-50/30">
                          {it.goodQty} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-rose-700 bg-rose-50/30">
                          {it.rejectQty} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-purple-700 bg-purple-50/30">
                          {it.freeQty} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-blue-600 font-mono">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rincian Finansial & Ongkir Diskon */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div className="text-slate-600 space-y-1">
                <p>• Diskon Supplier: <span className="font-bold text-emerald-700 font-mono">-{formatCurrency(selectedPo.discountRp)}</span> (Dihitung dalam Rupiah)</p>
                <p>• Biaya Ongkir: <span className="font-bold text-slate-800 font-mono">+{formatCurrency(selectedPo.shippingCostRp)}</span></p>
                {selectedPo.notes && <p className="text-slate-500 italic">Catatan: {selectedPo.notes}</p>}
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total Tagihan Final PO:</span>
                <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(selectedPo.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedPo(null)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("Dokumen Dicetak", `Purchase Order ${selectedPo.poCode} siap diunduh.`);
                  setSelectedPo(null);
                }}
              >
                Cetak Dokumen PO
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
