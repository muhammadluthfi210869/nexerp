"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  ListTodo,
  Layers,
  Settings,
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  User,
  Building2,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaStatCard,
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaPagination,
  DnaModal,
  DnaTabNav,
  DnaInput,
  DnaTextarea,
  DnaSelect,
  DnaConfirmDialog,
  useDnaToast,
} from "@/components/dna";
import { cn } from "@/lib/utils";

// ── TAB 1: CHECKLIST OPERASIONAL SO TYPES ──
interface ChecklistItem {
  id: string;
  soNumber: string;
  customer: string;
  brand: string;
  product: string;
  salesCategory: "Maklon Baru" | "Maklon Repeat Order" | "Custom Formulasi";
  startDate: string;
  endDate: string;
  totalMilestones: number;
  completedMilestones: number;
  status: "IN_PROGRESS" | "DONE" | "PENDING" | "DELAYED";
  description?: string;
}

// ── TAB 2: KATEGORI CHECKLIST TYPES ──
interface ChecklistCategory {
  id: string;
  name: string;
  sequence: number;
  defaultDays: number;
  daysBySalesCategory: {
    maklonBaru: number;
    maklonRo: number;
  };
  afterCategory: string; // Prerequisite category
  department: string;
}

// ── TAB 3: KELOLA CHECKLIST DETAIL TYPES ──
interface ManageChecklistSubItem {
  id: string;
  categoryName: string;
  pic: string;
  durationDays: number;
  afterCategory: string;
  status: "DONE" | "IN_PROGRESS" | "PENDING" | "BLOCKED";
  notes?: string;
  lastUpdated: string;
}

interface ManageChecklistItem {
  id: string;
  soNumber: string;
  customer: string;
  brand: string;
  product: string;
  startDate: string;
  endDate: string;
  creator: string;
  status: "AKTIF" | "SELESAI" | "PENDING" | "DIBATALKAN";
  createdAt: string;
  subItems: ManageChecklistSubItem[];
}

// ── INITIAL DATASETS ACCORDING TO LEGACY CSV ──
const INITIAL_CHECKLISTS: ChecklistItem[] = [
  {
    id: "chk-1",
    soNumber: "SO-2026-0512",
    customer: "PT Glow Skin Global",
    brand: "GlowSkin Aesthetic",
    product: "Sunscreen Glow Gel SPF 50 30ml",
    salesCategory: "Maklon Baru",
    startDate: "01/08/2026",
    endDate: "15/09/2026",
    totalMilestones: 16,
    completedMilestones: 11,
    status: "IN_PROGRESS",
    description: "Produksi batch perdana 10.000 tube dengan formulasi hybrid UV filter.",
  },
  {
    id: "chk-2",
    soNumber: "SO-2026-0508",
    customer: "PT Cantika Herbal Nusantara",
    brand: "HerbalCare Botanica",
    product: "Soothing Acne Gel Cica + Tea Tree 30gr",
    salesCategory: "Maklon Repeat Order",
    startDate: "05/08/2026",
    endDate: "20/09/2026",
    totalMilestones: 12,
    completedMilestones: 6,
    status: "DELAYED",
    description: "Repeat order 5.000 jar pot akrilik, kendala kedatangan kemasan.",
  },
  {
    id: "chk-3",
    soNumber: "SO-2026-0499",
    customer: "CV Royal Beauty Luxe",
    brand: "Royal Glow Luxe",
    product: "Anti-Aging Miracle Serum 20ml",
    salesCategory: "Custom Formulasi",
    startDate: "10/08/2026",
    endDate: "25/09/2026",
    totalMilestones: 16,
    completedMilestones: 9,
    status: "IN_PROGRESS",
    description: "Formulasi peptide encapsulated dengan botol pipet amber.",
  },
  {
    id: "chk-4",
    soNumber: "SO-2026-0485",
    customer: "CV Dermacare Indonesia",
    brand: "DermaPure",
    product: "Gentle Facial Cleanser Low pH 100ml",
    salesCategory: "Maklon Repeat Order",
    startDate: "15/07/2026",
    endDate: "25/08/2026",
    totalMilestones: 10,
    completedMilestones: 10,
    status: "DONE",
    description: "Produksi batch 2 selesai dan telah dikirim via ekspedisi.",
  },
];

