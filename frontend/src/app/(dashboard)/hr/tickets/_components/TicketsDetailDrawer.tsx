import React from "react";
import { X, Check, Printer } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import type { HrTicketItem } from "../_types/tickets.types";

interface TicketsDetailDrawerProps {
  selectedTicket: HrTicketItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdatingStatus: boolean;
  onPrintApprovalSheet: () => void;
}

export const TicketsDetailDrawer: React.FC<TicketsDetailDrawerProps> = ({
  selectedTicket,
  onClose,
  onUpdateStatus,
  isUpdatingStatus,
  onPrintApprovalSheet,
}) => {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedTicket}
      onClose={onClose}
      title={selectedTicket?.ticketNo || "Detail Tiket HR"}
      subtitle={`${selectedTicket?.empName} â€¢ ${selectedTicket?.department}`}
      badge={
        selectedTicket ? (
          <DnaBadge
            variant={
              selectedTicket.status === "APPROVED"
                ? "success"
                : selectedTicket.status === "PENDING"
                ? "warning"
                : "critical"
            }
          >
            {selectedTicket.status}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "details",
          label: "Rincian Pengajuan",
          content: selectedTicket && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Jenis Pengajuan
                  </span>
                  <strong className="text-slate-900">
                    {selectedTicket.type.replace("_", " ")}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Durasi Efektif
                  </span>
                  <strong className="text-slate-900">
                    {selectedTicket.duration}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Mulai Berlaku
                  </span>
                  <span className="tabular-nums text-slate-800">
                    {selectedTicket.startDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Selesai</span>
                  <span className="tabular-nums text-slate-800">
                    {selectedTicket.endDate}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900">
                  Alasan & Keperluan Resmi
                </h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                  {selectedTicket.reason}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "workflow",
          label: "Alur Persetujuan & Sign-off",
          content: selectedTicket && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Pejabat Approver:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.approver}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status Persetujuan:</span>
                  <DnaBadge
                    variant={
                      selectedTicket.status === "APPROVED"
                        ? "success"
                        : "warning"
                    }
                  >
                    {selectedTicket.status}
                  </DnaBadge>
                </div>
              </div>
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
          {selectedTicket?.status === "PENDING" ? (
            <div className="flex gap-2">
              <DnaButton
                variant="danger"
                size="md"
                disabled={isUpdatingStatus}
                onClick={() => {
                  onUpdateStatus(selectedTicket.id, "REJECTED");
                }}
              >
                <X className="w-4 h-4 mr-1.5" />
                Tolak
              </DnaButton>
              <DnaButton
                variant="primary"
                size="md"
                disabled={isUpdatingStatus}
                onClick={() => {
                  onUpdateStatus(selectedTicket.id, "APPROVED");
                }}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Setujui
              </DnaButton>
            </div>
          ) : (
            <DnaButton
              variant="secondary"
              size="md"
              onClick={onPrintApprovalSheet}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Lembar
            </DnaButton>
          )}
        </div>
      }
    />
  );
};
