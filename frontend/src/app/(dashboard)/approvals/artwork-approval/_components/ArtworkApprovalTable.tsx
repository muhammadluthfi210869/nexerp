import React from "react";
import {
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaInput,
} from "@/components/dna";
import { History, Search } from "lucide-react";
import {
  DesignTaskRow,
  EMPTY,
  formatDate,
  KANBAN_LABEL,
  KANBAN_VARIANT,
  latestVersionOf,
} from "../_types/artwork-approval.types";

interface ArtworkApprovalTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stateFilter: string;
  onStateFilterChange: (state: string) => void;
  totalCount: number;
  waitingApjCount: number;
  waitingClientCount: number;
  filteredTasks: DesignTaskRow[];
  onOpenDrawer: (task: DesignTaskRow) => void;
}

export function ArtworkApprovalTable({
  searchQuery,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  totalCount,
  waitingApjCount,
  waitingClientCount,
  filteredTasks,
  onOpenDrawer,
}: ArtworkApprovalTableProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="w-72">
          <DnaInput
            placeholder="Cari brief, klien, brand..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status Alur:</span>
          <select
            value={stateFilter}
            onChange={(e) => onStateFilterChange(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">Semua Alur ({totalCount})</option>
            <option value="INBOX">Antrean Baru</option>
            <option value="IN_PROGRESS">Dikerjakan</option>
            <option value="WAITING_APJ">Menunggu APJ ({waitingApjCount})</option>
            <option value="WAITING_CLIENT">Menunggu Klien ({waitingClientCount})</option>
            <option value="REVISION">Revisi</option>
            <option value="LOCKED">Final</option>
          </select>
        </div>
      </div>

      <TableWrapper>
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh>KLIEN &amp; BRIEF</DnaTh>
              <DnaTh>TIPE / SLA</DnaTh>
              <DnaTh align="center">VERSI TERBARU</DnaTh>
              <DnaTh align="center">REVISI</DnaTh>
              <DnaTh align="center">STATE BACKEND</DnaTh>
              <DnaTh>DIPERBARUI</DnaTh>
              <DnaTh align="right">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredTasks.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                  {totalCount === 0
                    ? "Belum ada task desain pada sistem."
                    : "Tidak ada task desain yang sesuai pencarian."}
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredTasks.map((task) => {
                const ver = latestVersionOf(task);
                return (
                  <DnaTableRow key={task.id}>
                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {task.lead?.clientName ?? "Klien belum tertaut"}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">
                          {task.brief}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Brand: {task.lead?.brandName ?? EMPTY}
                        </span>
                      </div>
                    </DnaTd>

                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {task.taskType ?? "Tidak dispesifikasikan"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          SLA: {formatDate(task.slaDeadline)}
                        </span>
                      </div>
                    </DnaTd>

                    <DnaTd align="center">
                      {ver ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2.5 py-1 text-[11px] font-black bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">{formatDate(ver.createdAt)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum ada file</span>
                      )}
                    </DnaTd>

                    <DnaTd align="center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">
                          {task.revisionCount}
                        </span>
                        {task.isLocked && (
                          <span className="text-[9px] font-bold text-rose-600">BATAS TERCAPAI</span>
                        )}
                      </div>
                    </DnaTd>

                    <DnaTd align="center">
                      <DnaBadge variant={KANBAN_VARIANT[task.kanbanState] ?? "neutral"}>
                        {KANBAN_LABEL[task.kanbanState] ?? task.kanbanState}
                      </DnaBadge>
                    </DnaTd>

                    <DnaTd>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(task.updatedAt)}
                      </span>
                    </DnaTd>

                    <DnaTd align="right">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        icon={<History className="w-3.5 h-3.5" />}
                        onClick={() => onOpenDrawer(task)}
                      >
                        Riwayat &amp; Approval
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>
    </>
  );
}
