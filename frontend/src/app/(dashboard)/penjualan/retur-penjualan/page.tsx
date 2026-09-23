"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaDetailDrawer,
  DnaButton,
  DnaInput,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
} from "@/components/dna";

interface SalesReturn {
  id: string;
  returnCode: string;
  soId: string;
  soNumber: string;
  customerName: string;
  brandName?: string;
  returnDate: string;
  warehouseId?: string;
  warehouseName: string;
  productName: string;
  qtyReturned: number;
  unitPrice: number;
  totalValue: number;
  returnType: "POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND";
  status: "PROSES" | "QC_PASSED" | "SELESAI" | "DITOLAK";
  reason: string;
}

const statusBadgeConfig: Record<string, { status: "warning" | "info" | "success" | "critical"; label: string }> = {
  PROSES: { status: "warning", label: "Inspeksi QC" },
  QC_PASSED: { status: "info", label: "QC Lolos (Karantina)" },
  SELESAI: { status: "success", label: "Selesai (Di-Offset)" },
  DITOLAK: { status: "critical", label: "Ditolak QC" },
};

function ReturPenjualanContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailReturn, setDetailReturn] = useState<SalesReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formSoId, setFormSoId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formMaterialId, setFormMaterialId] = useState("");
  const [formProductName, setFormProductName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState<"POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND">("POTONG_TAGIHAN");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Fetch Sales Returns
  const {
    data: returns = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SalesReturn[]>({
    queryKey: ["bussdev-returns"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/returns");
      return (resp.data || []).map((r: any) => {
        const qty = (r.items || []).reduce(
          (sum: number, it: any) => sum + (Number(it.qtyReturned) || Number(it.qtyOriginal) || 0),
          0
        );
        const unitPrice = Number(r.items?.[0]?.unitPrice) || 0;
        const total = (r.items || []).reduce((sum: number, it: any) => {
          const itemQty = Number(it.qtyReturned) || Number(it.qtyOriginal) || 0;
          const price = Number(it.unitPrice) || unitPrice || 0;
          return sum + itemQty * price;
        }, 0);

        const productName =
          r.items?.[0]?.material?.name ||
          r.items?.[0]?.productName ||
          r.so?.items?.[0]?.productName ||
          "Produk Retur Maklon";

        const mappedStatus =
          r.returnStatus === "SELESAI"
            ? "SELESAI"
            : r.returnStatus === "QC_PASSED"
            ? "QC_PASSED"
            : r.returnStatus === "DITOLAK"
            ? "DITOLAK"
            : "PROSES";

        return {
          id: r.id,
          returnCode: `RET-${r.id.slice(0, 8).toUpperCase()}`,
          soId: r.soId || "",
          soNumber: r.so?.orderNumber || (r.soId ? `SO-${r.soId.slice(0, 8)}` : "N/A"),
          customerName: r.so?.lead?.clientName || "Klien Maklon",
          brandName: r.so?.brandName || "Private Label",
          returnDate: r.returnDate
            ? new Date(r.returnDate).toISOString().split("T")[0]
            : r.createdAt
            ? new Date(r.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          warehouseId: r.warehouseId || "",
          warehouseName: r.warehouse?.name || "Gudang Karantina Maklon (KRT-01)",
          productName,
          qtyReturned: qty > 0 ? qty : 1,
          unitPrice,
          totalValue: total > 0 ? total : 0,
          returnType: (r.returnStatus as any) || "POTONG_TAGIHAN",
          status: mappedStatus as SalesReturn["status"],
          reason: r.notes || "Pengembalian barang dalam inspeksi karantina.",
        };
      });
    },
  });

  // Fetch Sales Orders for dropdown
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      const resp = await api.get("/commercial/sales-orders");
      return resp.data || [];
    },
  });

  // Fetch Warehouses for dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ["active-warehouses"],
    queryFn: async () => {
      try {
        const resp = await api.get("/warehouse/warehouses");
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  // Auto populate on SO select
  const handleSoChange = (selectedId: string) => {
    setFormSoId(selectedId);
    const chosenSo = salesOrders.find((so: any) => so.id === selectedId);
    if (chosenSo) {
      if (chosenSo.items && chosenSo.items.length > 0) {
        const firstItem = chosenSo.items[0];
        setFormMaterialId(firstItem.materialItemId || "");
        setFormProductName(firstItem.productName || "");
        setFormPrice(String(firstItem.unitPrice || 0));
        setFormQty(String(firstItem.quantity || 1));
      }
    }
  };

  // Create Return Mutation
  const createReturnMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/bussdev/returns", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bussdev-returns"] });
      toast.success(
        "Retur Penjualan Dicatat",
        "Klaim retur berhasil dicatat ke gudang karantina dan nota kredit diproses."
      );
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mencatat retur penjualan";
      toast.error("Validasi Gagal", msg);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return api.patch(`/bussdev/returns/${id}`, { returnStatus: status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bussdev-returns"] });
      toast.success("Retur Diperbarui", "Status klaim retur berhasil diperbarui.");
      setDetailReturn(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal memperbarui retur";
      toast.error("Gagal", msg);
    },
  });

  const resetForm = () => {
    setFormSoId("");
    setFormWarehouseId("");
    setFormMaterialId("");
    setFormProductName("");
    setFormQty("");
    setFormPrice("");
    setFormReason("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSoId) {
      toast.error("Validasi Gagal", "Harap pilih referensi Sales Order.");
      return;
    }
    const qty = Number(formQty) || 1;
    const price = Number(formPrice) || 0;

    // Use selected warehouse or first available warehouse
    const targetWarehouseId =
      formWarehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);

    if (!targetWarehouseId) {
      toast.error("Validasi Gagal", "Gudang karantina wajib dipilih.");
      return;
    }

    const payload: any = {
      soId: formSoId,
      warehouseId: targetWarehouseId,
      returnStatus: formType,
      notes: formReason || "Klaim retur produk maklon",
    };

    if (formMaterialId) {
      payload.items = [
        {
          materialId: formMaterialId,
          qtyReturned: qty,
          qtyOriginal: qty,
          unitPrice: price,
        },
      ];
    }

    createReturnMutation.mutate(payload);
  };

  const filteredReturns = returns.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.returnCode.toLowerCase().includes(q) ||
      r.soNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReturnsCount = returns.length;
  const totalValue = returns.reduce((acc, r) => acc + r.totalValue, 0);
  const inProcessCount = returns.filter((r) => r.status === "PROSES" || r.status === "QC_PASSED").length;
  const completedCount = returns.filter((r) => r.status === "SELESAI").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="RETUR PENJUALAN (SALES RETURN)"
        description="Administrasi klaim pengembalian barang jadi dari klien maklon kosmetik, verifikasi QC gudang karantina, dan kompensasi nota kredit pemotong tagihan faktur."
        tabs={[
          { key: "ALL", label: "Semua Klaim", count: totalReturnsCount },
          { key: "PROSES", label: "Inspeksi QC", count: returns.filter((r) => r.status === "PROSES").length },
          { key: "QC_PASSED", label: "QC Lolos", count: returns.filter((r) => r.status === "QC_PASSED").length },
          { key: "SELESAI", label: "Selesai", count: completedCount },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (salesOrders.length > 0 && !formSoId) {
                handleSoChange(salesOrders[0].id);
              }
              if (warehouses.length > 0 && !formWarehouseId) {
                setFormWarehouseId(warehouses[0].id);
              }
              setIsCreateOpen(true);
            }}
          >
            Buat Retur Penjualan
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Klaim Retur",
            value: totalReturnsCount,
            subtitle: "Akumulasi komplain batch",
            trend: "0.8% dari volume kirim",
            icon: RotateCcw,
            variant: "blue",
          },
          {
            label: "Nilai Pemulihan (Kredit)",
            value: `Rp ${(totalValue / 1000000).toFixed(1)} Jt`,
            subtitle: "Potensi nota kredit invoice",
            trend: "Rekonsiliasi aktif",
            icon: ArrowRightLeft,
            variant: "purple",
          },
          {
            label: "Dalam Inspeksi QC",
            value: inProcessCount,
            subtitle: "Di gudang karantina",
            trend: "Butuh uji lab",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Retur Selesai (Di-Offset)",
            value: completedCount,
            subtitle: "Tagihan telah disesuaikan",
            trend: "Terselesaikan",
            icon: CheckCircle2,
            variant: "emerald",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        count={filteredReturns.length}
        totalItems={returns.length}
        toolbarProps={{
          searchPlaceholder: "Cari kode retur, SO, pelanggan, atau produk...",
          searchValue: searchTerm,
          onSearchChange: setSearchTerm,
        }}
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title="Gagal Memuat Data Retur"
            message={(error as any)?.message || "Terjadi kesalahan saat memuat data retur penjualan."}
            onRetry={() => refetch()}
          />
        ) : filteredReturns.length === 0 ? (
          <DnaEmptyState
            title="Tidak Ada Klaim Retur"
            description="Belum ada transaksi retur penjualan yang tercatat."
            actionButton={
              <DnaButton variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
                Buat Retur Baru
              </DnaButton>
            }
          />
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-[20%]">Kode Retur & SO</th>
                  <th className="py-3 px-3 w-[24%]">Pelanggan & Produk</th>
                  <th className="py-3 px-3 w-[18%]">Tanggal & Lokasi</th>
                  <th className="py-3 px-3 w-[16%] text-right">Nilai & Qty Retur</th>
                  <th className="py-3 px-3 w-[12%] text-center">Status</th>
                  <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-blue-600 truncate">{ret.returnCode}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{ret.soNumber}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 truncate">{ret.customerName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ret.productName}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono font-semibold text-slate-700">{ret.returnDate}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ret.warehouseName}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <p className="font-mono font-bold text-slate-900">Rp {ret.totalValue.toLocaleString("id-ID")}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ret.qtyReturned.toLocaleString("id-ID")} pcs</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DnaCell.Badge
                        status={statusBadgeConfig[ret.status]?.status || "default"}
                        label={statusBadgeConfig[ret.status]?.label || ret.status}
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton variant="ghost" size="sm" onClick={() => setDetailReturn(ret)}>
                          Detail
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>

      {/* Drawer Detail Retur Penjualan */}
      <DnaDetailDrawer
        isOpen={!!detailReturn}
        onClose={() => setDetailReturn(null)}
        title={detailReturn?.returnCode || "Detail Klaim Retur"}
        subtitle={detailReturn ? `${detailReturn.customerName} • ${detailReturn.soNumber}` : undefined}
        badge={
          detailReturn ? (
            <DnaCell.Badge
              status={statusBadgeConfig[detailReturn.status]?.status || "default"}
              label={statusBadgeConfig[detailReturn.status]?.label || detailReturn.status}
            />
          ) : undefined
        }
        actions={
          detailReturn ? (
            <div className="flex items-center justify-between w-full">
              {detailReturn.status !== "SELESAI" ? (
                <DnaButton
                  variant="primary"
                  loading={updateStatusMutation.isPending}
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: detailReturn.id,
                      status: "SELESAI",
                      notes: `${detailReturn.reason} - Selesai & Di-offset`,
                    });
                  }}
                >
                  Selesaikan & Offset Tagihan
                </DnaButton>
              ) : (
                <div />
              )}
              <DnaButton variant="secondary" onClick={() => setDetailReturn(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {detailReturn && (
          <div className="space-y-4 text-xs">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Klien Maklon</span>
                <span className="font-semibold text-slate-800 text-xs">{detailReturn.customerName}</span>
                <p className="text-[10px] text-slate-400">{detailReturn.brandName || "Private Label"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">No. Sales Order</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{detailReturn.soNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Retur</span>
                <span className="font-mono text-slate-700 text-xs">{detailReturn.returnDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gudang Alokasi</span>
                <span className="font-semibold text-slate-700 text-xs">{detailReturn.warehouseName}</span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Rincian Barang & Nilai</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Produk:</span>
                <span className="font-bold text-slate-800">{detailReturn.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Diretur:</span>
                <span className="font-semibold text-slate-800 font-mono">{detailReturn.qtyReturned.toLocaleString("id-ID")} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Satuan:</span>
                <span className="font-semibold text-slate-800 font-mono">Rp {detailReturn.unitPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-rose-600">
                <span>Total Nilai Kompensasi:</span>
                <span className="font-mono">Rp {detailReturn.totalValue.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Alasan Pengembalian / Temuan Lapangan:</span>
              {detailReturn.reason}
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Buat Retur Penjualan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Catat Retur Penjualan Baru"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Pilih Sales Order Referensi *
            </label>
            <select
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formSoId}
              onChange={(e) => handleSoChange(e.target.value)}
              required
            >
              <option value="">-- Pilih Sales Order --</option>
              {salesOrders.map((so: any) => (
                <option key={so.id} value={so.id}>
                  {so.orderNumber} - {so.lead?.clientName || so.brandName || "Client"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Produk Retur</label>
            <DnaInput
              placeholder="Contoh: Brightening Niacinamide Serum 10%"
              value={formProductName}
              onChange={(e) => setFormProductName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Qty Retur (Pcs) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 100"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Harga Satuan (Rp)</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 15000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Gudang Penerima</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
              >
                {warehouses.length > 0 ? (
                  warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))
                ) : (
                  <option value="">Gudang Karantina Maklon</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Metode Kompensasi</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="POTONG_TAGIHAN">Potong Faktur / Nota Kredit</option>
                <option value="GANTI_BARANG">Ganti Barang Baru</option>
                <option value="REFUND">Pengembalian Dana Kas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Alasan Retur / Kerusakan</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Tutup botol bocor halus saat distribusi."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              type="submit"
              variant="primary"
              loading={createReturnMutation.isPending}
            >
              Simpan & Teruskan ke QC
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function ReturPenjualanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Retur Penjualan...</div>}>
      <ReturPenjualanContent />
    </Suspense>
  );
}
