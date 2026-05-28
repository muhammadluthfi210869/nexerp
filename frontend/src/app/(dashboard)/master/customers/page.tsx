"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  CreditCard,
  UserCircle,
  MapPin,
  User,
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
import { DnaInput } from "@/components/dna/DnaInput";
import { StatCard } from "@/components/dna/StatCard";
import { TableShell } from "@/components/layout/TableShell";
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

export default function MasterCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, catRes] = await Promise.all([
        api.get("/master/customers"),
        api.get("/master/categories?type=CUSTOMER"),
      ]);
      setCustomers(custRes.data);
      setCategories(catRes.data);
    } catch (err) {
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

  const handleSubmit = (e: React.FormEvent) => {
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
      fetchData();
    } catch (err) {
      toast.error("Constraint violation in partner registration");
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const activeCount = customers.filter(c => c.status === "ACTIVE").length;

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "", clientName: "", instansi: "", email: "", phone: "",
      address: "", alamatDetail: "", provinsi: "", kota: "", kecamatan: "",
      salesAssignee: "", status: "ACTIVE", categoryId: "", creditLimit: 0, taxId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
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

  return (
    <TableShell
      title="Global"
      titleAccent="Client Hub"
      subtitle="Commercial Partner Registry — B2B Commercial Ledger"
      actions={
        <DnaButton variant="primary" icon={<Plus />} onClick={openCreateModal}>
          Onboard Partner
        </DnaButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[var(--card-gap)]">
        <StatCard label="Partner Registry" value={customers.length} subValue="Total Clients" icon={<Building2 />} />
        <StatCard label="Active Revenue" value={activeCount} subValue="Active Partners" icon={<Activity />} />
        <StatCard label="Strategic Segments" value={categories.length} subValue="Categories" icon={<CreditCard />} />
        <StatCard label="Tax Compliance" value="100%" subValue="NPWP Coverage" icon={<ShieldCheck />} />
      </div>

      <TableWrapper
        filters={
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <span className="status-dot bg-blue-500" />
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                  Partner Directory
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  {filteredCustomers.length} Records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DnaInput
                icon={<Search />}
                placeholder="Search partner..."
                className="md:w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Partner Identity</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Classification</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Contact Protocol</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-center">Status</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Initializing Matrix...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-slate-50/30 border-b border-slate-50">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs uppercase block">{customer.clientName}</span>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">{customer.taxId || "NO TAX ID"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{customer.category?.name || "Tier 1 Partner"}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <Mail className="w-3 h-3" /> {customer.email || "---"}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <Phone className="w-3 h-3" /> {customer.phone || "---"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <DnaBadge status={customer.status === "ACTIVE" ? "success" : "default"}>
                      {customer.status}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DnaButton variant="ghost" onClick={() => openEditModal(customer)}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </DnaButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-6 bg-slate-800 text-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <UserCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black uppercase tracking-tight">
                  {editingCustomer ? "Edit Partner" : "Register Partner"}
                </DialogTitle>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">B2B Commercial Ledger</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company Name <span className="text-red-500">*</span></label>
                <input
                  placeholder="e.g. PT GLOBAL SYNERGY"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-300 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Instansi / Brand</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v ?? "" })}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tax ID (NPWP)</label>
                <input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</label>
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No. Telepon / WA</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
            </div>

            {/* Address Section */}
            <div className="p-5 bg-emerald-600/5 border border-emerald-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2">
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
                <label className="text-[9px] font-bold text-slate-400 uppercase">Alamat Detail</label>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sales Assignee</label>
              <Select value={formData.salesAssignee} onValueChange={(v) => setFormData({ ...formData, salesAssignee: v ?? "" })}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                  <SelectValue placeholder="Select BD/Sales Staff" />
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
              <h3 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Financial Liability
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Credit Limit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Status</label>
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
              <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>Discard</DnaButton>
              <DnaButton variant="primary" type="submit">
                {editingCustomer ? "Update Partner" : "Register Partner"}
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
