"use client";

import React from "react";
import { User, BadgeCheck, XCircle, Eye } from "lucide-react";
import {
  DnaButton,
  DnaBadge,
  DnaDataTableCard,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { PurchaseRequest, STATUS_BADGE_MAP } from "../_types/purchasing.types";

interface PurchaseRequestTableProps {
  prs: PurchaseRequest[] | undefined;
  onApprovePR: (id: string) => void;
  onRejectPR: (id: string) => void;
  onViewDetail?: (pr: PurchaseRequest) => void;
}

export function PurchaseRequestTable({
  prs,
  onApprovePR,
  onRejectPR,
  onViewDetail,
}: PurchaseRequestTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Daftar Purchase Request
          </h3>
        </div>
      </div>

      <DnaDataTableCard>
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <DnaTh className="py-3 px-4">ID</DnaTh>
              <DnaTh className="py-3 px-4">Gudang</DnaTh>
              <DnaTh className="py-3 px-4">Pembuat</DnaTh>
              <DnaTh className="py-3 px-4 text-right">Jml Item</DnaTh>
              <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
              <DnaTh className="py-3 px-4 text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {!prs || prs.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-16 text-center">
                  <p className="text-slate-400 font-medium">Belum ada permintaan pembelian.</p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              prs.map((pr) => (
                <DnaTableRow key={pr.id} className="hover:bg-slate-50/80">
                  <DnaTd className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] italic">
                        PR
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs uppercase italic">
                          #{pr.id?.split("-")[0]}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <DnaCell.Text primary={pr.warehouse?.name || "-"} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-600">
                        {pr.creator?.fullName || pr.createdBy || "-"}
                      </span>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <DnaCell.Number value={pr.items?.length || 0} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-center">
                    <DnaBadge status={STATUS_BADGE_MAP[pr.status] || "default"}>
                      {pr.status?.replace("_", " ") || "DRAFT"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {pr.status === "SUBMITTED" && (
                        <>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            onClick={() => onApprovePR(pr.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            icon={<BadgeCheck className="h-3.5 w-3.5" />}
                          >
                            Setuju
                          </DnaButton>
                          <DnaButton
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectPR(pr.id)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Tolak
                          </DnaButton>
                        </>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="icon"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => onViewDetail?.(pr)}
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
