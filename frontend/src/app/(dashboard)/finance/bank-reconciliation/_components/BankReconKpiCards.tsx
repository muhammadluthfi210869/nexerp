import React from "react";
import { Building2, Scale } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { BankAccountItem } from "../_types/bank-reconciliation.types";

interface BankReconKpiCardsProps {
  statementBalance: number;
  bookBalance: number;
  difference: number;
  selectedAccount?: BankAccountItem;
  dateEnd: string;
}

export function BankReconKpiCards({
  statementBalance,
  bookBalance,
  difference,
  selectedAccount,
  dateEnd,
}: BankReconKpiCardsProps) {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="Statement Balance (Rekening Koran)"
        value={formatRupiah(statementBalance)}
        icon={<Building2 className="w-5 h-5 text-blue-600" />}
        delta={{ value: selectedAccount?.bankName || "Rekening Koran", isPositive: true }}
        subtext={`Per ${dateEnd}`}
        variant="info"
      />
      <DnaStatCard
        label="Book Balance (Buku Besar Kas/Bank)"
        value={formatRupiah(bookBalance)}
        icon={<Building2 className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Saldo Sistem ERP", isPositive: true }}
        subtext={selectedAccount ? `No. Rek: ${selectedAccount.accountNumber}` : "Buku Kas/Bank"}
        variant="success"
      />
      <DnaStatCard
        label="Selisih Belum Rekon (Difference)"
        value={formatRupiah(difference)}
        icon={<Scale className="w-5 h-5 text-amber-600" />}
        delta={{ value: difference === 0 ? "Rekon Seimbang" : "Perlu Penyesuaian", isPositive: difference === 0 }}
        subtext="Target: Rp 0 Selesai Rekon"
        variant={difference === 0 ? "success" : "warning"}
      />
    </DnaKpiGrid>
  );
}
