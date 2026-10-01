import React from "react";
import { ShieldCheck, CheckCircle2, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { QcReleaseBatchItem, STATUS_CONFIG } from "../_types/qc-release.types";

interface QcReleaseTableProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isLoading: boolean;
  batches: QcReleaseBatchItem[];
  onOpenRelease: (item: QcReleaseBatchItem) => void;
  onOpenDetail: (item: QcReleaseBatchItem) => void;
}

export function QcReleaseTable({
  searchQuery,
  onSearchChange,
  isLoading,
  batches,
  onOpenRelease,
  onOpenDetail,
}: QcReleaseTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari No. Batch, SPK, Produk, Brand, Pelanggan..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[18%]">No. Batch & SPK</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Produk & Brand</DnaTh>
              <DnaTh className="py-3 px-4 w-[22%]">Output & Fisika-Kimia</DnaTh>
              <DnaTh className="py-3 px-4 w-[18%]">Uji Mikrobiologi</DnaTh>
              <DnaTh className="py-3 px-4 w-[12%]">Status & APJ</DnaTh>
              <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  Memuat antrian karantina QC...
                </DnaTd>
              </DnaTableRow>
            ) : batches.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada batch karantina yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              batches.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };
                return (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-blue-700 truncate">{item.batchNumber}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{item.spkCode}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.customerName} ({item.brandName})</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                        {item.outputQty.toLocaleString()} Pcs
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        pH: {item.phValue} â€¢ Visk: {item.viscosityCps} cPs
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${item.microbiologyPass ? "text-emerald-600" : "text-amber-500"}`} />
                        <span className={`font-semibold text-xs truncate ${item.microbiologyPass ? "text-emerald-700" : "text-amber-700"}`}>
                          {item.microbiologyResult}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uji ALT & Patogen</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <DnaBadge variant={statusInfo.badge}>{statusInfo.label}</DnaBadge>
                      <p className="text-[10px] tabular-nums text-slate-500 mt-0.5 truncate">{item.coaNumber || "Belum ttd"}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "QUARANTINE" && (
                          <DnaButton
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenRelease(item)}
                            title="Proses Pelepasan & Rilis APJ"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Rilis APJ
                          </DnaButton>
                        )}
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenDetail(item)}
                          title="Lihat Detail Hasil QC"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
