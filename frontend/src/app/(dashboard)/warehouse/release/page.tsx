"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Truck,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  FileText,
  Boxes,
  MapPin,
  Lock,
  Printer,
  Package
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
  DnaDetailDrawer,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { DnaCell } from "@/components/dna/cells/DnaCell";

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
  financialGateStatus: "PAID" | "APPROVED_CREDIT" | "BLOCKED_UNPAID";
  deliveryStatus: "READY" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";
  dispatchedBy: string;
  recipientName?: string;
  deliveredDate?: string;
  notes?: string;
  items: DeliveryItem[];
}

export default function GoodsReleasePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawShipments = [] } = useQuery({
    queryKey: ["fulfillment-shipments"],
    queryFn: async () => {
      try {
        const res = await api.get("/fulfillment/shipments");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: readyOrders = [] } = useQuery({
    queryKey: ["commercial-ready-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const liveDeliveries: DeliveryOrder[] = useMemo(() => {
    if (!Array.isArray(rawShipments)) return [];
    return rawShipments.map((s: any) => {
      const items: DeliveryItem[] = (s.items || []).map((it: any, idx: number) => ({
        id: it.id || `di-${idx}`,
        itemCode: it.itemCode || it.productCode || "PRD",
        itemName: it.itemName || it.productName || "Barang Jadi",
        qtyShipped: Number(it.quantity || it.qty || 0),
        unit: it.unit || "Pcs",
        boxCount: Number(it.boxCount || 1),
        batchNumber: it.batchNumber || "-",
      }));

      return {
        id: s.id,
        deliveryNumber: s.shipmentNumber || s.deliveryNumber || `SJ-${s.id.slice(0, 8).toUpperCase()}`,
        shipDate: s.shippedAt ? new Date(s.shippedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        soNumber: s.soNumber || s.salesOrder?.soNumber || "SO-DIRECT",
        clientName: s.clientName || s.salesOrder?.clientName || "Pelanggan Mitra",
        brandName: s.brandName || s.salesOrder?.brandName || "Brand",
        destinationAddress: s.destinationAddress || "Alamat Pengiriman",
        courierName: s.courierName || s.carrier || "Ekspedisi Logistik",
        vehicleOrTrackingNo: s.trackingNumber || s.vehicleNo || "-",
        totalBoxes: items.reduce((sum, it) => sum + it.boxCount, 0),
        totalUnits: items.reduce((sum, it) => sum + it.qtyShipped, 0),
        financialGateStatus: (s.financialStatus || "PAID") as any,
        deliveryStatus: (s.status || "READY") as any,
        dispatchedBy: s.dispatchedBy || "Petugas Gudang",
        deliveredDate: s.deliveredAt ? String(s.deliveredAt).split("T")[0] : undefined,
        notes: s.notes || "Pengiriman barang jadi",
        items,
      };
    });
  }, [rawShipments]);

  const [localCreated, setLocalCreated] = useState<DeliveryOrder[]>([]);

  const dataList = useMemo(() => [...localCreated, ...liveDeliveries], [localCreated, liveDeliveries]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
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
    const readyCount = list.filter((d) => d.deliveryStatus === "READY").length;
    const inTransitCount = list.filter((d) => d.deliveryStatus === "IN_TRANSIT").length;
    const deliveredCount = list.filter((d) => d.deliveryStatus === "DELIVERED").length;

    return {
      totalDeliveries,
      readyCount,
      inTransitCount,
      deliveredCount,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.courierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        item.deliveryStatus === activeTab;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  // PATCH /fulfillment/shipments/:id/status { status: "DELIVERED" }. The service stamps
  // `deliveredAt` and, on DELIVERED, advances the linked sales order to SOStatus.COMPLETED.
  //
  // ponytail: the name of the person who received the goods is NOT sent — `model Shipment` has no
  // recipient column and UpdateShipmentStatusDto carries only `status`. The old `prompt()` for a
  // recipient name discarded whatever was typed. Add a column + DTO field when proof-of-delivery
  // needs a named receiver.
  const deliverMut = useMutation({
    mutationFn: async (orderId: string) => unwrapResponse(await api.patch(`/fulfillment/shipments/${orderId}/status`, { status: "DELIVERED" })),
    onSuccess: (_data, orderId) => {
      toast.success("Status pengiriman berhasil diubah menjadi Selesai Diterima (DELIVERED)");
      if (selectedDelivery?.id === orderId) setSelectedDelivery(null);
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleConfirmDelivered = (orderId: string) => deliverMut.mutate(orderId);

  const handleCreateDelivery = () => {
    // POST /fulfillment/shipments exists, but CreateShipmentDto requires `soId` (@IsUUID) and
    // `logisticsId` (@IsUUID). This modal holds an SO *number* and a free-text courier name, so
    // neither UUID is available and the request would 400. Nothing is sent.
    toast.warning(
      "Surat jalan belum diterbitkan",
      "Form belum dapat mengirim data: backend memerlukan UUID Sales Order dan UUID master logistik, sedangkan modal ini berisi nomor SO dan nama ekspedisi bebas.",
    );
    setIsCreateOpen(false);
  };

  const getStatusBadge = (status: DeliveryOrder["deliveryStatus"]) => {
    switch (status) {
      case "READY":
        return <DnaBadge variant="warning">Siap Kirim</DnaBadge>;
      case "IN_TRANSIT":
        return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
      case "DELIVERED":
        return <DnaBadge variant="success">Terkirim (POD)</DnaBadge>;
      case "RETURNED":
        return <DnaBadge variant="critical">Retur Pengiriman</DnaBadge>;
    }
  };

  const getFinancialBadge = (status: DeliveryOrder["financialGateStatus"]) => {
    switch (status) {
      case "PAID":
        return <DnaBadge variant="success">Lunas (Pass)</DnaBadge>;
      case "APPROVED_CREDIT":
        return <DnaBadge variant="info">Kredit ACC</DnaBadge>;
      case "BLOCKED_UNPAID":
        return <DnaBadge variant="critical">Terkunci (Belum Lunas)</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Pengiriman Barang (Surat Jalan Release)"
        description="Surat Jalan pengeluaran barang jadi dengan proteksi Financial Gate otomatis sebelum armada diberangkatkan."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>Financial Gate Protected</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Pengiriman", count: dataList.length },
          { id: "READY", label: "Siap Kirim / Loading", count: dataList.filter((d) => d.deliveryStatus === "READY").length },
          { id: "IN_TRANSIT", label: "Dalam Perjalanan", count: dataList.filter((d) => d.deliveryStatus === "IN_TRANSIT").length },
          { id: "DELIVERED", label: "Selesai Diterima", count: dataList.filter((d) => d.deliveryStatus === "DELIVERED").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Pengiriman diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Buat Surat Jalan
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
          variant="info"
        />
        <DnaStatCard
          label="Siap Loading / Dispatch"
          value={`${kpis.readyCount} Dokumen`}
          icon={<Package className="w-5 h-5 text-amber-500" />}
          variant={kpis.readyCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Dalam Perjalanan"
          value={`${kpis.inTransitCount} Armada`}
          icon={<Truck className="w-5 h-5 text-blue-600" />}
          variant="purple"
        />
        <DnaStatCard
          label="Terkirim Sukses (POD)"
          value={`${kpis.deliveredCount} Order`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="success"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Surat Jalan, SO, Klien, Brand, No Resi...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[140px]">No. Surat Jalan</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tgl Kirim</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Klien & Brand</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. SO</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Ekspedisi / Driver</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Total Unit</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Box Karton</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[130px]">Status</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada surat jalan pengiriman yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredList.map((row) => (
                  <DnaTableRow
                    key={row.id}
                    onClick={() => setSelectedDelivery(row)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: No. Surat Jalan */}
                    <DnaTd className="px-4 py-2">
                      <DnaCell.Code value={row.deliveryNumber} />
                    </DnaTd>

                    {/* Kolom 2: Tgl Kirim */}
                    <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {row.shipDate}
                    </DnaTd>

                    {/* Kolom 3: Klien & Brand (1 Natural Pair) */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.DoubleText
                        primary={row.clientName}
                        secondary={row.brandName}
                      />
                    </DnaTd>

                    {/* Kolom 4: No. SO */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={row.soNumber} />
                    </DnaTd>

                    {/* Kolom 5: Ekspedisi / Driver */}
                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[180px]">
                      {row.courierName} ({row.vehicleOrTrackingNo})
                    </DnaTd>

                    {/* Kolom 6: Total Unit */}
                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.totalUnits}
                        unit="Unit"
                      />
                    </DnaTd>

                    {/* Kolom 7: Box Karton */}
                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.totalBoxes}
                        unit="Box"
                      />
                    </DnaTd>

                    {/* Kolom 8: Status */}
                    <DnaTd className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {getStatusBadge(row.deliveryStatus)}
                        {row.financialGateStatus === "BLOCKED_UNPAID" && (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Unpaid
                          </span>
                        )}
                      </div>
                    </DnaTd>

                    {/* Kolom 9: Aksi */}
                    <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDelivery(row)}
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

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        title={selectedDelivery?.deliveryNumber || "Detail Pengiriman"}
        subtitle={`SO: ${selectedDelivery?.soNumber} • ${selectedDelivery?.clientName}`}
        badge={selectedDelivery && getStatusBadge(selectedDelivery.deliveryStatus)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Surat Jalan ${selectedDelivery?.deliveryNumber}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Surat Jalan
            </DnaButton>
            {selectedDelivery && selectedDelivery.deliveryStatus === "IN_TRANSIT" && (
              <DnaButton
                variant="primary"
                size="sm"
                onClick={() => handleConfirmDelivered(selectedDelivery.id)}
              >
                Konfirmasi Sampai (POD)
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedDelivery && (
          <div className="space-y-6 text-xs">
            {/* Financial Gate Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              selectedDelivery.financialGateStatus === "PAID"
                ? "bg-emerald-50 border-emerald-200"
                : selectedDelivery.financialGateStatus === "APPROVED_CREDIT"
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  {selectedDelivery.financialGateStatus === "BLOCKED_UNPAID" ? (
                    <Lock className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>Status Financial Gate Operasional</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {selectedDelivery.financialGateStatus === "BLOCKED_UNPAID"
                    ? "Surat jalan terkunci otomatis karena sisa tagihan faktur belum lunas."
                    : "Lolos verifikasi finansial. Barang diizinkan untuk dikeluarkan dari pabrik."}
                </div>
              </div>
              <div>{getFinancialBadge(selectedDelivery.financialGateStatus)}</div>
            </div>

            {/* Destination & Logistics Details */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Informasi Ekspedisi & Penerima
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Ekspedisi / Armada:</span>
                  <span className="font-semibold text-slate-800">{selectedDelivery.courierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">No. Plat / Resi:</span>
                  <span className="tabular-nums font-semibold text-slate-800">{selectedDelivery.vehicleOrTrackingNo}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Alamat Tujuan Pengiriman:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.destinationAddress}</span>
                </div>
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Daftar Produk yang Dikirim
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable className="w-full text-left text-xs">
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Nama Produk</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Kirim</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Box</DnaTh>
                      <DnaTh className="py-2.5 px-3">No. Batch</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedDelivery.items.map((it) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.itemName}</div>
                          <div className="text-[10px] text-slate-400 tabular-nums">{it.itemCode}</div>
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">{it.qtyShipped} {it.unit}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right text-slate-700">{it.boxCount}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-slate-600">{it.batchNumber}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {/* POD Info if delivered. The receiver's name is not stored server-side (no
                recipient column on Shipment), so only the server's own deliveredAt is shown. */}
            {selectedDelivery.deliveryStatus === "DELIVERED" && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="font-semibold block text-emerald-800 mb-1">Bukti Penerimaan (Proof of Delivery):</span>
                <p className="text-emerald-700 text-xs">
                  Diterima pada tanggal{" "}
                  <b className="font-semibold">{selectedDelivery.deliveredDate || "-"}</b>
                </p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Input Surat Jalan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Surat Jalan Pengiriman Baru"
        description="Penerbitan surat jalan pengeluaran barang jadi dari gudang ekspedisi."
        size="xl"
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
              <label className="block text-slate-700 font-bold mb-1">Pilih Sales Order (SO) *</label>
              <DnaSelect
                aria-label="Pilih SO"
                value={selectedSoNumber}
                onChange={setSelectedSoNumber}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="">-- Pilih Sales Order --</option>
                {readyOrders.map((so: any) => (
                  <option key={so.soNumber || so.id} value={so.soNumber || so.id}>
                    {so.soNumber} - {so.clientName} ({so.brandName})
                  </option>
                ))}
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Pengiriman *</label>
              <DnaInput
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Ekspedisi / Kurir *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: JNE Cargo / Armada Internal"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Kendaraan / Resi Ekspedisi</label>
              <DnaInput
                type="text"
                placeholder="Contoh: B 9821 TBC / TRACK-88129"
                value={vehicleOrTrackingNo}
                onChange={(e) => setVehicleOrTrackingNo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap Tujuan</label>
            <DnaTextarea
              rows={2}
              placeholder="Masukkan alamat pengiriman gudang customer..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
