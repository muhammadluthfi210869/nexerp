"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  Boxes,
  MapPin,
  ShieldCheck,
  Package,
  Calendar,
  Building2,
  Lock,
  Printer
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
  DnaTabNav,
  useDnaToast
} from "@/components/dna";

interface DeliveryItem {
  id: string;
  itemCode: string;
  itemName: string;
  qtyShipped: number;
  unit: string;
  boxCount: number;
  batchNumber: string;
}

interface DeliveryOrder {
  id: string;
  deliveryNumber: string; // No Surat Jalan SJ-YYYYMM-XXXX
  shipDate: string;
  soNumber: string;
  clientName: string;
  brandName: string;
  destinationAddress: string;
  courierName: string; // Ekspedisi / Driver internal
  vehicleOrTrackingNo: string; // Plat nomor / No Resi
  totalBoxes: number;
  totalUnits: number;
  financialGateStatus: "PAID" | "APPROVED_CREDIT" | "BLOCKED_UNPAID"; // Poin 2 & 134
  deliveryStatus: "READY" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";
  dispatchedBy: string;
  recipientName?: string;
  deliveredDate?: string;
  notes?: string;
  items: DeliveryItem[];
}

const INITIAL_DELIVERIES: DeliveryOrder[] = [
  {
    id: "del-1",
    deliveryNumber: "SJ-202609-0012",
    shipDate: "2026-09-09",
    soNumber: "SO-202609-000002",
    clientName: "PT Glow Beauty Sejahtera",
    brandName: "Glow & Radiant Serum 20ml",
    destinationAddress: "Ruko Grand Niaga Blok B-12, Kebon Jeruk, Jakarta Barat",
    courierName: "Dakota Cargo (Truck Box)",
    vehicleOrTrackingNo: "B-9812-UXD / RESI-DKT-991204",
    totalBoxes: 24,
    totalUnits: 5000,
    financialGateStatus: "PAID",
    deliveryStatus: "IN_TRANSIT",
    dispatchedBy: "Bambang Sudiro (Logistics)",
    notes: "Pengiriman batch 1 serum peptide lengkap sertifikat CoA & BPOM NA.",
    items: [
      {
        id: "di-1",
        itemCode: "PRD00108",
        itemName: "Glow & Radiant Serum 20ml",
        qtyShipped: 5000,
        unit: "Pcs",
        boxCount: 24,
        batchNumber: "LOT-GLOW-2609-01"
      }
    ]
  },
  {
    id: "del-2",
    deliveryNumber: "SJ-202609-0011",
    shipDate: "2026-09-08",
    soNumber: "SO-202608-000045",
    clientName: "CV Natura Herbal Nusantara",
    brandName: "Acne Clear Facial Wash 100ml",
    destinationAddress: "Jl. Diponegoro No. 88, Surabaya, Jawa Timur",
    courierName: "J&T Cargo",
    vehicleOrTrackingNo: "RESI-JTC-88120491",
    totalBoxes: 15,
    totalUnits: 3000,
    financialGateStatus: "APPROVED_CREDIT",
    deliveryStatus: "DELIVERED",
    dispatchedBy: "Bambang Sudiro (Logistics)",
    recipientName: "Bpk. Hendra (Gudang Surabaya)",
    deliveredDate: "2026-09-09 14:20",
    notes: "Terkirim utuh 15 karton dan diterima dalam kondisi baik tanpa reject.",
    items: [
      {
        id: "di-2",
        itemCode: "PRD00095",
        itemName: "Acne Clear Facial Wash 100ml",
        qtyShipped: 3000,
        unit: "Pcs",
        boxCount: 15,
        batchNumber: "LOT-ACN-2608-04"
      }
    ]
  },
  {
    id: "del-3",
    deliveryNumber: "SJ-202609-0013",
    shipDate: "2026-09-09",
    soNumber: "SO-202609-000004",
    clientName: "PT Cantika Skincare Utama",
    brandName: "Moisturizer Gel Barrier 50g",
    destinationAddress: "Kawasan Industri MM2100 Blok C-4, Cikarang, Bekasi",
    courierName: "Driver Internal (Armada Blind Van Luthfi)",
    vehicleOrTrackingNo: "B-9140-KLA",
    totalBoxes: 10,
    totalUnits: 2000,
    financialGateStatus: "PAID",
    deliveryStatus: "READY",
    dispatchedBy: "Rahmat Hidayat (Logistics)",
    notes: "Barang sudah dipacking kayu dan siap loading armada sore ini.",
    items: [
      {
        id: "di-3",
        itemCode: "PRD00120",
        itemName: "Moisturizer Gel Barrier 50g",
        qtyShipped: 2000,
        unit: "Pcs",
        boxCount: 10,
        batchNumber: "LOT-MST-2609-02"
      }
    ]
  },
  {
    id: "del-4",
    deliveryNumber: "SJ-202609-0010",
    shipDate: "2026-09-07",
    soNumber: "SO-202608-000039",
    clientName: "PT Derma Estetika Farma",
    brandName: "Sunscreen Serum Gel SPF 50",
    destinationAddress: "Jl. Malioboro No. 45, Yogyakarta",
    courierName: "Panca Ekspedisi",
    vehicleOrTrackingNo: "AB-8821-YX",
    totalBoxes: 8,
    totalUnits: 1500,
    financialGateStatus: "BLOCKED_UNPAID",
    deliveryStatus: "READY",
    dispatchedBy: "Rahmat Hidayat (Logistics)",
    notes: "Pengiriman DITAHAN (Financial Gate): Menunggu bukti transfer pelunasan 50% dari finance.",
    items: [
      {
        id: "di-4",
        itemCode: "PRD00077",
        itemName: "Sunscreen Serum Gel SPF 50",
        qtyShipped: 1500,
        unit: "Pcs",
        boxCount: 8,
        batchNumber: "LOT-SUN-2608-01"
      }
    ]
  }
];

