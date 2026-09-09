"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ShieldCheck,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  Wallet,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface ClientEscrowItem {
  id: string;
  escrowNo: string;
  client: string;
  purpose: "BPOM Registration" | "Uji Lab Mikrobiologi" | "Pendaftaran HKI Merk" | "Lainnya";
  depositReceived: number;
  disbursedAmount: number;
  remainingBalance: number;
  status: "DEPOSITED" | "PARTIALLY_USED" | "FULLY_SETTLED";
}

const FALLBACK_ESCROWS: ClientEscrowItem[] = [
  { id: "1", escrowNo: "ESC-2609-001", client: "PT Glowing Beauty Indonesia", purpose: "BPOM Registration", depositReceived: 25000000, disbursedAmount: 18500000, remainingBalance: 6500000, status: "PARTIALLY_USED" },
  { id: "2", escrowNo: "ESC-2609-002", client: "CV Cantik Natural Nusantara", purpose: "Pendaftaran HKI Merk", depositReceived: 15000000, disbursedAmount: 15000000, remainingBalance: 0, status: "FULLY_SETTLED" },
  { id: "3", escrowNo: "ESC-2609-003", client: "dr. Vina Aesthetic Clinic", purpose: "Uji Lab Mikrobiologi", depositReceived: 12000000, disbursedAmount: 5000000, remainingBalance: 7000000, status: "PARTIALLY_USED" },
  { id: "4", escrowNo: "ESC-2609-004", client: "UD Cantik Berseri", purpose: "BPOM Registration", depositReceived: 30000000, disbursedAmount: 0, remainingBalance: 30000000, status: "DEPOSITED" },
];

export default function ClientEscrowPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [selectedEscrow, setSelectedEscrow] = useState<ClientEscrowItem | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  const totalOutstanding = useMemo(() => FALLBACK_ESCROWS.reduce((acc, r) => acc + r.remainingBalance, 0), []);
  const totalDisbursedBlnIni = useMemo(() => FALLBACK_ESCROWS.reduce((acc, r) => acc + r.disbursedAmount, 0), []);
  const totalDepositTotal = useMemo(() => FALLBACK_ESCROWS.reduce((acc, r) => acc + r.depositReceived, 0), []);

  const filteredEscrows = useMemo(() => {
    return FALLBACK_ESCROWS.filter((r) => {
      const matchSearch =
        r.escrowNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchPurpose = purposeFilter === "ALL" || r.purpose === purposeFilter;
      return matchSearch && matchStatus && matchPurpose;
    });
  }, [searchQuery, statusFilter, purposeFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Client Escrow / Pass-Through Disbursement Ledger"
        description="Rekening penampungan dana titipan klien untuk pengurusan legalitas BPOM, HKI merk, dan pengujian lab pihak ketiga (0% menyentuh P&L)."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-077: Liability Ledger Khusus</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => setIsDisburseModalOpen(true)}>
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              + Bayar Disbursement (Lab/BPOM)
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsDepositModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Terima Deposit Escrow
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-077) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Deposit Client Outstanding"
          value={formatRupiah(totalOutstanding)}
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Saldo Titipan Klien", isPositive: true }}
          subtext="Dana Aman Tersimpan di Rekening Escrow"
          variant="purple"
        />
        <DnaStatCard
          label="Total Sudah Disbursed Bulan Ini"
          value={formatRupiah(totalDisbursedBlnIni)}
          icon={<ArrowUpRight className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Dibayarkan ke PNBP/Lab", isPositive: true }}
          subtext="Realisasi Biaya Legalitas"
          variant="info"
        />
        <DnaStatCard
          label="Total Akumulasi Deposit Masuk"
          value={formatRupiah(totalDepositTotal)}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          subtext="Total Titipan Seluruh Akun"
          variant="success"
        />
      </DnaKpiGrid>

      {/* TABLE LIST (SCR-077) */}
      <DnaDataTableCard
        title="Daftar Buku Besar Escrow Dana Klien"
        badge={<DnaBadge variant="default">{filteredEscrows.length} Akun Escrow</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Peruntukan (Purpose)</option>
              <option value="BPOM Registration">BPOM Registration</option>
              <option value="Uji Lab Mikrobiologi">Uji Lab Mikrobiologi</option>
              <option value="Pendaftaran HKI Merk">Pendaftaran HKI Merk</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="DEPOSITED">Deposited</option>
              <option value="PARTIALLY_USED">Partially Used</option>
              <option value="FULLY_SETTLED">Fully Settled</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari client / escrow no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Escrow No</th>
                <th className="px-3.5 py-3">Client (Klien)</th>
                <th className="px-3.5 py-3">Purpose (Peruntukan)</th>
                <th className="px-3.5 py-3 text-right">Deposit Received</th>
                <th className="px-3.5 py-3 text-right">Disbursed Amount</th>
                <th className="px-3.5 py-3 text-right">Remaining Balance</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEscrows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-purple-700 font-bold">{e.escrowNo}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{e.client}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {e.purpose}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-emerald-700">{formatRupiah(e.depositReceived)}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-rose-700">{formatRupiah(e.disbursedAmount)}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-purple-900">{formatRupiah(e.remainingBalance)}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        e.status === "FULLY_SETTLED"
                          ? "success"
                          : e.status === "PARTIALLY_USED"
                          ? "warning"
                          : "default"
                      }
                    >
                      {e.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton variant="secondary" size="sm" onClick={() => setSelectedEscrow(e)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Rincian
                      </DnaButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* DETAIL ESCROW MODAL (SCR-077) */}
      <DnaModal
        isOpen={!!selectedEscrow}
        onClose={() => setSelectedEscrow(null)}
        title={`Rekonsiliasi Escrow Klien: ${selectedEscrow?.client}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Escrow No / Klien:</span>
              <strong className="text-slate-800">{selectedEscrow?.escrowNo} - {selectedEscrow?.client}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Peruntukan:</span>
              <strong className="text-purple-700">{selectedEscrow?.purpose}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Deposit Diterima:</span>
              <strong className="text-emerald-700">{selectedEscrow ? formatRupiah(selectedEscrow.depositReceived) : "0"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Disbursed (PNBP Simponi/Lab):</span>
              <strong className="text-rose-700">{selectedEscrow ? formatRupiah(selectedEscrow.disbursedAmount) : "0"}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Sisa Saldo Dana Titipan:</span>
              <strong className="text-purple-900 font-black text-sm">{selectedEscrow ? formatRupiah(selectedEscrow.remainingBalance) : "0"}</strong>
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg text-[11px]">
            * Dana titipan ini tercatat di sisi Kewajiban (Liability) dan 0% menyentuh P&L pendapatan Dreamlab.
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedEscrow(null)}>
              Tutup
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak Rekonsiliasi Escrow Klien...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Rekonsiliasi
              </DnaButton>
              {selectedEscrow && selectedEscrow.remainingBalance > 0 && (
                <DnaButton variant="primary" size="md" onClick={() => toast.success(`Pengembalian sisa dana ${formatRupiah(selectedEscrow.remainingBalance)} ke rekening klien diproses!`)}>
                  Refund Sisa Dana
                </DnaButton>
              )}
            </div>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
