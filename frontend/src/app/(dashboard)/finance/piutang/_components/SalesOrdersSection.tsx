"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { SalesOrderRow } from "../_types/piutang.types";

interface SalesOrdersSectionProps {
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredOrders?: SalesOrderRow[];
  pendingVerification: SalesOrderRow[];
  onReviewProof: (order: SalesOrderRow) => void;
}

export function SalesOrdersSection({
  isLoading,
  searchQuery,
  onSearchChange,
  filteredOrders,
  pendingVerification,
  onReviewProof,
}: SalesOrdersSectionProps) {
  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Master Sales Order Log</h3>
        <Link href="/penjualan/sales-orders" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ShoppingCart className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      {pendingVerification.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          {pendingVerification.map((order: any) => (
            <div
              key={order.id}
              className="p-6 bg-white border border-slate-200 shadow-sm border-l-4 border-amber-500 rounded-2xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <DnaBadge variant="warning">AWAITING DP</DnaBadge>
                <span className="text-[10px] font-black text-slate-300">#{order.id}</span>
              </div>
              <h4 className="font-black text-slate-900 uppercase italic text-sm line-clamp-1">{order.lead?.clientName}</h4>
              <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{formatCurrency(Number(order.totalAmount))}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                <DnaButton
                  variant="primary"
                  className="flex-1 h-10 bg-blue-600 hover:bg-amber-500 rounded-xl"
                  onClick={() => onReviewProof(order)}
                >
                  Verify Payment
                </DnaButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search orders, clients, or IDs..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        }
      >
        <DnaTable className="table-dense">
          <DnaTableHead className="bg-slate-50/50">
            <DnaTableRow className="border-slate-100">
              <DnaTh className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[10px]">Order Protocol</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Commercial Value</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Payment Intel</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Lifecycle</DnaTh>
              <DnaTh className="pr-6 text-right py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Audit</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredOrders?.map((order: any) => (
              <DnaTableRow key={order.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="py-4 pl-6">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black italic shadow-sm group-hover:bg-amber-500 transition-all duration-500">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase italic text-base leading-none">{order.lead?.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-2 flex items-center gap-1">
                        <span className="text-amber-500 font-bold">ID:</span> {order.orderNumber} â€¢{" "}
                        <span className="text-blue-500 font-bold">PIC:</span> {order.lead?.pic?.name}
                      </p>
                    </div>
                  </div>
                </DnaTd>
                <DnaTd>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tighter tabular-nums">{formatCurrency(Number(order.totalAmount))}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">MOQ: {order.quantity?.toLocaleString()} Pcs</span>
                  </div>
                </DnaTd>
                <DnaTd className="text-center">
                  {order.isPaymentVerified ? (
                    <div className="flex flex-col items-center gap-1">
                      <DnaBadge variant="success">VERIFIED</DnaBadge>
                      <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tight">On {new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                    </div>
                  ) : order.paymentProofUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <DnaBadge variant="warning" className="animate-pulse">PENDING VALIDATION</DnaBadge>
                      <DnaButton
                        variant="ghost"
                        className="h-6 text-[8px] text-blue-600 hover:bg-blue-50"
                        icon={<ExternalLink className="h-2 w-2" />}
                        onClick={() => onReviewProof(order)}
                      >
                        Review Proof
                      </DnaButton>
                    </div>
                  ) : (
                    <DnaBadge variant="default">AWAITING PROOF</DnaBadge>
                  )}
                </DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={order.status === "DP_PAID" ? "info" : order.status === "PENDING_DP" ? "warning" : "default"}>
                    {order.status?.replace("_", " ")}
                  </DnaBadge>
                </DnaTd>
                <DnaTd className="text-right pr-6">
                  <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