const MOCK_READY_ORDERS = [
  {
    soNumber: "SO-202609-000008",
    clientName: "PT Royal Beauty Care",
    brandName: "Brightening Body Lotion 200ml",
    destinationAddress: "Jl. Gatot Subroto No. 12, Bandung",
    financialStatus: "PAID",
    items: [
      { itemCode: "PRD00130", itemName: "Brightening Body Lotion 200ml", qty: 4000, unit: "Pcs", boxCount: 20 }
    ]
  }
];

export default function GoodsReleasePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<DeliveryOrder[]>(INITIAL_DELIVERIES);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedSoNumber, setSelectedSoNumber] = useState("");
  const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0]);
  const [courierName, setCourierName] = useState("Armada Internal Gudang");
  const [vehicleOrTrackingNo, setVehicleOrTrackingNo] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalDeliveries = list.length;
    const readyCount = list.filter(d => d.deliveryStatus === "READY").length;
    const inTransitCount = list.filter(d => d.deliveryStatus === "IN_TRANSIT").length;
    const deliveredCount = list.filter(d => d.deliveryStatus === "DELIVERED").length;

    return {
      totalDeliveries,
      readyCount,
      inTransitCount,
      deliveredCount
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicleOrTrackingNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "READY" ? item.deliveryStatus === "READY" :
        activeTab === "IN_TRANSIT" ? item.deliveryStatus === "IN_TRANSIT" :
        activeTab === "DELIVERED" ? item.deliveryStatus === "DELIVERED" : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleSelectSo = (soNo: string) => {
    setSelectedSoNumber(soNo);
    const so = MOCK_READY_ORDERS.find(s => s.soNumber === soNo);
    if (so) {
      setDestinationAddress(so.destinationAddress);
    } else {
      setDestinationAddress("");
    }
  };

  const handleCreateDelivery = () => {
    if (!selectedSoNumber) {
      toast.error("Pilih Sales Order referensi");
      return;
    }
    const so = MOCK_READY_ORDERS.find(s => s.soNumber === selectedSoNumber);
    if (!so) return;

    if (!vehicleOrTrackingNo.trim()) {
      toast.error("Nomor Resi Ekspedisi / Plat Kendaraan wajib diisi");
      return;
    }

    const newNo = `SJ-202609-00${String(dataList.length + 14).padStart(2, "0")}`;

    const newDelivery: DeliveryOrder = {
      id: `del-${Date.now()}`,
      deliveryNumber: newNo,
      shipDate,
      soNumber: so.soNumber,
      clientName: so.clientName,
      brandName: so.brandName,
      destinationAddress: destinationAddress || so.destinationAddress,
      courierName,
      vehicleOrTrackingNo,
      totalBoxes: so.items.reduce((sum, i) => sum + i.boxCount, 0),
      totalUnits: so.items.reduce((sum, i) => sum + i.qty, 0),
      financialGateStatus: so.financialStatus as any,
      deliveryStatus: "IN_TRANSIT",
      dispatchedBy: "Logistics Officer (Anda)",
      notes: formNotes || "Pengiriman produk jadi maklon resmi.",
      items: so.items.map((i, idx) => ({
        id: `di-${Date.now()}-${idx}`,
        itemCode: i.itemCode,
        itemName: i.itemName,
        qtyShipped: i.qty,
        unit: i.unit,
        boxCount: i.boxCount,
        batchNumber: `LOT-${Date.now().toString().slice(-4)}`
      }))
    };

    setDataList([newDelivery, ...dataList]);
    setIsCreateOpen(false);
    setSelectedSoNumber("");
    setVehicleOrTrackingNo("");
    setDestinationAddress("");
    setFormNotes("");
    toast.success(`Surat Jalan ${newNo} berhasil diterbitkan dan siap loading armada.`);
  };

  const handleConfirmDelivered = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          deliveryStatus: "DELIVERED",
          recipientName: "Klien / PIC Penerima",
          deliveredDate: new Date().toLocaleString("id-ID")
        };
      }
      return item;
    }));
    if (selectedDelivery && selectedDelivery.id === id) {
      setSelectedDelivery({
        ...selectedDelivery,
        deliveryStatus: "DELIVERED",
        deliveredDate: new Date().toLocaleString("id-ID")
      });
    }
    toast.success("Status pengiriman berhasil diperbarui: Telah Diterima Klien.");
  };

  const getStatusBadge = (status: DeliveryOrder["deliveryStatus"]) => {
    switch (status) {
      case "READY":
        return <DnaBadge variant="warning">Siap Loading</DnaBadge>;
      case "IN_TRANSIT":
        return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
      case "DELIVERED":
        return <DnaBadge variant="success">Telah Diterima</DnaBadge>;
      case "RETURNED":
        return <DnaBadge variant="critical">Retur Pengiriman</DnaBadge>;
    }
  };

  const getFinancialGateBadge = (status: DeliveryOrder["financialGateStatus"]) => {
    switch (status) {
      case "PAID":
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">LUNAS (Gate Pass)</span>;
      case "APPROVED_CREDIT":
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px] font-bold">TOP Disetujui</span>;
      case "BLOCKED_UNPAID":
        return <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px] font-bold animate-pulse flex items-center gap-1"><Lock className="w-3 h-3 inline" /> Ditahan (Belum Lunas)</span>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Pengiriman Barang (Release & Delivery Out)"
        description="Penerbitan Surat Jalan resmi, verifikasi Financial Gate pelunasan Sales Order, dan monitoring kurir/ekspedisi."
        badge={<DnaBadge variant="neutral">SCR-086 / WH-DELIVERY</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Pengiriman Barang diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Buat Surat Jalan Pengiriman
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Surat Jalan"
          value={`${kpis.totalDeliveries} Pengiriman`}
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+4 minggu ini", isPositive: true }}
        />
        <DnaStatCard
          label="Siap Loading / Dispatch"
          value={`${kpis.readyCount} Dokumen`}
          icon={<Package className="w-5 h-5 text-amber-500" />}
          variant={kpis.readyCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Dalam Perjalanan (In Transit)"
          value={`${kpis.inTransitCount} Armada`}
          icon={<Truck className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="Terkirim Sukses (Delivered)"
          value={`${kpis.deliveredCount} Order`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua Pengiriman", count: dataList.length },
            { id: "READY", label: "Siap Kirim / Loading", count: dataList.filter(d => d.deliveryStatus === "READY").length },
            { id: "IN_TRANSIT", label: "Dalam Perjalanan", count: dataList.filter(d => d.deliveryStatus === "IN_TRANSIT").length },
            { id: "DELIVERED", label: "Selesai Diterima", count: dataList.filter(d => d.deliveryStatus === "DELIVERED").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Surat Jalan Pengiriman Produk Jadi"
        description="Surat Jalan pengeluaran barang terkunci otomatis jika status finansial belum lolos verifikasi (Poin 2 & 134)."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Surat Jalan, SO, Klien, Brand, No Resi..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Surat Jalan</th>
                <th className="py-3 px-4">Tgl Kirim</th>
                <th className="py-3 px-4">Klien & Brand Produk</th>
                <th className="py-3 px-4">No. SO Referensi</th>
                <th className="py-3 px-4">Ekspedisi & Resi / Plat</th>
                <th className="py-3 px-4 text-center">Total Box</th>
                <th className="py-3 px-4 text-right">Total Unit</th>
                <th className="py-3 px-4">Financial Gate</th>
                <th className="py-3 px-4">Status Kirim</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada surat jalan pengiriman yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  const isBlocked = row.financialGateStatus === "BLOCKED_UNPAID";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                        {row.deliveryNumber}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {row.shipDate}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-900">{row.clientName}</div>
                        <div className="text-[11px] text-slate-500">{row.brandName}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-medium text-slate-900">
                        {row.soNumber}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800">
                        <div className="font-medium">{row.courierName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{row.vehicleOrTrackingNo}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-slate-800">
                        {row.totalBoxes} Box
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-bold text-indigo-700">
                        {row.totalUnits.toLocaleString("id-ID")}
                      </td>
                      {/* Financial Gate Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getFinancialGateBadge(row.financialGateStatus)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(row.deliveryStatus)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedDelivery(row);
                              setIsDetailOpen(true);
                            }}
                          >
                            Detail
                          </DnaButton>
                          {row.deliveryStatus === "IN_TRANSIT" && (
                            <DnaButton
                              variant="secondary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              onClick={() => handleConfirmDelivered(row.id)}
                            >
                              Diterima
                            </DnaButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Surat Jalan */}
      {selectedDelivery && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Surat Jalan Pengiriman: ${selectedDelivery.deliveryNumber}`}
          description={`Pengiriman untuk ${selectedDelivery.clientName} (${selectedDelivery.brandName})`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Disiapkan oleh: <span className="font-semibold text-slate-700">{selectedDelivery.dispatchedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <DnaButton
                  variant="outline"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => toast.success("Mencetak Surat Jalan Resmi 3 Rangkap (Customer, Ekspedisi, Arsip)...")}
                >
                  Cetak Surat Jalan
                </DnaButton>
                {selectedDelivery.deliveryStatus === "IN_TRANSIT" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleConfirmDelivered(selectedDelivery.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Konfirmasi Diterima Klien
                  </DnaButton>
                )}
                <DnaButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">No. Sales Order</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedDelivery.soNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ekspedisi / Resi</span>
                <span className="font-medium text-slate-800">{selectedDelivery.courierName}</span>
                <span className="text-slate-500 block text-[11px] font-mono">{selectedDelivery.vehicleOrTrackingNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Financial Gate</span>
                <div className="mt-0.5">{getFinancialGateBadge(selectedDelivery.financialGateStatus)}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pengiriman</span>
                <div className="mt-0.5">{getStatusBadge(selectedDelivery.deliveryStatus)}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-bold block mb-0.5">Alamat Tujuan Pengiriman:</span>
              <span className="text-slate-800">{selectedDelivery.destinationAddress}</span>
            </div>

            {selectedDelivery.recipientName && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900">
                <span className="font-bold block">Bukti Penerimaan:</span>
                Diterima oleh <span className="font-bold">{selectedDelivery.recipientName}</span> pada {selectedDelivery.deliveredDate}.
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Daftar Produk yang Dikirim</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Produk Jadi</th>
                      <th className="py-2.5 px-3 text-center">Jumlah Box</th>
                      <th className="py-2.5 px-3 text-right">Kuantitas Unit</th>
                      <th className="py-2.5 px-3">No. Batch / Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedDelivery.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-indigo-600 font-medium">{it.itemCode}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{it.itemName}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{it.boxCount} Box</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{it.qtyShipped.toLocaleString("id-ID")} {it.unit}</td>
                        <td className="py-2.5 px-3 text-slate-700">{it.batchNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Buat Surat Jalan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Penerbitan Surat Jalan Pengiriman (Delivery Order)"
        description="Hanya Sales Order yang telah lolos verifikasi pelunasan finansial yang dapat diterbitkan Surat Jalan."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleCreateDelivery}
            >
              Terbitkan Surat Jalan
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Sales Order Siap Kirim (Lunas) *</label>
              <select
                aria-label="Pilih Sales Order"
                value={selectedSoNumber}
                onChange={(e) => handleSelectSo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih Sales Order --</option>
                {MOCK_READY_ORDERS.map((so) => (
                  <option key={so.soNumber} value={so.soNumber}>
                    {so.soNumber} - {so.clientName} ({so.brandName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Pengiriman *</label>
              <input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ekspedisi / Kurir Pengangkut *</label>
              <input
                type="text"
                placeholder="Contoh: Dakota Cargo / Driver Internal"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Resi Ekspedisi / Plat Kendaraan *</label>
              <input
                type="text"
                placeholder="Contoh: RESI-DKT-98124 / B-9812-UXD"
                value={vehicleOrTrackingNo}
                onChange={(e) => setVehicleOrTrackingNo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Alamat Tujuan Pengiriman Lengkap *</label>
            <input
              type="text"
              placeholder="Alamat lengkap penerima / gudang customer"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan untuk Driver / Ekspedisi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Muatan fragile, simpan di tempat kering dan tidak terkena sinar matahari langsung."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
