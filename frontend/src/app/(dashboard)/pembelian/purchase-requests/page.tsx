"use client";

/**
 * Permintaan Pembelian (Purchase Request / PR)
 * Screen ID: SCR-040 (List) & SCR-041 (Form)
 *
 * Sesuai Spesifikasi:
 * - Visual DNA Design System (DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaModal, DnaCell, useDnaToast)
 * - Matriks Approval Bertingkat 3-Tier (Staff -> Head Dept -> Finance -> Direktur jika > 50 Jt)
 * - Alokasi Kategori COA (110401 Bahan Baku, 110402 Bahan Kemas, 510201 Perlengkapan Pabrik)
 * - Multi-line Keranjang Pengadaan Barang dengan auto-calculate
 * - Format Kode Universal Global (DL-SCM-PR-DDMMYYYY-0001 / PR-DDMMYYYY-0001)
 */

import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  DollarSign,
  Eye,
  Trash2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

export interface PRItemDetail {
  id: string;
  materialCode: string;
  materialName: string;
  categoryCoa: string;
  qty: number;
  unit: string;
  estimatedPrice: number;
  subtotal: number;
  notes?: string;
}

export interface PurchaseRequestRecord {
  id: string;
  prCode: string;
  date: string;
  department: string;
  requesterName: string;
  requesterRole: "STAFF" | "HEAD";
  categoryCoa: string;
  priority: "LOW" | "MEDIUM" | "URGENT";
  targetDate: string;
  totalEstimated: number;
  status: "DRAFT" | "PENDING_HEAD" | "PENDING_FINANCE" | "PENDING_DIRECTOR" | "APPROVED" | "REJECTED" | "ORDERED";
  approvalNotes?: string;
  items: PRItemDetail[];
}

