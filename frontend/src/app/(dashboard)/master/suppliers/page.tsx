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
  performanceScore: number;
  categoryId: string;
  category?: Category;
};

export default function MasterSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TableShell
      title="Vendor"
      titleAccent="Ecosystem"
      subtitle="Scale your procurement with qualified, categorized suppliers"
      actions={
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setEditingSupplier(null);
            setFormData({
              name: "", contact: "", phone: "", email: "",
              address: "", province: "", city: "", district: "",
              addressDetail: "", term_of_payment: 0, categoryId: "",
            });
            setIsModalOpen(true);
          }}
        >
          Onboard Vendor
        </DnaButton>
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
            <div key={supplier.id} className="bg-white border border-[var(--border-color)] rounded-2xl shadow-card hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Truck className="w-6 h-6" />
                  </div>
                  <DnaBadge status="warning">
                    {supplier.category?.name || "Uncategorized"}
                  </DnaBadge>
                </div>

                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{supplier.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-4">
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

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-5">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net Terms</p>
                    <p className="text-sm font-black text-slate-900">{supplier.term_of_payment} Days</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Performance</p>
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
                    categoryId: supplier.categoryId || "",
                  });
                  setIsModalOpen(true);
                }}>
                  View Profile
                </DnaButton>
                <div className="flex gap-1">
                  <DnaButton variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></DnaButton>
                  <DnaButton variant="ghost"><MoreHorizontal className="w-3.5 h-3.5" /></DnaButton>
                </div>
              </div>
            </div>
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

            <div className="grid grid-cols-3 gap-4">
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
    </TableShell>
  );
}
