"use client";

/**
 * Master Customer — Consolidated Page (Daftar + Kelola)
 *
 * Per Batch 6.3 user feedback: legacy ERP punya Customer + Kelola Customer
 * as 2 pages. Kita consolidated jadi 1 page dengan 2 tabs:
 *   - Tab 1: DAFTAR CUSTOMER (read-only partner directory)
 *   - Tab 2: KELOLA CUSTOMER (CRUD with full partner profile)
 *
 * Per REQUIREMENT Poin 2: Customer form supports Sample/Produksi/Legalitas
 * sections via category tagging.
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Activity,
  CreditCard,
  UserCircle,
  MapPin,
  Edit2,
  Trash2,
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
import { TableWrapper } from "@/components/dna/TableWrapper";
import {
  MasterPageShell,
  type MasterStatItem,
  type MasterTab,
} from "@/components/dna";
import { CascadingAddress } from "@/components/ui/cascading-address";

type Customer = {
  id: string;
  name: string;
  clientName: string;
  instansi?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  alamatDetail?: string | null;
  provinsi?: string | null;
  kota?: string | null;
  kecamatan?: string | null;
  salesAssignee?: string | null;
  status: "ACTIVE" | "INACTIVE";
  type: string | null;
  categoryId: string | null;
  category?: { name: string } | null;
  creditLimit: number;
  taxId: string | null;
};

const EMPTY_FORM = {
  name: "",
  clientName: "",
  instansi: "",
  email: "",
  phone: "",
  address: "",
  alamatDetail: "",
  provinsi: "",
  kota: "",
  kecamatan: "",
  salesAssignee: "",
  status: "ACTIVE",
  categoryId: "",
  creditLimit: 0,
  taxId: "",
};

export default function MasterCustomersPage() {
  // Consolidated tabs
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, catRes] = await Promise.all([
        api.get("/master/customers"),
        api.get("/master/categories?type=CUSTOMER"),
      ]);
      setCustomers(custRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Failed to sync customer ecosystem");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      try {
        const res = await api.get("/bussdev/staffs");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setUsers([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/master/customers/${id}`);
      toast.success("Customer deleted successfully");
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      if (editingCustomer) {
        await api.patch(`/master/customers/${editingCustomer.id}`, formData);
        toast.success("Strategic partner record updated");
      } else {
        await api.post("/master/customers", formData);
        toast.success("New commercial partner registered");
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchData();
    } catch {
      toast.error("Constraint violation in partner registration");
    }
  };

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      clientName: customer.clientName,
      instansi: customer.instansi || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      alamatDetail: customer.alamatDetail || "",
      provinsi: customer.provinsi || "",
      kota: customer.kota || "",
      kecamatan: customer.kecamatan || "",
      salesAssignee: customer.salesAssignee || "",
      status: customer.status,
      categoryId: customer.categoryId || "",
      creditLimit: customer.creditLimit,
      taxId: customer.taxId || "",
    });
    setIsModalOpen(true);
  };

  // Stats
  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.status === "ACTIVE").length;
  const inactiveCount = customers.filter((c) => c.status === "INACTIVE").length;
  const withTaxId = customers.filter((c) => c.taxId && c.taxId !== "").length;

  const stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
    { variant: "neutral", label: "Total Customer", value: totalCustomers, subtext: "Partner terdaftar", icon: <Building2 /> },
    { variant: "emerald", label: "Customer Aktif", value: activeCount, subtext: "Sedang aktif", icon: <Activity /> },
    { variant: "rose", label: "Non-aktif", value: inactiveCount, subtext: "Tidak aktif", icon: <Activity /> },
    { variant: "blue", label: "NPWP Lengkap", value: withTaxId, subtext: "Tax compliance", icon: <ShieldCheck /> },
  ];

  const tabs: [MasterTab, MasterTab] = [
    { key: "DAFTAR", label: "Daftar Customer", count: totalCustomers },
    { key: "KELOLA", label: "Kelola Customer", count: activeCount },
  ];

  // ── Reusable Customer Table ──
  const CustomerTable = ({ showActions }: { showActions: boolean }) => (
    <TableWrapper>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Partner Identity</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Classification</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5">Contact Protocol</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center">Status</TableHead>
              {showActions && (
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3.5 text-center w-24">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={showActions ? 5 : 4} className="py-20 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Initializing Matrix...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 5 : 4} className="py-12 text-center text-slate-400">
                  Tidak ada customer.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-slate-50/80 border-b border-slate-100">
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs uppercase block">{customer.clientName}</span>
                        <span className="text-[11px] text-blue-600 uppercase">{customer.taxId || "NO TAX ID"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span className="text-[11px] text-slate-500">{customer.category?.name || "Tier 1 Partner"}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Mail className="w-3 h-3" /> {customer.email || "---"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3" /> {customer.phone || "---"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-center">
                    <DnaBadge status={customer.status === "ACTIVE" ? "success" : "default"}>
                      {customer.status}
                    </DnaBadge>
                  </TableCell>
                  {showActions && (
                    <TableCell className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(customer)}
                          className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(customer.id)}
                          className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TableWrapper>
  );

  const daftarContent = <CustomerTable showActions={false} />;

  const kelolaContent = (
    <>
      <div className="flex items-center justify-end mb-3">
        <DnaButton
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
        >
          Tambah Customer
        </DnaButton>
      </div>
      <CustomerTable showActions={true} />
    </>
  );

  return (
    <>
      <MasterPageShell
        title="CUSTOMER"
        badge={<DnaBadge status="info">CLIENT HUB</DnaBadge>}
        subtitle="Master customer / partner B2B. Tab Daftar = lihat semua customer. Tab Kelola = CRUD."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "DAFTAR" | "KELOLA")}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama partner atau email..."
        daftarContent={daftarContent}
        kelolaContent={kelolaContent}
      />

      {/* Modal: Add/Edit Customer */}
      <Dialog open={isModalOpen} onOpenChange={(o) => { setIsModalOpen(o); if (!o) setEditingCustomer(null); }}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-6 bg-slate-800 text-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <UserCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">
                  {editingCustomer ? "Edit Partner" : "Tambah Customer"}
                </DialogTitle>
                <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">B2B Commercial Ledger</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Perusahaan *</label>
                <input
                  placeholder="e.g. PT GLOBAL SYNERGY"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instansi / Brand</label>
                <input
                  placeholder="e.g. Brand Cosmetics"
                  value={formData.instansi}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v ?? "" })}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {categories.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tax ID (NPWP)</label>
                <input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Telepon / WA</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
            </div>

            {/* Address Section */}
            <div className="p-5 bg-emerald-600/5 border border-emerald-100 rounded-2xl space-y-4">
              <h3 className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Alamat & Wilayah
              </h3>
              <CascadingAddress
                provinsi={formData.provinsi}
                kota={formData.kota}
                kecamatan={formData.kecamatan}
                onProvinsiChange={(v) => setFormData({ ...formData, provinsi: v })}
                onKotaChange={(v) => setFormData({ ...formData, kota: v })}
                onKecamatanChange={(v) => setFormData({ ...formData, kecamatan: v })}
              />
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Alamat Detail</label>
                <textarea
                  placeholder="Jalan, RT/RW, Patokan gedung..."
                  value={formData.alamatDetail}
                  onChange={(e) => setFormData({ ...formData, alamatDetail: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                />
              </div>
            </div>

            {/* Sales Assignee */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sales Assignee</label>
              <Select value={formData.salesAssignee} onValueChange={(v) => setFormData({ ...formData, salesAssignee: v ?? "" })}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                  <SelectValue placeholder="Pilih BD/Sales Staff" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.fullName || u.name || u.id} className="text-xs font-bold uppercase">
                      {u.fullName || u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Financial */}
            <div className="p-5 bg-blue-600/5 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-[11px] font-bold text-blue-600 uppercase flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Tanggung Jawab Finansial
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Credit Limit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v ?? "ACTIVE" })}>
                    <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="ACTIVE" className="text-xs font-bold uppercase">Active</SelectItem>
                      <SelectItem value="INACTIVE" className="text-xs font-bold uppercase">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DnaButton variant="outline" onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }}>Batal</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingCustomer ? "Simpan" : "Tambah"}
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
          <p>Yakin ingin menyimpan data customer ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Customer</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus customer ini dari master data?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setDeletingId(null)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={() => deletingId && handleDelete(deletingId)}>Ya, Hapus</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
