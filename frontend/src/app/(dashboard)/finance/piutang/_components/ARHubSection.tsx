"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Wallet,
  FlaskConical,
  ShieldCheck,
  Package,
  RotateCcw,
  History,
  FileText,
  Eye,
  CircleDollarSign,
} from "lucide-react";
import {
  DnaStatCard,
  DnaDataTableCard,
  DnaTabNav,
  DnaButton,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaBadge,
} from "@/components/dna";
import type { ArInvoiceRow, ArReturnRow, ArHubSubTabId } from "../_types/piutang.types";

interface ARHubSectionProps {
  activeTab: ArHubSubTabId;
  onTabChange: (tab: string) => void;
  totalReceivables: number;
  outstandingCount: number;
  overdue30: number;
  collectionsMtd: number;
  sampleRevenue: number;
  orders: ArInvoiceRow[];
  samples: ArInvoiceRow[];
  returns: ArReturnRow[];
  onOpenPaymentModal: (inv: ArInvoiceRow) => void;
}

const rp = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

export function ARHubSection({
  activeTab,
  onTabChange,
  totalReceivables,
  outstandingCount,
  overdue30,
  collectionsMtd,
  sampleRevenue,
  orders,
  samples,
  returns,
  onOpenPaymentModal,
}: ARHubSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Total Receivables" value={rp(totalReceivables)} subValue={`${outstandingCount} Faktur Outstanding`} icon={<TrendingUp className="text-blue-600" />} />
        <DnaStatCard label="Overdue (30+ Days)" value={rp(overdue30)} subValue="Risk Profile: Low" icon={<CreditCard className="text-rose-600" />} />
        <DnaStatCard label="Collections (MTD)" value={rp(collectionsMtd)} subValue="Dari Ledger Faktur" icon={<Wallet className="text-emerald-500" />} />
        <DnaStatCard label="Sample Revenue" value={rp(sampleRevenue)} subValue="R&D Commitment" icon={<FlaskConical className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Penerimaan Piutang</h3>
        <Link href="/finance/ar-hub" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> + Validasi
        </Link>
      </div>

      <div className="w-full">
        <DnaDataTableCard
          customToolbar={
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
              <DnaTabNav
                tabs={[
                  { id: "products", label: "Regular Products", icon: Package },
                  { id: "samples", label: "R&D Samples", icon: FlaskConical },
                  { id: "returns", label: "Retur", icon: RotateCcw },
                ]}
                activeTab={activeTab}
                onChange={onTabChange}
              />
              <DnaButton variant="outline" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-400">
                <History className="h-5 w-5" />
              </DnaButton>
            </div>
          }
        >
          <div hidden={activeTab !== "products"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
            {orders.length === 0 ? (
              <DnaEmptyState
                icon={<FileText className="h-10 w-10 text-slate-300" />}
                title="Tidak Ada Faktur Menunggu Validasi"
                description="Faktur penjualan berstatus UNPAID/PARTIAL akan muncul di sini untuk validasi penerimaan."
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
                  {orders.map((inv) => (
                    <DnaTableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                      <DnaTd className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase">{inv.tanggal}</span>
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-[11px] uppercase">{inv.kode_so}</span>
                          <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.pelanggan}</span>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-4">
                        <DnaBadge variant="default">{inv.ref}</DnaBadge>
                      </DnaTd>
                      <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-black">
                        Rp {inv.grand_total.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="text-right tabular-nums py-4 text-rose-600 text-xs font-black">
                        Rp {inv.sisa.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="text-center py-4">
                        <DnaBadge variant={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                      </DnaTd>
                      <DnaTd className="pr-6 text-right py-4">
                        <div className="flex justify-end gap-2">
                          <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                            <Eye className="h-3.5 w-3.5" />
                          </DnaButton>
                          {inv.sisa > 0 && (
                            <DnaButton
                              onClick={() => onOpenPaymentModal(inv)}
                              variant="primary"
                              className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                            </DnaButton>
                          )}
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            )}
          </div>

          <div hidden={activeTab !== "samples"} className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {samples.length === 0 ? (
              <DnaEmptyState
                icon={<FlaskConical className="h-10 w-10 text-slate-300" />}
                title="Tidak Ada Pembayaran Sample Menunggu Validasi"
                description="Aktivitas pembayaran sample / down payment dari BusDev yang belum divalidasi akan muncul di sini."
              />
            ) : (
              <DnaTable className="table-dense">
                <DnaTableHead className="bg-slate-50/50">
                  <DnaTableRow className="hover:bg-transparent border-slate-100">
                    <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Sample Identity</DnaTh>
                    <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Produk</DnaTh>
                    <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</DnaTh>
                    <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</DnaTh>
                    <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                    <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {samples.map((inv) => (
                    <DnaTableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                      <DnaTd className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <FlaskConical className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase">Ref: {inv.ref}</span>
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-[11px] uppercase">{inv.pelanggan}</span>
                          <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.produk}</span>
                        </div>
                      </DnaTd>
                      <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-black">
                        Rp {inv.grand_total.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="text-right tabular-nums py-4 text-rose-600 text-xs font-black">
                        Rp {inv.sisa.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="text-center py-4">
                        <DnaBadge variant={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                      </DnaTd>
                      <DnaTd className="pr-6 text-right py-4">
                        <div className="flex justify-end gap-2">
                          <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                            <Eye className="h-3.5 w-3.5" />
                          </DnaButton>
                          <DnaButton
                            onClick={() => onOpenPaymentModal(inv)}
                            variant="primary"
                            className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            )}
          </div>

          <div hidden={activeTab !== "returns"} className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {returns.length === 0 ? (
              <DnaEmptyState
                icon={<RotateCcw className="h-10 w-10 text-slate-300" />}
                title="Belum Ada Retur Penjualan"
                description="Retur dari BusDev akan muncul di sini untuk adjustment piutang: kurangi outstanding invoice + buat jurnal adjustment."
              />
            ) : (
              <DnaTable className="table-dense">
                <DnaTableHead className="bg-slate-50/50">
                  <DnaTableRow className="hover:bg-transparent border-slate-100">
                    <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">No. Retur / SO</DnaTh>
                    <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Brand</DnaTh>
                    <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Catatan</DnaTh>
                    <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</DnaTh>
                    <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Item</DnaTh>
                    <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {returns.map((r) => (
                    <DnaTableRow key={r.id} className="hover:bg-slate-50/30 transition-all border-b border-slate-50">
                      <DnaTd className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-sm">
                            <RotateCcw className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{r.no_retur}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase">Retur Penjualan</span>
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-[11px] uppercase">{r.pelanggan}</span>
                          <span className="text-[9px] font-medium text-blue-600 uppercase italic">{r.brand}</span>
                        </div>
                      </DnaTd>
                      <DnaTd className="py-4">
                        <span className="text-[10px] text-slate-500">{r.catatan}</span>
                      </DnaTd>
                      <DnaTd className="text-center py-4 text-[10px] text-slate-500 tabular-nums">{r.tanggal}</DnaTd>
                      <DnaTd className="text-center py-4 text-xs font-black text-slate-900 tabular-nums">{r.jumlah_item}</DnaTd>
                      <DnaTd className="pr-6 text-right py-4">
                        <DnaBadge variant={r.status === "APPROVED" ? "success" : "info"}>{r.status}</DnaBadge>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            )}
          </div>
        </DnaDataTableCard>
      </div>
    </div>
  );
}
