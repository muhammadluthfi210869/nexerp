import React from "react";
import { Phone } from "lucide-react";
import { DnaDetailDrawer, DnaButton, DnaCell } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import { LostProspectItem, ChurnedClientItem, REASON_LABELS } from "../_types/lost.types";

interface LostDetailDrawerProps {
  selectedProspect: LostProspectItem | null;
  selectedChurn: ChurnedClientItem | null;
  onCloseProspect: () => void;
  onCloseChurn: () => void;
  onReEngage: (name: string, phone?: string) => void;
}

export function LostDetailDrawer({
  selectedProspect,
  selectedChurn,
  onCloseProspect,
  onCloseChurn,
  onReEngage,
}: LostDetailDrawerProps) {
  return (
    <>
      {/* Drawer Detail Lost Prospect */}
      <DnaDetailDrawer
        isOpen={!!selectedProspect}
        onClose={onCloseProspect}
        title={selectedProspect?.brandName || "Detail Pembatalan"}
        subtitle={
          selectedProspect
            ? `Klien: ${selectedProspect.clientName} â€¢ PIC: ${selectedProspect.bdName}`
            : undefined
        }
        badge={
          selectedProspect ? (
            <DnaCell.Badge
              label={
                REASON_LABELS[selectedProspect.lostReason]?.label ||
                selectedProspect.lostReason
              }
              status={
                REASON_LABELS[selectedProspect.lostReason]?.status || "neutral"
              }
            />
          ) : undefined
        }
        actions={
          selectedProspect ? (
            <div className="flex items-center justify-between w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() =>
                  onReEngage(selectedProspect.clientName, selectedProspect.phoneNo)
                }
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Chat Re-Engagement WA
              </DnaButton>
              <DnaButton variant="secondary" onClick={onCloseProspect}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedProspect && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Produk Target:
                </span>
                <p className="font-bold text-slate-800">
                  {selectedProspect.productName}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Potensi Omset:
                </span>
                <p className="font-bold text-rose-600 tabular-nums">
                  {formatCurrency(selectedProspect.estimatedValue)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Status Terakhir:
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedProspect.sampleStatus}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Tanggal Sample:
                </span>
                <p className="tabular-nums text-slate-700">
                  {selectedProspect.sampleDate}
                </p>
              </div>
            </div>

            {selectedProspect.lostNotes && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Catatan Evaluasi BusDev
                </span>
                <p className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 text-slate-800 leading-relaxed">
                  {selectedProspect.lostNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Drawer Detail Churned Client */}
      <DnaDetailDrawer
        isOpen={!!selectedChurn}
        onClose={onCloseChurn}
        title={selectedChurn?.clientName || "Profil Klien Churn"}
        subtitle={
          selectedChurn
            ? `Brand: ${selectedChurn.brandName} â€¢ Dormant: ${selectedChurn.inactivityMonths} Bulan`
            : undefined
        }
        badge={
          selectedChurn ? (
            <DnaCell.Badge
              label={`${selectedChurn.inactivityMonths} Bulan Dormant`}
              status="critical"
            />
          ) : undefined
        }
        actions={
          selectedChurn ? (
            <div className="flex items-center justify-between w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() =>
                  onReEngage(selectedChurn.clientName, selectedChurn.phoneNo)
                }
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Kirim Promo Re-Aktivasi WA
              </DnaButton>
              <DnaButton variant="secondary" onClick={onCloseChurn}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedChurn && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Total Lifetime Value:
                </span>
                <p className="font-bold text-emerald-600 tabular-nums">
                  {formatCurrency(selectedChurn.lifetimeValue)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Total Batch Dipesan:
                </span>
                <p className="font-bold text-slate-800">
                  {selectedChurn.totalOrders}x Order
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Order Terakhir:
                </span>
                <p className="tabular-nums text-slate-800">
                  {selectedChurn.lastOrderDate}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Produk Terakhir:
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedChurn.lastProductOrdered}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Indikasi Penyebab Dormancy
              </span>
              <p className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-800 leading-relaxed">
                {selectedChurn.churnReason}
              </p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </>
  );
}
