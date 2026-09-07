"use client";

/**
 * Master Gudang — Consolidated Page (Daftar Gudang + Kelola Gudang)
 *
 * Per user feedback: legacy ERP punya Gudang + Kelola Gudang as 2 pages.
 * Kita consolidate jadi 1 page dengan 2 tabs:
 * - Tab 1: DAFTAR GUDANG (read-only list — everyone can see)
 * - Tab 2: KELOLA GUDANG (CRUD — admin only)
 *
 * Pattern: ConsolidatedPage pattern per Batch 6 user requirement.
 * Tabs reduce sidebar menu items + clarify user intent.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  MapPin,
  Warehouse as WarehouseIcon,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaStatCard } from "@/components/dna/DnaStatCard";
import { DnaPageHeader } from "@/components/dna/layout/DnaPageHeader";
import { TableShell } from "@/components/layout/TableShell";

type Warehouse = {
  id: string;
  name: string;
  pic_name: string;
  description: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  _count: { locations: number };
};

export default function MasterWarehousesPage() {
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pic_name: "",
    description: "",
    phone: "",
    province: "",
    city: "",
    address: "",
  });

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/master/warehouses");
      setWarehouses(res.data);
    } catch (err) {
      toast.error("Failed to fetch warehouses");
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const filteredWarehouses = useMemo(() => {
    if (!searchQuery) return warehouses;
    const q = searchQuery.toLowerCase();
    return warehouses.filter(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        w.pic_name?.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q)
    );
  }, [warehouses, searchQuery]);

  // Stats
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter((w) => w.status === "ACTIVE").length;
  const totalLocations = warehouses.reduce(
    (sum, w) => sum + (w._count?.locations || 0),
    0
  );

  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      if (editingWarehouse) {
        await api.patch(`/master/warehouses/${editingWarehouse.id}`, formData);
        toast.success("Warehouse updated successfully");
      } else {
        await api.post("/master/warehouses", formData);
        toast.success("Warehouse created successfully");
      }
      setIsModalOpen(false);
      setEditingWarehouse(null);
      setFormData({
        name: "",
        pic_name: "",
        description: "",
        phone: "",
        province: "",
        city: "",
        address: "",
      });
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to save warehouse");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/master/warehouses/${id}`);
      toast.success("Warehouse deleted successfully");
      setDeletingId(null);
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to delete warehouse");
    }
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      pic_name: warehouse.pic_name || "",
      description: warehouse.description || "",
      phone: warehouse.phone || "",
      province: warehouse.province || "",
      city: warehouse.city || "",
      address: warehouse.address || "",
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* Page Header with Tabs (DAFTAR + KELOLA) — consolidated Gudang page */}
      <DnaPageHeader
        title="GUDANG"
        badge={<DnaBadge status="info">WAREHOUSE</DnaBadge>}
        subtitle="Daftar gudang & kelola gudang. Tab Daftar = lihat semua gudang. Tab Kelola = CRUD."
        tabs={[
          { key: "DAFTAR", label: "Daftar Gudang", count: totalWarehouses },
          { key: "KELOLA", label: "Kelola Gudang", count: activeWarehouses },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as any)}
      />

      {/* KPI Cards — visible di kedua tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <DnaStatCard
          variant="neutral"
          label="Total Gudang"
          value={totalWarehouses}
          subtext="Seluruh gudang terdaftar"
          icon={<WarehouseIcon />}
        />
        <DnaStatCard
          variant="emerald"
          label="Gudang Aktif"
          value={activeWarehouses}
          subtext="Sedang operasional"
          icon={<CheckCircle2 />}
        />
        <DnaStatCard
          variant="amber"
          label="Total Lokasi"
          value={totalLocations}
          subtext="Storage area / bin location"
          icon={<Layers />}
        />
        <DnaStatCard
          variant="blue"
          label="Kota"
          value={[...new Set(warehouses.map((w) => w.city).filter(Boolean))].length}
          subtext="Lokasi gudang tersebar"
          icon={<MapPin />}
        />
      </div>

      {/* Toolbar Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center gap-2">
        <div className="relative flex-1 md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari gudang, PIC, atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* ======================== */}
      {/* TAB 1: DAFTAR GUDANG (read-only list) */}
      {/* ======================== */}
      {activeTab === "DAFTAR" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <TableShell
            title="Daftar Gudang"
            actions={
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("KELOLA")}
              >
                Ke Kelola →
              </DnaButton>
            }
          >
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50/75 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3.5 text-left w-10">#</th>
                  <th className="p-3.5 text-left">Nama Gudang</th>
                  <th className="p-3.5 text-left">PIC</th>
                  <th className="p-3.5 text-left">Lokasi</th>
                  <th className="p-3.5 text-center">Lokasi</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarehouses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      Tidak ada gudang.
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((w, idx) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{w.name}</div>
                        {w.description && (
                          <div className="text-[11px] text-slate-500">
                            {w.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">{w.pic_name || "-"}</td>
                      <td className="p-3.5 text-slate-700">
                        {w.city || "-"}
                        {w.province && (
                          <div className="text-[11px] text-slate-500">
                            {w.province}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center text-slate-700">
                        {w._count?.locations || 0}
                      </td>
                      <td className="p-3.5 text-center">
                        {w.status === "ACTIVE" ? (
                          <DnaBadge status="success">Aktif</DnaBadge>
                        ) : (
                          <DnaBadge status="default">Non-aktif</DnaBadge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      )}

      {/* ======================== */}
      {/* TAB 2: KELOLA GUDANG (CRUD form table) */}
      {/* ======================== */}
      {activeTab === "KELOLA" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <TableShell
            title="Kelola Gudang"
            actions={
              <DnaButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setEditingWarehouse(null);
                  setFormData({
                    name: "",
                    pic_name: "",
                    description: "",
                    phone: "",
                    province: "",
                    city: "",
                    address: "",
                  });
                  setIsModalOpen(true);
                }}
              >
                Tambah Gudang
              </DnaButton>
            }
          >
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50/75 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3.5 text-left w-10">#</th>
                  <th className="p-3.5 text-left">Nama Gudang</th>
                  <th className="p-3.5 text-left">PIC</th>
                  <th className="p-3.5 text-left">Kota</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarehouses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      Tidak ada gudang. Klik "Tambah Gudang" untuk menambah.
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((w, idx) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{w.name}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">{w.pic_name || "-"}</td>
                      <td className="p-3.5 text-slate-700">{w.city || "-"}</td>
                      <td className="p-3.5 text-center">
                        {w.status === "ACTIVE" ? (
                          <DnaBadge status="success">Aktif</DnaBadge>
                        ) : (
                          <DnaBadge status="default">Non-aktif</DnaBadge>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(w)}
                            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(w.id)}
                            className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      )}

      {/* ======================== */}
      {/* MODAL: Add/Edit Warehouse */}
      {/* ======================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit Gudang" : "Tambah Gudang"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Nama Gudang *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  PIC
                </label>
                <Input
                  value={formData.pic_name}
                  onChange={(e) =>
                    setFormData({ ...formData, pic_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Provinsi
                </label>
                <Input
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({ ...formData, province: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Kota
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Telepon
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Alamat
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Deskripsi
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <DnaButton
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </DnaButton>
              <DnaButton type="submit" variant="primary">
                {editingWarehouse ? "Simpan Perubahan" : "Tambah Gudang"}
              </DnaButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Submit */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menyimpan data gudang ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>
              Ya, Simpan
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Gudang</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus gudang ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setDeletingId(null)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={() => deletingId && handleDelete(deletingId)}>
              Ya, Hapus
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
