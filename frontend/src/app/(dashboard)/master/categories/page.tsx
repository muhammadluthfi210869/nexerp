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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaInput } from "@/components/dna/DnaInput";
import { TableShell } from "@/components/layout/TableShell";
import { StatCard } from "@/components/dna/StatCard";

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

  return (
    <TableShell
      title="Master"
      titleAccent="Categories"
      subtitle="Foundational Taxonomy Protocol"
      actions={
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", description: "", type: activeTab });
            setIsModalOpen(true);
          }}
        >
          Add Category
        </DnaButton>
      }
    >
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Total Categories" value={categories.length} subValue={activeTab === "GOODS" ? "Goods Categories" : activeTab === "SUPPLIER" ? "Supplier Categories" : "Customer Categories"} icon={<Layers />} />
        <StatCard label="Active" value={categories.filter(c => c.isActive).length} subValue="Live Classifications" icon={<CheckCircle2 />} />
        <StatCard label="Inactive" value={categories.filter(c => !c.isActive).length} subValue="Archived Taxonomies" icon={<XCircle />} />
      </div>
      <Tabs defaultValue="GOODS" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TableWrapper
          filters={
            <div className="flex items-center justify-between gap-4 w-full">
              <TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
                <TabsTrigger value="GOODS" className="rounded-lg px-5 py-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  GOODS
                </TabsTrigger>
                <TabsTrigger value="SUPPLIER" className="rounded-lg px-5 py-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  SUPPLIERS
                </TabsTrigger>
                <TabsTrigger value="CUSTOMER" className="rounded-lg px-5 py-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  CUSTOMERS
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                <DnaInput
                  icon={<Search />}
                  placeholder="Search taxonomy..."
                  className="md:w-56"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          }
        >
          <TabsContent value={activeTab} className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-table-header text-slate-400 px-6 py-4">Classification Name</TableHead>
                    <TableHead className="text-table-header text-slate-400 px-6 py-4">Audit Description</TableHead>
                    <TableHead className="text-table-header text-slate-400 px-6 py-4 text-center">Lifecycle Status</TableHead>
                    <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Synchronizing Registry...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id} className="group hover:bg-slate-50/30 border-b border-slate-50">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 text-xs uppercase block">{category.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Updated: {new Date(category.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase leading-relaxed max-w-md">
                          {category.description || "No description"}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <DnaBadge
                            status={category.isActive ? "success" : "default"}
                            onClick={() => toggleStatus(category)}
                          >
                            {category.isActive ? "Active" : "Inactive"}
                          </DnaBadge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <DnaButton variant="ghost" onClick={() => handleEdit(category)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </DnaButton>
                            <DnaButton variant="ghost" onClick={() => toggleStatus(category)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </DnaButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </TableWrapper>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
              {editingCategory ? "Update Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category Name</label>
              <input
                placeholder="e.g. RAW MATERIAL HIGH-VELOCITY"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description (Optional)</label>
              <input
                placeholder="Define category purpose..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
                Discard
              </DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingCategory ? "Update" : "Create"}
              </DnaButton>
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
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableShell>
  );
}
