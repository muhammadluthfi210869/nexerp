"use client";

import React from "react";
import { DnaModal, DnaButton, DnaCell } from "@/components/dna";
import { AccountModel, AccountType } from "../_types/coa.types";

interface CoaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  viewingAccount: AccountModel | null;
  onOpenEdit: (item: AccountModel) => void;
  getTypeBadgeStatus: (type: AccountType) => "blue" | "rose" | "purple" | "success" | "orange" | "slate";
}

export function CoaDetailDrawer({
  isOpen,
  onClose,
  viewingAccount,
  onOpenEdit,
  getTypeBadgeStatus,
}: CoaDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Akun Buku Besar"
      subtitle={viewingAccount ? `${viewingAccount.code} â€” ${viewingAccount.name}` : ""}
      size="md"
    >
      {viewingAccount && (
        <div className="space-y-6 py-2 text-xs">
          {/* Header Badge Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center tabular-nums font-black text-sm shadow-xs">
              {viewingAccount.code.substring(0, 3)}
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">{viewingAccount.name}</h4>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                  Kode: {viewingAccount.code}
                </span>
                <DnaCell.Badge
                  label={viewingAccount.isActive ? "ACTIVE" : "INACTIVE"}
                  status={viewingAccount.isActive ? "success" : "slate"}
                />
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tipe Laporan Finansial
              </span>
              <DnaCell.Badge
                label={viewingAccount.type}
                status={getTypeBadgeStatus(viewingAccount.type)}
              />
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Saldo Normal
              </span>
              <DnaCell.Badge
                label={viewingAccount.normalBalance}
                status={viewingAccount.normalBalance === "DEBIT" ? "blue" : "purple"}
              />
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Induk Akun (Parent)
              </span>
              <span className="font-semibold text-slate-800 text-xs">
                {viewingAccount.parent ? `${viewingAccount.parent.code} - ${viewingAccount.parent.name}` : "Tingkat Utama (Tanpa Induk)"}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Klasifikasi Level
              </span>
              <DnaCell.Badge
                label={viewingAccount.isHeader || viewingAccount.allowManualJournal === false ? "HEADER (TIDAK DAPAT DIJURNAL)" : "DETAIL (DAPAT DIJURNAL)"}
                status={viewingAccount.isHeader || viewingAccount.allowManualJournal === false ? "purple" : "blue"}
              />
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Kelompok Kategori
              </span>
              <span className="font-semibold text-slate-800 text-sm">{viewingAccount.category}</span>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <DnaButton
              variant="secondary"
              onClick={() => {
                onClose();
                onOpenEdit(viewingAccount);
              }}
            >
              Sunting Akun
            </DnaButton>
            <DnaButton variant="primary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
