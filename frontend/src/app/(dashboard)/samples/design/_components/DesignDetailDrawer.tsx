"use client";

import React from "react";
import { X, Calendar, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { DnaBadge, DnaButton } from "@/components/dna";
import {
  DesignTask,
  STATE_LABEL,
  STATE_VARIANT,
  formatDate,
} from "../_types/design.types";

interface DesignDetailDrawerProps {
  design: DesignTask | null;
  onClose: () => void;
}

export function DesignDetailDrawer({ design, onClose }: DesignDetailDrawerProps) {
  if (!design) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {design.lead?.brandName || design.lead?.clientName || "Task Desain"}
            </h3>
            <p className="text-xs text-slate-500">
              {design.lead?.clientName || "â€”"} â€¢ {design.taskType || "â€”"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 font-bold block">Status Papan:</span>
            <DnaBadge variant={STATE_VARIANT[design.kanbanState] || "neutral"}>
              {STATE_LABEL[design.kanbanState] || design.kanbanState}
            </DnaBadge>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Versi Artwork Terakhir:</span>
            <span className="tabular-nums font-bold text-slate-900">
              {design.versions[0]?.versionNumber
                ? `V${design.versions[0].versionNumber}`
                : "Belum ada versi"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Jumlah Revisi:</span>
            <span className="tabular-nums font-bold text-slate-900">{design.revisionCount}x</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Batas SLA:</span>
            <span className="tabular-nums text-slate-800 inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(design.slaDeadline)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 font-bold block">Produk Diminati:</span>
            <span className="text-slate-800">{design.lead?.productInterest || "â€”"}</span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Brief Desain
          </span>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{design.brief}</p>
        </div>

        <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Berkas Artwork
          </span>
          {design.finalArtworkUrl || design.versions[0]?.artworkUrl ? (
            <a
              href={design.finalArtworkUrl || design.versions[0]?.artworkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Buka master artwork
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="text-slate-400 italic">Belum ada berkas artwork diunggah.</p>
          )}
          {design.finalMockupUrl || design.versions[0]?.mockupUrl ? (
            <a
              href={design.finalMockupUrl || design.versions[0]?.mockupUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Buka mockup preview
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Catatan: nomor notifikasi BPOM, nomor batch, tanggal kedaluwarsa, dan dual-approval
          BusDev/Purchase tidak tersimpan pada modul Creative (<code className="font-mono">DesignTask</code>),
          sehingga tidak ditampilkan. Persetujuan APJ dan klien dilakukan melalui papan Creative
          (endpoint <code className="font-mono">/creative/task/:id/apj-review</code> dan
          <code className="font-mono"> /client-review</code>) dan tercatat pada riwayat desain.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <DnaButton variant="outline" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </div>
  );
}
