"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Eye,
  Check,
  Ban,
  FileCheck2,
  ArrowUpDown,
  Download,
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
  DnaBulkActionBar,
  DnaConfirmDialog,
  DnaExportButton,
  useDnaToast,
} from "@/components/dna";
import {
  ApprovalDetailModal,
  type ApprovalDetailData,
} from "./ApprovalDetailModal";
import { cn, formatRupiah } from "@/lib/utils";

export interface ApprovalColumn<T> {
  header: string;
  accessor?: keyof T | string;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface ApprovalPageShellProps<T extends { id: string; code: string; status: string; date: string; [key: string]: any }> {
  title: string;
  subtitle: string;
  categoryBadge: string;
  breadcrumbItems: Array<{ label: string; href?: string }>;
  items: T[];
  columns: ApprovalColumn<T>[];
  stats?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
    totalAmount?: number;
  };
  getDetailData: (item: T) => ApprovalDetailData;
  onApprove?: (id: string, notes?: string) => Promise<void> | void;
  onReject?: (id: string, reason: string) => Promise<void> | void;
  onBulkApprove?: (ids: string[]) => Promise<void> | void;
  searchPlaceholder?: string;
  extraHeaderActions?: React.ReactNode;
}

export function ApprovalPageShell<T extends { id: string; code: string; status: string; date: string; [key: string]: any }>({
  title,
  subtitle,
  categoryBadge,
  breadcrumbItems,
  items: initialItems,
  columns,
  stats: customStats,
  getDetailData,
  onApprove,
  onReject,
  onBulkApprove,
  searchPlaceholder = "Cari nomor dokumen, requester, keterangan...",
  extraHeaderActions,
}: ApprovalPageShellProps<T>) {
  const { showToast } = useDnaToast();

  // Local mutable state for optimistic updates if parent doesn't handle state directly
  const [items, setItems] = useState<T[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal inspection
  const [inspectingItem, setInspectingItem] = useState<T | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Bulk Approve Dialog
  const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] = useState(false);

  // Quick Single Approve Dialog from row
  const [quickApproveItem, setQuickApproveItem] = useState<T | null>(null);

  // Calculate live stats
  const calculatedStats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status.toUpperCase() === "PENDING" || i.status.toUpperCase() === "MENUNGGU").length;
    const approved = items.filter((i) => i.status.toUpperCase() === "APPROVED" || i.status.toUpperCase() === "DISETUJUI").length;
    const rejected = items.filter((i) => i.status.toUpperCase() === "REJECTED" || i.status.toUpperCase() === "DITOLAK").length;
    
    let totalAmount = 0;
    items.forEach((i) => {
      if (typeof i.totalAmount === "number") totalAmount += i.totalAmount;
      else if (typeof i.total === "number") totalAmount += i.total;
    });

    return {
      total: customStats?.total ?? total,
      pending: customStats?.pending ?? pending,
      approved: customStats?.approved ?? approved,
      rejected: customStats?.rejected ?? rejected,
      totalAmount: customStats?.totalAmount ?? totalAmount,
    };
  }, [items, customStats]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Tab filter
        const st = item.status.toUpperCase();
        if (tabFilter === "PENDING" && st !== "PENDING" && st !== "MENUNGGU") return false;
        if (tabFilter === "APPROVED" && st !== "APPROVED" && st !== "DISETUJUI") return false;
        if (tabFilter === "REJECTED" && st !== "REJECTED" && st !== "DITOLAK") return false;

        // Search query
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const matchCode = item.code?.toLowerCase().includes(q);
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchRequester = item.requesterName?.toLowerCase().includes(q) || item.creatorName?.toLowerCase().includes(q);
          const matchPartner = item.partnerName?.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchCode && !matchTitle && !matchRequester && !matchPartner && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        const valA = (a as any)[sortColumn];
        const valB = (b as any)[sortColumn];

        if (typeof valA === "number" && typeof valB === "number") {
          return dir * (valA - valB);
        }
        return dir * String(valA || "").localeCompare(String(valB || ""));
      });
  }, [items, tabFilter, searchQuery, sortColumn, sortDirection]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, page, pageSize]);

  // Total pages
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;

  // Selection handlers
  const isAllSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedRowIds.includes(item.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !paginatedItems.some((item) => item.id === id)));
    } else {
      const pageIds = paginatedItems.map((item) => item.id);
      setSelectedRowIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sort handler
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Approve action
  const handleApprove = async (id: string, notes?: string) => {
    setIsActionLoading(true);
    try {
      if (onApprove) {
        await onApprove(id, notes);
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
      );
      showToast({
        type: "success",
        title: "Persetujuan Diberikan",
        message: `Dokumen berhasil disetujui.`,
      });
      setIsDetailModalOpen(false);
      setQuickApproveItem(null);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Gagal Menyetujui",
        message: err?.message || "Terjadi kesalahan sistem saat memproses persetujuan.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reject action
  const handleReject = async (id: string, reason: string) => {
    setIsActionLoading(true);
    try {
      if (onReject) {
        await onReject(id, reason);
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "REJECTED", rejectReason: reason } : item))
      );
      showToast({
        type: "warning",
        title: "Pengajuan Ditolak",
        message: `Dokumen telah ditolak dengan alasan: "${reason}".`,
      });
      setIsDetailModalOpen(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Gagal Menolak",
        message: err?.message || "Terjadi kesalahan sistem saat memproses penolakan.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Approve action
  const handleBulkApproveConfirm = async () => {
    setIsActionLoading(true);
    try {
      if (onBulkApprove) {
        await onBulkApprove(selectedRowIds);
      }
      setItems((prev) =>
        prev.map((item) => (selectedRowIds.includes(item.id) ? { ...item, status: "APPROVED" } : item))
      );
      showToast({
        type: "success",
        title: "Persetujuan Massal Berhasil",
        message: `${selectedRowIds.length} dokumen telah disetujui secara bersamaan.`,
      });
      setSelectedRowIds([]);
      setIsBulkApproveDialogOpen(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Gagal Proses Massal",
        message: err?.message || "Terjadi kesalahan saat memproses batch persetujuan.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const openInspection = (item: T) => {
    setInspectingItem(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. UNBOXED PAGE HEADER (DNA SPEC) ── */}
      <DnaPageHeader
        title={title}
        badge={<DnaBadge status="info">{categoryBadge}</DnaBadge>}
        subtitle={subtitle}
        breadcrumbItems={breadcrumbItems}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaExportButton
              onExport={(type: string) => {
                showToast({
                  type: "success",
                  title: `Ekspor ${type.toUpperCase()} Berhasil`,
                  message: `Data ${filteredItems.length} transaksi persetujuan berhasil diunduh.`,
                });
              }}
            />
            {extraHeaderActions}
          </div>
        }
      />

      {/* ── 02. 4-KPI STAT CARDS ROW (LIVE VALUES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DnaStatCard
          label="Total Pengajuan"
          value={calculatedStats.total}
          subtext="Seluruh dokumen tercatat"
          variant="default"
        />
        <DnaStatCard
          label="Menunggu Persetujuan"
          value={calculatedStats.pending}
          subtext="Perlu tindakan verifikasi"
          variant="warning"
        />
        <DnaStatCard
          label="Telah Disetujui"
          value={calculatedStats.approved}
          subtext="Persetujuan tuntas"
          variant="success"
        />
        <DnaStatCard
          label="Pengajuan Ditolak"
          value={calculatedStats.rejected}
          subtext="Perlu revisi / dibatalkan"
          variant="danger"
        />
      </div>

      {/* ── 03. FILTER TABS BAR (DNA CAPSULE TABS) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {[
            { key: "ALL", label: `Semua (${calculatedStats.total})` },
            { key: "PENDING", label: `Menunggu (${calculatedStats.pending})` },
            { key: "APPROVED", label: `Disetujui (${calculatedStats.approved})` },
            { key: "REJECTED", label: `Ditolak (${calculatedStats.rejected})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTabFilter(tab.key as any);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer",
                tabFilter === tab.key
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setTabFilter("ALL");
            setSearchQuery("");
            setSortColumn(null);
            setSelectedRowIds([]);
            setPage(1);
            showToast({
              type: "info",
              title: "Filter Direset",
              message: "Menampilkan seluruh data pengajuan.",
            });
          }}
          className="h-8 px-3 text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filter</span>
        </button>
      </div>

      {/* ── 04. DATA TABLE CARD WITH INTEGRATED TOOLBAR ── */}
      <DnaDataTableCard
        title="DAFTAR TRANSAKSI PERSETUJUAN"
        count={filteredItems.length}
        badge={<DnaBadge status="neutral">READ ONLY REVIEW</DnaBadge>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 md:w-80 placeholder:text-slate-400"
              />
            </div>
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <th className={cn(DNA_TABLE_CLASSES.th, "w-10 text-center")}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Pilih semua baris"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && col.accessor && handleSort(String(col.accessor))}
                  className={cn(
                    DNA_TABLE_CLASSES.th,
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      col.align === "right" && "justify-end",
                      col.align === "center" && "justify-center"
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && col.accessor && (
                      <ArrowUpDown className={cn(
                        "w-3 h-3 text-slate-400",
                        sortColumn === col.accessor && "text-blue-600 font-bold"
                      )} />
                    )}
                  </div>
                </th>
              ))}
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-36")}>Aksi Review</th>
            </tr>
          </DnaTableHead>
          <tbody className={DNA_TABLE_CLASSES.tbody}>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-500">
                  <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada pengajuan ditemukan</p>
                  <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau tab filter status.</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedRowIds.includes(item.id);
                const isPending = item.status.toUpperCase() === "PENDING" || item.status.toUpperCase() === "MENUNGGU";

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      DNA_TABLE_CLASSES.tr,
                      isSelected && "bg-blue-50/50"
                    )}
                  >
                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item.id)}
                        aria-label={`Pilih ${item.code}`}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={cn(
                          DNA_TABLE_CLASSES.td,
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center"
                        )}
                      >
                        {col.render
                          ? col.render(item)
                          : col.accessor
                          ? String(item[col.accessor] ?? "-")
                          : "-"}
                      </td>
                    ))}

                    <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openInspection(item)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-blue-200/60"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Periksa</span>
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setQuickApproveItem(item)}
                            title="Setujui Cepat"
                            className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200/60"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DnaTable>

        {/* ── PAGINATION BAR ── */}
        <DnaPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </DnaDataTableCard>

      {/* ── 05. BULK ACTION BAR ── */}
      <DnaBulkActionBar
        selectedCount={selectedRowIds.length}
        label="dokumen terpilih"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRowIds([])}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 cursor-pointer"
          >
            Batal Pilih
          </button>
          <DnaButton
            variant="primary"
            size="sm"
            onClick={() => setIsBulkApproveDialogOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Setujui Massal ({selectedRowIds.length})</span>
          </DnaButton>
        </div>
      </DnaBulkActionBar>

      {/* ── 06. READ-ONLY INSPECTION DETAIL MODAL ── */}
      <ApprovalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setInspectingItem(null);
        }}
        data={inspectingItem ? getDetailData(inspectingItem) : null}
        onApprove={handleApprove}
        onReject={handleReject}
        isActionLoading={isActionLoading}
      />

      {/* ── 07. QUICK APPROVE CONFIRM DIALOG ── */}
      <DnaConfirmDialog
        isOpen={!!quickApproveItem}
        onClose={() => setQuickApproveItem(null)}
        onConfirm={async () => {
          if (quickApproveItem) {
            await handleApprove(quickApproveItem.id);
          }
        }}
        title={`Setujui Pengajuan ${quickApproveItem?.code}?`}
        description={`Apakah Anda yakin ingin menyetujui dokumen ini? Tindakan ini akan tercatat dalam audit log.`}
        confirmText="Ya, Setujui"
        variant="success"
        isProcessing={isActionLoading}
      />

      {/* ── 08. BULK APPROVE CONFIRM DIALOG ── */}
      <DnaConfirmDialog
        isOpen={isBulkApproveDialogOpen}
        onClose={() => setIsBulkApproveDialogOpen(false)}
        onConfirm={handleBulkApproveConfirm}
        title={`Setujui ${selectedRowIds.length} Dokumen Massal?`}
        description={`Anda akan menyetujui ${selectedRowIds.length} dokumen pengajuan secara massal. Seluruh status akan diperbarui dan diverifikasi oleh akun Anda.`}
        confirmText="Setujui Semua Terpilih"
        variant="success"
        isProcessing={isActionLoading}
      />
    </div>
  );
}
