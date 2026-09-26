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
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

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

export default function ClientEscrowPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [selectedEscrow, setSelectedEscrow] = useState<ClientEscrowItem | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  // Live client escrow query
  const { data: escrowsRaw = [], isLoading } = useQuery({
    queryKey: ["finance-client-escrows"],
    queryFn: async (): Promise<any[]> => {
      const res = await api.get("/finance/client-escrows");
      return unwrapResponse<any[]>(res) || [];
    },
  });

  const escrows: ClientEscrowItem[] = useMemo(() => {
    return (escrowsRaw || []).map((e: any) => {
      const deposit = Number(e.amount || 0);
      const disbursed = Number(e.disbursedAmount || 0);
      const remaining = Number(e.remainingAmount ?? (deposit - disbursed));
      let status: "DEPOSITED" | "PARTIALLY_USED" | "FULLY_SETTLED" = "DEPOSITED";
      if (e.status === "SETTLED" || remaining <= 0) status = "FULLY_SETTLED";
      else if (disbursed > 0) status = "PARTIALLY_USED";

      return {
        id: e.id,
        escrowNo: e.escrowNumber || `ESC-${e.id?.slice(0, 8)}`,
        client: e.customer?.name || e.lead?.clientName || e.clientName || "Klien Escrow",
        purpose: (e.purpose || "BPOM Registration") as any,
        depositReceived: deposit,
        disbursedAmount: disbursed,
        remainingBalance: remaining,
        status,
      };
    });
  }, [escrowsRaw]);

  const totalOutstanding = useMemo(() => escrows.reduce((acc, r) => acc + r.remainingBalance, 0), [escrows]);
  const totalDisbursedBlnIni = useMemo(() => escrows.reduce((acc, r) => acc + r.disbursedAmount, 0), [escrows]);
  const totalDepositTotal = useMemo(() => escrows.reduce((acc, r) => acc + r.depositReceived, 0), [escrows]);

  const filteredEscrows = useMemo(() => {
    return escrows.filter((r) => {
      const matchSearch =
        r.escrowNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchPurpose = purposeFilter === "ALL" || r.purpose === purposeFilter;
      return matchSearch && matchStatus && matchPurpose;
    });
  }, [escrows, searchQuery, statusFilter, purposeFilter]);

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
        tabs={[
          { id: "ALL", label: "Semua Escrow" },
          { id: "DEPOSITED", label: "Deposited" },
          { id: "PARTIALLY_USED", label: "Partially Used" },
          { id: "FULLY_SETTLED", label: "Settled" }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
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
        customToolbar={
          <div className="flex flex-wrap items-center gap-2">
            <DnaSelect 
              value={purposeFilter}
              onChange={setPurposeFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Peruntukan (Purpose)</option>
              <option value="BPOM Registration">BPOM Registration</option>
              <option value="Uji Lab Mikrobiologi">Uji Lab Mikrobiologi</option>
              <option value="Pendaftaran HKI Merk">Pendaftaran HKI Merk</option>
            </DnaSelect>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
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
        <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3.5 py-3 w-[18%]">No. Escrow & Status</th>
              <th className="px-3.5 py-3 w-[27%]">Client & Peruntukan</th>
              <th className="px-3.5 py-3 text-right w-[17%]">Deposit Diterima</th>
              <th className="px-3.5 py-3 text-right w-[16%]">Dana Terpakai</th>
              <th className="px-3.5 py-3 text-right w-[16%]">Sisa Saldo</th>
              <th className="px-3.5 py-3 text-center w-[6%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEscrows.map((e) => (
              <tr
                key={e.id}
                onClick={() => setSelectedEscrow(e)}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <td className="px-3.5 py-2.5">
                  <div className="tabular-nums text-purple-700 font-bold text-xs">{e.escrowNo}</div>
                  <div className="mt-0.5">
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
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="font-bold text-slate-900 truncate">{e.client}</div>
                  <div className="text-[11px] text-slate-500 truncate">{e.purpose}</div>
                </td>
                <td className="px-3.5 py-2.5 text-right font-medium text-emerald-700 text-xs">
                  {formatRupiah(e.depositReceived)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-medium text-rose-700 text-xs">
                  {formatRupiah(e.disbursedAmount)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-extrabold text-purple-900 text-xs">
                  {formatRupiah(e.remainingBalance)}
                </td>
                <td className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <DnaButton variant="ghost" size="sm" onClick={() => setSelectedEscrow(e)} title="Lihat">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                  </DnaButton>
                </td>
              </tr>
            ))}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* DETAIL ESCROW DRAWER (QUICK PEEK) */}
      <DnaDetailDrawer
        isOpen={!!selectedEscrow}
        onClose={() => setSelectedEscrow(null)}
        title={`Buku Besar Escrow: ${selectedEscrow?.escrowNo}`}
        subtitle={`${selectedEscrow?.client} — ${selectedEscrow?.purpose}`}
        badge={
          selectedEscrow && (
            <DnaBadge
              variant={
                selectedEscrow.status === "FULLY_SETTLED"
                  ? "success"
                  : selectedEscrow.status === "PARTIALLY_USED"
                  ? "warning"
                  : "default"
              }
            >
              {selectedEscrow.status.replace(/_/g, " ")}
            </DnaBadge>
          )
        }
        tabs={[
          {
            id: "info",
            label: "Rincian Titipan Dana",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-[11px] text-slate-500">Nomor Escrow</div>
                    <div className="tabular-nums font-bold text-purple-700 text-sm">{selectedEscrow?.escrowNo}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Klien Pemilik Dana</div>
                    <div className="font-bold text-slate-900">{selectedEscrow?.client}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-slate-500">Peruntukan Dana</div>
                    <div className="font-semibold text-purple-800">{selectedEscrow?.purpose}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
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

                <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs leading-relaxed border border-blue-200">
                  * Dana titipan ini tercatat di sisi Kewajiban (Liability) dan 0% menyentuh P&L pendapatan maklon.
                </div>
              </div>
            )
          },
          {
            id: "accounting",
            label: "Ketentuan Akuntansi Escrow",
            content: (
              <div className="p-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">Pass-Through Disbursement Governance:</div>
                  <p className="text-slate-600 leading-relaxed">
                    Setiap pengeluaran dari rekening escrow wajib dilampirkan bukti billing PNBP Simponi BPOM / invoice resmi laboratorium uji terakreditasi KAN.
                  </p>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedEscrow(null)}>
              Tutup
            </DnaButton>
            <div className="flex items-center gap-2">
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
        }
      />
    </DnaPageContainer>
  );
}
