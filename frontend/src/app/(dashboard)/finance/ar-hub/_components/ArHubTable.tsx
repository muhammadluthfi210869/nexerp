"use client";

import React from "react";
import {
  CircleDollarSign,
  Package,
  FlaskConical,
  RotateCcw,
  FileIcon,
} from "lucide-react";
import {
  DnaButton,
  DnaBadge,
  DnaDataTableCard,
  DnaTabNav,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  formatRupiah,
} from "@/components/dna";
import {
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
} from "@/components/dna";
import type { PendingOrder, PendingSample, ReturnRow } from "../_types/ar-hub.types";
import { fmtDate } from "../_hooks/useArHubOperations";

interface ArHubTableProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  search: string;
  setSearch: (query: string) => void;
  tableError: boolean;
  isLoading: boolean;
  isReturnsLoading: boolean;
  orders: PendingOrder[];
  samples: PendingSample[];
  returns: ReturnRow[];
  filteredOrders: PendingOrder[];
  filteredSamples: PendingSample[];
  onValidate: (kind: "order" | "sample", row: any) => void;
  onRetry: () => void;
}

export function ArHubTable({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  tableError,
  isLoading,
  isReturnsLoading,
  orders,
  samples,
  returns,
  filteredOrders,
  filteredSamples,
  onValidate,
  onRetry,
}: ArHubTableProps) {
  return (
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
            onRetry={onRetry}
          />
        ) : isLoading ? (
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
                            onClick={() => onValidate("order", inv)}
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
                              {s.brandName} Â· {s.productInterest}
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
                            onClick={() => onValidate("sample", s)}
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
              {isReturnsLoading ? (
                <DnaLoadingSkeleton rows={4} />
              ) : returns.length === 0 ? (
                <div className="p-8">
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 bg-slate-50/50 text-center">
                    <RotateCcw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Retur Penjualan</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Belum ada data retur penjualan yang terbaca. Daftar ini dibaca langsung dari modul BusDev
                      (<span className="font-mono">GET /bussdev/returns</span>) â€” jika peran Anda tidak memiliki akses ke modul itu,
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
  );
}
