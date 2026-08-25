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
  Trash2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  OperationalDataTable,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
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

  const handleDelete = async (customer: Customer) => {
    try {
      await api.delete(`/master/customers/${customer.id}`);
      toast.success("Customer deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

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

  const columns: ColumnDef<Customer>[] = [
    {
      id: "identity",
      header: "Identitas Pelanggan",
      accessorFn: (row) => row.clientName,
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-xs uppercase">{row.original.clientName}</div>
            <div className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">
              {row.original.taxId || "NPWP BELUM DIISI"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Klasifikasi",
      accessorFn: (row) => row.category?.name || "Tier 1 Partner",
      cell: ({ row }) => (
        <span className="text-[10px] font-black text-slate-400 uppercase">
          {row.original.category?.name || "Tier 1 Partner"}
        </span>
      ),
    },
    {
      id: "contact",
      header: "Kontak",
      accessorFn: (row) => row.email || "",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <Mail className="w-3 h-3" /> {row.original.email || "—"}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <Phone className="w-3 h-3" /> {row.original.phone || "—"}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ row }) => (
        <OperationalStatusBadge status={row.original.status === "ACTIVE" ? "success" : "neutral"}>
          {getOperationalStatusLabel(row.original.status)}
        </OperationalStatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <OperationalButton variant="ghost" onClick={() => openEditModal(row.original)}>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </OperationalButton>
          <OperationalButton variant="ghost" onClick={() => handleDelete(row.original)}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </OperationalButton>
        </div>
      ),
    },
  ];

  return (
    <OperationalMigrationShell
      title="Pelanggan"
      subtitle="Registri pelanggan dan mitra komersial B2B"
      actions={
        <OperationalButton variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          <span>Tambah Pelanggan</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Pelanggan"
            value={customers.length}
            helper="Registri pelanggan"
            icon={<Building2 className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Pelanggan Aktif"
            value={activeCount}
            helper="Mitra aktif"
            icon={<Activity className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Segmen"
            value={categories.length}
            helper="Kategori pelanggan"
            icon={<CreditCard className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Kelengkapan Pajak"
            value="100%"
            helper="Cakupan NPWP"
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="amber"
          />
        </OperationalMetricGrid>

        <OperationalPanel className="flex items-center justify-between gap-4 w-full">
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
            <OperationalInput
              icon={<Search className="h-4 w-4" />}
              placeholder="Cari pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-72"
            />
          </div>
        </OperationalPanel>

        <OperationalDataTable
          data={filteredCustomers}
          columns={columns as any}
          getRowId={(row: Customer) => row.id}
          searchPlaceholder=""
          enableSearch={false}
          enableColumnVisibility={false}
          loading={loading}
          emptyMessage="Initializing Matrix..."
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <UserCircle className="w-6 h-6 text-blue-400" />
              <div>
                <DialogTitle>
                  {editingCustomer ? "Edit Partner" : "Register Partner"}
                </DialogTitle>
                <DialogDescription>B2B Commercial Ledger</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="operational-stack">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Company Name *">
                <input
                  placeholder="e.g. PT GLOBAL SYNERGY"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  autoFocus
                />
              </OperationalField>
              <OperationalField label="Instansi / Brand">
                <input
                  placeholder="e.g. Brand Cosmetics"
                  value={formData.instansi}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                />
              </OperationalField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Category">
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </OperationalField>
              <OperationalField label="Tax ID (NPWP)">
                <input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
              </OperationalField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <OperationalField label="Email">
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </OperationalField>
              <OperationalField label="No. Telepon / WA">
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </OperationalField>
            </div>

            {/* Address Section */}
            <div className="operational-panel p-5 space-y-4">
              <h3 className="operational-section-title">
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
              <OperationalField label="Alamat Detail">
                <textarea
                  placeholder="Jalan, RT/RW, Patokan gedung..."
                  value={formData.alamatDetail}
                  onChange={(e) => setFormData({ ...formData, alamatDetail: e.target.value })}
                  rows={2}
                />
              </OperationalField>
            </div>

            {/* Sales Assignee */}
            <OperationalField label="Sales Assignee">
              <Select value={formData.salesAssignee} onValueChange={(v) => setFormData({ ...formData, salesAssignee: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BD/Sales Staff" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.fullName || u.name || u.id}>
                      {u.fullName || u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OperationalField>

            {/* Financial */}
            <div className="operational-panel p-5 space-y-4">
              <h3 className="operational-section-title">
                <CreditCard className="w-3.5 h-3.5" />
                Financial Liability
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <OperationalField label="Credit Limit">
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  />
                </OperationalField>
                <OperationalField label="Status">
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v ?? "ACTIVE" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </OperationalField>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <OperationalButton variant="secondary" onClick={() => setIsModalOpen(false)}>Discard</OperationalButton>
              <OperationalButton variant="primary" type="submit">
                {editingCustomer ? "Update Partner" : "Register Partner"}
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
