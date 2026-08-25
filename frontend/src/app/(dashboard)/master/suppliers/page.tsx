"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  Trash2,
} from "lucide-react";
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
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
  OperationalMetricGrid,
  OperationalMetricCard,
  OperationalPanel,
  OperationalInput,
  OperationalField,
  OperationalButton,
  OperationalStatusBadge,
} from "@/components/operational/OperationalUI";
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
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OperationalMigrationShell
      title="Pemasok"
      subtitle="Registri pemasok, kategori, kontak, dan ketentuan pembayaran"
      actions={
        <OperationalButton
          variant="primary"
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
          <Plus className="h-4 w-4" />
          <span>Tambah Pemasok</span>
        </OperationalButton>
      }
      filters={
        <OperationalInput
          icon={<Search className="h-4 w-4" />}
          placeholder="Cari pemasok..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-72"
        />
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Pemasok"
            value={suppliers.length}
            helper="Vendor aktif"
            icon={<Truck className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Kategori"
            value={categories.length}
            helper="Klasifikasi vendor"
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Performa Rata-rata"
            value="4.8"
            helper="Skor vendor"
            icon={<Star className="h-4 w-4" />}
            tone="amber"
          />
        </OperationalMetricGrid>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--card-gap)]">
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
              <OperationalPanel key={supplier.id} className="flex flex-col !p-0 overflow-hidden">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <Truck className="w-6 h-6" />
                    </div>
                    <OperationalStatusBadge status="pending">
                      {supplier.category?.name || "Tanpa Kategori"}
                    </OperationalStatusBadge>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{supplier.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-6">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    PIC: {supplier.contact || "—"}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <div className="p-1.5 bg-slate-50 rounded-lg"><Phone className="w-3.5 h-3.5" /></div>
                      {supplier.phone || "—"}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <div className="p-1.5 bg-slate-50 rounded-lg"><Mail className="w-3.5 h-3.5" /></div>
                      {supplier.email || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Termin Pembayaran</p>
                      <p className="text-sm font-black text-slate-900">{supplier.term_of_payment} Hari</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Pajak</p>
                      <p className="text-sm font-black text-slate-900">{supplier.tax != null ? `${supplier.tax}%` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Kota</p>
                      <p className="text-sm font-black text-slate-900">{supplier.city || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Kinerja</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black text-slate-900">4.8</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 flex items-center justify-between border-t border-slate-100">
                  <OperationalButton variant="ghost" onClick={() => {
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
                    Lihat Profil
                  </OperationalButton>
                  <div className="flex gap-1">
                    <OperationalButton variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></OperationalButton>
                    <OperationalButton variant="ghost" onClick={() => handleDelete(supplier.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></OperationalButton>
                  </div>
                </div>
              </OperationalPanel>
            ))
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Vendor" : "Onboard Vendor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="operational-stack">
            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Company Name *">
                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </OperationalField>
              <OperationalField label="Category">
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v ?? ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </OperationalField>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <OperationalField label="PIC Name">
                <input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
              </OperationalField>
              <OperationalField label="Phone">
                <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </OperationalField>
              <OperationalField label="Term of Payment">
                <input type="number" value={formData.term_of_payment} onChange={(e) => setFormData({...formData, term_of_payment: Number(e.target.value)})} />
              </OperationalField>
              <OperationalField label="Pajak (%)">
                <input type="number" step="0.01" value={formData.tax ?? ""} onChange={(e) => setFormData({...formData, tax: e.target.value ? Number(e.target.value) : null})} />
              </OperationalField>
            </div>

            <OperationalField label="Email">
              <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </OperationalField>

            <CascadingAddress
              provinsi={formData.province}
              kota={formData.city}
              kecamatan={formData.district}
              onProvinsiChange={(v) => setFormData({...formData, province: v})}
              onKotaChange={(v) => setFormData({...formData, city: v})}
              onKecamatanChange={(v) => setFormData({...formData, district: v})}
            />

            <OperationalField label="Address Detail">
              <input value={formData.addressDetail} onChange={(e) => setFormData({...formData, addressDetail: e.target.value})} />
            </OperationalField>

            <OperationalField label="Full Address">
              <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </OperationalField>

            <OperationalField label="Description">
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
            </OperationalField>

            <DialogFooter className="gap-3">
              <OperationalButton variant="secondary" onClick={() => setIsModalOpen(false)}>Discard</OperationalButton>
              <OperationalButton variant="primary" type="submit">
                {editingSupplier ? "Update" : "Register"}
                <ChevronRight className="w-4 h-4" />
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
