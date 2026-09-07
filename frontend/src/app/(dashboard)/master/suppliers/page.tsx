"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
  ExternalLink,
  MoreHorizontal,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaInput } from "@/components/dna/DnaInput";
import { StatCard } from "@/components/dna/StatCard";
import { DashboardCard } from "@/components/dna/DashboardCard";
import { TableShell } from "@/components/layout/TableShell";
import { CascadingAddress } from "@/components/ui/cascading-address";

type Category = { id: string; name: string };

type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  city: string;
  district: string;
  addressDetail: string;
  term_of_payment: number;
  tax: number | null;
  description: string | null;
  performanceScore: number;
  categoryId: string;
  category?: Category;
};

export default function MasterSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    city: "",
    district: "",
    addressDetail: "",
    term_of_payment: 0,
    tax: null as number | null,
    description: "",
    categoryId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppRes, catRes] = await Promise.all([
        api.get("/master/suppliers"),
        api.get("/master/categories?type=SUPPLIER"),
      ]);
      setSuppliers(suppRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error("Failed to fetch supply chain data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      if (editingSupplier) {
        await api.patch(`/master/suppliers/${editingSupplier.id}`, formData);
        toast.success("Supplier profile updated");
      } else {
        await api.post("/master/suppliers", formData);
        toast.success("New vendor onboarded successfully");
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      fetchData();
    } catch (err) {
      toast.error("Error in vendor registration");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus supplier ini?")) return;
    try {
      await api.delete(`/master/suppliers/${id}`);
      toast.success("Supplier berhasil dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus supplier");
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    (filterCategory === "ALL" || s.categoryId === filterCategory || s.category?.name === filterCategory) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("File tidak memiliki baris data.");
        return;
      }

      // Parse CSV or TSV format
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
      const parsed = lines.slice(1).map((line, idx) => {
        const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
        return {
          id: `imp-${idx}-${Date.now()}`,
          name: cols[0] || `Supplier Import ${idx + 1}`,
          contact: cols[1] || "PIC",
          phone: cols[2] || "-",
          email: cols[3] || "-",
          term_of_payment: Number(cols[4]) || 30,
          city: cols[5] || "Surabaya",
          categoryName: cols[6] || "Bahan Baku",
        };
      });

      setImportRows(parsed);
      toast.success(`${parsed.length} data vendor berhasil dibaca dari file.`);
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importRows.length === 0) {
      toast.error("Belum ada data vendor yang dimuat.");
      return;
    }

    setImportLoading(true);
    try {
      let successCount = 0;
      for (const row of importRows) {
        // Find matching category ID or use first
        const matchedCat = categories.find(c => c.name.toLowerCase().includes(row.categoryName.toLowerCase())) || categories[0];
        try {
          await api.post("/master/suppliers", {
            name: row.name,
            contact: row.contact,
            phone: row.phone,
            email: row.email,
            term_of_payment: row.term_of_payment,
            city: row.city,
            categoryId: matchedCat ? matchedCat.id : undefined,
          });
          successCount++;
        } catch {
          // continue batch
        }
      }
      toast.success(`${successCount} vendor berhasil diimport ke sistem.`);
      setIsImportModalOpen(false);
      setImportRows([]);
      fetchData();
    } catch {
      toast.error("Gagal memproses import data vendor.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <TableShell
      title="Vendor"
      titleAccent="Ecosystem"
      subtitle="Scale your procurement with qualified, categorized suppliers"
      actions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Excel
          </DnaButton>
          <DnaButton
            variant="primary"
            icon={<Plus />}
            onClick={() => {
              setEditingSupplier(null);
              setFormData({
                name: "", contact: "", phone: "", email: "",
                address: "", province: "", city: "", district: "",
                addressDetail: "", term_of_payment: 0, tax: null,
                description: "", categoryId: "",
              });
              setIsModalOpen(true);
            }}
          >
            Onboard Vendor
          </DnaButton>
        </div>
      }
      filters={
        <div className="flex items-center gap-3 w-full">
          <DnaInput
            icon={<Search />}
            placeholder="Search vendors..."
            className="md:w-72"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Bahan</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {filterCategory !== "ALL" && (
            <button onClick={() => setFilterCategory("ALL")} className="text-xs text-blue-600 hover:text-blue-800 font-bold">Reset</button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--card-gap)]">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Syncing vendors...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
            No vendors found
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <DashboardCard key={supplier.id} className="flex flex-col !p-0 overflow-hidden">
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Truck className="w-6 h-6" />
                  </div>
                  <DnaBadge status="warning">
                    {supplier.category?.name || "Uncategorized"}
                  </DnaBadge>
                </div>

                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{supplier.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-6">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  PIC: {supplier.contact || "N/A"}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><Phone className="w-3.5 h-3.5" /></div>
                    {supplier.phone || "---"}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <div className="p-1.5 bg-slate-50 rounded-lg"><Mail className="w-3.5 h-3.5" /></div>
                    {supplier.email || "---"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Net Terms</p>
                    <p className="text-sm font-black text-slate-900">{supplier.term_of_payment} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Pajak</p>
                    <p className="text-sm font-black text-slate-900">{supplier.tax != null ? `${supplier.tax}%` : "---"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Kota</p>
                    <p className="text-sm font-black text-slate-900">{supplier.city || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Performance</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-black text-slate-900">4.8</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 flex items-center justify-between border-t border-slate-100">
                <DnaButton variant="ghost" onClick={() => {
                  setEditingSupplier(supplier);
                  setFormData({
                    name: supplier.name,
                    contact: supplier.contact || "",
                    phone: supplier.phone || "",
                    email: supplier.email || "",
                    address: supplier.address || "",
                    province: supplier.province || "",
                    city: supplier.city || "",
                    district: supplier.district || "",
                    addressDetail: supplier.addressDetail || "",
                    term_of_payment: supplier.term_of_payment,
                    tax: supplier.tax ?? null,
                    description: supplier.description || "",
                    categoryId: supplier.categoryId || "",
                  });
                  setIsModalOpen(true);
                }}>
                  View Profile
                </DnaButton>
                <div className="flex gap-1">
                  <DnaButton variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></DnaButton>
                  <DnaButton variant="ghost" onClick={() => handleDelete(supplier.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></DnaButton>
                </div>
              </div>
            </DashboardCard>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
              {editingSupplier ? "Edit Vendor" : "Onboard Vendor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company Name <span className="text-red-500">*</span></label>
                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v ?? ""})}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PIC Name</label>
                  <input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Term of Payment</label>
                  <input type="number" value={formData.term_of_payment} onChange={(e) => setFormData({...formData, term_of_payment: Number(e.target.value)})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pajak (%)</label>
                  <input type="number" step="0.01" value={formData.tax ?? ""} onChange={(e) => setFormData({...formData, tax: e.target.value ? Number(e.target.value) : null})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
              </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</label>
              <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>

            <CascadingAddress
              provinsi={formData.province}
              kota={formData.city}
              kecamatan={formData.district}
              onProvinsiChange={(v) => setFormData({...formData, province: v})}
              onKotaChange={(v) => setFormData({...formData, city: v})}
              onKecamatanChange={(v) => setFormData({...formData, district: v})}
            />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Address Detail</label>
              <input value={formData.addressDetail} onChange={(e) => setFormData({...formData, addressDetail: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Address</label>
              <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none" />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>Discard</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingSupplier ? "Update" : "Register"}
                <ChevronRight className="w-4 h-4" />
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

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[750px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-6 bg-slate-800 text-white">
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
              Import Data Vendor (Excel / CSV)
            </DialogTitle>
            <p className="text-[10px] text-slate-300 mt-1">
              Upload file data vendor dengan format: Nama Vendor, PIC, No Telp, Email, TOP (Hari), Kota, Kategori.
            </p>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-slate-50/50">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-2">Mendukung format .csv, .xlsx, atau teks delimited</p>
            </div>

            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Preview Data ({importRows.length} baris):</span>
                  <DnaBadge status="info">{importRows.length} Vendor Siap Import</DnaBadge>
                </div>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">Nama Vendor</th>
                        <th className="p-2">PIC</th>
                        <th className="p-2">Telepon</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2 text-center">TOP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">{row.name}</td>
                          <td className="p-2">{row.contact}</td>
                          <td className="p-2">{row.phone}</td>
                          <td className="p-2">{row.categoryName}</td>
                          <td className="p-2 text-center">{row.term_of_payment} Hari</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importRows.length > 10 && (
                  <p className="text-[10px] text-slate-400 text-right">Menampilkan 10 dari {importRows.length} baris data.</p>
                )}
              </div>
            )}

            <DialogFooter className="pt-4 gap-2">
              <DnaButton variant="outline" onClick={() => { setIsImportModalOpen(false); setImportRows([]); }}>
                Batal
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={handleExecuteImport}
                disabled={importRows.length === 0 || importLoading}
              >
                {importLoading ? "Mengimpor..." : `Import ${importRows.length} Vendor`}
              </DnaButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </TableShell>
  );
}
