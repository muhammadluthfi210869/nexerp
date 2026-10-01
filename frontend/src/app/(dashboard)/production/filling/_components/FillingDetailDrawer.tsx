import React from "react";
import { Play, CheckCircle2 } from "lucide-react";
import { DnaDetailDrawer, DnaButton } from "@/components/dna";
import { FillingProductionItem } from "../_types/filling.types";
import { FillingStatusBadge } from "./FillingStatusBadge";

interface FillingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDetail: FillingProductionItem | null;
  onStartProduce: (item: FillingProductionItem) => void;
  onOpenProduceModal: (item: FillingProductionItem) => void;
  onTogglePending: (item: FillingProductionItem) => void;
}

export function FillingDetailDrawer({
  isOpen,
  onClose,
  selectedDetail,
  onStartProduce,
  onOpenProduceModal,
  onTogglePending,
}: FillingDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedDetail?.code || "Detail Produksi Filling"}
      subtitle={selectedDetail ? `${selectedDetail.product} â€¢ ${selectedDetail.batchRecord}` : undefined}
      badge={selectedDetail ? <FillingStatusBadge status={selectedDetail.status} /> : undefined}
      tabs={[
        {
          id: "summary",
          label: "Ringkasan Filling",
          content: selectedDetail ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tabular-nums font-bold text-slate-900">{selectedDetail.code}</span>
                  <span className="tabular-nums text-slate-500">{selectedDetail.date}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{selectedDetail.product}</p>
                <p className="text-slate-600">{selectedDetail.customer} ({selectedDetail.category})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Target Pengisian</span>
                  <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedDetail.targetPcs.toLocaleString()} Pcs</p>
                  <span className="text-[10px] text-slate-400">Kemasan Primer</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Alokasi Mesin</span>
                  <p className="font-semibold text-purple-700">{selectedDetail.machine}</p>
                  <span className="text-[10px] text-slate-400">Filling Nozzle Line</span>
                </div>
              </div>

              {selectedDetail.actualPcs && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-emerald-800 font-semibold block mb-0.5">Hasil Realisasi Pengisian:</span>
                  <p className="tabular-nums font-bold text-emerald-900 text-base">{selectedDetail.actualPcs.toLocaleString()} Pcs</p>
                </div>
              )}
            </div>
          ) : null,
        },
        {
          id: "history",
          label: "Riwayat & Log",
          content: selectedDetail ? (
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700 uppercase">Riwayat Operasional Line Filling:</p>
              {(selectedDetail.historyLogs || []).length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-400 text-center">
                  Belum ada riwayat aktivitas yang tercatat.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDetail.historyLogs?.map((log, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-[11px] tabular-nums text-slate-500 mb-1">
                        <span>{log.timestamp}</span>
                        <span className="font-semibold text-slate-700">{log.operator}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{log.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null,
        },
      ]}
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
          {selectedDetail?.status === "MENUNGGU" && (
            <DnaButton variant="primary" onClick={() => onStartProduce(selectedDetail)}>
              <Play className="w-3.5 h-3.5 mr-1" />
              Mulai Filling
            </DnaButton>
          )}
          {selectedDetail?.status === "PROSES" && (
            <DnaButton
              variant="primary"
              onClick={() => onOpenProduceModal(selectedDetail)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Selesaikan Filling
            </DnaButton>
          )}
          {selectedDetail && selectedDetail.status !== "SELESAI" && selectedDetail.status !== "DIBATALKAN" && (
            <DnaButton variant="outline" onClick={() => onTogglePending(selectedDetail)}>
              {selectedDetail.status === "PENDING" ? "Aktifkan" : "Pending"}
            </DnaButton>
          )}
        </div>
      }
    />
  );
}
