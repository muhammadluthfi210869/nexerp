import React from "react";
import {
  DnaDataTableCard,
  DnaSelect,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import {
  CostAllocationTableProps,
  METHODS,
} from "../_types/cost-allocation-setup.types";

export function CostAllocationTable({
  rows,
  isLoading,
  isError,
  methodFilter,
  onMethodFilterChange,
  onRetry,
}: CostAllocationTableProps) {
  return (
    <DnaDataTableCard
      title="Riwayat Alokasi Biaya Overhead"
      toolbarProps={{
        searchPlaceholder: "Cari cost center...",
        extraActions: (
          <DnaSelect
            value={methodFilter}
            onChange={(val) => onMethodFilterChange(val)}
            options={[
              { value: "ALL", label: "Semua Metode" },
              ...METHODS.map((m) => ({ value: m, label: m })),
            ]}
            className="h-9 w-44"
          />
        ),
      }}
    >
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Alokasi Biaya"
          message="Tidak dapat mengambil data alokasi dari server."
          onRetry={onRetry}
        />
      ) : rows.length === 0 ? (
        <DnaEmptyState
          title="Belum Ada Alokasi Tercatat"
          description="Belum ada entri alokasi biaya overhead pada metode yang dipilih. Catat alokasi baru untuk memulai."
        />
      ) : (
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh>FROM COST CENTER</DnaTh>
              <DnaTh>TO COST CENTER</DnaTh>
              <DnaTh className="w-[130px]">METODE</DnaTh>
              <DnaTh className="w-[140px]">BASIS</DnaTh>
              <DnaTh align="right" className="w-[150px]">NOMINAL</DnaTh>
              <DnaTh className="w-[120px]">TANGGAL</DnaTh>
              <DnaTh>CATATAN</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {rows.map((r) => (
              <DnaTableRow key={r.id}>
                <DnaTd>
                  <span className="font-semibold text-slate-800">{r.fromCostCenter}</span>
                </DnaTd>
                <DnaTd>
                  <span className="font-semibold text-slate-800">{r.toCostCenter}</span>
                </DnaTd>
                <DnaTd>
                  <DnaBadge variant={r.allocationMethod === "DIRECT" ? "blue" : "amber"}>
                    {r.allocationMethod}
                  </DnaBadge>
                </DnaTd>
                <DnaTd className="text-xs text-slate-600">{r.basis || "â€”"}</DnaTd>
                <DnaTd align="right" className="tabular-nums font-semibold text-slate-800">
                  {formatRupiah(r.amount)}
                </DnaTd>
                <DnaTd className="tabular-nums text-xs text-slate-600">
                  {new Date(r.allocationDate).toISOString().slice(0, 10)}
                </DnaTd>
                <DnaTd className="text-xs text-slate-500 max-w-xs truncate" title={r.notes || ""}>
                  {r.notes || "â€”"}
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      )}
    </DnaDataTableCard>
  );
}
