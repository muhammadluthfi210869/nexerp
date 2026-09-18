"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Search,
  Plus,
  Eye,
  Printer,
  Warehouse,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Trash2,
  ShieldCheck,
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

interface OpnameRecord {
  id: string;
  code: string;
  date: string;
  warehouse: string;
  creator: string;
  status: "COMPLETED" | "DRAFT" | "PENDING_APPROVAL";
  notes: string;
  items: {
    name: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    difference: number;
    notes?: string;
  }[];
}

const INITIAL_OPNAMES: OpnameRecord[] = [
  {
    id: "OPN-001",
    code: "OPN-2026-0001",
    date: "2026-08-31",
    warehouse: "Gudang Bahan Baku",
    creator: "Super Admin",
    status: "COMPLETED",
    notes: "Stock Opname Bulanan Agustus Gudang Bahan Baku",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", systemQty: 500, actualQty: 498, difference: -2, notes: "Selisih timbang kalibrasi" },
      { name: "IPM", unit: "gr", systemQty: 250, actualQty: 250, difference: 0, notes: "Akurat" },
    ]
  },
  {
    id: "OPN-002",
    code: "OPN-2026-0002",
    date: "2026-09-10",
    warehouse: "Gudang Kemasan",
    creator: "Super Admin",
    status: "COMPLETED",
    notes: "Audit Fisik Kemasan & Dus Sekunder Pra-Produksi",
    items: [
      { name: "Niacinamide", unit: "gr", systemQty: 10000, actualQty: 9980, difference: -20, notes: "Dus rusak tepi" },
    ]
  },
  {
    id: "OPN-003",
    code: "OPN-2026-0003",
    date: "2026-09-15",
    warehouse: "Gudang Barang Jadi",
    creator: "Staff Gudang",
    status: "DRAFT",
    notes: "Opname Berkala Produk Jadi Siap Distribusi",
    items: [
      { name: "Secret Water", unit: "gr", systemQty: 1500, actualQty: 1500, difference: 0, notes: "Hitung fisik sesuai" },
    ]
  }
];

export default function StockOpnamePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Stok Opname...</div>}>
      <StockOpnameContent />
    </Suspense>
  );
}

function StockOpnameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const [opnames, setOpnames] = useState<OpnameRecord[]>(INITIAL_OPNAMES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpn, setSelectedOpn] = useState<OpnameRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `OPN-2026-${String(opnames.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    warehouse: "Gudang Bahan Baku",
    notes: "",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", systemQty: 500, actualQty: 500, difference: 0, notes: "" }
    ]
  });

  const [newItem, setNewItem] = useState({
    name: "Niacinamide",
    unit: "gr",
    systemQty: 250,
    actualQty: 250,
    difference: 0,
    notes: ""
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return opnames.filter(item => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [opnames, searchTerm]);

  const totalCompleted = opnames.filter(o => o.status === "COMPLETED").length;
  const totalDraft = opnames.filter(o => o.status === "DRAFT").length;

  const handleAddItem = () => {
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, difference: diff }]
    });
    setNewItem({ name: "IPM", unit: "gr", systemQty: 300, actualQty: 300, difference: 0, notes: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: "Item Kosong", description: "Tambahkan barang yang di-opname", variant: "warning" });
      return;
    }

    const newOpn: OpnameRecord = {
      id: `OPN-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      warehouse: formData.warehouse,
      creator: "Super Admin",
      status: "COMPLETED",
      notes: formData.notes || "Stock opname fisik gudang",
      items: formData.items
    };

    setOpnames([newOpn, ...opnames]);
    setIsCreateOpen(false);
    toast({
      title: "Stock Opname Disimpan",
      description: `Audit fisik ${newOpn.code} berhasil diverifikasi.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/stock-opname");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge status="success">Selesai (Approved)</DnaBadge>;
      case "DRAFT":
        return <DnaBadge status="warning">Draft Opname</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Audit Stok Opname Fisik"
        description="Pencocokan dan rekonsiliasi kuantitas fisik di gudang dengan catatan saldo sistem ERP secara berkala"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/stock-opname/create");
            }}
          >
            + Buat Stock Opname
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Sesi Opname"
          value={opnames.length.toString()}
          icon={ClipboardCheck}
          variant="default"
          subtext="Akumulasi audit opname"
        />
        <DnaStatCard
          title="Opname Selesai & Disetujui"
          value={totalCompleted.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Saldo sistem tersinkron"
        />
        <DnaStatCard
          title="Opname Berjalan / Draft"
          value={totalDraft.toString()}
          icon={AlertTriangle}
          variant="warning"
          subtext="Menunggu rekonsiliasi akhir"
        />
        <DnaStatCard
          title="Tingkat Akurasi Stok"
          value="99.4%"
          icon={ShieldCheck}
          variant="info"
          subtext="Variance toleransi < 1%"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode opname, gudang, petugas, catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1:1 Table (Exactly 7 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Riwayat Stok Opname">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi stok opname ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.warehouse}</td>
                    <td className="py-3 px-4 text-slate-600">{item.creator}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => {
                            setSelectedOpn(item);
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
                              title: "Mencetak Berita Acara Opname",
                              description: `Mengunduh PDF Opname ${item.code}`,
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

      {/* Modal Detail */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Stock Opname: ${selectedOpn?.code || ""}`}
        size="lg"
      >
        {selectedOpn && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Opname</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Opname</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.warehouse}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Petugas</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.creator}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Status Approval</p>
                <div className="mt-0.5">{getStatusBadge(selectedOpn.status)}</div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Catatan</p>
                <p className="text-xs text-slate-700 mt-0.5">{selectedOpn.notes}</p>
              </div>
            </div>

            {/* Sub-table Detail */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Hasil Penghitungan Fisik
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                      <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                      <th className="py-2.5 px-3 text-right">Selisih</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOpn.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{it.systemQty.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{it.actualQty.toLocaleString()}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${it.difference === 0 ? "text-slate-400" : it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{it.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Form Buat Stock Opname (/stock-opname/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/stock-opname");
          }
        }}
        title="Buat Berita Acara Stock Opname"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gudang Diperiksa *
              </label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
                <option value="Gudang Kemasan">Gudang Kemasan</option>
                <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
                <option value="Gudang Surabaya">Gudang Surabaya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
          </div>

          {/* Sub-form Input Item */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Barang yang Di-Opname
            </h5>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Barang *</label>
                <select
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Hairdensyl Complex">Hairdensyl Complex (gr)</option>
                  <option value="Niacinamide">Niacinamide (gr)</option>
                  <option value="IPM">IPM (gr)</option>
                  <option value="Secret Water">Secret Water (gr)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stok Sistem</label>
                <input
                  type="number"
                  readOnly
                  value={newItem.systemQty}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-100 text-right font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stok Fisik *</label>
                <input
                  type="number"
                  value={newItem.actualQty}
                  onChange={(e) => setNewItem({ ...newItem, actualQty: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-right font-bold"
                />
              </div>
              <div className="col-span-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Catatan kondisi/lot..."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
                <DnaButton type="button" variant="primary" size="sm" onClick={handleAddItem}>
                  + Tambah
                </DnaButton>
              </div>
            </div>
          </div>

          {/* Tabel Hasil Opname */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Barang</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                  <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-right">Selisih</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3 text-center w-12">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{it.systemQty.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{it.actualQty.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right font-bold ${it.difference === 0 ? "text-slate-400" : it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {it.difference > 0 ? `+${it.difference}` : it.difference}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{it.notes || "-"}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pelaksanaan Opname
            </label>
            <textarea
              rows={2}
              placeholder="Kondisi gudang, saksi auditor, penanggung jawab..."
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
                  router.push("/stock-opname");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Hasil Opname Fisik
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
