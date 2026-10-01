"use client";

import React from "react";
import {
  Search,
  ClipboardList,
  User,
  BadgeCheck,
  XCircle,
  Send,
  Eye,
  ShoppingCart,
} from "lucide-react";
import {
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaDataTableCard,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { EmptyState } from "@/components/empty-state";
import { PurchaseOrder, STATUS_BADGE_MAP } from "../_types/purchasing.types";

interface PurchasingTableProps {
  purchaseOrders: PurchaseOrder[];
  searchPo: string;
  setSearchPo: (v: string) => void;
  searchItemName: string;
  setSearchItemName: (v: string) => void;
  searchMinQty: string;
  setSearchMinQty: (v: string) => void;
  searchMaxQty: string;
  setSearchMaxQty: (v: string) => void;
  searchDateFrom: string;
  setSearchDateFrom: (v: string) => void;
  searchDateTo: string;
  setSearchDateTo: (v: string) => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onApprovePO: (id: string) => void;
  onRejectPO: (id: string) => void;
  onViewDetail?: (po: PurchaseOrder) => void;
}

export function PurchasingTable({
  purchaseOrders,
  searchPo,
  setSearchPo,
  searchItemName,
  setSearchItemName,
  searchMinQty,
  setSearchMinQty,
  searchMaxQty,
  setSearchMaxQty,
  searchDateFrom,
  setSearchDateFrom,
  searchDateTo,
  setSearchDateTo,
  onResetFilters,
  onOpenCreate,
  onApprovePO,
  onRejectPO,
  onViewDetail,
}: PurchasingTableProps) {
  const hasFilterActive =
    searchPo ||
    searchItemName ||
    searchMinQty ||
    searchMaxQty ||
    searchDateFrom ||
    searchDateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Purchase Order</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DnaInput
            placeholder="Cari PO, supplier..."
            value={searchPo}
            onChange={(e) => setSearchPo(e.target.value)}
            icon={<Search />}
            className="w-48"
          />
          <DnaInput
            placeholder="Nama item..."
            value={searchItemName}
            onChange={(e) => setSearchItemName(e.target.value)}
            className="w-40"
          />
          <div className="flex items-center gap-1">
            <DnaInput
              type="number"
              placeholder="Qty min"
              value={searchMinQty}
              onChange={(e) => setSearchMinQty(e.target.value)}
              className="w-20"
            />
            <span className="text-slate-400 text-xs">-</span>
            <DnaInput
              type="number"
              placeholder="Qty max"
              value={searchMaxQty}
              onChange={(e) => setSearchMaxQty(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-1">
            <DnaInput
              type="date"
              placeholder="Tgl dari"
              value={searchDateFrom}
              onChange={(e) => setSearchDateFrom(e.target.value)}
              className="w-36"
            />
            <span className="text-slate-400 text-xs">-</span>
            <DnaInput
              type="date"
              placeholder="Tgl sampai"
              value={searchDateTo}
              onChange={(e) => setSearchDateTo(e.target.value)}
              className="w-36"
            />
          </div>
          {hasFilterActive && (
            <button
              onClick={onResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <DnaDataTableCard>
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <DnaTh className="py-3 px-4">No. PO</DnaTh>
              <DnaTh className="py-3 px-4">Supplier</DnaTh>
              <DnaTh className="py-3 px-4">Tgl</DnaTh>
              <DnaTh className="py-3 px-4">Pembuat</DnaTh>
              <DnaTh className="py-3 px-4 text-right">Nilai</DnaTh>
              <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
              <DnaTh className="py-3 px-4 text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {!purchaseOrders || purchaseOrders.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={7} className="py-6">
                  <EmptyState
                    icon={<ShoppingCart className="h-8 w-8 text-slate-300" />}
                    title="Belum Ada PO"
                    description="Buat purchase order baru untuk memulai pengadaan."
                    action={
                      <DnaButton variant="primary" onClick={onOpenCreate}>
                        Buat PO Baru
                      </DnaButton>
                    }
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              purchaseOrders.map((po) => (
                <DnaTableRow key={po.id} className="hover:bg-slate-50/80">
                  <DnaTd className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs uppercase italic">
                          {po.poNumber}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <DnaCell.Text primary={po.supplier?.name || "-"} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <DnaCell.Date value={po.estArrival || "-"} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-600">
                        {po.scm?.fullName || "-"}
                      </span>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <DnaCell.Currency value={Number(po.totalValue || 0)} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-center">
                    <DnaBadge status={STATUS_BADGE_MAP[po.status] || "default"}>
                      {po.status?.replace("_", " ") || "DRAFT"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {(po.status === "DRAFT" || po.status === "PENDING_APPROVAL") && (
                        <>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            onClick={() => onApprovePO(po.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            icon={<BadgeCheck className="h-3.5 w-3.5" />}
                          >
                            Setuju
                          </DnaButton>
                          <DnaButton
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectPO(po.id)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Tolak
                          </DnaButton>
                        </>
                      )}
                      {po.status === "APPROVED" && (
                        <DnaButton
                          variant="primary"
                          size="sm"
                          icon={<Send className="h-3.5 w-3.5" />}
                        >
                          Kirim PO
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="icon"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => onViewDetail?.(po)}
                      />
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
