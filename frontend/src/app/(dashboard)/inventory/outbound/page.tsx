"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Truck,
  PackageCheck,
  Search,
  Plus,
  Eye,
  Printer,
  XCircle,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface DeliveryOutItem {
  id: string;
  code: string;
  date: string;
  soNumber: string;
  soDate: string;
  customer: string;
  creator: string;
  courier: string;
  trackingNo: string;
  status: "DELIVERED" | "SHIPPED" | "PACKING" | "PENDING";
  items: {
    name: string;
    unit: string;
    qtySales: number;
    qtyAvailable: number;
    qtyShip: number;
  }[];
  notes?: string;
}

export default function LogisticsOutboundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Pengiriman Barang...</div>}>
      <LogisticsOutboundContent />
    </Suspense>
  );
}

function LogisticsOutboundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPurchaseReturn = searchParams.get("type") === "purchase-return";
  const actionParam = searchParams.get("action");
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedDo, setSelectedDo] = useState<DeliveryOutItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawShipments = [], isLoading } = useQuery({
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

  const { data: rawSalesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const deliveries: DeliveryOutItem[] = useMemo(() => {
    if (!rawShipments || !Array.isArray(rawShipments)) return [];
    return rawShipments.map((s: any) => ({
      id: s.id,
      code: `DO-${s.id.slice(0, 8).toUpperCase()}`,
      date: s.shippedAt ? new Date(s.shippedAt).toISOString().split("T")[0] : "-",
      soNumber: s.so?.orderNumber || s.soId || "-",
      soDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "-",
      customer: s.so?.lead?.clientName || "Pelanggan",
      creator: "Logistics Officer",
      courier: s.notes?.includes("[Ekspedisi:")
        ? s.notes.split("[Ekspedisi:")[1]?.split("]")[0]?.trim()
        : "Logistik Internal",
      trackingNo: s.trackingNo || "-",
      status: (s.status as DeliveryOutItem["status"]) || "SHIPPED",
      notes: s.notes || "-",
      items: (s.items && s.items.length > 0)
        ? s.items.map((it: any) => ({
            name: it.material?.name || "Produk Maklon",
            unit: "pcs",
            qtySales: Number(it.qty || 0),
            qtyAvailable: Number(it.qty || 0),
            qtyShip: Number(it.qty || 0),
          }))
        : [
            {
              name: `Pengiriman SO ${s.so?.orderNumber || s.soId?.slice(0, 8) || ""}`,
              unit: "batch",
              qtySales: 1,
              qtyAvailable: 1,
              qtyShip: 1,
            },
          ],
    }));
  }, [rawShipments]);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    date: string;
    soId: string;
    soNumber: string;
    customer: string;
    courier: string;
    trackingNo: string;
    notes: string;
    items: DeliveryOutItem["items"];
  }>({
    code: `DO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    soId: "",
    soNumber: "",
    customer: "",
    courier: "JNE Cargo",
    trackingNo: "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (rawSalesOrders.length > 0 && !formData.soId) {
      const firstSo = rawSalesOrders[0];
      setFormData((prev) => ({
        ...prev,
        soId: firstSo.id,
        soNumber: firstSo.orderNumber || firstSo.id,
        customer: firstSo.lead?.clientName || "Pelanggan",
      }));
    }
  }, [rawSalesOrders, formData.soId]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return deliveries.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const totalDelivered = useMemo(() => deliveries.filter((d) => d.status === "DELIVERED").length, [deliveries]);
  const totalShipped = useMemo(() => deliveries.filter((d) => d.status === "SHIPPED").length, [deliveries]);
  const totalPacking = useMemo(() => deliveries.filter((d) => d.status === "PACKING").length, [deliveries]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.soId) {
      toast.warning("Pilih Sales Order terlebih dahulu");
      return;
    }

    try {
      await api.post("/fulfillment/shipments", {
        soId: formData.soId,
        logisticsId: "00000000-0000-0000-0000-000000000001",
        trackingNo: formData.trackingNo || undefined,
        notes: `[Ekspedisi: ${formData.courier}] ${formData.notes || ""}`.trim() || undefined,
      });

      toast.success("Surat Jalan pengiriman berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      setIsCreateOpen(false);
      if (actionParam === "create") {
        router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat surat jalan pengiriman");
    }
  };

  const handleUpdateStatus = async (id: string, status: "DELIVERED" | "SHIPPED") => {
    try {
      await api.patch(`/fulfillment/shipments/${id}/status`, { status });
      toast.success(`Status pengiriman berhasil diubah menjadi ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      setSelectedDo(null);
      setIsDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status pengiriman");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <DnaBadge variant="success">Diterima</DnaBadge>;
      case "SHIPPED":
        return <DnaBadge variant="info">Dalam Perjalanan</DnaBadge>;
      case "PACKING":
        return <DnaBadge variant="warning">Packing Gudang</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title={isPurchaseReturn ? "Pengeluaran Retur Pembelian" : "Pengiriman Barang (Delivery Order)"}
        description={
          isPurchaseReturn
            ? "Logistik fisik pengeluaran barang retur dari gudang pabrik menuju vendor / supplier"
            : "Surat jalan pengeluaran barang jadi dan distribusi logistik ke pelanggan maklon"
        }
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return&action=create" : "/delivery-out/create");
            }}
          >
            + Buat Pengiriman
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Surat Jalan"
          value={deliveries.length.toString()}
          icon={Truck}
          variant="default"
          subtext="Total delivery order terbit"
        />
        <DnaStatCard
          title="Terkirim & Diterima"
          value={totalDelivered.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Lolos konfirmasi penerimaan"
        />
        <DnaStatCard
          title="Dalam Pengiriman"
          value={totalShipped.toString()}
          icon={Send}
          variant="info"
          subtext="Dalam perjalanan ekspedisi"
        />
        <DnaStatCard
          title="Antrean Packing"
          value={totalPacking.toString()}
          icon={Clock}
          variant="warning"
          subtext="Proses seal & wrapping gudang"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no DO, sales order, pelanggan, ekspedisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="DELIVERED">Diterima</option>
            <option value="SHIPPED">Dalam Perjalanan</option>
            <option value="PACKING">Packing Gudang</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 9 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Pengiriman Barang (Delivery Outbound)">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Pengiriman</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">No. Sales</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal Sales</DnaTh>
                <DnaTh className="py-3 px-4">Customer</DnaTh>
                <DnaTh className="py-3 px-4">Pembuat</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data pengiriman barang ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-900">{item.soNumber}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.soDate}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-900 font-medium">{item.customer}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">{getStatusBadge(item.status)}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => {
                            setSelectedDo(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          Lihat
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Printer className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => {
                            toast({
                              title: "Mencetak Surat Jalan",
                              description: `Mengunduh PDF Surat Jalan ${item.code}`,
                              variant: "info"
                            });
                          }}
                        >
                          Print
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

      {/* Modal Detail (1:1 Legacy G-SERP Modal Detail) */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Pengiriman: ${selectedDo?.code || ""}`}
        size="lg"
      >
        {selectedDo && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Pengiriman</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Kirim</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">No. Sales Order</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.soNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Sales</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.soDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer / Klien</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.customer}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Ekspedisi / Kurir</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.courier}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">No. Resi Pelacakan</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedDo.trackingNo}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Status Logistik</p>
                <div className="mt-0.5">{getStatusBadge(selectedDo.status)}</div>
              </div>
            </div>

            {/* Sub-table Detail Barang */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Rincian Barang Terkirim
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Kirim</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedDo.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                        <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {it.qtyShip.toLocaleString("id-ID")}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {selectedDo.notes && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                <span className="font-bold">Catatan Pengiriman:</span> {selectedDo.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
              {selectedDo.status !== "DELIVERED" && (
                <DnaButton
                  variant="primary"
                  onClick={() => handleUpdateStatus(selectedDo.id, "DELIVERED")}
                >
                  Konfirmasi Diterima (Delivered)
                </DnaButton>
              )}
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Form Buat Pengiriman (/delivery-out/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
          }
        }}
        title="Buat Surat Jalan Pengiriman Barang"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Pengiriman (DO) *
              </label>
              <input
                type="text"
                required
                readOnly
                value={formData.code}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengiriman *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Sales Order Ref *
              </label>
              <select
                value={formData.soId}
                onChange={(e) => {
                  const targetSo = rawSalesOrders.find((so: any) => so.id === e.target.value);
                  setFormData({
                    ...formData,
                    soId: e.target.value,
                    soNumber: targetSo?.orderNumber || e.target.value,
                    customer: targetSo?.lead?.clientName || "Pelanggan",
                  });
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {rawSalesOrders.length === 0 ? (
                  <option value="">Tidak ada Sales Order aktif</option>
                ) : (
                  rawSalesOrders.map((so: any) => (
                    <option key={so.id} value={so.id}>
                      {so.orderNumber || so.id.slice(0, 8)} - {so.lead?.clientName || "Klien"} ({so.status})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Brand Klien
              </label>
              <input
                type="text"
                readOnly
                value={formData.customer}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ekspedisi / Kurir Pengantar *
              </label>
              <input
                type="text"
                required
                value={formData.courier}
                onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Resi Pelacakan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: JNE-99210219"
                value={formData.trackingNo}
                onChange={(e) => setFormData({ ...formData, trackingNo: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
          </div>

          {/* Sub-table Keranjang Pengiriman */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Daftar Barang yang Dikirim
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Sales</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Tersedia</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Kirim *</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {formData.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-slate-600">{it.qtySales.toLocaleString()}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-emerald-600 font-semibold">{it.qtyAvailable.toLocaleString()}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          max={it.qtyAvailable}
                          value={it.qtyShip}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...formData.items];
                            updated[idx].qtyShip = val;
                            setFormData({ ...formData, items: updated });
                          }}
                          className="w-24 text-right p-1.5 border border-slate-200 rounded font-bold text-slate-900"
                        />
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pengiriman (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi packing, nomor segel, driver..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                if (actionParam === "create") {
                  router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan & Cetak Surat Jalan
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
