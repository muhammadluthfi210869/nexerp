import React from "react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import type { GuestBookEntry } from "../_types/guest-book.types";

interface GuestDetailDrawerProps {
  selectedGuest: GuestBookEntry | null;
  onClose: () => void;
}

export function GuestDetailDrawer({ selectedGuest, onClose }: GuestDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedGuest}
      onClose={onClose}
      title={selectedGuest?.clientName || "Detail Tamu"}
      subtitle={selectedGuest ? `${selectedGuest.city} â€¢ ${selectedGuest.dateTime}` : undefined}
      badge={
        selectedGuest ? (
          <DnaBadge
            variant={
              selectedGuest.category === "BRANDED"
                ? "purple"
                : selectedGuest.category === "KLINIK"
                ? "emerald"
                : selectedGuest.category === "PEMULA"
                ? "amber"
                : "blue"
            }
          >
            {selectedGuest.category}
          </DnaBadge>
        ) : undefined
      }
      actions={
        selectedGuest ? (
          <div className="flex items-center justify-end w-full">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {selectedGuest && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waktu Kunjungan</span>
              <span className="tabular-nums font-semibold text-slate-800 text-xs">{selectedGuest.dateTime}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Asal Kota</span>
              <span className="font-semibold text-slate-800 text-xs">{selectedGuest.city}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PIC Pertemuan</span>
              <span className="font-medium text-slate-800 text-xs">{selectedGuest.meetingPic}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WhatsApp Klien</span>
              <span className="tabular-nums font-bold text-blue-600 text-xs">{selectedGuest.contact}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target MOQ</span>
              <span className="tabular-nums font-bold text-slate-900 text-xs">{selectedGuest.moq.toLocaleString("id-ID")} pcs</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Pasar Konsumen</span>
              <span className="font-medium text-slate-700 text-xs">{selectedGuest.targetMarket}</span>
            </div>
          </div>

          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Produk yang Diminati</span>
            <p className="text-slate-800 font-semibold text-sm">{selectedGuest.productInterest}</p>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
