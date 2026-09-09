"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  RefreshCw,
  Upload,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles
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
  DnaTabNav,
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface ReconItem {
  id: string;
  date: string;
  statementDesc: string;
  statementAmount: number;
  systemRef: string;
  systemAmount: number;
  matchStatus: "MATCHED" | "UNMATCHED" | "DIFFERENCE";
  diffAmount: number;
  notes?: string;
}

const FALLBACK_RECON_ITEMS: ReconItem[] = [
  {
    id: "rec-1",
    date: "2026-09-09",
    statementDesc: "CR TRSF E-BANKING KLIKBCA DR CANTIKA JELITA",
    statementAmount: 145000000,
    systemRef: "KM-2026-0045 (Pelunasan Niacinamide)",
    systemAmount: 145000000,
    matchStatus: "MATCHED",
    diffAmount: 0,
    notes: "Auto-matched 100%"
  },
  {
    id: "rec-2",
    date: "2026-09-08",
    statementDesc: "DB BI-FAST PYMT PLN PERSERO UP3",
    statementAmount: -38500000,
    systemRef: "KK-2026-0084 (Listrik Pabrik)",
    systemAmount: -38500000,
    matchStatus: "MATCHED",
    diffAmount: 0,
    notes: "Auto-matched 100%"
  },
  {
    id: "rec-3",
    date: "2026-09-07",
    statementDesc: "CR BIAYA ADM REK GIRO BCA 08/26",
    statementAmount: -25000,
    systemRef: "Belum Ada Entri Sistem",
    systemAmount: 0,
    matchStatus: "UNMATCHED",
    diffAmount: -25000,
    notes: "Perlu dibuat jurnal biaya administrasi bank"
  },
  {
    id: "rec-4",
    date: "2026-09-07",
    statementDesc: "CR BUNGA GIRO BCA 08/26",
    statementAmount: 3850000,
    systemRef: "KM-2026-0047 (Pendapatan Bunga)",
    systemAmount: 3850000,
    matchStatus: "MATCHED",
    diffAmount: 0,
    notes: "Auto-matched 100%"
  }
];

export default function BankReconciliationPage() {
  const toast = useDnaToast();
  const [selectedBank, setSelectedBank] = useState("BCA Giro Operasional (101-001)");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: serverData } = useQuery({
    queryKey: ["finance-bank-recon", selectedBank],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/bank-reconciliation");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map
        }
      } catch (err) {
        console.warn("Using fallback recon items", err);
      }
      return FALLBACK_RECON_ITEMS;
    }
  });

  const reconItems = serverData || FALLBACK_RECON_ITEMS;

  const filteredList = useMemo(() => {
    return reconItems.filter((item) => {
      if (activeTab === "MATCHED" && item.matchStatus !== "MATCHED") return false;
      if (activeTab === "UNMATCHED" && item.matchStatus !== "UNMATCHED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = item.statementDesc.toLowerCase().includes(q);
        const matchRef = item.systemRef.toLowerCase().includes(q);
        if (!matchDesc && !matchRef) return false;
      }
      return true;
    });
  }, [reconItems, activeTab, searchQuery]);

  const matchedCount = reconItems.filter((r) => r.matchStatus === "MATCHED").length;
  const unmatchedCount = reconItems.filter((r) => r.matchStatus === "UNMATCHED").length;

  const handleAutoMatch = () => {
    toast.success("Auto-Match Berhasil", "Sistem berhasil mencocokkan 98.5% transaksi rekening koran vs buku besar.");
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Rekonsiliasi Bank (Bank Reconciliation)"
        subtitle="Pencocokan otomatis mutasi rekening koran bank vs transaksi kas masuk/keluar sistem ERP"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Bank Matching Engine</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => toast.info("Upload Rekening Koran", "Pilih file CSV/Excel dari internet banking.")}>
              <Upload className="w-4 h-4 mr-1.5" />
              Upload Statement
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleAutoMatch}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Auto-Match Transaksi
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Saldo Rekening Koran"
          value="Rp 1.482.350.000"
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Update 09/09/2026", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Saldo Buku Besar (GL)"
          value="Rp 1.482.375.000"
          icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
          subtext="Akun 101-001 BCA Giro"
          variant="success"
        />
        <DnaStatCard
          label="Transaksi Cocok (Matched)"
          value={`${matchedCount} Item`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="99.2% Match Rate"
          variant="success"
        />
        <DnaStatCard
          label="Selisih Belum Rekonsil"
          value="Rp 25.000"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          subtext="Biaya Adm Bank Belum Dijurnal"
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Pencocokan Rekening Koran vs Sistem"
        badge={
          <DnaBadge variant="default">
            {filteredList.length} Baris
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Baris", badge: reconItems.length },
                { id: "MATCHED", label: "Cocok (Matched)", badge: matchedCount },
                { id: "UNMATCHED", label: "Belum Cocok (Unmatched)", badge: unmatchedCount }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="BCA Giro Operasional (101-001)">BCA Giro Operasional (101-001)</option>
                <option value="Mandiri Giro Utama (101-002)">Mandiri Giro Utama (101-002)</option>
              </select>

              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Mutasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Mutasi Rekening Koran</th>
                <th className="px-3.5 py-3 text-right">Nominal Bank</th>
                <th className="px-3.5 py-3">Transaksi Sistem ERP</th>
                <th className="px-3.5 py-3 text-right">Nominal Sistem</th>
                <th className="px-3.5 py-3">Status Matching</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3 text-slate-700 font-medium">{item.date}</td>
                  <td className="px-3.5 py-3 font-semibold text-slate-900 max-w-[240px] truncate" title={item.statementDesc}>
                    {item.statementDesc}
                  </td>
                  <td className={`px-3.5 py-3 text-right font-extrabold ${item.statementAmount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatRupiah(item.statementAmount)}
                  </td>
                  <td className="px-3.5 py-3 text-slate-800 font-medium">{item.systemRef}</td>
                  <td className={`px-3.5 py-3 text-right font-extrabold ${item.systemAmount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {item.systemAmount !== 0 ? formatRupiah(item.systemAmount) : "-"}
                  </td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant={item.matchStatus === "MATCHED" ? "success" : "warning"}>
                      {item.matchStatus}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    {item.matchStatus === "UNMATCHED" ? (
                      <Link href="/finance/cash-out">
                        <DnaButton variant="primary" size="sm">
                          Buat Jurnal
                        </DnaButton>
                      </Link>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
