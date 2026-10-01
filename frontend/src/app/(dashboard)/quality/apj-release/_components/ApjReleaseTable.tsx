import React from "react";
import { FileText, Search } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { ApjReleaseRecord } from "../_types/apj-release.types";

export interface ApjReleaseTableProps {
  releases: ApjReleaseRecord[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onViewDetails?: (release: ApjReleaseRecord) => void;
}

const keputusanBadge = (k: string) => {
  switch (k) {
    case "RELEASE":
      return <DnaBadge variant="success">{k}</DnaBadge>;
    case "HOLD":
      return <DnaBadge variant="warning">{k}</DnaBadge>;
    case "REJECT":
      return <DnaBadge variant="critical">{k}</DnaBadge>;
    default:
      return <DnaBadge variant="default">{k}</DnaBadge>;
  }
};

export const ApjReleaseTable: React.FC<ApjReleaseTableProps> = ({
  releases,
  isLoading,
  searchTerm,
  onSearchChange,
  onViewDetails,
}) => {
  return (
    <DnaDataTableCard
      customToolbar={
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                APJ RELEASE INDEX
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                Batch release verification ledger â€¢ {releases.length} Records
              </p>
            </div>
          </div>
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="CARI BATCH / KEPUTUSAN / NIE..."
          />
        </div>
      }
    >
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
            <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[120px] text-left">TANGGAL RILIS</DnaTh>
            <DnaTh className="px-4 py-2.5 text-left">BATCH RECORD</DnaTh>
            <DnaTh className="px-4 py-2.5 text-center w-[130px]">KEPUTUSAN</DnaTh>
            <DnaTh className="px-4 py-2.5 text-left w-[140px]">NIE BPOM</DnaTh>
            <DnaTh className="px-4 py-2.5 text-center w-[120px]">STATUS</DnaTh>
            <DnaTh className="pr-4 py-2.5 text-right w-[90px]">AKSI</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {isLoading ? (
            <DnaTableRow>
              <DnaTd colSpan={7} className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                Sinkronisasi data rilis APJ...
              </DnaTd>
            </DnaTableRow>
          ) : releases.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={7} className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                Tidak ada data release APJ ditemukan
              </DnaTd>
            </DnaTableRow>
          ) : (
            releases.map((release: any, idx: number) => (
              <DnaTableRow key={release.id} className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer">
                <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                  {idx + 1}
                </DnaTd>
                <DnaTd className="px-4 py-2.5 text-slate-700 text-xs tabular-nums">
                  {release.createdAt
                    ? new Date(release.createdAt).toLocaleDateString("id-ID")
                    : "—"}
                </DnaTd>
                <DnaTd className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-900 text-xs uppercase font-mono">
                      {release.batchRecord}
                    </span>
                  </div>
                </DnaTd>
                <DnaTd className="px-4 py-2.5 text-center">
                  {keputusanBadge(release.keputusan)}
                </DnaTd>
                <DnaTd className="px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-700">
                    {release.nie || "—"}
                  </span>
                </DnaTd>
                <DnaTd className="px-4 py-2.5 text-center">
                  <DnaBadge
                    status={
                      release.status === "RELEASED"
                        ? "success"
                        : release.status === "PENDING"
                        ? "warning"
                        : "default"
                    }
                  >
                    {release.status || "—"}
                  </DnaBadge>
                </DnaTd>
                <DnaTd className="pr-4 py-2.5 text-right">
                  <DnaButton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails(release);
                      } else {
                        console.log("View release:", release.id);
                      }
                    }}
                    className="text-xs px-2.5 h-7"
                  >
                    Detail
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            ))
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
};
