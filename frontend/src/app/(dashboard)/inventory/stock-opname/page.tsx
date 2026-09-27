"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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
    materialId?: string;
    name: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    difference: number;
    notes?: string;
  }[];
}

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
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpn, setSelectedOpn] = useState<OpnameRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawOpnames = [] } = useQuery({
    queryKey: ["inventory-opnames"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/opname");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: catalogMaterials = [] } = useQuery({
    queryKey: ["inventory-catalog-materials"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const opnames: OpnameRecord[] = useMemo(() => {
    return rawOpnames.map((o: any) => ({
      id: o.id,
      code: o.opnameNumber || `OPN-${o.id.slice(0, 8).toUpperCase()}`,
      date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "-",
      warehouse: o.warehouse?.name || "Gudang Utama",
      creator: o.pic?.name || o.picId || "Staff Gudang",
      status: (o.status || "COMPLETED") as any,
      notes: o.notes || "-",
      items: (o.items || []).map((it: any) => ({
        materialId: it.materialId,
        name: it.material?.name || "Material",
        unit: it.material?.unit || "Unit",
        systemQty: Number(it.systemQty || 0),
        actualQty: Number(it.actualQty || 0),
        difference: Number(it.difference || 0),
        notes: it.notes || "",
      })),
    }));
  }, [rawOpnames]);

  // Form State
  const [formData, setFormData] = useState<{
    warehouseId: string;
    warehouse: string;
    date: string;
    notes: string;
    items: {
      materialId?: string;
      name: string;
      unit: string;
      systemQty: number;
      actualQty: number;
      difference: number;
      notes?: string;
    }[];
  }>({
    warehouseId: "",
    warehouse: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState({
    materialId: "",
    name: "",
    unit: "Unit",
    systemQty: 0,
    actualQty: 0,
    difference: 0,
    notes: "",
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return opnames.filter((item) => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [opnames, searchTerm]);

  const totalCompleted = opnames.filter((o) => o.status === "COMPLETED").length;
  const totalDraft = opnames.filter((o) => o.status === "DRAFT").length;

  const accuracy = useMemo(() => {
    if (opnames.length === 0) return "100%";
    let totalSys = 0;
    let totalAct = 0;
    opnames.forEach((o) => {
      o.items.forEach((i) => {
        totalSys += i.systemQty;
        totalAct += i.actualQty;
      });
    });
    if (totalSys === 0) return "100%";
    const acc = (1 - Math.abs(totalSys - totalAct) / totalSys) * 100;
    return `${Math.max(0, acc).toFixed(1)}%`;
  }, [opnames]);

  const handleAddItem = () => {
    if (!newItem.name) {
      toast({ title: "Pilih Material", description: "Pilih material terlebih dahulu", variant: "warning" });
      return;
    }
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, difference: diff }],
    });
    setNewItem({ materialId: "", name: "", unit: "Unit", systemQty: 0, actualQty: 0, difference: 0, notes: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = formData.warehouseId || warehouses[0]?.id;
    if (!targetWhId) {
      toast({ title: "Gudang Kosong", description: "Pilih gudang terlebih dahulu", variant: "warning" });
      return;
    }

    try {
      await api.post("/warehouse/opname", {
        warehouseId: targetWhId,
        picId: "SYSTEM",
        notes: formData.notes || "Stock opname fisik gudang",
        items: formData.items.map((it) => ({
          materialId: it.materialId || (catalogMaterials[0]?.id as string) || "MAT-01",
          systemQty: it.systemQty,
          actualQty: it.actualQty,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ["inventory-opnames"] });
      setIsCreateOpen(false);
      setFormData({
        warehouseId: "",
        warehouse: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        items: [],
      });
      toast({
        title: "Stock Opname Disimpan",
        description: `Audit fisik berhasil disimpan ke server.`,
        variant: "success",
      });
      if (actionParam === "create") {
        router.push("/stock-opname");
      }
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err?.response?.data?.message || "Terjadi kesalahan saat menyimpan opname",
        variant: "error",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai (Approved)</DnaBadge>;
      case "DRAFT":
        return <DnaBadge variant="warning">Draft Opname</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
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
          value={accuracy}
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
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-12 text-center">#</DnaTh>
                <DnaTh>Kode</DnaTh>
                <DnaTh>Tanggal</DnaTh>
                <DnaTh>Gudang</DnaTh>
                <DnaTh>Pembuat</DnaTh>
                <DnaTh>Catatan</DnaTh>
                <DnaTh className="text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi stok opname ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id}>
                    <DnaTd className="text-center font-medium text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="text-slate-600 tabular-nums">{item.date}</DnaTd>
                    <DnaTd className="font-medium text-slate-800">{item.warehouse}</DnaTd>
                    <DnaTd className="text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="text-slate-700 max-w-xs truncate">{item.notes}</DnaTd>
                    <DnaTd className="text-center">
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
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
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
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="w-10 text-center">#</DnaTh>
                      <DnaTh>Nama Barang</DnaTh>
                      <DnaTh className="text-center">Satuan</DnaTh>
                      <DnaTh className="text-right">Stok Sistem</DnaTh>
                      <DnaTh className="text-right">Stok Fisik</DnaTh>
                      <DnaTh className="text-right">Selisih</DnaTh>
                      <DnaTh>Catatan</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedOpn.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                        <DnaTd className="font-medium text-slate-800">{it.name}</DnaTd>
                        <DnaTd className="text-center text-slate-600">{it.unit}</DnaTd>
                        <DnaTd className="text-right text-slate-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                        <DnaTd className="text-right font-semibold text-slate-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                        <DnaTd className={`text-right font-bold tabular-nums ${it.difference === 0 ? "text-slate-400" : it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </DnaTd>
                        <DnaTd className="text-slate-500">{it.notes || "-"}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
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
                value={formData.warehouseId}
                onChange={(e) => {
                  const selWh = warehouses.find((w: any) => w.id === e.target.value);
                  setFormData({
                    ...formData,
                    warehouseId: e.target.value,
                    warehouse: selWh?.name || e.target.value,
                  });
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {warehouses.length === 0 ? (
                  <option value="">Tidak ada gudang</option>
                ) : (
                  warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))
                )}
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
                  value={newItem.materialId}
                  onChange={(e) => {
                    const selMat = catalogMaterials.find((m: any) => m.id === e.target.value);
                    const stock = Number(selMat?.currentStock ?? selMat?.stockQty ?? 0);
                    setNewItem({
                      ...newItem,
                      materialId: e.target.value,
                      name: selMat?.name || e.target.value,
                      unit: selMat?.unit || "Unit",
                      systemQty: stock,
                      actualQty: stock,
                    });
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="">Pilih Material...</option>
                  {catalogMaterials.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.code ? `[${m.code}] ` : ""}{m.name} ({m.unit || "Unit"})
                    </option>
                  ))}
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
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="w-10 text-center">#</DnaTh>
                  <DnaTh>Barang</DnaTh>
                  <DnaTh className="text-center">Satuan</DnaTh>
                  <DnaTh className="text-right">Stok Sistem</DnaTh>
                  <DnaTh className="text-right">Stok Fisik</DnaTh>
                  <DnaTh className="text-right">Selisih</DnaTh>
                  <DnaTh>Catatan</DnaTh>
                  <DnaTh className="text-center w-12">Hapus</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {formData.items.map((it, idx) => (
                  <DnaTableRow key={idx}>
                    <DnaTd className="text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="font-medium text-slate-800">{it.name}</DnaTd>
                    <DnaTd className="text-center text-slate-600">{it.unit}</DnaTd>
                    <DnaTd className="text-right text-slate-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                    <DnaTd className="text-right font-bold text-slate-800 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                    <DnaTd className={`text-right font-bold tabular-nums ${it.difference === 0 ? "text-slate-400" : it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {it.difference > 0 ? `+${it.difference}` : it.difference}
                    </DnaTd>
                    <DnaTd className="text-slate-500">{it.notes || "-"}</DnaTd>
                    <DnaTd className="text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
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
