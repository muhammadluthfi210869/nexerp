"use client";

import React from "react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaCell,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import type { ComplianceAsset } from "../_types/compliance-asset.types";

interface ComplianceAssetTableProps {
  search: string;
  onSearchChange: (value: string) => void;
  filteredAssets: ComplianceAsset[];
  onSelectAsset?: (asset: ComplianceAsset) => void;
}

export function ComplianceAssetTable({
  search,
  onSearchChange,
  filteredAssets,
  onSelectAsset,
}: ComplianceAssetTableProps) {
  return (
    <DnaDataTableCard
      searchPlaceholder="Cari nomor registrasi, nama izin, atau brand produk..."
      searchValue={search}
      onSearchChange={onSearchChange}
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left text-[12px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3">No. Registrasi / Izin</th>
              <th className="px-4 py-3">Nama Sertifikasi / Brand</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Tgl Terbit & Berakhir</th>
              <th className="px-4 py-3 text-right">Biaya Legalitas</th>
              <th className="px-4 py-3 text-right">Amortisasi / Bln</th>
              <th className="px-4 py-3 text-center">Sisa Hari</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Belum ada aset tak berwujud atau izin legalitas yang terdaftar.
                </td>
              </tr>
            ) : (
              filteredAssets.map((a) => (
                <tr
                  key={a.id}
                  className={`hover:bg-slate-50/60 transition-colors ${onSelectAsset ? "cursor-pointer" : ""}`}
                  onClick={() => onSelectAsset?.(a)}
                >
                  <td className="px-4 py-3">
                    <DnaCell.Code value={a.code} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{a.name}</div>
                    <div className="text-[11px] text-slate-400">{a.productBrand}</div>
                  </td>
                  <td className="px-4 py-3">
                    <DnaBadge
                      variant={
                        a.type === "BPOM"
                          ? "blue"
                          : a.type === "HALAL"
                          ? "emerald"
                          : a.type === "ISO"
                          ? "purple"
                          : "slate"
                      }
                    >
                      {a.type}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{a.issueDate} s/d</div>
                    <div className="font-medium text-slate-900">{a.expiryDate}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatRupiah(a.cost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatRupiah(a.monthlyAmortization)}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {a.daysToExpiry > 0 ? (
                      <span className={a.daysToExpiry <= 60 ? "text-amber-600 font-bold" : "text-slate-700"}>
                        {a.daysToExpiry} Hari
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Kadaluarsa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge
                      variant={
                        a.status === "ACTIVE"
                          ? "emerald"
                          : a.status === "WARNING"
                          ? "amber"
                          : "danger"
                      }
                    >
                      {a.status}
                    </DnaBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