const INITIAL_PR_DATA: PurchaseRequestRecord[] = [
  {
    id: "pr-1",
    prCode: "DL-SCM-PR-09092026-0001",
    date: "09/09/2026",
    department: "Produksi Pabrik",
    requesterName: "Agus Raharjo",
    requesterRole: "STAFF",
    categoryCoa: "110401 - Persediaan Bahan Baku",
    priority: "URGENT",
    targetDate: "15/09/2026",
    totalEstimated: 24500000,
    status: "PENDING_HEAD",
    items: [
      {
        id: "pri-1",
        materialCode: "RAW-ACT-001",
        materialName: "Niacinamide PC Grade (DSM)",
        categoryCoa: "110401 - Persediaan Bahan Baku",
        qty: 50,
        unit: "kg",
        estimatedPrice: 350000,
        subtotal: 17500000,
        notes: "Untuk batch SO-2026-001 PT Cantika",
      },
      {
        id: "pri-2",
        materialCode: "RAW-EXT-004",
        materialName: "Centella Asiatica Extract 10:1",
        categoryCoa: "110401 - Persediaan Bahan Baku",
        qty: 20,
        unit: "kg",
        estimatedPrice: 350000,
        subtotal: 7000000,
        notes: "Stok kritis di bawah buffer stock",
      },
    ],
  },
  {
    id: "pr-2",
    prCode: "DL-SCM-PR-08092026-0002",
    date: "08/09/2026",
    department: "Packaging & Finishing",
    requesterName: "Budi Santoso",
    requesterRole: "HEAD",
    categoryCoa: "110402 - Persediaan Bahan Kemas",
    priority: "MEDIUM",
    targetDate: "20/09/2026",
    totalEstimated: 68000000,
    status: "PENDING_DIRECTOR",
    approvalNotes: "Head & Accounting Approved. Menunggu persetujuan Direktur (> 50 Jt).",
    items: [
      {
        id: "pri-3",
        materialCode: "KEM-BOT-012",
        materialName: "Botol Dropper 30ml Frosted Amber",
        categoryCoa: "110402 - Persediaan Bahan Kemas",
        qty: 10000,
        unit: "pcs",
        estimatedPrice: 4500,
        subtotal: 45000000,
      },
      {
        id: "pri-4",
        materialCode: "KEM-BOX-008",
        materialName: "Inner Box Hologram Ivory 350gsm",
        categoryCoa: "110402 - Persediaan Bahan Kemas",
        qty: 10000,
        unit: "pcs",
        estimatedPrice: 2300,
        subtotal: 23000000,
      },
    ],
  },
  {
    id: "pr-3",
    prCode: "DL-SCM-PR-07092026-0003",
    date: "07/09/2026",
    department: "R&D Formulation Lab",
    requesterName: "Dr. Siti Aminah",
    requesterRole: "HEAD",
    categoryCoa: "110401 - Persediaan Bahan Baku",
    priority: "LOW",
    targetDate: "25/09/2026",
    totalEstimated: 12800000,
    status: "APPROVED",
    approvalNotes: "Disetujui. SCM siap terbitkan PO ke supplier utama.",
    items: [
      {
        id: "pri-5",
        materialCode: "RAW-ACT-009",
        materialName: "Sodium Hyaluronate Multi-Molecular",
        categoryCoa: "110401 - Persediaan Bahan Baku",
        qty: 5,
        unit: "kg",
        estimatedPrice: 2560000,
        subtotal: 12800000,
      },
    ],
  },
  {
    id: "pr-4",
    prCode: "DL-SCM-PR-05092026-0004",
    date: "05/09/2026",
    department: "Quality Control (QC)",
    requesterName: "Hendra Wijaya",
    requesterRole: "STAFF",
    categoryCoa: "510201 - Perlengkapan & Reagen QC",
    priority: "MEDIUM",
    targetDate: "12/09/2026",
    totalEstimated: 5400000,
    status: "ORDERED",
    approvalNotes: "PO terbit: PO-09092026-0008",
    items: [
      {
        id: "pri-6",
        materialCode: "LAB-REA-003",
        materialName: "Media Mikrobiologi PCA & Buffer pH 7",
        categoryCoa: "510201 - Perlengkapan & Reagen QC",
        qty: 12,
        unit: "pack",
        estimatedPrice: 450000,
        subtotal: 5400000,
      },
    ],
  },
];

