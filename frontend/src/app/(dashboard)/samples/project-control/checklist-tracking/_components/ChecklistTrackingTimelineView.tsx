"use client";

import React from "react";
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
  DnaLoadingSkeleton,
} from "@/components/dna";
import {
  SampleTrackingItem,
  SampleTimelineDetail,
  STAGE_LABEL,
  STAGE_VARIANT,
  formatDate,
  formatDateTime,
} from "../_types/checklist-tracking.types";

interface ChecklistTrackingTimelineViewProps {
  item: SampleTrackingItem | null;
  timelineDetail: SampleTimelineDetail | null;
  isTimelineLoading: boolean;
  onBack: () => void;
}

export function ChecklistTrackingTimelineView({
  item,
  timelineDetail,
  isTimelineLoading,
  onBack,
}: ChecklistTrackingTimelineViewProps) {
  const logs = timelineDetail?.stageLogs ?? [];
  const totalDays = logs.reduce((acc, log) => acc + (log.durationDays ?? 0), 0);

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen px-6 py-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <p className="text-xs text-slate-500 font-medium">Beranda / Timeline Checklist</p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Timeline Stage Sampel</h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>
      </div>

      {item && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            <span>Informasi Sampel</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Kode Sampel :</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded tabular-nums font-bold text-[11px]">
                {item.sampleCode}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Customer :</span>
              <span className="font-bold text-slate-800">{item.customer}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Brand/Produk :</span>
              <span className="font-semibold text-slate-800">
                {item.brand} <span className="text-slate-500 font-normal">({item.product})</span>
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Stage Terakhir :</span>
              <DnaBadge variant={STAGE_VARIANT[item.stage] || "neutral"}>
                {STAGE_LABEL[item.stage] || item.stage}
              </DnaBadge>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Tanggal Mulai :</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded tabular-nums font-bold text-[11px]">
                {item.requestedAt}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Target Deadline :</span>
              <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded tabular-nums font-bold text-[11px]">
                {formatDate(item.targetDeadline)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Ringkasan Waktu Stage</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Jumlah Stage Tercatat :</span>
            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-bold text-[11px]">
              {logs.length} stage
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Akumulasi Durasi Stage :</span>
            <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[11px] tabular-nums">
              {totalDays.toFixed(1)} hari
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Stage Aktif :</span>
            <span className="tabular-nums text-slate-800 font-semibold">
              {STAGE_LABEL[item?.stage || ""] || item?.stage || "â€”"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Versi Formula Terakhir :</span>
            <span className="tabular-nums text-slate-800 font-semibold">
              {timelineDetail?.formula ? `V${timelineDetail.formula.version} (${timelineDetail.formula.formulaCode})` : "Belum ada formula"}
            </span>
          </div>
        </div>
      </div>

      {isTimelineLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <DnaEmptyState
          title="Belum Ada Riwayat Stage"
          description="Sample request ini belum memiliki catatan stage log pada /rnd/samples/:id."
        />
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Visualisasi Timeline Stage (Durasi Relatif)</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="min-w-[700px]">
                {logs.map((log) => {
                  const maxDuration = Math.max(...logs.map((l) => l.durationDays ?? 1), 1);
                  const widthPercent = Math.max(4, ((log.durationDays ?? 0) / maxDuration) * 100);
                  return (
                    <div key={log.id} className="grid grid-cols-12 items-center py-1.5 text-xs">
                      <div className="col-span-4 text-[11px] font-semibold text-slate-700 truncate pl-2">
                        {STAGE_LABEL[log.stage] || log.stage}
                      </div>
                      <div className="col-span-8 relative h-5 flex items-center bg-slate-50/50 rounded">
                        <div
                          className="absolute h-3.5 left-0 bg-amber-500 rounded text-[9px] font-bold text-amber-950 flex items-center justify-center shadow-2xs"
                          style={{ width: `${widthPercent}%`, minWidth: "16px" }}
                          title={`${STAGE_LABEL[log.stage] || log.stage}: ${formatDateTime(log.enteredAt)} â†’ ${formatDateTime(log.leftAt)}`}
                        >
                          {log.durationDays ? <span className="px-1">{log.durationDays}d</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-amber-400 text-slate-950 font-bold border-b border-amber-500">
                  <DnaTh className="py-2.5 px-3 text-center w-10">#</DnaTh>
                  <DnaTh className="py-2.5 px-3">Stage</DnaTh>
                  <DnaTh className="py-2.5 px-3">Masuk</DnaTh>
                  <DnaTh className="py-2.5 px-3">Keluar</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center">Durasi</DnaTh>
                  <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {logs.map((log, idx) => (
                  <DnaTableRow key={log.id} className="hover:bg-slate-50/80">
                    <DnaTd className="py-2 px-3 text-center tabular-nums text-slate-500">{idx + 1}</DnaTd>
                    <DnaTd className="py-2 px-3">
                      <DnaBadge variant={STAGE_VARIANT[log.stage] || "neutral"}>
                        {STAGE_LABEL[log.stage] || log.stage}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="py-2 px-3 tabular-nums text-slate-700">{formatDateTime(log.enteredAt)}</DnaTd>
                    <DnaTd className="py-2 px-3 tabular-nums text-slate-700">
                      {log.leftAt ? formatDateTime(log.leftAt) : <span className="text-blue-600 font-bold">Masih berjalan</span>}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-center tabular-nums font-bold text-slate-800">
                      {log.durationDays != null ? `${log.durationDays} hari` : "â€”"}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-[11px] text-slate-500 max-w-xs">
                      {log.notes || log.rejectionReason || "â€”"}
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
              <tfoot>
                <DnaTableRow className="bg-slate-50 font-bold border-t border-slate-200">
                  <DnaTd colSpan={4} className="py-2.5 px-3 text-right text-slate-700">Akumulasi Durasi:</DnaTd>
                  <DnaTd className="py-2.5 px-3 text-center">
                    <span className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-xs tabular-nums">
                      {totalDays.toFixed(1)} hari
                    </span>
                  </DnaTd>
                  <DnaTd />
                </DnaTableRow>
              </tfoot>
            </DnaTable>
          </div>
        </>
      )}

      {timelineDetail?.formula && timelineDetail.formula.phases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Fase Formula V{timelineDetail.formula.version}</span>
          </div>
          <div className="p-4 space-y-3">
            {timelineDetail.formula.phases.map((phase) => (
              <div key={phase.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700">
                  {phase.prefix} {phase.customName ? `â€” ${phase.customName}` : ""}
                </div>
                <DnaTable>
                  <DnaTableBody>
                    {phase.items.map((it) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-1.5 px-3 text-[11.5px] text-slate-700">{it.materialName}</DnaTd>
                        <DnaTd className="py-1.5 px-3 text-right tabular-nums text-[11.5px] font-bold text-slate-800">
                          {Number(it.dosagePercentage).toFixed(3)}%
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
