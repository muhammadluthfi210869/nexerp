"use client";

import React, { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Eye,
  Search,
  Calendar,
  CreditCard,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Package,
  FlaskConical,
  ArrowUpRight,
  ShieldCheck,
  History,
  FileIcon,
  RotateCcw,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DnaInput,
  DnaButton,
  DnaBadge,
  DnaStatCard,
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaSelect,
  DnaTabNav,
  DnaTextarea,
  DnaModal,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  formatRupiah,
  useDnaToast,
} from "@/components/dna";
import {
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
} from "@/components/dna";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

interface PendingOrder {
  id: string;
  invoiceNumber: string;
  customerName: string;
  brandName: string;
  reference: string;
  issuedAt: string | null;
  dueDate: string | null;
  amountDue: number;
  outstanding: number;
  status: string;
  invoiceType: string;
}

interface PendingSample {
  id: string;
  activityType: string;
  clientName: string;
  brandName: string;
  productInterest: string;
  notes: string;
  amount: number;
  createdAt: string | null;
}

interface ReturnRow {
  id: string;
  returnDate: string | null;
  returnStatus: string;
  notes: string;
  soNumber: string;
  brandName: string;
  clientName: string;
  itemCount: number;
}

const num = (v: unknown) => Number(v ?? 0);

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "—";