const INITIAL_CATEGORIES: ChecklistCategory[] = [
  { id: "cat-1", name: "Desain Logo", sequence: 1, defaultDays: 7, daysBySalesCategory: { maklonBaru: 7, maklonRo: 2 }, afterCategory: "-", department: "Kreatif & Desain" },
  { id: "cat-2", name: "HKI Merek", sequence: 2, defaultDays: 14, daysBySalesCategory: { maklonBaru: 14, maklonRo: 0 }, afterCategory: "Desain Logo", department: "Legalitas" },
  { id: "cat-3", name: "BPOM NA (Notifikasi)", sequence: 3, defaultDays: 30, daysBySalesCategory: { maklonBaru: 30, maklonRo: 5 }, afterCategory: "HKI Merek", department: "Regulasi & BPOM" },
  { id: "cat-4", name: "BPOM Merk", sequence: 4, defaultDays: 14, daysBySalesCategory: { maklonBaru: 14, maklonRo: 0 }, afterCategory: "HKI Merek", department: "Regulasi & BPOM" },
  { id: "cat-5", name: "MoU Kontrak Maklon", sequence: 5, defaultDays: 5, daysBySalesCategory: { maklonBaru: 5, maklonRo: 2 }, afterCategory: "Desain Logo", department: "BusDev / Sales" },
  { id: "cat-6", name: "Desain Kemasan", sequence: 6, defaultDays: 10, daysBySalesCategory: { maklonBaru: 10, maklonRo: 3 }, afterCategory: "BPOM NA (Notifikasi)", department: "Kreatif & Desain" },
  { id: "cat-7", name: "Approval Desain Klien", sequence: 7, defaultDays: 5, daysBySalesCategory: { maklonBaru: 5, maklonRo: 2 }, afterCategory: "Desain Kemasan", department: "BusDev / Sales" },
  { id: "cat-8", name: "Pengadaan Bahan Baku", sequence: 8, defaultDays: 14, daysBySalesCategory: { maklonBaru: 14, maklonRo: 10 }, afterCategory: "Approval Desain Klien", department: "SCM / Purchasing" },
  { id: "cat-9", name: "Pelunasan DP Maklon", sequence: 9, defaultDays: 3, daysBySalesCategory: { maklonBaru: 3, maklonRo: 2 }, afterCategory: "Approval Desain Klien", department: "Finance" },
  { id: "cat-10", name: "Mixing Produksi", sequence: 10, defaultDays: 7, daysBySalesCategory: { maklonBaru: 7, maklonRo: 5 }, afterCategory: "Pengadaan Bahan Baku", department: "Produksi" },
  { id: "cat-11", name: "Pengadaan Bahan Kemas", sequence: 11, defaultDays: 21, daysBySalesCategory: { maklonBaru: 21, maklonRo: 14 }, afterCategory: "Approval Desain Klien", department: "SCM / Purchasing" },
  { id: "cat-12", name: "Filling & Seal", sequence: 12, defaultDays: 5, daysBySalesCategory: { maklonBaru: 5, maklonRo: 4 }, afterCategory: "Mixing Produksi", department: "Produksi" },
  { id: "cat-13", name: "Label & Kodifikasi", sequence: 13, defaultDays: 3, daysBySalesCategory: { maklonBaru: 3, maklonRo: 2 }, afterCategory: "Filling & Seal", department: "Produksi / QC" },
  { id: "cat-14", name: "Box & Packing Luar", sequence: 14, defaultDays: 3, daysBySalesCategory: { maklonBaru: 3, maklonRo: 2 }, afterCategory: "Label & Kodifikasi", department: "Gudang & Finishing" },
  { id: "cat-15", name: "Uji Stabilitas Lab", sequence: 15, defaultDays: 14, daysBySalesCategory: { maklonBaru: 14, maklonRo: 3 }, afterCategory: "Mixing Produksi", department: "QC & R&D Lab" },
  { id: "cat-16", name: "Delivery & Serah Terima", sequence: 16, defaultDays: 3, daysBySalesCategory: { maklonBaru: 3, maklonRo: 2 }, afterCategory: "Box & Packing Luar", department: "Logistik" },
];

