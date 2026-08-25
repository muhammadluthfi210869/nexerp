"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Zap,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  OperationalMigrationShell,
} from "@/components/operational/OperationalMigrationShell";
import {
  OperationalMetricGrid,
  OperationalMetricCard,
  OperationalPanel,
  OperationalTabs,
  OperationalTabsList,
  OperationalTabsTrigger,
  OperationalTabsContent,
  OperationalInput,
  OperationalField,
  OperationalButton,
  OperationalDataTable,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  description: string;
  type: "GOODS" | "SUPPLIER" | "CUSTOMER";
  isActive: boolean;
  updatedAt: string;
};

export default function MasterCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"GOODS" | "SUPPLIER" | "CUSTOMER">("GOODS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "GOODS" as "GOODS" | "SUPPLIER" | "CUSTOMER",
  });

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/master/categories?type=${activeTab}`);
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      if (editingCategory) {
        await api.patch(`/master/categories/${editingCategory.id}`, formData);
        toast.success("Category updated successfully");
      } else {
        await api.post("/master/categories", { ...formData, type: activeTab });
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", type: activeTab });
      fetchCategories();
    } catch (err) {
      toast.error("Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (category: Category) => {
    try {
      await api.patch(`/master/categories/${category.id}`, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? "deactivated" : "activated"}`);
      fetchCategories();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<Category>[] = [
    {
      id: "name",
      header: "Nama Klasifikasi",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-xs uppercase">{row.original.name}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Updated: {formatOperationalDate(row.original.updatedAt)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "description",
      header: "Deskripsi",
      accessorFn: (row) => row.description || "",
      cell: ({ row }) => (
        <span className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed max-w-md">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.isActive,
      cell: ({ row }) => (
        <OperationalStatusBadge status={row.original.isActive ? "success" : "neutral"}>
          {getOperationalStatusLabel(row.original.isActive ? "ACTIVE" : "INACTIVE")}
        </OperationalStatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <OperationalButton variant="ghost" onClick={() => handleEdit(row.original)}>
            <Edit2 className="w-3.5 h-3.5" />
          </OperationalButton>
          <OperationalButton variant="ghost" onClick={() => toggleStatus(row.original)}>
            <Trash2 className="w-3.5 h-3.5" />
          </OperationalButton>
        </div>
      ),
    },
  ];

  return (
    <OperationalMigrationShell
      title="Kategori Master"
      subtitle="Klasifikasi dasar barang, pemasok, dan pelanggan"
      actions={
        <OperationalButton
          variant="primary"
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", description: "", type: activeTab });
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Kategori"
            value={categories.length}
            helper={activeTab === "GOODS" ? "Kategori Barang" : activeTab === "SUPPLIER" ? "Kategori Pemasok" : "Kategori Pelanggan"}
            icon={<Layers className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Aktif"
            value={categories.filter(c => c.isActive).length}
            helper="Klasifikasi aktif"
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Tidak Aktif"
            value={categories.filter(c => !c.isActive).length}
            helper="Klasifikasi diarsipkan"
            icon={<XCircle className="h-4 w-4" />}
            tone="red"
          />
        </OperationalMetricGrid>

        <OperationalTabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <OperationalPanel className="flex items-center justify-between gap-4 w-full">
            <OperationalTabsList>
              <OperationalTabsTrigger value="GOODS">Barang</OperationalTabsTrigger>
              <OperationalTabsTrigger value="SUPPLIER">Pemasok</OperationalTabsTrigger>
              <OperationalTabsTrigger value="CUSTOMER">Pelanggan</OperationalTabsTrigger>
            </OperationalTabsList>
            <div className="flex items-center gap-3">
              <OperationalInput
                icon={<Search className="h-4 w-4" />}
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:w-72"
              />
            </div>
          </OperationalPanel>

          <OperationalTabsContent value={activeTab} className="m-0">
            <OperationalDataTable
              data={filteredCategories}
              columns={columns as any}
              getRowId={(row: Category) => row.id}
              searchPlaceholder=""
              enableSearch={false}
              enableColumnVisibility={false}
              loading={loading}
              emptyMessage="No categories found"
            />
          </OperationalTabsContent>
        </OperationalTabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Update Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="operational-stack">
            <OperationalField label="Category Name">
              <input
                placeholder="e.g. RAW MATERIAL HIGH-VELOCITY"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </OperationalField>
            <OperationalField label="Description (Optional)">
              <input
                placeholder="Define category purpose..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </OperationalField>
            <DialogFooter className="gap-3">
              <OperationalButton variant="secondary" onClick={() => setIsModalOpen(false)}>
                Discard
              </OperationalButton>
              <OperationalButton variant="primary" type="submit">
                {editingCategory ? "Update" : "Create"}
              </OperationalButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <OperationalButton variant="secondary" onClick={() => setShowConfirm(false)}>Batal</OperationalButton>
            <OperationalButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