export default function ARHubPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("products");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ kind: "order" | "sample"; row: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [bankAdminFee, setBankAdminFee] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const pendingQuery = useQuery<{ orders: PendingOrder[]; samples: PendingSample[] }>({
    queryKey: ["finance-ar-hub-pending"],
    queryFn: async () => {
      const res = await api.get("/finance/ar-hub/pending");
      const body = unwrapResponse<any>(res);
      const rawOrders: any[] = body?.orders ?? [];
      const rawSamples: any[] = body?.samples ?? [];

      return {
        orders: rawOrders.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName:
            inv.so?.lead?.clientName || inv.workOrder?.lead?.clientName || "Pelanggan tidak diketahui",
          brandName: inv.so?.lead?.brandName || inv.workOrder?.lead?.brandName || "—",
          reference: inv.so?.orderNumber || inv.workOrder?.woNumber || "—",
          issuedAt: inv.issuedAt ?? null,
          dueDate: inv.dueDate ?? null,
          amountDue: num(inv.amountDue),
          outstanding: num(inv.outstandingAmount),
          status: inv.status,
          invoiceType: inv.type,
        })),
        samples: rawSamples.map((s) => ({
          id: s.id,
          activityType: s.activityType,
          clientName: s.lead?.clientName || "—",
          brandName: s.lead?.brandName || "—",
          productInterest: s.lead?.productInterest || "—",
          notes: s.notes || "—",
          amount: num(s.amount),
          createdAt: s.createdAt ?? null,
        })),
      };
    },
  });

  // Aggregate figures for the KPI row — real invoice ledger, not a separate store.
  const invoicesQuery = useQuery<any[]>({
    queryKey: ["finance-ar-hub-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(res);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const accountsQuery = useQuery<any[]>({
    queryKey: ["finance-ar-hub-accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows.filter((a) => a.isActive !== false);
    },
  });

  // Sales returns live in the BusDev module; readable by BusDev/Warehouse roles.
  const returnsQuery = useQuery<ReturnRow[]>({
    queryKey: ["finance-ar-hub-returns"],
    retry: false,
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/returns");
        const body = unwrapResponse<any>(res);
        const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
        return rows.map((r) => ({
          id: r.id,
          returnDate: r.returnDate ?? null,
          returnStatus: r.returnStatus || "—",
          notes: r.notes || "—",
          soNumber: r.so?.orderNumber || "—",
          brandName: r.so?.brandName || "—",
          clientName: r.so?.lead?.clientName || "—",
          itemCount: Array.isArray(r.items) ? r.items.length : 0,
        }));
      } catch {
        return [];
      }
    },
  });

  const receivables = useMemo(
    () => (invoicesQuery.data ?? []).filter((inv) => inv.category === "RECEIVABLE"),
    [invoicesQuery.data],
  );

  const totalReceivables = receivables.reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);

  const overdue30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return receivables
      .filter((inv) => inv.dueDate && new Date(inv.dueDate).getTime() < cutoff && num(inv.outstandingAmount) > 0)
      .reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  }, [receivables]);

  const collectionsMtd = useMemo(() => {
    const now = new Date();
    return receivables
      .filter((inv) => {
        if (inv.status !== "PAID" || !inv.paidAt) return false;
        const paid = new Date(inv.paidAt);
        return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
      })
      .reduce((acc, inv) => acc + num(inv.amountDue), 0);
  }, [receivables]);

  const orders = pendingQuery.data?.orders ?? [];
  const samples = pendingQuery.data?.samples ?? [];
  const returns = returnsQuery.data ?? [];

  const pendingAmount = [...orders.map((o) => o.outstanding), ...samples.map((s) => s.amount)].reduce(
    (a, b) => a + b,
    0,
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.reference.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, search],
  );

  const filteredSamples = useMemo(
    () =>
      samples.filter(
        (s) =>
          s.clientName.toLowerCase().includes(search.toLowerCase()) ||
          s.brandName.toLowerCase().includes(search.toLowerCase()),
      ),
    [samples, search],
  );

  const openValidate = (kind: "order" | "sample", row: any) => {
    setSelected({ kind, row });
    setReceivingAccountId("");
    setActualAmount(kind === "order" ? String(row.outstanding) : String(row.amount));
    setBankAdminFee("0");
    setTaxAmount("0");
    setNotes("");
  };

  const closeModal = () => {
    setSelected(null);
    setIsSubmitting(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const amount = Number(actualAmount);
    if (!receivingAccountId || !(amount > 0)) {
      toast.error("Validasi Gagal", "Akun penerima dan nominal aktual wajib diisi.");
      return;
    }

    // Backend maps: SAMPLE_PAYMENT -> SAMPLE, DOWN_PAYMENT -> DP_ORDER,
    // and falls through to the invoice settlement branch for RECEIVABLE invoices.
    const type =
      selected.kind === "order"
        ? "PNBP"
        : selected.row.activityType === "DOWN_PAYMENT"
        ? "DP_ORDER"
        : "SAMPLE";

    setIsSubmitting(true);
    try {
      await api.post("/finance/ar-hub/verify", {
        type,
        id: selected.row.id,
        receivingAccountId,
        actualAmount: amount,
        bankAdminFee: Number(bankAdminFee) || 0,
        taxAmount: Number(taxAmount) || 0,
        notes: notes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-hub-pending"] });
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-hub-invoices"] });
      toast.success("Pembayaran Divalidasi", `${selected.row.invoiceNumber ?? selected.row.clientName} berhasil divalidasi.`);
      closeModal();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error("Gagal Validasi", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = (accountsQuery.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.code} — ${a.name}`,
  }));

  const tableError = pendingQuery.isError || invoicesQuery.isError;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="PENERIMAAN PIUTANG"
        subtitle="Validasi pembayaran masuk dari BusDev (sample & DP) dan pelunasan faktur penjualan"
        actions={
          <div className="flex gap-3">
            <DnaButton variant="outline" size="sm" onClick={() => pendingQuery.refetch()}>
              <History className="mr-2 h-4 w-4 text-amber-500" /> Muat Ulang
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Receivables"
          value={invoicesQuery.isLoading ? "…" : formatRupiah(totalReceivables)}
          delta={{ value: `${receivables.filter((i) => num(i.outstandingAmount) > 0).length} Faktur Belum Lunas`, isPositive: true }}
          icon={<TrendingUp className="text-blue-600" />}
          variant="blue"
        />
        <DnaStatCard
          label="Overdue (30+ Hari)"
          value={invoicesQuery.isLoading ? "…" : formatRupiah(overdue30)}
          delta={{ value: "Dihitung dari tanggal jatuh tempo", isPositive: false }}
          icon={<CreditCard className="text-rose-600" />}
          variant="rose"
        />
        <DnaStatCard
          label="Collections (MTD)"
          value={invoicesQuery.isLoading ? "…" : formatRupiah(collectionsMtd)}
          delta={{ value: "Faktur lunas bulan berjalan", isPositive: true }}
          icon={<Wallet className="text-emerald-500" />}
          variant="emerald"
        />
        <DnaStatCard
          label="Menunggu Validasi"
          value={pendingQuery.isLoading ? "…" : `${orders.length + samples.length} Dokumen`}
          delta={{ value: `${formatRupiah(pendingAmount)} nilai tercatat`, isPositive: true }}
          icon={<FlaskConical className="text-amber-500" />}
          variant="amber"
        />
      </DnaKpiGrid>

      <div className="w-full mt-6 space-y-4">
        <DnaTabNav
          tabs={[
            { id: "products", label: "Regular Products", icon: Package, count: orders.length },
            { id: "samples", label: "R&D Samples", icon: FlaskConical, count: samples.length },
            { id: "returns", label: "Retur", icon: RotateCcw, count: returns.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <DnaDataTableCard
          searchPlaceholder="Cari faktur, pelanggan, atau referensi..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          {tableError ? (
            <DnaErrorState
              title="Gagal Memuat Data Piutang"
              message="Tidak dapat mengambil daftar faktur / validasi dari server."
              onRetry={() => {
                pendingQuery.refetch();
                invoicesQuery.refetch();
              }}
            />
          ) : pendingQuery.isLoading ? (
            <DnaLoadingSkeleton rows={5} />
          ) : (
            <>
              {/* ---------- REGULAR PRODUCTS ---------- */}
              <div hidden={activeTab !== "products"}>
                {filteredOrders.length === 0 ? (
                  <DnaEmptyState
                    title="Tidak Ada Faktur Menunggu Validasi"
                    description="Semua faktur penjualan berstatus UNPAID/PARTIAL sudah divalidasi, atau belum ada faktur pada filter ini."
                  />
                ) : (
                  <DnaTable className="table-dense">
                    <DnaTableHead className="bg-slate-50/50">
                      <DnaTableRow className="hover:bg-transparent border-slate-100">
                        <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Faktur Identity</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO / Client</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Jatuh Tempo</DnaTh>
                        <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</DnaTh>
                        <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</DnaTh>
                        <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                        <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      {filteredOrders.map((inv) => (
                        <DnaTableRow key={inv.id} className="hover:bg-slate-50/30 transition-all">
                          <DnaTd className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.invoiceNumber}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase">{fmtDate(inv.issuedAt)}</span>
                              </div>
                            </div>
                          </DnaTd>
                          <DnaTd className="py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-[11px] uppercase">{inv.reference}</span>
                              <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.customerName}</span>
                            </div>
                          </DnaTd>
                          <DnaTd className="py-4 tabular-nums text-xs text-slate-600">{fmtDate(inv.dueDate)}</DnaTd>
                          <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-semibold">
                            {formatRupiah(inv.amountDue)}
                          </DnaTd>
                          <DnaTd className="text-right tabular-nums py-4 text-rose-600 text-xs font-semibold">
                            {formatRupiah(inv.outstanding)}
                          </DnaTd>
                          <DnaTd className="text-center py-4">
                            <DnaBadge variant={inv.status === "PARTIAL" ? "warning" : "critical"}>{inv.status}</DnaBadge>
                          </DnaTd>
                          <DnaTd className="pr-6 text-right py-4">
                            <DnaButton
                              onClick={() => openValidate("order", inv)}
                              variant="primary"
                              size="sm"
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Validasi
                            </DnaButton>
                          </DnaTd>
                        </DnaTableRow>
                      ))}
                    </DnaTableBody>
                  </DnaTable>
                )}
              </div>

              {/* ---------- R&D SAMPLES ---------- */}
              <div hidden={activeTab !== "samples"}>
                {filteredSamples.length === 0 ? (
                  <DnaEmptyState
                    title="Tidak Ada Pembayaran Sample Menunggu Validasi"
                    description="Aktivitas pembayaran sample / down payment dari BusDev yang belum divalidasi akan muncul di sini."
                  />
                ) : (
                  <DnaTable className="table-dense">
                    <DnaTableHead className="bg-slate-50/50">
                      <DnaTableRow className="hover:bg-transparent border-slate-100">
                        <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Jenis Aktivitas</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Brand</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Catatan</DnaTh>
                        <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Nominal</DnaTh>
                        <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</DnaTh>
                        <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      {filteredSamples.map((s) => (
                        <DnaTableRow key={s.id} className="hover:bg-slate-50/30 transition-all">
                          <DnaTd className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                <FlaskConical className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{s.activityType}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase">Belum divalidasi</span>
                              </div>
                            </div>
                          </DnaTd>
                          <DnaTd className="py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-[11px] uppercase">{s.clientName}</span>
                              <span className="text-[9px] font-medium text-blue-600 uppercase italic">
                                {s.brandName} · {s.productInterest}
                              </span>
                            </div>
                          </DnaTd>
                          <DnaTd className="py-4 text-xs text-slate-500 max-w-xs truncate" title={s.notes}>{s.notes}</DnaTd>
                          <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-semibold">
                            {formatRupiah(s.amount)}
                          </DnaTd>
                          <DnaTd className="text-center tabular-nums py-4 text-xs text-slate-600">{fmtDate(s.createdAt)}</DnaTd>
                          <DnaTd className="pr-6 text-right py-4">
                            <DnaButton
                              onClick={() => openValidate("sample", s)}
                              variant="primary"
                              size="sm"
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Validasi
                            </DnaButton>
                          </DnaTd>
                        </DnaTableRow>
                      ))}
                    </DnaTableBody>
                  </DnaTable>
                )}
              </div>

              {/* ---------- RETUR ---------- */}
              <div hidden={activeTab !== "returns"}>
                {returnsQuery.isLoading ? (
                  <DnaLoadingSkeleton rows={4} />
                ) : returns.length === 0 ? (
                  <div className="p-8">
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 bg-slate-50/50 text-center">
                      <RotateCcw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Retur Penjualan</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Belum ada data retur penjualan yang terbaca. Daftar ini dibaca langsung dari modul BusDev
                        (<span className="font-mono">GET /bussdev/returns</span>) — jika peran Anda tidak memiliki akses ke modul itu,
                        daftar akan tampil kosong. Penyesuaian piutang otomatis dari retur belum tersedia di backend finance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <DnaTable className="table-dense">
                    <DnaTableHead className="bg-slate-50/50">
                      <DnaTableRow className="hover:bg-transparent border-slate-100">
                        <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal Retur</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO / Pelanggan</DnaTh>
                        <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Brand</DnaTh>
                        <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Item</DnaTh>
                        <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                        <DnaTh className="pr-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Catatan</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      {returns.map((r) => (
                        <DnaTableRow key={r.id} className="hover:bg-slate-50/30 transition-all">
                          <DnaTd className="pl-6 py-4 tabular-nums text-xs text-slate-600">{fmtDate(r.returnDate)}</DnaTd>
                          <DnaTd className="py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-[11px] uppercase">{r.soNumber}</span>
                              <span className="text-[9px] font-medium text-blue-600 uppercase italic">{r.clientName}</span>
                            </div>
                          </DnaTd>
                          <DnaTd className="py-4 text-xs text-slate-700">{r.brandName}</DnaTd>
                          <DnaTd className="text-center tabular-nums py-4 text-xs text-slate-700">{r.itemCount}</DnaTd>
                          <DnaTd className="text-center py-4">
                            <DnaBadge variant="warning">{r.returnStatus}</DnaBadge>
                          </DnaTd>
                          <DnaTd className="pr-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={r.notes}>{r.notes}</DnaTd>
                        </DnaTableRow>
                      ))}
                    </DnaTableBody>
                  </DnaTable>
                )}
              </div>
            </>
          )}
        </DnaDataTableCard>
      </div>

      <DnaModal
        isOpen={!!selected}
        onClose={closeModal}
        title="Validasi Pembayaran Masuk"
        subtitle={
          selected?.kind === "order"
            ? `Faktur ${selected.row.invoiceNumber} — ${selected.row.customerName}`
            : selected
            ? `${selected.row.activityType} — ${selected.row.clientName}`
            : undefined
        }
        size="lg"
      >
        {selected && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Nilai Tercatat</p>
                <p className="font-black text-xs text-slate-900 tabular-nums">
                  {formatRupiah(selected.kind === "order" ? selected.row.outstanding : selected.row.amount)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Jenis</p>
                <p className="font-black text-xs uppercase text-slate-900">
                  {selected.kind === "order" ? selected.row.invoiceType : selected.row.activityType}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                <p className="font-black text-xs uppercase text-slate-900">
                  {selected.kind === "order" ? selected.row.status : "BELUM DIVALIDASI"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Akun Penerima *</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <DnaSelect
                    value={receivingAccountId}
                    onChange={setReceivingAccountId}
                    placeholder={accountsQuery.isLoading ? "Memuat akun..." : "Pilih akun..."}
                    options={accountOptions}
                    className="h-11 pl-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Tanggal Validasi</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <DnaInput
                    type="date"
                    value={new Date().toISOString().slice(0, 10)}
                    readOnly
                    className="h-11 pl-12 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Nominal Aktual *</label>
                <DnaInput
                  type="number"
                  min={1}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="h-11 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Biaya Bank</label>
                <DnaInput
                  type="number"
                  min={0}
                  value={bankAdminFee}
                  onChange={(e) => setBankAdminFee(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Pajak</label>
                <DnaInput
                  type="number"
                  min={0}
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Catatan / Referensi</label>
              <DnaTextarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., referensi transfer bank..."
                className="w-full"
              />
            </div>

            <div className="pt-3 flex gap-3 border-t border-slate-100">
              <DnaButton type="button" onClick={closeModal} variant="outline" className="flex-1">
                Batal
              </DnaButton>
              <DnaButton type="submit" variant="primary" className="flex-[2]" disabled={isSubmitting}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {isSubmitting ? "Memvalidasi..." : "Commit Validation"}
              </DnaButton>
            </div>
          </form>
        )}
      </DnaModal>

      <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-6 flex gap-6 items-center shadow-sm mt-6">
        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
          {tableError ? <ArrowUpRight className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Sumber Data</p>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            Angka di halaman ini dihitung dari <span className="font-mono">GET /finance/invoices</span> dan daftar tunggu
            validasi <span className="font-mono">GET /finance/ar-hub/pending</span>. Validasi mengirim
            <span className="font-mono"> POST /finance/ar-hub/verify</span> dan langsung memperbarui status dokumen di backend.
          </p>
        </div>
      </div>
    </DnaPageContainer>
  );
}