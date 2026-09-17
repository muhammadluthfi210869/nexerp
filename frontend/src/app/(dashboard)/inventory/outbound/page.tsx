"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

const INITIAL_DELIVERIES: DeliveryOutItem[] = [
  {
    id: "DO-001",
    code: "DO-2026-0001",
    date: "2026-09-03",
    soNumber: "SO-202609-000004",
    soDate: "2026-08-28",
    customer: "Farah Derma Clinic",
    creator: "Staff Gudang",
    courier: "JNE Cargo",
    trackingNo: "JNE-TRK-2026-0081",
    status: "DELIVERED",
    notes: "Pengiriman batch 1 produk skincare botol 100ml",
    items: [
      { name: "Day Cream SPF 30 (Farah Derma)", unit: "pcs", qtySales: 3000, qtyAvailable: 3000, qtyShip: 3000 },
      { name: "Kardus Master Box Day Cream", unit: "box", qtySales: 150, qtyAvailable: 150, qtyShip: 150 }
    ]
  },
  {
    id: "DO-002",
    code: "DO-2026-0002",
    date: "2026-09-07",
    soNumber: "SO-202609-000005",
    soDate: "2026-09-01",
    customer: "K-Skin Men",
    creator: "Logistics Officer",
    courier: "SiCepat Cargo",
    trackingNo: "SICEPAT-0092819",
    status: "SHIPPED",
    notes: "Pengiriman via ekspedisi darat Jakarta - Surabaya",
    items: [
      { name: "Facial Foam Charcoal 100ml", unit: "pcs", qtySales: 5000, qtyAvailable: 5000, qtyShip: 5000 }
    ]
  },
  {
    id: "DO-003",
    code: "DO-2026-0003",
    date: "2026-09-11",
    soNumber: "SO-202609-000008",
    soDate: "2026-09-05",
    customer: "Anita Aesthetics",
    creator: "Staff Packaging",
    courier: "Lalamove Van",
    trackingNo: "LALAMOVE-VN-1102",
    status: "PACKING",
    notes: "Menunggu final seal shrink wrap dan audit QC packing",
    items: [
      { name: "Moisturizer Gel Aloe 50gr", unit: "pcs", qtySales: 1500, qtyAvailable: 1500, qtyShip: 1500 }
    ]
  },
  {
    id: "DO-004",
    code: "DO-2026-0004",
    date: "2026-09-14",
    soNumber: "SO-202609-000004",
    soDate: "2026-09-08",
    customer: "Farah Derma Clinic",
    creator: "Staff Gudang",
    courier: "AnterAja",
    trackingNo: "ANTERAJA-8827101",
    status: "DELIVERED",
    notes: "Pengiriman sampel batch kedua uji klinis lanjutan",
    items: [
      { name: "Serum Niacinamide 10% 20ml", unit: "pcs", qtySales: 100, qtyAvailable: 100, qtyShip: 100 }
    ]
  }
];

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
  const { toast } = useDnaToast();

  const [deliveries, setDeliveries] = useState<DeliveryOutItem[]>(INITIAL_DELIVERIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedDo, setSelectedDo] = useState<DeliveryOutItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `DO-2026-${String(deliveries.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    soNumber: "SO-202609-000005",
    soDate: new Date().toISOString().split("T")[0],
    customer: "Farah Derma Clinic",
    courier: "JNE Cargo",
    trackingNo: "",
    notes: "",
    items: [
      { name: "Facial Foam Charcoal 100ml", unit: "pcs", qtySales: 5000, qtyAvailable: 5000, qtyShip: 5000 }
    ]
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return deliveries.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const totalDelivered = deliveries.filter(d => d.status === "DELIVERED").length;
  const totalShipped = deliveries.filter(d => d.status === "SHIPPED").length;
  const totalPacking = deliveries.filter(d => d.status === "PACKING").length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newDo: DeliveryOutItem = {
      id: `DO-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      soNumber: formData.soNumber,
      soDate: formData.soDate,
      customer: formData.customer,
      creator: "Super Admin",
      courier: formData.courier,
      trackingNo: formData.trackingNo || `TRK-${Date.now()}`,
      status: "SHIPPED",
      notes: formData.notes,
      items: formData.items
    };
    setDeliveries([newDo, ...deliveries]);
    setIsCreateOpen(false);
    toast({
      title: "Pengiriman Dibuat",
      description: `Surat Jalan ${newDo.code} berhasil disimpan ke logistik.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push(isPurchaseReturn ? "/inventory/outbound?type=purchase-return" : "/delivery-out");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <DnaBadge status="success">Diterima</DnaBadge>;
      case "SHIPPED":
        return <DnaBadge status="info">Dalam Perjalanan</DnaBadge>;
      case "PACKING":
        return <DnaBadge status="warning">Packing Gudang</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
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
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode Pengiriman</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Sales</th>
                <th className="py-3 px-4">Tanggal Sales</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data pengiriman barang ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.soNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{item.soDate}</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{item.customer}</td>
                    <td className="py-3 px-4 text-slate-600">{item.creator}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-center">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Qty Kirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDo.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {it.qtyShip.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                No. Sales Order Ref *
              </label>
              <input
                type="text"
                required
                value={formData.soNumber}
                onChange={(e) => setFormData({ ...formData, soNumber: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Brand Klien *
              </label>
              <input
                type="text"
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
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
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Barang</th>
                    <th className="py-2.5 px-3 text-center">Satuan</th>
                    <th className="py-2.5 px-3 text-right">Qty Sales</th>
                    <th className="py-2.5 px-3 text-right">Qty Tersedia</th>
                    <th className="py-2.5 px-3 text-right">Qty Kirim *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{it.qtySales.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">{it.qtyAvailable.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