export default function PurchaseRequestsModernPage() {
  const toast = useDnaToast();
  const [prList, setPrList] = useState<PurchaseRequestRecord[]>(INITIAL_PR_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPr, setSelectedPr] = useState<PurchaseRequestRecord | null>(null);

  // Modal Create PR State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formDept, setFormDept] = useState("Produksi Pabrik");
  const [formRequester, setFormRequester] = useState("Staff Produksi");
  const [formRole, setFormRole] = useState<"STAFF" | "HEAD">("STAFF");
  const [formCoa, setFormCoa] = useState("110401 - Persediaan Bahan Baku");
  const [formPriority, setFormPriority] = useState<"LOW" | "MEDIUM" | "URGENT">("MEDIUM");
  const [formTargetDate, setFormTargetDate] = useState("18/09/2026");

  // Multi-line Cart in Create Form
  const [cartItems, setCartItems] = useState<PRItemDetail[]>([
    {
      id: "draft-1",
      materialCode: "RAW-ACT-002",
      materialName: "Alpha Arbutin Pure Grade",
      categoryCoa: "110401 - Persediaan Bahan Baku",
      qty: 10,
      unit: "kg",
      estimatedPrice: 850000,
      subtotal: 8500000,
      notes: "Trial formula pencerah",
    },
  ]);

  // Reject Dialog Modal State
  const [rejectModalPr, setRejectModalPr] = useState<PurchaseRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filters & Tabs
  const filteredPrList = useMemo(() => {
    return prList.filter((pr) => {
      if (activeTab === "pending" && !["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(pr.status)) {
        return false;
      }
      if (activeTab === "approved" && pr.status !== "APPROVED") return false;
      if (activeTab === "ordered" && pr.status !== "ORDERED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        pr.prCode.toLowerCase().includes(q) ||
        pr.department.toLowerCase().includes(q) ||
        pr.requesterName.toLowerCase().includes(q) ||
        pr.items.some((it) => it.materialName.toLowerCase().includes(q) || it.materialCode.toLowerCase().includes(q))
      );
    });
  }, [prList, activeTab, searchQuery]);

  // KPIs
  const totalBudget = useMemo(() => prList.reduce((sum, p) => sum + p.totalEstimated, 0), [prList]);
  const pendingCount = useMemo(
    () => prList.filter((p) => ["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(p.status)).length,
    [prList]
  );
  const approvedCount = useMemo(() => prList.filter((p) => p.status === "APPROVED").length, [prList]);
  const orderedCount = useMemo(() => prList.filter((p) => p.status === "ORDERED").length, [prList]);

  // Handlers
  const handleAddItem = () => {
    const newItem: PRItemDetail = {
      id: `draft-${Date.now()}`,
      materialCode: "RAW-MAT-00" + (cartItems.length + 1),
      materialName: "Bahan Baru #" + (cartItems.length + 1),
      categoryCoa: formCoa,
      qty: 10,
      unit: "kg",
      estimatedPrice: 100000,
      subtotal: 1000000,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (cartItems.length <= 1) {
      toast.warning("Minimal 1 Item", "Permintaan pembelian wajib memiliki minimal 1 item barang.");
      return;
    }
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof PRItemDetail, val: any) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === "qty" || field === "estimatedPrice") {
            updated.subtotal = Number(updated.qty || 0) * Number(updated.estimatedPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalEst = cartItems.reduce((sum, it) => sum + it.subtotal, 0);

    let initStatus: PurchaseRequestRecord["status"] = "PENDING_HEAD";
    if (formRole === "HEAD") {
      initStatus = totalEst > 50000000 ? "PENDING_DIRECTOR" : "APPROVED";
    }

    const newPr: PurchaseRequestRecord = {
      id: `pr-${Date.now()}`,
      prCode: `DL-SCM-PR-${new Date().toLocaleDateString("id-ID").replace(/\//g, "")}-${String(
        prList.length + 1
      ).padStart(4, "0")}`,
      date: new Date().toLocaleDateString("id-ID"),
      department: formDept,
      requesterName: formRequester,
      requesterRole: formRole,
      categoryCoa: formCoa,
      priority: formPriority,
      targetDate: formTargetDate,
      totalEstimated: totalEst,
      status: initStatus,
      items: cartItems,
    };

    setPrList([newPr, ...prList]);
    setIsCreateOpen(false);
    toast.success("PR Berhasil Dibuat", `Pengajuan ${newPr.prCode} telah diserahkan untuk proses approval.`);
  };

  const handleApprove = (pr: PurchaseRequestRecord) => {
    let nextStatus: PurchaseRequestRecord["status"] = "APPROVED";
    let note = "Disetujui Head. Siap proses PO.";

    if (pr.status === "PENDING_HEAD") {
      if (pr.totalEstimated > 50000000) {
        nextStatus = "PENDING_DIRECTOR";
        note = "Head Approved. Dilanjutkan ke Direktur Utama (> Rp 50 Juta).";
      } else {
        nextStatus = "APPROVED";
        note = "Disetujui penuh. SCM dapat langsung menerbitkan PO.";
      }
    } else if (pr.status === "PENDING_DIRECTOR") {
      nextStatus = "APPROVED";
      note = "Otorisasi Direktur Utama selesai. PO dapat diterbitkan.";
    }

    setPrList(
      prList.map((item) => (item.id === pr.id ? { ...item, status: nextStatus, approvalNotes: note } : item))
    );
    if (selectedPr?.id === pr.id) {
      setSelectedPr({ ...selectedPr, status: nextStatus, approvalNotes: note });
    }
    toast.success("Otorisasi Berhasil", `Status ${pr.prCode} diperbarui ke ${nextStatus}.`);
  };

  const handleReject = () => {
    if (!rejectModalPr) return;
    if (!rejectReason.trim()) {
      toast.warning("Alasan Wajib Diisi", "Mohon isi catatan alasan penolakan PR untuk revisi departemen.");
      return;
    }

    setPrList(
      prList.map((item) =>
        item.id === rejectModalPr.id
          ? { ...item, status: "REJECTED", approvalNotes: `Ditolak: ${rejectReason}` }
          : item
      )
    );
    setRejectModalPr(null);
    setRejectReason("");
    if (selectedPr?.id === rejectModalPr.id) {
      setSelectedPr(null);
    }
    toast.error("PR Ditolak", `Pengajuan ${rejectModalPr.prCode} ditolak dengan catatan evaluasi.`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <DnaPageHeader
          title="Permintaan Pembelian (Purchase Request / PR)"
          description="Otorisasi & Pengajuan Pengadaan Bahan Baku Kosmetik, Kemasan Primer/Sekunder, dan Perlengkapan Pabrik (3-Tier Approval)"
          tabs={[
            { key: "all", label: "Semua Permintaan", count: prList.length },
            { key: "pending", label: "Menunggu Approval", count: pendingCount },
            { key: "approved", label: "Disetujui (Siap PO)", count: approvedCount },
            { key: "ordered", label: "Selesai PO", count: orderedCount },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <DnaButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
              + Buat Permintaan Pembelian
            </DnaButton>
          }
        />

        {/* 4 KPI Grid */}
        <DnaKpiGrid
          items={[
            {
              label: "Total Nilai Pengajuan PR",
              value: formatCurrency(totalBudget),
              subtitle: "Akumulasi estimasi anggaran pengadaan",
              trend: `${prList.length} Pengajuan`,
              icon: DollarSign,
              variant: "blue",
            },
            {
              label: "Menunggu Otorisasi Dana",
              value: `${pendingCount} PR Pending`,
              subtitle: "Verifikasi bertingkat 3-Tier",
              trend: "Antrean Aktif",
              icon: Clock,
              variant: "amber",
            },
            {
              label: "Disetujui (Siap Jadi PO)",
              value: `${approvedCount} PR Approved`,
              subtitle: "Siap diproses tim SCM Purchasing",
              trend: "Otorisasi Lengkap",
              icon: CheckCircle2,
              variant: "emerald",
            },
            {
              label: "Sudah Terbit PO Pembelian",
              value: `${orderedCount} PR Ordered`,
              subtitle: "Dalam proses pengiriman supplier",
              trend: "On Pipeline",
              icon: Package,
              variant: "purple",
            },
          ]}
        />

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="w-80">
            <DnaInput
              placeholder="Cari no PR, departemen, nama bahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Menampilkan <span className="text-slate-900 font-bold">{filteredPrList.length}</span> dari{" "}
            {prList.length} Pengajuan
          </div>
        </div>

        {/* Data Table */}
        <DnaDataTableCard
          title="Daftar Pengajuan Permintaan Pembelian (PR)"
          count={filteredPrList.length}
          description="Alur verifikasi kebutuhan bahan sebelum penerbitan PO resmi ke supplier."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider select-none whitespace-nowrap text-[10px]">
                  <th className="py-3 px-3 w-8 text-center">#</th>
                  <th className="py-3 px-3">KODE PR</th>
                  <th className="py-3 px-3">TGL PENGAJUAN</th>
                  <th className="py-3 px-3">DEPARTEMEN & PIC</th>
                  <th className="py-3 px-3">KATEGORI COA</th>
                  <th className="py-3 px-3 text-center">PRIORITAS</th>
                  <th className="py-3 px-3 text-center">TOTAL ITEM</th>
                  <th className="py-3 px-3 text-right">ESTIMASI BUDGET</th>
                  <th className="py-3 px-3 text-center">STATUS APPROVAL</th>
                  <th className="py-3 px-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      Tidak ada permintaan pembelian pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredPrList.map((pr, idx) => (
                    <tr
                      key={pr.id}
                      onClick={() => setSelectedPr(pr)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {pr.prCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[10px]">
                        {pr.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{pr.department}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {pr.requesterName} ({pr.requesterRole})
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {pr.categoryCoa}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            pr.priority === "URGENT"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : pr.priority === "MEDIUM"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {pr.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                        {pr.items.length} Bahan
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(pr.totalEstimated)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            pr.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : pr.status === "ORDERED"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : pr.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {pr.status === "PENDING_HEAD"
                            ? "Pending Head"
                            : pr.status === "PENDING_FINANCE"
                            ? "Pending Finance"
                            : pr.status === "PENDING_DIRECTOR"
                            ? "Pending Direktur (>50Jt)"
                            : pr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedPr(pr)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Lihat Rincian PR"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(pr.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(pr)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Setujui PR"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModalPr(pr)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Tolak PR"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>

      {/* Modal Detail PR */}
      <DnaModal
        isOpen={!!selectedPr}
        onClose={() => setSelectedPr(null)}
        title="Rincian Permintaan Pembelian (PR)"
        size="lg"
      >
        {selectedPr && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {selectedPr.prCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedPr.department}</h3>
                <p className="text-xs text-slate-500">
                  Diajukan oleh: <span className="font-semibold text-slate-700">{selectedPr.requesterName}</span> (
                  {selectedPr.requesterRole}) • Tanggal: <span className="font-mono">{selectedPr.date}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Total Estimasi</span>
                <span className="text-base font-black text-blue-600">{formatCurrency(selectedPr.totalEstimated)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Alokasi COA</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{selectedPr.categoryCoa}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Target Tiba di Pabrik</span>
                <span className="font-bold text-slate-800 font-mono">{selectedPr.targetDate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Status Approval</span>
                <span className="font-bold text-emerald-600">{selectedPr.status}</span>
              </div>
            </div>

            {/* Sub-tabel Item Bahan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daftar Bahan / Barang Diminta ({selectedPr.items.length} Item)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">KODE</th>
                      <th className="py-2 px-3">NAMA BAHAN</th>
                      <th className="py-2 px-2 text-right">QTY</th>
                      <th className="py-2 px-2 text-right">EST. HARGA</th>
                      <th className="py-2 px-3 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPr.items.map((it, i) => (
                      <tr key={it.id}>
                        <td className="py-2 px-2 text-slate-400 font-bold">{i + 1}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{it.materialCode}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {it.materialName}
                          {it.notes && <span className="block text-[10px] text-slate-400">{it.notes}</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-800">
                          {it.qty} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {formatCurrency(it.estimatedPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-blue-600">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPr.approvalNotes && (
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Catatan Otorisasi / Evaluasi:</span>
                {selectedPr.approvalNotes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedPr(null)}>
                Tutup
              </DnaButton>
              {["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(selectedPr.status) && (
                <>
                  <DnaButton
                    variant="danger"
                    onClick={() => {
                      setRejectModalPr(selectedPr);
                    }}
                  >
                    Tolak Pengajuan
                  </DnaButton>
                  <DnaButton variant="primary" onClick={() => handleApprove(selectedPr)}>
                    Setujui PR (Approve)
                  </DnaButton>
                </>
              )}
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Create PR Baru */}
      <DnaModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Permintaan Pembelian (PR)" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Departemen Pengaju *</label>
              <DnaSelect
                options={[
                  { value: "Produksi Pabrik", label: "Produksi Pabrik" },
                  { value: "Packaging & Finishing", label: "Packaging & Finishing" },
                  { value: "R&D Formulation Lab", label: "R&D Formulation Lab" },
                  { value: "Quality Control (QC)", label: "Quality Control (QC)" },
                  { value: "Gudang & Logistik", label: "Gudang & Logistik" },
                ]}
                value={formDept}
                onChange={(val) => setFormDept(val)}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kategori Pengadaan (COA) *</label>
              <DnaSelect
                options={[
                  { value: "110401 - Persediaan Bahan Baku", label: "110401 - Persediaan Bahan Baku" },
                  { value: "110402 - Persediaan Bahan Kemas", label: "110402 - Persediaan Bahan Kemas" },
                  { value: "510201 - Perlengkapan & Reagen QC", label: "510201 - Perlengkapan & Reagen QC" },
                ]}
                value={formCoa}
                onChange={(val) => setFormCoa(val)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama PIC Pengaju *</label>
              <DnaInput value={formRequester} onChange={(e) => setFormRequester(e.target.value)} />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Jenjang Jabatan *</label>
              <DnaSelect
                options={[
                  { value: "STAFF", label: "Staff (Butuh Approval Head)" },
                  { value: "HEAD", label: "Head Departemen (Langsung ke Finance/Dir)" },
                ]}
                value={formRole}
                onChange={(val) => setFormRole(val as "STAFF" | "HEAD")}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prioritas *</label>
              <DnaSelect
                options={[
                  { value: "LOW", label: "Low (Rutin Bulanan)" },
                  { value: "MEDIUM", label: "Medium (Batch Berikutnya)" },
                  { value: "URGENT", label: "Urgent (Stok Kritis Produksi)" },
                ]}
                value={formPriority}
                onChange={(val) => setFormPriority(val as any)}
              />
            </div>
          </div>

          {/* Dynamic Multi-line Cart */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px]">
                Keranjang Item Barang / Bahan ({cartItems.length})
              </span>
              <DnaButton type="button" size="sm" variant="secondary" onClick={handleAddItem}>
                + Tambah Baris Bahan
              </DnaButton>
            </div>

            <div className="space-y-2">
              {cartItems.map((item, idx) => (
                <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <DnaInput
                      placeholder="Nama Bahan Baku / Kemasan"
                      value={item.materialName}
                      onChange={(e) => handleUpdateItem(item.id, "materialName", e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <DnaInput
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-20">
                    <DnaSelect
                      options={[
                        { value: "kg", label: "kg" },
                        { value: "gram", label: "gram" },
                        { value: "pcs", label: "pcs" },
                        { value: "pack", label: "pack" },
                      ]}
                      value={item.unit}
                      onChange={(val) => handleUpdateItem(item.id, "unit", val)}
                    />
                  </div>
                  <div className="w-32">
                    <DnaInput
                      type="number"
                      placeholder="Est. Harga"
                      value={item.estimatedPrice}
                      onChange={(e) => handleUpdateItem(item.id, "estimatedPrice", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-28 text-right font-bold text-blue-600 font-mono text-[11px]">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-600">Total Estimasi Anggaran PR:</span>
              <span className="text-sm font-black text-blue-600 font-mono">
                {formatCurrency(cartItems.reduce((sum, it) => sum + it.subtotal, 0))}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Ajukan Permintaan Pembelian
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* Modal Reject dengan Alasan Wajib */}
      <DnaModal
        isOpen={!!rejectModalPr}
        onClose={() => setRejectModalPr(null)}
        title="Tolak Permintaan Pembelian"
        size="sm"
      >
        {rejectModalPr && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Anda akan menolak pengajuan <span className="font-bold text-slate-900">{rejectModalPr.prCode}</span>.
              Mohon berikan catatan alasan penolakan untuk evaluasi departemen terkait.
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan Alasan Penolakan *</label>
              <textarea
                className="w-full h-24 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="Contoh: Buffer stock di gudang masih mencukupi 2 minggu produksi..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DnaButton variant="secondary" onClick={() => setRejectModalPr(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="danger" onClick={handleReject}>
                Konfirmasi Tolak PR
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
