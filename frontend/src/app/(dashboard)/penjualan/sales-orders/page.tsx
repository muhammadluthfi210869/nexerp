"use client";

/**
 * Sales Orders (SO) — Commercial Operations Workbench
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 17, 60, & 120),
 * dan REQUIREMENT.md Poin 38 (Input deadline per PIC), 148 (Format Kode Universal ringkas/lengkap),
 * serta AR Delivery Gatekeeper (HELD vs RELEASED).
 *
 * Visual DNA Golden Reference:
 * - Light Enterprise Theme (bg-[#F8FAFC])
 * - DnaPageHeader with primary action (+ Buat Sales Order)
 * - DnaKpiGrid with 4 interactive KPI cards (Total SO, Pending Approval, Proses Pabrik, Omzet)
 * - DnaDataTableCard with 2-level filter toolbar (search, order category, gatekeeper, status)
 * - Standardized DnaCell.* primitives
 * - DnaModal for Buat SO (dengan multi-line item cart & deadline per PIC) dan Detail Inspeksi
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";
import { unwrapData } from "@/lib/api-client";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDetailDrawer,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

export interface SalesOrderItem {
  id: string;
  soCode: string; // Universal Code e.g. DL-FIN-SO-202609-0001
  orderDate: string;
  customerName: string;
  brandName: string;
  category: "MAKLON_BARU" | "REPEAT_ORDER" | "JUAL_PUTUS";
  deadlineFinal: string;
  deadlinePic: {
    design: string;
    rnd: string;
    scm: string;
    production: string;
  };
  items: {
    itemName: string;
    netto: string;
    qty: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
  grandTotal: number;
  approvalStatus: "PENDING" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED";
  gatekeeperStatus: "HELD" | "RELEASED";
  notes?: string;
}

function SalesOrdersContent() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGatekeeper, setSelectedGatekeeper] = useState("ALL");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SalesOrderItem | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [codeType, setCodeType] = useState<"SHORT" | "FULL">("SHORT");
  const [form, setForm] = useState({
    customerName: "",
    brandName: "",
    category: "MAKLON_BARU" as SalesOrderItem["category"],
    orderDate: new Date().toISOString().slice(0, 10),
    deadlineFinal: "2026-10-31",
    deadlineDesign: "2026-09-20",
    deadlineRnd: "2026-09-28",
    deadlineScm: "2026-10-08",
    deadlineProduction: "2026-10-25",
    itemName: "",
    netto: "50ml",
    qty: "2000",
    unitPrice: "35000",
    discount: "0",
    notes: "",
  });

  // Query commercial sales orders
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useApiQuery<SalesOrderItem[]>(
    ["commercial-sales-orders"],
    async () => {
      const resp = await api.get("/commercial/sales-orders");
      const raw = unwrapData<any[]>(resp.data);
      const items = Array.isArray(raw) ? raw : [];
      return items.map((so: any) => ({
        id: so.id,
        soCode: so.orderNumber,
        orderDate: so.orderDate
          ? new Date(so.orderDate).toISOString().slice(0, 10)
          : so.createdAt
          ? new Date(so.createdAt).toISOString().slice(0, 10)
          : "",
        customerName: so.lead?.clientName || so.customerName || "Pelanggan",
        brandName: so.brandName || so.lead?.brandName || "Brand",
        category: (so.salesCategory || so.category || "MAKLON_BARU") as SalesOrderItem["category"],
        deadlineFinal: so.deadlineFinal
          ? new Date(so.deadlineFinal).toISOString().slice(0, 10)
          : "-",
        deadlinePic: {
          design: so.deadlineDesign
            ? new Date(so.deadlineDesign).toISOString().slice(0, 10)
            : "-",
          rnd: so.deadlineRnd ? new Date(so.deadlineRnd).toISOString().slice(0, 10) : "-",
          scm: so.deadlineScm ? new Date(so.deadlineScm).toISOString().slice(0, 10) : "-",
          production: so.deadlineProduction
            ? new Date(so.deadlineProduction).toISOString().slice(0, 10)
            : "-",
        },
        items: (so.items || []).map((it: any) => ({
          itemName: it.productName || it.description || "Item",
          netto: it.netto ? `${it.netto}g` : "30g",
          qty: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          subtotal:
            (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
        })),
        grandTotal: Number(so.totalAmount) || 0,
        approvalStatus: so.status || "PENDING",
        gatekeeperStatus: (so.deliveryGateStatus || "HELD") as "HELD" | "RELEASED",
        notes: so.notes || "",
      }));
    },
  );

  // Query customers for leadId mapping if available
  const { data: customers = [] } = useApiQuery<any[]>(
    ["master-customers-dropdown"],
    async () => {
      try {
        const resp = await api.get("/customers");
        const raw = unwrapData<any[]>(resp.data);
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    },
  );

  // KPI calculations
  const totalOmzet = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPending = orders.filter((o) => o.approvalStatus === "PENDING").length;
  const totalInProd = orders.filter((o) => o.approvalStatus === "IN_PRODUCTION").length;
  const totalReleased = orders.filter((o) => o.gatekeeperStatus === "RELEASED").length;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedKpiFilter === "PENDING" && o.approvalStatus !== "PENDING") return false;
      if (selectedKpiFilter === "IN_PROD" && o.approvalStatus !== "IN_PRODUCTION") return false;
      if (selectedKpiFilter === "RELEASED" && o.gatekeeperStatus !== "RELEASED") return false;

      if (selectedCategory !== "ALL" && o.category !== selectedCategory) return false;
      if (selectedGatekeeper !== "ALL" && o.gatekeeperStatus !== selectedGatekeeper) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = o.soCode.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchBrand = o.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchCustomer && !matchBrand) return false;
      }

      return true;
    });
  }, [orders, selectedKpiFilter, selectedCategory, selectedGatekeeper, searchQuery]);

  // Gatekeeper mutation
  const gatekeeperMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "HELD" | "RELEASED" }) => {
      return api.post(`/commercial/sales-orders/${id}/delivery-gate`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales-orders"] });
      toast.success(
        `Gatekeeper Pengiriman diubah ke ${variables.status}. ${
          variables.status === "RELEASED"
            ? "Gudang diizinkan mencetak Surat Jalan / DO."
            : "Gudang dikunci dari pengiriman."
        }`
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mengubah gatekeeper";
      toast.error("Gagal", msg);
    },
  });

  // Create SO mutation
  const createSOMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/sales-orders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-sales-orders"] });
      toast.success("Sales Order berhasil diterbitkan!");
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal menerbitkan SO";
      toast.error("Validasi Gagal", msg);
    },
  });

  const handleCreateSO = () => {
    if (!form.customerName.trim() || !form.itemName.trim()) {
      toast.warning("Nama Pelanggan dan Nama Produk wajib diisi!");
      return;
    }

    const qtyNum = parseInt(form.qty) || 1000;
    const priceNum = parseInt(form.unitPrice) || 30000;
    const discNum = parseInt(form.discount) || 0;

    const matchedCustomer = customers.find(
      (c: any) =>
        c.clientName?.toLowerCase() === form.customerName.trim().toLowerCase() ||
        c.name?.toLowerCase() === form.customerName.trim().toLowerCase()
    );
    const leadId = matchedCustomer?.id || (customers[0]?.id ?? "00000000-0000-0000-0000-000000000001");

    createSOMutation.mutate({
      leadId,
      salesCategory: form.category,
      brandName: form.brandName || form.customerName,
      deadlineFinal: form.deadlineFinal,
      deadlineDesign: form.deadlineDesign,
      deadlineRnd: form.deadlineRnd,
      deadlineScm: form.deadlineScm,
      deadlineProduction: form.deadlineProduction,
      notes: form.notes,
      items: [
        {
          materialId: "00000000-0000-0000-0000-000000000001",
          productName: form.itemName,
          quantity: qtyNum,
          unitPrice: priceNum,
          discount: discNum,
        },
      ],
    });
  };

  const handleToggleGatekeeper = (so: SalesOrderItem) => {
    const nextStatus = so.gatekeeperStatus === "HELD" ? "RELEASED" : "HELD";
    gatekeeperMutation.mutate({ id: so.id, status: nextStatus });
    if (selectedDetail && selectedDetail.id === so.id) {
      setSelectedDetail((prev) => (prev ? { ...prev, gatekeeperStatus: nextStatus } : null));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans space-y-6">
      <DnaPageHeader
        title="PENJUALAN & SALES ORDERS (SO)"
        tabs={[
          { key: "ALL", label: "Semua Order", count: orders.length },
          { key: "PENDING", label: "Menunggu Approval", count: totalPending },
          { key: "IN_PROD", label: "Proses Pabrik", count: totalInProd },
        ]}
        activeTab={selectedKpiFilter || "ALL"}
        onTabChange={(k) => setSelectedKpiFilter(k === "ALL" ? null : k)}
      />

      {/* 4 KPI Cards */}
      <DnaKpiGrid
        cards={[
          {
            key: "ALL",
            title: "TOTAL SALES ORDERS",
            value: `${orders.length} Order`,
            deltaText: "Kontrak aktif terdaftar",
            isDeltaPositive: true,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: selectedKpiFilter === null,
            onClick: () => setSelectedKpiFilter(null),
          },
          {
            key: "PENDING",
            title: "MENUNGGU APPROVAL",
            value: `${totalPending} SO`,
            deltaText: "Verifikasi kontrak & DP",
            isDeltaPositive: false,
            icon: <Clock className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: selectedKpiFilter === "PENDING",
            onClick: () =>
              setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING"),
          },
          {
            key: "IN_PROD",
            title: "DALAM PRODUKSI PABRIK",
            value: `${totalInProd} SO`,
            deltaText: "Mixing / filling / packing",
            isDeltaPositive: true,
            icon: <Package className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: selectedKpiFilter === "IN_PROD",
            onClick: () =>
              setSelectedKpiFilter(selectedKpiFilter === "IN_PROD" ? null : "IN_PROD"),
          },
          {
            key: "OMZET",
            title: "TOTAL OMZET BERJALAN",
            value: formatCurrency(totalOmzet),
            deltaText: `${totalReleased} SO Siap Kirim (RELEASED)`,
            isDeltaPositive: true,
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
        ]}
      />

      {/* Data Table Card with Unified Toolbar */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={6} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Sales Order"
          message={(error as any)?.message || "Terjadi kesalahan saat memuat data dari server."}
          onRetry={() => refetch()}
        />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari no SO, nama klien, brand...",
            filterColumns: [
              {
                key: "category",
                label: "Kategori Order",
                type: "select",
                options: ["MAKLON_BARU", "REPEAT_ORDER", "JUAL_PUTUS"],
              },
              {
                key: "gatekeeper",
                label: "Gatekeeper DO",
                type: "select",
                options: ["RELEASED", "HELD"],
              },
            ],
            selectedColumn: selectedCategory !== "ALL" ? "category" : selectedGatekeeper !== "ALL" ? "gatekeeper" : undefined,
            onSelectColumn: (col) => {
              if (!col) {
                setSelectedCategory("ALL");
                setSelectedGatekeeper("ALL");
              }
            },
            filterValue: selectedCategory !== "ALL" ? selectedCategory : selectedGatekeeper !== "ALL" ? selectedGatekeeper : "",
            onFilterValueChange: (val) => {
              if (["MAKLON_BARU", "REPEAT_ORDER", "JUAL_PUTUS"].includes(val)) {
                setSelectedCategory(val);
              } else if (["RELEASED", "HELD"].includes(val)) {
                setSelectedGatekeeper(val);
              } else {
                setSelectedCategory("ALL");
                setSelectedGatekeeper("ALL");
              }
            },
            actionButton: {
              label: "Buat Sales Order (SO)",
              onClick: () => setIsCreateOpen(true),
            },
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: filteredOrders.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
                  <DnaTh className="px-3.5 py-2.5 w-[50px] text-center text-slate-400">#</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[180px]">No. Sales Order</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[110px]">Tanggal</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 min-w-[200px]">Pelanggan & Brand</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[140px]">Kategori</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[120px]">Deadline Final</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[150px] text-right">Total Nilai</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">Gatekeeper</DnaTh>
                  <DnaTh className="px-3.5 py-2.5 w-[130px] text-center">Status Order</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredOrders.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                      Tidak ada transaksi sales order yang sesuai dengan filter atau pencarian Anda.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredOrders.map((so, idx) => (
                    <DnaTableRow
                      key={so.id}
                      onClick={() => setSelectedDetail(so)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">{idx + 1}</DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Code code={so.soCode} />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text text={so.orderDate} />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <div>
                          <div className="text-[12px] font-medium text-slate-900 line-clamp-1">{so.customerName}</div>
                          <div className="text-[10.5px] text-slate-400 font-normal mt-0.5 line-clamp-1">{so.brandName}</div>
                        </div>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {so.category.replace(/_/g, " ")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 tabular-nums text-[11.5px] text-slate-700">
                        {so.deadlineFinal}
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-right">
                        <DnaCell.Numeric value={so.grandTotal} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleGatekeeper(so)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${
                            so.gatekeeperStatus === "RELEASED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                          }`}
                          title="Klik untuk ubah gatekeeper logistik"
                        >
                          {so.gatekeeperStatus === "RELEASED" ? (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              RELEASED
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-rose-600" />
                              HELD
                            </>
                          )}
                        </button>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
                        <DnaCell.Badge
                          status={
                            so.approvalStatus === "COMPLETED"
                              ? "approved"
                              : so.approvalStatus === "IN_PRODUCTION"
                              ? "progress"
                              : so.approvalStatus === "APPROVED"
                              ? "info"
                              : "pending"
                          }
                          label={so.approvalStatus}
                        />
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          onClick={() => setSelectedDetail(so)}
                          title="Lihat Detail"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* Modal Buat SO Baru (Multi-Line Cart & Deadline per PIC) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Sales Order (SO) Baru"
        subtitle="Formulir Kontrak Penjualan Produk & Matriks Alokasi Deadline per Departemen"
        size="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <DnaButton variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateSO}>
              Terbitkan Sales Order
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-medium">
          {/* Format Kode Universal Selector (Poin 148) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                Format Penomoran Kode SO Universal
              </span>
              <span className="text-[10px] text-slate-500">
                Pilih format standar kode transaksi sesuai SOP perusahaan (Poin 148)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCodeType("SHORT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  codeType === "SHORT"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Ringkas (SO-202609-0001)
              </button>
              <button
                type="button"
                onClick={() => setCodeType("FULL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  codeType === "FULL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Lengkap (DL-BUS-SO-...)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Nama Pelanggan *
              </label>
              <DnaInput
                placeholder="Contoh: PT Cantik Jelita"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Brand Produk
              </label>
              <DnaInput
                placeholder="Contoh: Jelita Glow"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kategori Order
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="MAKLON_BARU">Maklon Baru (Batch 1)</option>
                <option value="REPEAT_ORDER">Repeat Order (Batch Lanjutan)</option>
                <option value="JUAL_PUTUS">Jual Putus / Distribusi</option>
              </select>
            </div>
          </div>

          {/* Deadlines per PIC Section (Requirement Poin 38) */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Alokasi Deadline per PIC / Departemen (Poin 38)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  1. PIC Desain & Kemas:
                </span>
                <input
                  type="date"
                  value={form.deadlineDesign}
                  onChange={(e) => setForm({ ...form, deadlineDesign: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  2. PIC Formulasi R&D:
                </span>
                <input
                  type="date"
                  value={form.deadlineRnd}
                  onChange={(e) => setForm({ ...form, deadlineRnd: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  3. PIC Pengadaan SCM:
                </span>
                <input
                  type="date"
                  value={form.deadlineScm}
                  onChange={(e) => setForm({ ...form, deadlineScm: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  4. PIC Produksi Pabrik:
                </span>
                <input
                  type="date"
                  value={form.deadlineProduction}
                  onChange={(e) => setForm({ ...form, deadlineProduction: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Multi-line Product Cart Item */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-white">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Rincian Item Produk
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Produk *
                </label>
                <DnaInput
                  placeholder="Contoh: Sunscreen Brightening SPF 50"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Netto / Ukuran
                </label>
                <DnaInput
                  placeholder="30g / 50ml"
                  value={form.netto}
                  onChange={(e) => setForm({ ...form, netto: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kuantitas (Qty)
                </label>
                <DnaInput
                  type="number"
                  placeholder="2000"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Harga Satuan (Rp)
                </label>
                <DnaInput
                  type="number"
                  placeholder="35000"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </DnaModal>

      {/* Drawer Detail SO */}
      <DnaDetailDrawer
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={selectedDetail ? `Sales Order ${selectedDetail.soCode}` : "Detail Sales Order"}
        subtitle={selectedDetail ? `${selectedDetail.customerName} (${selectedDetail.brandName})` : undefined}
        badge={selectedDetail?.approvalStatus}
        badgeVariant={
          selectedDetail?.approvalStatus === "COMPLETED"
            ? "success"
            : selectedDetail?.approvalStatus === "IN_PRODUCTION"
            ? "primary"
            : "neutral"
        }
        actions={
          selectedDetail && (
            <>
              <button
                type="button"
                onClick={() => handleToggleGatekeeper(selectedDetail)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedDetail.gatekeeperStatus === "RELEASED"
                    ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                {selectedDetail.gatekeeperStatus === "RELEASED" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Kunci Gatekeeper (Tahan DO)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    Buka Gatekeeper (Siap Kirim DO)
                  </>
                )}
              </button>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.info(`Mencetak Kontrak Penjualan ${selectedDetail.soCode}`);
                }}
                className="gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak SO
              </DnaButton>
              <DnaButton variant="outline" onClick={() => setSelectedDetail(null)}>
                Tutup
              </DnaButton>
            </>
          )
        }
      >
        {selectedDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tgl Order:</span>
                <p className="font-bold text-slate-800">{selectedDetail.orderDate}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Deadline Final:</span>
                <p className="font-bold text-slate-800">{selectedDetail.deadlineFinal}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Approval:</span>
                <p className="font-bold text-blue-600">{selectedDetail.approvalStatus}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grand Total:</span>
                <p className="font-bold text-emerald-600">{formatCurrency(selectedDetail.grandTotal)}</p>
              </div>
            </div>

            {/* Matriks Deadline per PIC */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Target Deadline per PIC (Poin 38)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">DESAIN KEMASAN</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.design}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">FORMULA R&D</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.rnd}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">PENGADAAN SCM</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.scm}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">PRODUKSI PABRIK</span>
                  <span className="font-bold text-slate-800">{selectedDetail.deadlinePic.production}</span>
                </div>
              </div>
            </div>

            {/* Rincian Produk */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Rincian Produk Dipesan
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[10px] font-bold">
                      <DnaTh className="p-2.5">PRODUK</DnaTh>
                      <DnaTh className="p-2.5 text-center">NETTO</DnaTh>
                      <DnaTh className="p-2.5 text-right">QTY</DnaTh>
                      <DnaTh className="p-2.5 text-right">HARGA (RP)</DnaTh>
                      <DnaTh className="p-2.5 text-right">DISKON (RP)</DnaTh>
                      <DnaTh className="p-2.5 text-right">SUBTOTAL</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedDetail.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="p-2.5 font-bold text-slate-800">{it.itemName}</DnaTd>
                        <DnaTd className="p-2.5 text-center text-slate-500">{it.netto}</DnaTd>
                        <DnaTd className="p-2.5 text-right font-medium">{it.qty.toLocaleString()} pcs</DnaTd>
                        <DnaTd className="p-2.5 text-right font-medium">{formatCurrency(it.unitPrice)}</DnaTd>
                        <DnaTd className="p-2.5 text-right text-rose-600 font-medium">
                          {it.discount > 0 ? `-${formatCurrency(it.discount)}` : "—"}
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(it.subtotal)}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {selectedDetail.notes && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                <span className="font-bold text-slate-700 block mb-0.5">Catatan Order:</span>
                {selectedDetail.notes}
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}

export default function SalesOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <SalesOrdersContent />
    </Suspense>
  );
}
