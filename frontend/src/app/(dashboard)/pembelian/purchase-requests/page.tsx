"use client";

/**
 * Permintaan Pembelian (Purchase Request / PR)
 * Screen ID: SCR-040 (List) & SCR-041 (Form)
 *
 * Sesuai Spesifikasi Visual DNA Golden Reference:
 * - DnaPageContainer, DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaDetailDrawer
 * - Matriks Approval Bertingkat 3-Tier (Staff -> Head Dept -> Finance -> Direktur jika > 50 Jt)
 * - Alokasi Kategori COA (110401 Bahan Baku, 110402 Bahan Kemas, 510201 Perlengkapan Pabrik)
 * - Multi-line Keranjang Pengadaan Barang dengan auto-calculate
 * - 6 kolom ramping tanpa scroll horizontal, 2 baris per sel
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  DollarSign,
  Eye,
  Trash2,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaDetailDrawer,
  DnaBadge,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
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

export default function PurchaseRequestsModernPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Permintaan Pembelian...</div>}>
      <PurchaseRequestsContent />
    </Suspense>
  );
}

function PurchaseRequestsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPr, setSelectedPr] = useState<PurchaseRequestRecord | null>(null);

  // Live Query from backend /purchase/requests
  const {
    data: rawPrs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase-requests-list"],
    queryFn: async () => {
      const res = await api.get("/purchase/requests");
      return unwrapResponse(res) || [];
    },
  });

  // Query raw materials for cart items
  const { data: rawMaterials = [] } = useQuery({
    queryKey: ["raw-materials-dropdown"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return unwrapResponse(res) || [];
    },
  });

  const prList: PurchaseRequestRecord[] = useMemo(() => {
    return (rawPrs as any[]).map((pr) => {
      const totalEst =
        pr.items?.reduce(
          (sum: number, it: any) =>
            sum + Number(it.qtyRequired ?? it.quantity ?? 0) * Number(it.estimatedPrice ?? 0),
          0
        ) || 0;

      return {
        id: pr.id,
        prCode: pr.requestNumber || pr.id,
        date: pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("id-ID") : "-",
        department: pr.warehouse?.name || "Produksi Pabrik",
        requesterName: pr.creator?.name || "Staff Pengadaan",
        requesterRole: pr.creator?.role?.includes("HEAD") || pr.creator?.role?.includes("DIRECTOR") ? "HEAD" : "STAFF",
        categoryCoa: pr.budgetCode || "110401 - Persediaan Bahan Baku",
        priority: (pr.priority as "LOW" | "MEDIUM" | "URGENT") || "MEDIUM",
        targetDate: pr.createdAt
          ? new Date(new Date(pr.createdAt).getTime() + 7 * 86400000).toLocaleDateString("id-ID")
          : "-",
        totalEstimated: totalEst,
        status: pr.status || "PENDING",
        approvalNotes: pr.notes,
        items: (pr.items || []).map((it: any) => ({
          id: it.id,
          materialCode: it.material?.code || it.materialId || "-",
          materialName: it.material?.name || "Item Material",
          categoryCoa: pr.budgetCode || "110401 - Persediaan Bahan Baku",
          qty: Number(it.qtyRequired ?? it.quantity ?? 0),
          unit: it.material?.unit || "kg",
          estimatedPrice: Number(it.estimatedPrice ?? 0),
          subtotal: Number(it.qtyRequired ?? it.quantity ?? 0) * Number(it.estimatedPrice ?? 0),
          notes: it.notes,
        })),
      };
    });
  }, [rawPrs]);

  // Modal Create PR State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const [formDept, setFormDept] = useState("Produksi Pabrik");
  const [formRequester, setFormRequester] = useState("Staff Produksi");
  const [formRole, setFormRole] = useState<"STAFF" | "HEAD">("STAFF");
  const [formCoa, setFormCoa] = useState("110401 - Persediaan Bahan Baku");
  const [formPriority, setFormPriority] = useState<"LOW" | "MEDIUM" | "URGENT">("MEDIUM");

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

  // Mutations
  const createPrMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/requests", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.success("PR Berhasil Dibuat", "Pengajuan telah dikirim untuk approval.");
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Buat PR", err?.response?.data?.message || err.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/purchase/requests/${id}/approve`);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.success("Otorisasi Berhasil", "Status PR berhasil disetujui.");
      setSelectedPr(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Otorisasi", err?.response?.data?.message || err.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post(`/purchase/requests/${id}/reject`, { reason });
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.error("PR Ditolak", "Pengajuan telah ditolak.");
      setRejectModalPr(null);
      setSelectedPr(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Menolak PR", err?.response?.data?.message || err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.warning("Minimal 1 Item", "Permintaan pembelian wajib memiliki minimal 1 item barang.");
      return;
    }

    const itemsPayload = cartItems.map((it) => {
      const matched = (rawMaterials as any[]).find(
        (m) => m.id === it.id || m.code === it.materialCode || m.name?.toLowerCase() === it.materialName?.toLowerCase()
      );
      return {
        materialId: matched?.id || (rawMaterials as any[])[0]?.id || "default-mat",
        qtyRequired: Number(it.qty) || 1,
        estimatedPrice: Number(it.estimatedPrice) || 0,
      };
    });

    createPrMutation.mutate({
      notes: `Pengajuan ${formDept} (${formRequester}) - Prioritas: ${formPriority}`,
      budgetCode: formCoa,
      priority: formPriority,
      items: itemsPayload,
    });
  };

  const handleApprove = (pr: PurchaseRequestRecord) => {
    approveMutation.mutate(pr.id);
  };

  const handleReject = () => {
    if (!rejectModalPr) return;
    if (!rejectReason.trim()) {
      toast.warning("Alasan Wajib Diisi", "Mohon isi catatan alasan penolakan PR untuk revisi departemen.");
      return;
    }
    rejectMutation.mutate({ id: rejectModalPr.id, reason: rejectReason });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">Approved</DnaBadge>;
      case "ORDERED":
        return <DnaBadge variant="info">Ordered (PO Terbit)</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak</DnaBadge>;
      case "PENDING_HEAD":
        return <DnaBadge variant="warning">Pending Head</DnaBadge>;
      case "PENDING_FINANCE":
        return <DnaBadge variant="warning">Pending Finance</DnaBadge>;
      case "PENDING_DIRECTOR":
        return <DnaBadge variant="warning">Pending Direktur</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Urgent</span>;
      case "MEDIUM":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      default:
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  return (
    <DnaPageContainer>
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
          <DnaButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
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

      {/* Data Table */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Permintaan Pembelian"
            message="Terjadi kesalahan saat memuat data dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Cari no PR, departemen, pemohon...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. PR</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Departemen</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Pemohon</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Kategori Anggaran</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-center">Prioritas</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Estimasi Budget</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-center">Status Approval</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredPrList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Permintaan Pembelian"
                        description="Belum ada data permintaan pembelian yang sesuai filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredPrList.map((pr) => (
                    <DnaTableRow
                      key={pr.id}
                      onClick={() => setSelectedPr(pr)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={pr.prCode} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={pr.date} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={pr.department} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">
                          {pr.requesterName} <span className="text-[10.5px] text-slate-400 font-normal">({pr.requesterRole})</span>
                        </span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{pr.categoryCoa}</span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {getPriorityBadge(pr.priority)}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={pr.totalEstimated} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {getStatusBadge(pr.status)}
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => setSelectedPr(pr)}
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                          {["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(pr.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(pr)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Setujui PR"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModalPr(pr)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Tolak PR"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for PR Details */}
      <DnaDetailDrawer
        isOpen={!!selectedPr}
        onClose={() => setSelectedPr(null)}
        title={selectedPr?.prCode || "Rincian Permintaan Pembelian"}
        subtitle={selectedPr ? `Departemen: ${selectedPr.department} • Pemohon: ${selectedPr.requesterName}` : undefined}
        badge={selectedPr ? getStatusBadge(selectedPr.status) : undefined}
        footer={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedPr(null)}>
              Tutup
            </DnaButton>
            {selectedPr && ["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(selectedPr.status) && (
              <div className="flex items-center gap-2">
                <DnaButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setRejectModalPr(selectedPr);
                  }}
                >
                  Tolak Pengajuan
                </DnaButton>
                <DnaButton
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleApprove(selectedPr)}
                >
                  Setujui PR (Approve)
                </DnaButton>
              </div>
            )}
          </div>
        }
      >
        {selectedPr && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Departemen & Pemohon</span>
                <span className="font-bold text-slate-900 text-sm block">{selectedPr.department}</span>
                <span className="text-slate-500 text-[11px]">
                  Diajukan oleh: <span className="font-semibold text-slate-700">{selectedPr.requesterName}</span> ({selectedPr.requesterRole}) • {selectedPr.date}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total Estimasi</span>
                <span className="text-base font-bold text-blue-600 tabular-nums block">
                  {formatCurrency(selectedPr.totalEstimated)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Alokasi COA</span>
                <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPr.categoryCoa}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Target Tiba</span>
                <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPr.targetDate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Prioritas</span>
                <div>{getPriorityBadge(selectedPr.priority)}</div>
              </div>
            </div>

            {/* Sub-tabel Item Bahan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Bahan / Barang Diminta ({selectedPr.items.length} Item)
              </h4>
              <div className="overflow-x-auto">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <DnaTh className="py-2 px-2">#</DnaTh>
                      <DnaTh className="py-2 px-2">KODE</DnaTh>
                      <DnaTh className="py-2 px-3">NAMA BAHAN</DnaTh>
                      <DnaTh className="py-2 px-2 text-right">QTY</DnaTh>
                      <DnaTh className="py-2 px-2 text-right">EST. HARGA</DnaTh>
                      <DnaTh className="py-2 px-3 text-right">SUBTOTAL</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedPr.items.map((it, i) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-2 px-2 text-slate-400 font-bold">{i + 1}</DnaTd>
                        <DnaTd className="py-2 px-2 tabular-nums text-slate-600 text-[11px]">{it.materialCode}</DnaTd>
                        <DnaTd className="py-2 px-3 font-semibold text-slate-900">
                          {it.materialName}
                          {it.notes && <span className="block text-[10px] text-slate-400">{it.notes}</span>}
                        </DnaTd>
                        <DnaTd className="py-2 px-2 text-right font-bold text-slate-800">
                          {it.qty} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2 px-2 text-right tabular-nums text-slate-600 text-[11px]">
                          {formatCurrency(it.estimatedPrice)}
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right font-bold text-blue-600 tabular-nums text-[11px]">
                          {formatCurrency(it.subtotal)}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {selectedPr.approvalNotes && (
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Catatan Otorisasi / Evaluasi:</span>
                {selectedPr.approvalNotes}
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

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
                  <div className="w-28 text-right font-bold text-blue-600 tabular-nums text-[11px]">
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
              <span className="text-sm font-black text-blue-600 tabular-nums">
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
    </DnaPageContainer>
  );
}
