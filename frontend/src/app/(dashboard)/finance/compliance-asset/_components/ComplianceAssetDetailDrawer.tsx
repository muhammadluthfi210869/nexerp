"use client";

import React from "react";
import {
  DnaDetailDrawer,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import type { ComplianceAsset } from "../_types/compliance-asset.types";

interface ComplianceAssetDetailDrawerProps {
  selectedAsset: ComplianceAsset | null;
  onClose: () => void;
}

export function ComplianceAssetDetailDrawer({
  selectedAsset,
  onClose,
}: ComplianceAssetDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedAsset}
      onClose={onClose}
      title={selectedAsset?.name || "Detail Aset Kepatuhan"}
      subtitle={selectedAsset?.code}
      badge={
        selectedAsset ? (
          <DnaBadge
            variant={
              selectedAsset.type === "BPOM"
                ? "blue"
                : selectedAsset.type === "HALAL"
                ? "emerald"
                : selectedAsset.type === "ISO"
                ? "purple"
                : "slate"
            }
          >
            {selectedAsset.type} &bull; {selectedAsset.status}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "detail",
          label: "Informasi Legalitas & Amortisasi",
          content: selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Brand / Entitas</span>
                  <span className="font-semibold text-slate-900">{selectedAsset.productBrand}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Kepatuhan</span>
                  <span className="font-semibold text-slate-900">{selectedAsset.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Terbit</span>
                  <span className="font-semibold text-slate-900">{selectedAsset.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Kadaluarsa</span>
                  <span className="font-semibold text-slate-900">{selectedAsset.expiryDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Sisa Masa Berlaku</span>
                  <span className="font-semibold text-slate-900">
                    {selectedAsset.daysToExpiry > 0 ? `${selectedAsset.daysToExpiry} Hari` : "Kadaluarsa"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Biaya Legalitas (Cost)</span>
                  <span className="font-bold text-slate-900">{formatRupiah(selectedAsset.cost)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Amortisasi Bulanan</span>
                  <span className="font-bold text-blue-700">{formatRupiah(selectedAsset.monthlyAmortization)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Akumulasi Amortisasi</span>
                  <span className="font-bold text-amber-700">{formatRupiah(selectedAsset.accumulatedAmortization)}</span>
                </div>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