const INITIAL_MANAGE_CHECKLISTS: ManageChecklistItem[] = [
  {
    id: "mng-1",
    soNumber: "SO-2026-0512",
    customer: "PT Glow Skin Global",
    brand: "GlowSkin Aesthetic",
    product: "Sunscreen Glow Gel SPF 50 30ml",
    startDate: "01/08/2026",
    endDate: "15/09/2026",
    creator: "Fitri Handayani (BusDev)",
    status: "AKTIF",
    createdAt: "01/08/2026 09:30",
    subItems: [
      { id: "sb-1", categoryName: "Desain Logo", pic: "Edi (Creative)", durationDays: 7, afterCategory: "-", status: "DONE", lastUpdated: "05/08/2026" },
      { id: "sb-2", categoryName: "HKI Merek", pic: "Cipta (Legal)", durationDays: 14, afterCategory: "Desain Logo", status: "DONE", lastUpdated: "12/08/2026" },
      { id: "sb-3", categoryName: "BPOM NA", pic: "Cipta (Legal)", durationDays: 30, afterCategory: "HKI Merek", status: "DONE", notes: "NA18261700142 terbit", lastUpdated: "19/08/2026" },
      { id: "sb-4", categoryName: "Bahan Baku & Kemas", pic: "Nike (SCM)", durationDays: 14, afterCategory: "BPOM NA", status: "DONE", lastUpdated: "28/08/2026" },
      { id: "sb-5", categoryName: "Mixing Produksi", pic: "Nur Kholilah (Produksi)", durationDays: 7, afterCategory: "Bahan Baku", status: "DONE", lastUpdated: "04/09/2026" },
      { id: "sb-6", categoryName: "Filling & Seal", pic: "Nur Kholilah (Produksi)", durationDays: 5, afterCategory: "Mixing Produksi", status: "IN_PROGRESS", notes: "6.000/10.000 pcs selesai", lastUpdated: "08/09/2026" },
      { id: "sb-7", categoryName: "Box & Packing", pic: "Budi Santoso (Gudang)", durationDays: 3, afterCategory: "Filling & Seal", status: "PENDING", lastUpdated: "—" },
      { id: "sb-8", categoryName: "Delivery", pic: "Agus Pratama (Logistik)", durationDays: 3, afterCategory: "Box & Packing", status: "PENDING", lastUpdated: "—" },
    ],
  },
  {
    id: "mng-2",
    soNumber: "SO-2026-0508",
    customer: "PT Cantika Herbal Nusantara",
    brand: "HerbalCare Botanica",
    product: "Soothing Acne Gel Cica + Tea Tree 30gr",
    startDate: "05/08/2026",
    endDate: "20/09/2026",
    creator: "Budi Hermawan (Sales)",
    status: "AKTIF",
    createdAt: "05/08/2026 10:15",
    subItems: [
      { id: "sb-9", categoryName: "Desain Logo", pic: "Edi (Creative)", durationDays: 7, afterCategory: "-", status: "DONE", lastUpdated: "10/08/2026" },
      { id: "sb-10", categoryName: "BPOM NA", pic: "Cipta (Legal)", durationDays: 30, afterCategory: "Desain Logo", status: "DONE", lastUpdated: "25/08/2026" },
      { id: "sb-11", categoryName: "Bahan Kemas (Pot Jar)", pic: "Nike (SCM)", durationDays: 21, afterCategory: "BPOM NA", status: "BLOCKED", notes: "Vendor terlambat pengiriman pot jar 5.000 pcs", lastUpdated: "28/08/2026" },
      { id: "sb-12", categoryName: "Mixing Produksi", pic: "Nur Kholilah (Produksi)", durationDays: 7, afterCategory: "Bahan Kemas", status: "PENDING", lastUpdated: "—" },
    ],
  },
];

