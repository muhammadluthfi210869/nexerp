"use client";

import React from "react";
import { CheckCircle2, Clock, Wallet } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { FundRequestItem } from "../_types/fund-requests.types";

interface FundRequestsDetailDrawerProps {
  selectedRequest: FundRequestItem | null;
  onClose: () => void;
  onApprove: (request: FundRequestItem) => void;
  onDisburse: (request: FundRequestItem) => void;
  onReject: () => void;
}

export function FundRequestsDetailDrawer({
  selectedRequest,
  onClose,
  onApprove,
  onDisburse,
  onReject,
}: FundRequestsDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedRequest}
      onClose={onClose}
      title={`Pengajuan Dana: ${selectedRequest?.requestNo}`}
      subtitle={selectedRequest?.purpose}
      badge={
        selectedRequest && (
          <DnaBadge
            variant={
              selectedRequest.status === "DISBURSED"
                ? "success"
                : selectedRequest.status === "APPROVED"
                ? "purple"
                : selectedRequest.status === "PENDING_APPROVAL"
                ? "warning"
                : "critical"
            }
          >
            {selectedRequest.status.replace(/_/g, " ")}
          </DnaBadge>
        )
      }
      tabs={[
        {
          id: "info",
          label: "Rincian Permintaan",
          content: (
            <div className="space-y-4 p-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-500">Nomor Pengajuan</div>
                  <div className="tabular-nums font-bold text-blue-700 text-sm">
                    {selectedRequest?.requestNo}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Tanggal Diajukan</div>
                  <div className="font-medium text-slate-800">
                    {selectedRequest?.requestDate}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Pemohon & Jabatan</div>
                  <div className="font-semibold text-slate-900">
                    {selectedRequest?.applicant} ({selectedRequest?.level})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Departemen</div>
                  <div className="font-semibold text-slate-800">
                    {selectedRequest?.department}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Target Tanggal Dibutuhkan</div>
                  <div className="font-medium text-amber-700 font-semibold">
                    {selectedRequest?.requiredDate}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Gerbang Approval Aktif</div>
                  <div className="font-semibold text-blue-800">
                    {selectedRequest?.currentApprovalLevel}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">
                  Tujuan / Keperluan Pengeluaran:
                </div>
                <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {selectedRequest?.purpose}
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-blue-700 font-bold uppercase">
                    Total Nominal Diajukan
                  </div>
                  <div className="text-xl font-black text-blue-900">
                    {selectedRequest ? formatRupiah(selectedRequest.amount) : "0"}
                  </div>
                </div>
                <DnaBadge variant="info">4-TIER GOVERNANCE</DnaBadge>
              </div>
            </div>
          ),
        },
        {
          id: "workflow",
          label: "Jalur Persetujuan (Workflow)",
          content: (
            <div className="p-4 space-y-3 text-xs">
              <div className="text-slate-500 font-medium">
                Matriks Approval Bertingkat Sesuai SOP Finansial:
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-900">1. Verifikasi Head Divisi</div>
                    <div className="text-[11px] text-emerald-700">
                      Validasi urgensi pengadaan operasional
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.currentApprovalLevel === "ACCOUNTING"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      2. Review Accounting & Anggaran
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Pengecekan budget COA dan alokasi dana
                    </div>
                  </div>
                  {selectedRequest?.currentApprovalLevel === "ACCOUNTING" ? (
                    <Clock className="w-5 h-5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.currentApprovalLevel === "DIREKTUR"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      3. Persetujuan Direktur Keuangan
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Sign-off otorisasi pengeluaran dana &gt; Rp 10 Juta
                    </div>
                  </div>
                  {selectedRequest?.currentApprovalLevel === "DIREKTUR" ? (
                    <Clock className="w-5 h-5 text-amber-600" />
                  ) : selectedRequest?.status === "DISBURSED" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="text-[10px] text-slate-400 tabular-nums">MENUNGGU</div>
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedRequest?.status === "DISBURSED"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      4. Pencairan Kas Keluar (Disbursement)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Posting otomatis bukti kas keluar & transfer bank
                    </div>
                  </div>
                  {selectedRequest?.status === "DISBURSED" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="text-[10px] text-slate-400 tabular-nums">STANDBY</div>
                  )}
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
          <div className="flex items-center gap-2">
            {selectedRequest?.status === "PENDING_APPROVAL" && (
              <>
                <DnaButton
                  variant="danger"
                  size="md"
                  onClick={onReject}
                >
                  Tolak
                </DnaButton>
                <DnaButton
                  variant="primary"
                  size="md"
                  onClick={() => selectedRequest && onApprove(selectedRequest)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Setujui (Approve)
                </DnaButton>
              </>
            )}
            {selectedRequest?.status === "APPROVED" && (
              <DnaButton
                variant="primary"
                size="md"
                onClick={() => selectedRequest && onDisburse(selectedRequest)}
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                Cairkan Dana (Disburse)
              </DnaButton>
            )}
          </div>
        </div>
      }
    />
  );
}
