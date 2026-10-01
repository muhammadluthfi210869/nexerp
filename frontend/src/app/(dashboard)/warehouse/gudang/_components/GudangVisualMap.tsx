"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { DnaBadge } from "@/components/dna";
import type { WarehouseNode } from "../_types/gudang.types";

interface GudangVisualMapProps {
  warehouses: WarehouseNode[];
}

export function GudangVisualMap({ warehouses }: GudangVisualMapProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4 hover:border-zinc-400 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center tabular-nums font-bold text-xs border border-zinc-200">
                  {wh.code}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-zinc-900">{wh.name}</h4>
                  <p className="text-[11px] text-zinc-500">{wh.typeLabel}</p>
                </div>
              </div>
              <DnaBadge variant="success">AKTIF</DnaBadge>
            </div>

            {/* Progress bar occupancy */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between tabular-nums text-[11px]">
                <span className="text-zinc-500">Utilisasi Kapasitas:</span>
                <span className="font-semibold text-zinc-800">{wh.capacityUtilityPercent}%</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${wh.capacityUtilityPercent > 80 ? "bg-amber-600" : "bg-zinc-900"}`}
                  style={{ width: `${wh.capacityUtilityPercent}%` }}
                />
              </div>
            </div>

            {/* Rack matrix miniature preview */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Matriks Visual Rak:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-8 rounded-md flex items-center justify-center text-[10px] tabular-nums font-medium border ${
                      idx < 5
                        ? "bg-zinc-100 text-zinc-900 border-zinc-300"
                        : "bg-zinc-50 text-zinc-400 border-zinc-200"
                    }`}
                    title={`Slot Rak #${idx + 1}`}
                  >
                    R{idx + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" /> {wh.city}
              </span>
              <span className="font-medium text-zinc-700">
                PIC: {wh.picName.split(" ")[0]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
