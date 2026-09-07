"use client";

/**
 * Master Categories — Consolidated Page (Daftar + Kelola)
 *
 * Per Batch 6.3 user feedback: legacy ERP punya Kategori + Kelola Kategori
 * as 2 pages. Kita consolidated jadi 1 page dengan 2 tabs + type filter:
 *   - Tab 1: DAFTAR KATEGORI (read-only list with type filter)
 *   - Tab 2: KELOLA KATEGORI (CRUD form)
 *
 * Categories have 3 types (GOODS / SUPPLIER / CUSTOMER) per CSV column.
 * Type filter preserved as inner state.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableShell } from "@/components/layout/TableShell";
import {
  MasterPageShell,
  type MasterStatItem,
  type MasterTab,
} from "@/components/dna/MasterPageShell";

type CategoryType = "GOODS" | "SUPPLIER" | "CUSTOMER";

type Category = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CategoryType;
  isActive: boolean;
  updatedAt: string;
};

const TYPE_TABS: { key: CategoryType; label: string }[] = [
  { key: "GOODS", label: "Barang" },
  { key: "SUPPLIER", label: "Supplier" },
  { key: "CUSTOMER", label: "Customer" },
];

export default function MasterCategoriesPage() {
  // Consolidated tabs (Daftar vs Kelola)
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");

  // Type filter (inside both tabs)
  const [typeFilter, setTypeFilter] = useState<CategoryType>("GOODS");

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "GOODS" as CategoryType,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/master/categories?type=${typeFilter}`);
      setCategories(res.data);
    } catch {
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const filtered = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // Stats
  const totalCategories = filtered.length;
  const activeCategories = filtered.filter((c) => c.isActive).length;
  const inactiveCategories = filtered.filter((c) => !c.isActive).length;
  const withDescription = filtered.filter((c) => c.description).length;

  const stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
    { variant: "neutral", label: "Total Kategori", value: totalCategories, subtext: `Tipe ${typeFilter}`, icon: <Layers /> },
    { variant: "emerald", label: "Aktif", value: activeCategories, subtext: "Sedang digunakan", icon: <CheckCircle2 /> },
    { variant: "rose", label: "Non-aktif", value: inactiveCategories, subtext: "Tidak aktif", icon: <XCircle /> },
    { variant: "blue", label: "Dengan Deskripsi", value: withDescription, subtext: "Punya deskripsi", icon: <Search /> },
  ];

  const tabs: [MasterTab, MasterTab] = [
    { key: "DAFTAR", label: "Daftar Kategori", count: totalCategories },
    { key: "KELOLA", label: "Kelola Kategori", count: activeCategories },
  ];

  // CRUD handlers
  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      if (editingCategory) {
        await api.patch(`/master/categories/${editingCategory.id}`, formData);
        toast.success("Category updated");
      } else {
        await api.post("/master/categories", { ...formData, type: typeFilter });
        toast.success("Category created");
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ code: "", name: "", description: "", type: typeFilter });
      fetchCategories();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/master/categories/${id}`);
      toast.success("Deleted");
      setDeletingId(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setFormData({
      code: c.code,
      name: c.name,
      description: c.description || "",
      type: c.type,
    });
    setIsModalOpen(true);
  };

  return (
    <MasterPageShell
      title="KATEGORI"
      badge={<DnaBadge status="info">CATEGORY</DnaBadge>}
      subtitle="Master kategori barang, supplier, customer. Tab Daftar = lihat semua kategori per tipe. Tab Kelola = CRUD."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(k) => setActiveTab(k as "DAFTAR" | "KELOLA")}
      stats={stats}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nama, kode, atau deskripsi kategori..."
      daftarContent={
        <>
          {/* Inner type filter — preserves existing per-type functionality */}
          <div className="flex items-center gap-2 px-4 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tipe:
            </span>
            {TYPE_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  typeFilter === t.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <TableShell title={`Daftar Kategori — ${typeFilter}`}>
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50/75 border-b border-slate-200">
                  <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 text-left w-10">#</th>
                    <th className="p-3.5 text-left">Kode</th>
                    <th className="p-3.5 text-left">Nama</th>
                    <th className="p-3.5 text-left">Deskripsi</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Tidak ada kategori tipe {typeFilter}.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">
                          {c.code}
                        </td>
                        <td className="p-3.5 text-slate-900 font-medium">
                          {c.name}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {c.description || "-"}
                        </td>
                        <td className="p-3.5 text-center">
                          {c.isActive ? (
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
        </>
      }
      kelolaContent={
        <>
          {/* Inner type filter (controls which type new categories are) */}
          <div className="flex items-center gap-2 px-4 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tipe:
            </span>
            {TYPE_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  typeFilter === t.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="flex-1" />
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingCategory(null);
                setFormData({
                  code: "",
                  name: "",
                  description: "",
                  type: typeFilter,
                });
                setIsModalOpen(true);
              }}
            >
              Tambah Kategori
            </DnaButton>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <TableShell title={`Kelola Kategori — ${typeFilter}`}>
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50/75 border-b border-slate-200">
                  <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 text-left w-10">#</th>
                    <th className="p-3.5 text-left">Kode</th>
                    <th className="p-3.5 text-left">Nama</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Belum ada kategori tipe {typeFilter}.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-900">
                          {c.code}
                        </td>
                        <td className="p-3.5 text-slate-900 font-medium">
                          {c.name}
                        </td>
                        <td className="p-3.5 text-center">
                          {c.isActive ? (
                            <DnaBadge status="success">Aktif</DnaBadge>
                          ) : (
                            <DnaBadge status="default">Non-aktif</DnaBadge>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(c)}
                              className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(c.id)}
                              className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
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
        </>
      }

      {/* Modal: Add/Edit Category */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Kode *
              </label>
              <input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Nama *
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Deskripsi
              </label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
              />
            </div>
            <DialogFooter>
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton type="submit" variant="primary">
                {editingCategory ? "Simpan" : "Tambah"}
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
          <p>Yakin ingin menyimpan?</p>
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
            <DialogTitle>Hapus Kategori</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus?</p>
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