export default function ChecklistHubPage() {
  const { showToast } = useDnaToast();

  // Active Tab: 'checklist' | 'category' | 'manage'
  const [activeTab, setActiveTab] = useState<"checklist" | "category" | "manage">("checklist");
  const [searchQuery, setSearchQuery] = useState("");

  // Tab 1 state
  const [checklists, setChecklists] = useState<ChecklistItem[]>(INITIAL_CHECKLISTS);
  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);
  const [newChecklistForm, setNewChecklistForm] = useState({
    soNumber: "SO-2026-0520",
    customer: "PT Mahakarya Kosmetika",
    brand: "Maha Glow",
    product: "Lip Tint Hydrating 5ml",
    salesCategory: "Maklon Baru" as "Maklon Baru" | "Maklon Repeat Order" | "Custom Formulasi",
    startDate: "10/09/2026",
    endDate: "25/10/2026",
    description: "",
  });

  // Tab 2 state (Kategori)
  const [categories, setCategories] = useState<ChecklistCategory[]>(INITIAL_CATEGORIES);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<ChecklistCategory>({
    id: "",
    name: "",
    sequence: INITIAL_CATEGORIES.length + 1,
    defaultDays: 7,
    daysBySalesCategory: { maklonBaru: 7, maklonRo: 3 },
    afterCategory: "-",
    department: "Produksi",
  });
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Tab 3 state (Kelola Detail Modal)
  const [manageItems, setManageItems] = useState<ManageChecklistItem[]>(INITIAL_MANAGE_CHECKLISTS);
  const [selectedManageItem, setSelectedManageItem] = useState<ManageChecklistItem | null>(null);

  // ── HANDLERS ──
  const handleSaveChecklist = () => {
    if (!newChecklistForm.soNumber || !newChecklistForm.product) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Nomor SO dan produk wajib diisi." });
      return;
    }
    const created: ChecklistItem = {
      id: `chk-${Date.now()}`,
      soNumber: newChecklistForm.soNumber,
      customer: newChecklistForm.customer,
      brand: newChecklistForm.brand,
      product: newChecklistForm.product,
      salesCategory: newChecklistForm.salesCategory,
      startDate: newChecklistForm.startDate,
      endDate: newChecklistForm.endDate,
      totalMilestones: 16,
      completedMilestones: 0,
      status: "IN_PROGRESS",
      description: newChecklistForm.description,
    };
    setChecklists([created, ...checklists]);
    setIsCreateChecklistOpen(false);
    showToast({ type: "success", title: "Checklist Dibuat", message: `Checklist untuk ${created.soNumber} berhasil didaftarkan.` });
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Nama kategori wajib diisi." });
      return;
    }
    if (isEditingCategory) {
      setCategories((prev) => prev.map((c) => (c.id === categoryForm.id ? categoryForm : c)));
      showToast({ type: "success", title: "Kategori Diperbarui", message: `Kategori ${categoryForm.name} berhasil diubah.` });
    } else {
      const newCat = { ...categoryForm, id: `cat-${Date.now()}` };
      setCategories([...categories, newCat]);
      showToast({ type: "success", title: "Kategori Ditambahkan", message: `Kategori ${categoryForm.name} berhasil disimpan.` });
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast({ type: "warning", title: "Kategori Dihapus", message: `Kategori ${name} telah dihapus.` });
  };

  const handleToggleSubItemStatus = (itemId: string, subId: string) => {
    setManageItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updatedSubs = item.subItems.map((sub) => {
          if (sub.id !== subId) return sub;
          const nextStatus = sub.status === "DONE" ? "IN_PROGRESS" : sub.status === "IN_PROGRESS" ? "DONE" : "IN_PROGRESS";
          return { ...sub, status: nextStatus as any, lastUpdated: new Date().toLocaleDateString("id-ID") };
        });
        return { ...item, subItems: updatedSubs };
      })
    );
    if (selectedManageItem && selectedManageItem.id === itemId) {
      setSelectedManageItem((prev) => {
        if (!prev) return null;
        const updatedSubs = prev.subItems.map((sub) => {
          if (sub.id !== subId) return sub;
          const nextStatus = sub.status === "DONE" ? "IN_PROGRESS" : sub.status === "IN_PROGRESS" ? "DONE" : "IN_PROGRESS";
          return { ...sub, status: nextStatus as any, lastUpdated: new Date().toLocaleDateString("id-ID") };
        });
        return { ...prev, subItems: updatedSubs };
      });
    }
    showToast({ type: "success", title: "Status Milestone Diperbarui", message: "Progres tahapan berhasil disimpan." });
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. UNBOXED PAGE HEADER (DNA SPEC) ── */}
      <DnaPageHeader
        title="PUSAT KENDALI CHECKLIST OPERASIONAL"
        badge={<DnaBadge status="info">SISTEM KENDALI</DnaBadge>}
        subtitle="Manajemen alur checklist maklon, standardisasi sequence tahapan kronologis, durasi per kategori penjualan, dan monitoring pelaksanaan SO."
        breadcrumbItems={[
          { label: "Dashboard", href: "/executive/dashboard" },
          { label: "Umum & Kendali", href: "/checklist" },
          { label: "Checklist" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {activeTab === "checklist" && (
              <DnaButton
                variant="primary"
                onClick={() => setIsCreateChecklistOpen(true)}
                className="flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Checklist Baru</span>
              </DnaButton>
            )}
            {activeTab === "category" && (
              <DnaButton
                variant="primary"
                onClick={() => {
                  setCategoryForm({
                    id: "",
                    name: "",
                    sequence: categories.length + 1,
                    defaultDays: 7,
                    daysBySalesCategory: { maklonBaru: 7, maklonRo: 3 },
                    afterCategory: categories[categories.length - 1]?.name || "-",
                    department: "Produksi",
                  });
                  setIsEditingCategory(false);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Kategori</span>
              </DnaButton>
            )}
          </div>
        }
      />

      {/* ── 02. 3-TAB NAVBAR PERSISTENT HEADER (DNA SPEC) ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "checklist"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Checklist Operasional</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
              {checklists.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("category")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "category"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kategori Checklist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manage")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeTab === "manage"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kelola Checklist SO</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-mono">
              {manageItems.length}
            </span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari dalam tab aktif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-60 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── 03. TAB CONTENT 1: CHECKLIST OPERASIONAL SO ── */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="DAFTAR CHECKLIST SALES ORDER AKTIF"
            count={checklists.length}
            badge={<DnaBadge status="neutral">OPERASIONAL SO</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <tr>
                  <th className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</th>
                  <th className={DNA_TABLE_CLASSES.th}>Sales Order & Klien</th>
                  <th className={DNA_TABLE_CLASSES.th}>Produk & Kategori Sales</th>
                  <th className={DNA_TABLE_CLASSES.th}>Periode Pengerjaan</th>
                  <th className={DNA_TABLE_CLASSES.th}>Progres Milestone</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</th>
                </tr>
              </DnaTableHead>
              <tbody className={DNA_TABLE_CLASSES.tbody}>
                {checklists.map((item, idx) => (
                  <tr key={item.id} className={DNA_TABLE_CLASSES.tr}>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400")}>
                      {idx + 1}
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <DnaCell.Code value={item.soNumber} />
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{item.customer}</p>
                        <p className="text-[11px] text-blue-600 font-medium">{item.brand}</p>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{item.product}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.salesCategory}
                        </span>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div className="text-xs">
                        <p className="text-slate-700 font-medium">Mulai: {item.startDate}</p>
                        <p className="text-slate-500">Selesai: {item.endDate}</p>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>
                            {item.completedMilestones} / {item.totalMilestones} Selesai
                          </span>
                          <span>
                            {Math.round((item.completedMilestones / item.totalMilestones) * 100)}%
                          </span>
                        </div>
                        <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.status === "DONE"
                                ? "bg-emerald-500"
                                : item.status === "DELAYED"
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            )}
                            style={{
                              width: `${(item.completedMilestones / item.totalMilestones) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <DnaBadge
                        status={
                          item.status === "DONE"
                            ? "SUCCESS"
                            : item.status === "DELAYED"
                            ? "DANGER"
                            : "INFO"
                        }
                      >
                        {item.status.replace("_", " ")}
                      </DnaBadge>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <button
                        type="button"
                        onClick={() => {
                          const matched = manageItems.find((m) => m.soNumber === item.soNumber);
                          if (matched) setSelectedManageItem(matched);
                          else showToast({ type: "info", title: "Info", message: "Rincian checklist dapat dikelola di tab Kelola Checklist." });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── 04. TAB CONTENT 2: KATEGORI CHECKLIST ── */}
      {activeTab === "category" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="MASTER SEQUENCE & LEAD-TIME KATEGORI CHECKLIST"
            count={categories.length}
            badge={<DnaBadge status="neutral">STANDARDISASI PROTOKOL</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <tr>
                  <th className={cn(DNA_TABLE_CLASSES.th, "w-16 text-center")}>Urutan</th>
                  <th className={DNA_TABLE_CLASSES.th}>Nama Kategori / Milestone</th>
                  <th className={DNA_TABLE_CLASSES.th}>Departemen Terkait</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-right")}>Lama Hari Default</th>
                  <th className={DNA_TABLE_CLASSES.th}>Hari per Kategori Penjualan</th>
                  <th className={DNA_TABLE_CLASSES.th}>Setelah Kategori (Prasyarat)</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-24")}>Aksi</th>
                </tr>
              </DnaTableHead>
              <tbody className={DNA_TABLE_CLASSES.tbody}>
                {categories.map((cat) => (
                  <tr key={cat.id} className={DNA_TABLE_CLASSES.tr}>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono font-bold text-blue-600")}>
                      #{cat.sequence}
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "font-semibold text-slate-800 text-xs")}>
                      {cat.name}
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <span className="text-xs text-slate-600 font-medium">{cat.department}</span>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-right font-mono font-bold text-slate-900")}>
                      {cat.defaultDays} Hari
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div className="text-[11px] space-y-0.5">
                        <p className="text-slate-600">Maklon Baru: <span className="font-bold text-slate-800">{cat.daysBySalesCategory.maklonBaru} Hari</span></p>
                        <p className="text-slate-600">Repeat Order: <span className="font-bold text-slate-800">{cat.daysBySalesCategory.maklonRo} Hari</span></p>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          cat.afterCategory === "-"
                            ? "bg-slate-50 text-slate-400 border-slate-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        )}
                      >
                        {cat.afterCategory === "-" ? "Mulai Awal" : `Setelah: ${cat.afterCategory}`}
                      </span>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryForm(cat);
                            setIsEditingCategory(true);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Sunting Kategori"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── 05. TAB CONTENT 3: KELOLA CHECKLIST SO ── */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <DnaDataTableCard
            title="MANAJEMEN KELOLA CHECKLIST PROTOKOL"
            count={manageItems.length}
            badge={<DnaBadge status="neutral">EKSEKUSI OPERASIONAL</DnaBadge>}
          >
            <DnaTable>
              <DnaTableHead>
                <tr>
                  <th className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</th>
                  <th className={DNA_TABLE_CLASSES.th}>No. Sales & Customer</th>
                  <th className={DNA_TABLE_CLASSES.th}>Brand & Produk</th>
                  <th className={DNA_TABLE_CLASSES.th}>Periode Pengerjaan</th>
                  <th className={DNA_TABLE_CLASSES.th}>Pembuat & Tanggal</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</th>
                  <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-28")}>Aksi</th>
                </tr>
              </DnaTableHead>
              <tbody className={DNA_TABLE_CLASSES.tbody}>
                {manageItems.map((item, idx) => (
                  <tr key={item.id} className={DNA_TABLE_CLASSES.tr}>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400")}>
                      {idx + 1}
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <DnaCell.Code value={item.soNumber} />
                        <p className="font-semibold text-slate-800 text-xs mt-0.5">{item.customer}</p>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{item.product}</p>
                        <p className="text-[11px] text-blue-600 font-medium">{item.brand}</p>
                      </div>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <p className="text-xs text-slate-700">
                        {item.startDate} s/d {item.endDate}
                      </p>
                    </td>
                    <td className={DNA_TABLE_CLASSES.td}>
                      <div className="text-xs">
                        <p className="text-slate-700 font-medium">{item.creator}</p>
                        <p className="text-[10px] text-slate-400">{item.createdAt}</p>
                      </div>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <DnaBadge
                        status={
                          item.status === "SELESAI"
                            ? "SUCCESS"
                            : item.status === "AKTIF"
                            ? "INFO"
                            : "WARNING"
                        }
                      >
                        {item.status}
                      </DnaBadge>
                    </td>
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <button
                        type="button"
                        onClick={() => setSelectedManageItem(item)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer border border-blue-200/60"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Kelola</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL: BUAT CHECKLIST BARU (TAB 1) ── */}
      <DnaModal
        isOpen={isCreateChecklistOpen}
        onClose={() => setIsCreateChecklistOpen(false)}
        title="Buat Checklist Operasional Sales Order Baru"
        subtitle="Daftarkan sales order maklon ke dalam sistem tracking checklist."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Sales Order (SO) *
            </label>
            <DnaInput
              value={newChecklistForm.soNumber}
              onChange={(e) => setNewChecklistForm({ ...newChecklistForm, soNumber: e.target.value })}
              placeholder="Contoh: SO-2026-0525"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Klien / Pelanggan *
              </label>
              <DnaInput
                value={newChecklistForm.customer}
                onChange={(e) => setNewChecklistForm({ ...newChecklistForm, customer: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Brand *
              </label>
              <DnaInput
                value={newChecklistForm.brand}
                onChange={(e) => setNewChecklistForm({ ...newChecklistForm, brand: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Produk Maklon *
            </label>
            <DnaInput
              value={newChecklistForm.product}
              onChange={(e) => setNewChecklistForm({ ...newChecklistForm, product: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Sales
              </label>
              <select
                value={newChecklistForm.salesCategory}
                onChange={(e) => setNewChecklistForm({ ...newChecklistForm, salesCategory: e.target.value as any })}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:bg-white"
              >
                <option value="Maklon Baru">Maklon Baru</option>
                <option value="Maklon Repeat Order">Maklon Repeat Order</option>
                <option value="Custom Formulasi">Custom Formulasi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tgl Mulai *
              </label>
              <DnaInput
                value={newChecklistForm.startDate}
                onChange={(e) => setNewChecklistForm({ ...newChecklistForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tgl Target Selesai *
              </label>
              <DnaInput
                value={newChecklistForm.endDate}
                onChange={(e) => setNewChecklistForm({ ...newChecklistForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Catatan Tambahan
            </label>
            <DnaTextarea
              value={newChecklistForm.description}
              onChange={(e) => setNewChecklistForm({ ...newChecklistForm, description: e.target.value })}
              placeholder="Catatan formulasi, kemasan khusus, atau instruksi klien..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={() => setIsCreateChecklistOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveChecklist}>
              Simpan & Daftarkan Checklist
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── MODAL: TAMBAH / SUNTING KATEGORI CHECKLIST (TAB 2) ── */}
      <DnaModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={isEditingCategory ? "Sunting Kategori Checklist" : "Tambah Kategori Checklist Baru"}
        subtitle="Konfigurasi tahapan milestone, durasi SLA, dan aturan prasyarat kronologis."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kategori / Milestone *
            </label>
            <DnaInput
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Contoh: Pengujian Stabilitas Lab"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urutan Penomoran * (Angka)
              </label>
              <DnaInput
                type="number"
                value={String(categoryForm.sequence)}
                onChange={(e) => setCategoryForm({ ...categoryForm, sequence: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen PIC
              </label>
              <DnaInput
                value={categoryForm.department}
                onChange={(e) => setCategoryForm({ ...categoryForm, department: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lama Hari Default
              </label>
              <DnaInput
                type="number"
                value={String(categoryForm.defaultDays)}
                onChange={(e) => setCategoryForm({ ...categoryForm, defaultDays: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Hari (Maklon Baru)
              </label>
              <DnaInput
                type="number"
                value={String(categoryForm.daysBySalesCategory.maklonBaru)}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    daysBySalesCategory: {
                      ...categoryForm.daysBySalesCategory,
                      maklonBaru: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Hari (Repeat Order)
              </label>
              <DnaInput
                type="number"
                value={String(categoryForm.daysBySalesCategory.maklonRo)}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    daysBySalesCategory: {
                      ...categoryForm.daysBySalesCategory,
                      maklonRo: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dimulai Setelah Kategori Ini Selesai (Prasyarat):
            </label>
            <select
              value={categoryForm.afterCategory}
              onChange={(e) => setCategoryForm({ ...categoryForm, afterCategory: e.target.value })}
              className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:bg-white"
            >
              <option value="-">- Tidak ada (Bisa dimulai langsung di awal) -</option>
              {categories
                .filter((c) => c.id !== categoryForm.id)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.sequence}. {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveCategory}>
              {isEditingCategory ? "Simpan Perubahan" : "Simpan Kategori"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── MODAL: KELOLA SUB-TABEL CHECKLIST SO (TAB 3) ── */}
      <DnaModal
        isOpen={!!selectedManageItem}
        onClose={() => setSelectedManageItem(null)}
        title={`Rincian Sub-Checklist: ${selectedManageItem?.soNumber}`}
        subtitle={`Klien: ${selectedManageItem?.customer} (${selectedManageItem?.brand}) • Produk: ${selectedManageItem?.product}`}
        size="lg"
      >
        {selectedManageItem && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Periode Pengerjaan:</p>
                <p className="font-bold text-slate-800">{selectedManageItem.startDate} - {selectedManageItem.endDate}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Status Dokumen:</p>
                <span className="font-bold text-blue-600">{selectedManageItem.status}</span>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Dibuat Oleh:</p>
                <p className="font-bold text-slate-800">{selectedManageItem.creator}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Tanggal Dibuat:</p>
                <p className="font-mono text-slate-700">{selectedManageItem.createdAt}</p>
              </div>
            </div>

            {/* Sub-tabel rincian kategori */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-center w-10">#</th>
                    <th className="px-3 py-2">Kategori Milestone</th>
                    <th className="px-3 py-2">PIC Penanggung Jawab</th>
                    <th className="px-3 py-2 text-center">Durasi</th>
                    <th className="px-3 py-2">Prasyarat Setelah</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2">Catatan Kendala</th>
                    <th className="px-3 py-2 text-center">Aksi Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedManageItem.subItems.map((sub, i) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-center font-mono text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{sub.categoryName}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{sub.pic}</td>
                      <td className="px-3 py-2 text-center font-mono">{sub.durationDays} Hari</td>
                      <td className="px-3 py-2 text-slate-500">{sub.afterCategory}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                            sub.status === "DONE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : sub.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : sub.status === "BLOCKED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          )}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 max-w-xs">{sub.notes || "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSubItemStatus(selectedManageItem.id, sub.id)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border",
                            sub.status === "DONE"
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
                          )}
                        >
                          {sub.status === "DONE" ? "Set In Progress" : "Set Done ✓"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" onClick={() => setSelectedManageItem(null)}>
                Tutup Rincian
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
