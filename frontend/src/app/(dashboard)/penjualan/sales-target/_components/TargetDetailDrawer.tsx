"use client";

import React from "react";
import { Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { DnaDetailDrawer, DnaCell, DnaButton } from "@/components/dna";
import type { SalesTargetItem } from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface TargetDetailDrawerProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  target?: SalesTargetItem | null;
  onClose?: () => void;
  onEdit?: (target: SalesTargetItem) => void;
  onDelete?: (target: SalesTargetItem) => void;
}

export function TargetDetailDrawer(props: TargetDetailDrawerProps) {
  const target = props.target !== undefined ? props.target : (props.ops?.detailTarget ?? null);
  const onClose = props.onClose ?? (() => props.ops?.setDetailTarget(null));
  const onEdit = props.onEdit ?? props.ops?.handleOpenEditTarget ?? (() => {});
  const onDelete = props.onDelete ?? props.ops?.setTargetToDelete ?? (() => {});

  return (
    <DnaDetailDrawer
      isOpen={!!target}
      onClose={onClose}
      title={target?.marketingName || "Detail Target Penjualan"}
      subtitle={target ? `${target.marketingRole} â€¢ ${MONTHS_ID[target.month - 1]} ${target.year}` : undefined}
      badge={
        target ? (
          <DnaCell.Badge
            status={
              target.achievementPercent >= 100
                ? "success"
                : target.achievementPercent >= 70
                ? "info"
                : "warning"
            }
            label={`${target.achievementPercent}% Capaian`}
          />
        ) : undefined
      }
      actions={
        target ? (
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => onDelete(target)}
            >
              Hapus Target
            </DnaButton>
            <DnaButton
              variant="secondary"
              size="sm"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={() => {
                const t = target;
                onClose();
                onEdit(t);
              }}
            >
              Sunting Target
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {target && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Target Kuota
              </span>
              <span className="text-base font-black text-slate-900 tabular-nums">
                Rp {target.nominalTarget.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Realisasi Faktur Terbayar
              </span>
              <span className="text-base font-black text-emerald-600 tabular-nums">
                Rp {target.realizedRevenue.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Catatan Operasional
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {target.notes || "Tidak ada catatan operasional khusus untuk periode ini."}
            </p>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Koneksi Real-Time Live Database</span>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Realisasi achievement dihitung secara otomatis oleh NestJS dari seluruh faktur penjualan terbayar (AR) yang terbit di periode {MONTHS_ID[target.month - 1]} {target.year} atas nama PIC marketing ini.
            </p>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
