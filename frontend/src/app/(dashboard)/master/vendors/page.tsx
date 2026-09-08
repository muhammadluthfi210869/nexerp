"use client";

/**
 * Master Vendor — Consolidated Page (Daftar + Kelola)
 *
 * Per Batch 6.3 user feedback: legacy ERP punya Vendor + Kelola Vendor
 * as 2 pages. Kita consolidated jadi 1 page dengan 2 tabs:
 *   - Tab 1: DAFTAR VENDOR (read-only list with detail modal)
 *   - Tab 2: KELOLA VENDOR (CRUD with Import Excel + Tambah form)
 *
 * Special: Uses mock data (INITIAL_VENDORS) instead of API. Category filter
 * preserved as inner state (Bahan Baku, Kemasan, Jasa, Utilitas).
 */

import { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Filter,
} from "lucide-react";
import {
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdCode,
  DnaBadge,
  DnaButton,
  DnaModal,
  DnaPagination,
  DnaEmptyState,
  MasterPageShell,
  type MasterStatItem,
  type MasterTab,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface VendorItem {
  id: string;
  vendorCode: string;
  name: string;
  pic: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  realCategory: "Bahan Baku" | "Kemasan Primer" | "Kemasan Sekunder" | "Bahan Pembantu" | "Jasa Maklon" | "Mesin & Sparepart";
  coaCategory: "11310 - Persediaan Bahan Baku" | "11320 - Persediaan Kemasan" | "51100 - Beban Pokok Jasa" | "12100 - Aset Tetap Pabrik";
  taxStatus: "PKP (11%)" | "NON_PKP (0%)";
  paymentTermDays: number;
  totalActivePO: number;
  status: "ACTIVE" | "INACTIVE";
}

const INITIAL_VENDORS: VendorItem[] = [
  { id: "V-01", vendorCode: "VND-BB-001", name: "PT Surya Kimia Farma", pic: "Wenny Sulistyo", phone: "0822-4402-3077", email: "wenny@suryakimia.co.id", city: "Jakarta Pusat", address: "Menara BCA Lt. 39, Jl. M.H. Thamrin No. 1", realCategory: "Bahan Baku", coaCategory: "11310 - Persediaan Bahan Baku", taxStatus: "PKP (11%)", paymentTermDays: 30, totalActivePO: 4, status: "ACTIVE" },
  { id: "V-02", vendorCode: "VND-BB-002", name: "PT Iberchem Indonesia", pic: "Yonatan Pratama", phone: "0878-5111-7541", email: "yonatan@iberchem.com", city: "Surabaya", address: "Rungkut Industri III No. 45, Surabaya", realCategory: "Bahan Baku", coaCategory: "11310 - Persediaan Bahan Baku", taxStatus: "NON_PKP (0%)", paymentTermDays: 14, totalActivePO: 2, status: "ACTIVE" },
  { id: "V-03", vendorCode: "VND-KP-001", name: "PT Reda Packaging Mandiri", pic: "Sandi Kurniawan", phone: "0812-3655-7377", email: "sandi@reda.co.id", city: "Tangerang", address: "Kawasan Pergudangan Pantai Indah Dadap Blok C-12", realCategory: "Kemasan Primer", coaCategory: "11320 - Persediaan Kemasan", taxStatus: "PKP (11%)", paymentTermDays: 30, totalActivePO: 5, status: "ACTIVE" },
  { id: "V-04", vendorCode: "VND-KS-001", name: "CV Cahaya Printing Box", pic: "Hendra Wijaya", phone: "0812-8833-4411", email: "hendra@cahayaprint.com", city: "Bandung", address: "Jl. Soekarno Hatta No. 240, Bandung", realCategory: "Kemasan Sekunder", coaCategory: "11320 - Persediaan Kemasan", taxStatus: "PKP (11%)", paymentTermDays: 14, totalActivePO: 2, status: "ACTIVE" },
  { id: "V-05", vendorCode: "VND-BP-001", name: "PT Sumber Kimia Makmur", pic: "Bambang Santoso", phone: "0811-9876-5432", email: "sales@sumberkimia.co.id", city: "Semarang", address: "Kawasan Industri Wijayakusuma Blok B", realCategory: "Bahan Pembantu", coaCategory: "11310 - Persediaan Bahan Baku", taxStatus: "PKP (11%)", paymentTermDays: 30, totalActivePO: 3, status: "ACTIVE" },
];

export default function MasterVendorsPage() {
  // Consolidated tabs
  const [activeTab, setActiveTab] = useState<"DAFTAR" | "KELOLA">("DAFTAR");
  const [vendors, setVendors] = useState<VendorItem[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [coaFilter, setCoaFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawers & Modals
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<VendorItem>>({
    vendorCode: `VND-${String(Math.floor(Math.random() * 900) + 100)}`,
    name: "",
    pic: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    realCategory: "Bahan Baku",
    coaCategory: "11310 - Persediaan Bahan Baku",
    taxStatus: "PKP (11%)",
    paymentTermDays: 30,
    status: "ACTIVE",
  });

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        v.name.toLowerCase().includes(q) ||
        v.vendorCode.toLowerCase().includes(q) ||
        v.pic.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "ALL" || v.realCategory === categoryFilter;
      const matchCoa = coaFilter === "ALL" || v.coaCategory.includes(coaFilter);
      return matchSearch && matchCategory && matchCoa;
    });
  }, [vendors, search, categoryFilter, coaFilter]);

  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVendors.slice(start, start + pageSize);
  }, [filteredVendors, currentPage]);

  // Stats
  const activeCount = vendors.filter((v) => v.status === "ACTIVE").length;
  const rawMaterialCount = vendors.filter((v) => v.realCategory === "Bahan Baku").length;
  const packagingCount = vendors.filter((v) => v.realCategory.includes("Kemasan")).length;
  const auxCount = vendors.filter((v) => v.realCategory === "Bahan Pembantu").length;
  const maklonCount = vendors.filter((v) => v.realCategory === "Jasa Maklon").length;

  const stats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
    { variant: "blue", label: "Total Pemasok Aktif", value: activeCount, subtext: "Supplier kimia & kemasan", icon: <Building2 /> },
    { variant: "emerald", label: "Vendor Bahan Baku", value: rawMaterialCount, subtext: "CoA 11310 Raw Material", icon: <Building2 /> },
    { variant: "amber", label: "Vendor Packaging", value: packagingCount, subtext: "CoA 11320 Kemasan", icon: <Building2 /> },
    { variant: "slate", label: "Total Rekanan", value: vendors.length, subtext: "Supplier terdaftar", icon: <Building2 /> },
  ];

  const tabs: [MasterTab, MasterTab] = [
    { key: "DAFTAR", label: "Daftar Vendor", count: vendors.length },
    { key: "KELOLA", label: "Kelola Vendor", count: activeCount },
  ];

  // CRUD handlers
  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    if (!formData.name || !formData.pic) {
      toast.error("Mohon lengkapi Nama Vendor dan Nama PIC!");
      return;
    }

    const newVendor: VendorItem = {
      id: editingVendor?.id || `V-${Date.now()}`,
      vendorCode: formData.vendorCode || `VND-${Date.now()}`,
      name: formData.name,
      pic: formData.pic,
      phone: formData.phone || "-",
      email: formData.email || "-",
      city: formData.city || "-",
      address: formData.address || "-",
      realCategory: formData.realCategory as VendorItem["realCategory"],
      coaCategory: formData.coaCategory as VendorItem["coaCategory"],
      taxStatus: formData.taxStatus as VendorItem["taxStatus"],
      paymentTermDays: Number(formData.paymentTermDays) || 30,
      totalActivePO: editingVendor?.totalActivePO || 0,
      status: "ACTIVE",
    };

    if (editingVendor) {
      setVendors(vendors.map((v) => (v.id === editingVendor.id ? newVendor : v)));
      toast.success(`Vendor ${newVendor.name} berhasil diperbarui!`);
    } else {
      setVendors([newVendor, ...vendors]);
      toast.success(`Vendor ${newVendor.name} (${newVendor.vendorCode}) berhasil ditambahkan!`);
    }
    setIsCreateOpen(false);
    setEditingVendor(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      vendorCode: `VND-${String(Math.floor(Math.random() * 900) + 100)}`,
      name: "",
      pic: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      realCategory: "Bahan Baku",
      coaCategory: "11310 - Persediaan Bahan Baku",
      taxStatus: "PKP (11%)",
      paymentTermDays: 30,
      status: "ACTIVE",
    });
  };

  const openEdit = (v: VendorItem) => {
    setEditingVendor(v);
    setFormData({
      vendorCode: v.vendorCode,
      name: v.name,
      pic: v.pic,
      phone: v.phone,
      email: v.email,
      city: v.city,
      address: v.address,
      realCategory: v.realCategory,
      coaCategory: v.coaCategory,
      taxStatus: v.taxStatus,
      paymentTermDays: v.paymentTermDays,
      status: v.status,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    setVendors(vendors.filter((v) => v.id !== id));
    setDeletingId(null);
    toast.success("Vendor berhasil dihapus");
  };

  // ── Category sub-tabs (inner filter preserved) ──
  const categoryTabs = [
    { key: "ALL", label: "Semua Vendor", count: vendors.length },
    { key: "Bahan Baku", label: "Bahan Kimia & Aktif", count: rawMaterialCount },
    { key: "Kemasan Primer", label: "Kemasan & Botol", count: packagingCount },
    { key: "Jasa Maklon", label: "Sub-kontrak & Jasa", count: maklonCount },
    { key: "Bahan Pembantu", label: "Utilitas & Umum", count: auxCount },
  ];

  const subNav = (
    <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
      {categoryTabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setCategoryFilter(t.key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
            categoryFilter === t.key
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <span>{t.label}</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-extrabold",
            categoryFilter === t.key ? "bg-blue-700/80 text-white" : "bg-slate-100 text-slate-600"
          )}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );

  const coaDropdown = (
    <div className="flex items-center gap-2">
      <select
        value={coaFilter}
        onChange={(e) => setCoaFilter(e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="ALL">Semua Akun CoA</option>
        <option value="11310">11310 (Bahan Baku)</option>
        <option value="11320">11320 (Kemasan)</option>
        <option value="51100">51100 (Jasa Maklon)</option>
      </select>
    </div>
  );

  const vendorTable = (
    <TableWrapper
      filters={
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Filter:</span>
            {coaDropdown}
          </div>
        </div>
      }
    >
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow>
            <DnaTh align="left">Kode Vendor</DnaTh>
            <DnaTh align="left">Nama Perusahaan / Supplier</DnaTh>
            <DnaTh align="left">Kategori & CoA</DnaTh>
            <DnaTh align="left">Kontak PIC / Telepon</DnaTh>
            <DnaTh align="left">Kota</DnaTh>
            <DnaTh align="left">Status Pajak & Termin</DnaTh>
            <DnaTh align="center">{activeTab === "DAFTAR" ? "Detail" : "Aksi"}</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {paginatedVendors.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={7} className="p-8 text-center">
                <DnaEmptyState title="Tidak ada vendor ditemukan" description="Coba ubah kata kunci pencarian atau filter kategori." />
              </DnaTd>
            </DnaTableRow>
          ) : (
            paginatedVendors.map((v) => (
              <DnaTableRow key={v.id}>
                <DnaTdCode>{v.vendorCode}</DnaTdCode>
                <DnaTd>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-xs">{v.name}</span>
                    <span className="text-[11px] text-slate-500">{v.email}</span>
                  </div>
                </DnaTd>
                <DnaTd>
                  <div className="flex flex-col gap-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold w-fit bg-slate-100 text-slate-700 border border-slate-200">
                      {v.realCategory}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-medium">
                      CoA: {v.coaCategory.split(" - ")[0]}
                    </span>
                  </div>
                </DnaTd>
                <DnaTd>
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-slate-900">{v.pic}</span>
                    <span className="text-slate-500 text-[11px]">{v.phone}</span>
                  </div>
                </DnaTd>
                <DnaTd>
                  <span className="font-medium text-slate-900 text-xs">{v.city}</span>
                </DnaTd>
                <DnaTd>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-slate-700">{v.taxStatus}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit font-mono">
                      Termin {v.paymentTermDays} Hari
                    </span>
                  </div>
                </DnaTd>
                <DnaTd align="center">
                  {activeTab === "DAFTAR" ? (
                    <button
                      onClick={() => { setSelectedVendor(v); setIsDetailOpen(true); }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(v)} className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(v.id)} className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </DnaTd>
              </DnaTableRow>
            ))
          )}
        </DnaTableBody>
      </DnaTable>
      <DnaPagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredVendors.length / pageSize) || 1}
        onPageChange={setCurrentPage}
        totalItems={filteredVendors.length}
        pageSize={pageSize}
      />
    </TableWrapper>
  );

  const daftarContent = (
    <>
      {subNav}
      {vendorTable}
    </>
  );

  const kelolaContent = (
    <>
      <div className="flex items-center justify-end gap-2 mb-3">
        <DnaButton variant="outline" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setIsImportOpen(true)}>
          Import Excel
        </DnaButton>
        <DnaButton variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { resetForm(); setEditingVendor(null); setIsCreateOpen(true); }}>
          Tambah Pemasok
        </DnaButton>
      </div>
      {subNav}
      {vendorTable}
    </>
  );

  return (
    <>
      <MasterPageShell
        title="VENDOR"
        badge={<DnaBadge status="info">D365 PROCUREMENT</DnaBadge>}
        subtitle="Master vendor & supplier. Tab Daftar = lihat semua vendor. Tab Kelola = CRUD + Import Excel."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "DAFTAR" | "KELOLA")}
        stats={stats}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari kode vendor, nama, PIC, atau kota..."
        daftarContent={daftarContent}
        kelolaContent={kelolaContent}
      />

      {/* Modal: Detail Vendor */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedVendor ? `Rincian Rekanan: ${selectedVendor.name}` : "Rincian Vendor"}
        subtitle="Profil supplier, kategori pengadaan, rekening, dan pemetaan CoA"
        badge={selectedVendor?.vendorCode}
        size="xl"
      >
        {selectedVendor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status Kemitraan</span>
                <DnaBadge status="success">AKTIF & TERVERIFIKASI</DnaBadge>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-medium">Kode Vendor</span>
                <span className="font-mono font-bold text-slate-900">{selectedVendor.vendorCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama Supplier</span>
                <span className="font-bold text-slate-900">{selectedVendor.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Kategori & Pemetaan CoA</h4>
              <div className="p-3.5 border border-slate-200 rounded-lg space-y-2 bg-white">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori Pengadaan Riil</span>
                  <span className="font-semibold text-slate-900">{selectedVendor.realCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemetaan Akun CoA</span>
                  <span className="font-mono font-semibold text-blue-600">{selectedVendor.coaCategory}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Status Perpajakan</span>
                  <span className="font-semibold text-slate-900">{selectedVendor.taxStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Term of Payment</span>
                  <span className="font-semibold text-amber-700 font-mono">{selectedVendor.paymentTermDays} Hari Net</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Informasi Kontak & Lokasi</h4>
              <div className="p-3.5 border border-slate-200 rounded-lg space-y-2 bg-white">
                <div className="flex justify-between">
                  <span className="text-slate-500">Person in Charge (PIC)</span>
                  <span className="font-semibold text-slate-900">{selectedVendor.pic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Telepon / WA</span>
                  <span className="font-mono text-slate-900">{selectedVendor.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Korespondensi</span>
                  <span className="text-blue-600">{selectedVendor.email}</span>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <span className="text-slate-500 block mb-1">Alamat:</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedVendor.address}, {selectedVendor.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>Tutup</DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal: Add/Edit Vendor */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingVendor(null); }}
        title={editingVendor ? "Edit Vendor" : "Registrasi Vendor Baru"}
        subtitle="Pencatatan mitra supplier bahan baku, kemasan, dan pemetaan CoA"
        badge={editingVendor ? "Edit Supplier" : "Master Supplier Form"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Kode Vendor</label>
              <input
                type="text"
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Nama Perusahaan *</label>
              <input
                type="text"
                placeholder="PT / CV Supplier..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Kategori Pengadaan</label>
              <select
                value={formData.realCategory}
                onChange={(e) => setFormData({ ...formData, realCategory: e.target.value as VendorItem["realCategory"] })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Kemasan Primer">Kemasan Primer</option>
                <option value="Kemasan Sekunder">Kemasan Sekunder</option>
                <option value="Bahan Pembantu">Bahan Pembantu</option>
                <option value="Jasa Maklon">Jasa Maklon</option>
                <option value="Mesin & Sparepart">Mesin & Sparepart</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Pemetaan Akun CoA</label>
              <select
                value={formData.coaCategory}
                onChange={(e) => setFormData({ ...formData, coaCategory: e.target.value as VendorItem["coaCategory"] })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="11310 - Persediaan Bahan Baku">11310 - Persediaan Bahan Baku</option>
                <option value="11320 - Persediaan Kemasan">11320 - Persediaan Kemasan</option>
                <option value="51100 - Beban Pokok Jasa">51100 - Beban Pokok Jasa</option>
                <option value="12100 - Aset Tetap Pabrik">12100 - Aset Tetap Pabrik</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Status Pajak</label>
              <select
                value={formData.taxStatus}
                onChange={(e) => setFormData({ ...formData, taxStatus: e.target.value as VendorItem["taxStatus"] })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="PKP (11%)">PKP (11%)</option>
                <option value="NON_PKP (0%)">NON_PKP (0%)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Termin Pembayaran (Hari)</label>
              <input
                type="number"
                value={formData.paymentTermDays}
                onChange={(e) => setFormData({ ...formData, paymentTermDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Nama PIC *</label>
              <input
                type="text"
                placeholder="Nama PIC..."
                value={formData.pic}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Telepon / WhatsApp</label>
              <input
                type="text"
                placeholder="08..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Email</label>
            <input
              type="email"
              placeholder="vendor@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Kota</label>
              <input
                type="text"
                placeholder="Surabaya, Jakarta..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Alamat Lengkap</label>
              <input
                type="text"
                placeholder="Alamat kantor..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <DnaButton type="button" variant="secondary" onClick={() => { setIsCreateOpen(false); setEditingVendor(null); }}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              {editingVendor ? "Simpan Perubahan" : "Simpan Vendor"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* Modal: Import Excel */}
      <DnaModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Master Vendor (Excel/CSV)"
        subtitle="Unggah berkas spreadsheet master data rekanan vendor"
        badge="Batch Import"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-3 bg-slate-50 hover:bg-slate-100/60 transition-all cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-700">Tarik File Template Master Vendor</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format .xlsx, .xls, .csv</p>
            </div>
            <DnaButton variant="secondary" size="sm">Pilih File</DnaButton>
          </div>
          <div className="flex items-center justify-between pt-2">
            <a href="#" className="text-xs text-blue-600 hover:underline font-medium">
              Unduh Format Template Vendor (.xlsx)
            </a>
            <div className="flex gap-2">
              <DnaButton variant="secondary" onClick={() => setIsImportOpen(false)}>Batal</DnaButton>
              <DnaButton variant="primary" onClick={() => { setIsImportOpen(false); toast.success("Master vendor berhasil diimpor!"); }}>Proses Import</DnaButton>
            </div>
          </div>
        </div>
      </DnaModal>

      {/* Modal: Confirm Delete */}
      <DnaModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Hapus Vendor"
        subtitle="Konfirmasi penghapusan vendor dari master data"
        badge="Danger Zone"
        size="sm"
      >
        <p className="text-sm text-slate-700">Yakin ingin menghapus vendor ini dari master data?</p>
        <div className="pt-4 flex items-center justify-end gap-2">
          <DnaButton variant="secondary" onClick={() => setDeletingId(null)}>Batal</DnaButton>
          <DnaButton variant="primary" onClick={() => deletingId && handleDelete(deletingId)}>Ya, Hapus</DnaButton>
        </div>
      </DnaModal>
    </>
  );
}
