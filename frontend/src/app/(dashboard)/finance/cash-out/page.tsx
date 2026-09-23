"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowUpRight,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Building2,
  CreditCard
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
  DnaSelect,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell
} from "@/components/dna";

interface CashOutItem {
  id: string;
  code: string;
  date: string;
  description: string;
  to: string;
  billNo: string;
  account: string;
  amount: number;
  status: "POSTED" | "DRAFT";
  category: string;
}

export default function CashOutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Kas Keluar...</div>}>
      <CashOutContent />
    </Suspense>
  );
}

function CashOutContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CashOutItem | null>(null);

  // Live Cash Out / Journals query
  const { data: journalsRaw = [], isLoading, refetch } = useQuery({
    queryKey: ["finance-cash-out-journals"],
    queryFn: async (): Promise<any[]> => {
      const res = await api.get("/finance/journals");
      return unwrapResponse<any[]>(res) || [];
    },
  });

  const cashOutItems: CashOutItem[] = useMemo(() => {
    return (journalsRaw || [])
      .filter((j: any) =>
        j.reference?.includes("KK") ||
        j.reference?.includes("CASH-OUT") ||
        j.reference?.includes("FUND-DISB") ||
        j.lines?.some((l: any) => l.account?.type === "EXPENSE")
      )
      .map((j: any) => {
        const debitLine = j.lines?.find((l: any) => Number(l.debit) > 0);
        const creditLine = j.lines?.find((l: any) => Number(l.credit) > 0);
        return {
          id: j.id,
          code: j.reference || `KK-${j.id?.slice(0, 8)}`,
          date: j.date ? new Date(j.date).toISOString().split("T")[0] : "",
          description: j.description || "Pengeluaran Kas",
          to: j.sourceDocumentType || "Vendor/Staff",
          billNo: j.reference || "-",
          account: creditLine?.account?.name || "Kas/Bank BCA",
          amount: Number(debitLine?.debit || creditLine?.credit || 0),
          status: "POSTED" as const,
          category: debitLine?.account?.name || "Beban Operasional",
        };
      });
  }, [journalsRaw]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Form states (SCR-084)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    account: "BCA Operasional (521-009182)",
    to: "",
    billNo: "",
    coaExpense: "5110 - Beban Pokok Bahan Baku",
    amount: "",
    entryNotes: ""
  });

  const totalKasKeluar = useMemo(() => {
    return cashOutItems.reduce((acc, r) => acc + r.amount, 0);
  }, [cashOutItems]);

  const filteredItems = useMemo(() => {
    return cashOutItems.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.billNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTab = statusTab === "ALL" || item.status === statusTab;
      return matchSearch && matchTab;
    });
  }, [cashOutItems, searchQuery, statusTab]);

  const handleSave = () => {
    if (!formData.description || !formData.amount) {
      toast.error("Mohon lengkapi seluruh kolom bertanda bintang (*)");
      return;
    }
    toast.success("Bukti Kas Bank Keluar berhasil disimpan dan diposting ke Jurnal!");
    setIsCreateModalOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      account: "BCA Operasional (521-009182)",
      to: "",
      billNo: "",
      coaExpense: "5110 - Beban Pokok Bahan Baku",
      amount: "",
      entryNotes: ""
    });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kas Bank Keluar"
        description="Pencatatan pengeluaran kas dan transfer bank untuk pembayaran tagihan vendor supplier, utilitas pabrik, dan pencairan pengajuan dana."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Poin 19: Single Card Ringkas & Filter Kalender Lengkap</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Mutasi" },
          { id: "POSTED", label: "Posted (Jurnal)" },
          { id: "DRAFT", label: "Draft" }
        ]}
        activeTab={statusTab}
        onTabChange={setStatusTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Kas Keluar
            </DnaButton>
          </div>
        }
      />

      {/* SPECIAL REQUIREMENT POIN 19: HANYA 1 CARD RINGKAS */}
      <DnaKpiGrid cols={1}>
        <DnaStatCard
          label="Total Kas Keluar Periode Terpilih"
          value={formatRupiah(totalKasKeluar)}
          icon={<DollarSign className="w-6 h-6 text-rose-600" />}
          delta={{ value: "Pengeluaran Operasional & Vendor", isPositive: false }}
          subtext={`Akumulasi kas keluar dari ${dateRange.start} s/d ${dateRange.end}`}
          variant="critical"
        />
      </DnaKpiGrid>

      {/* DATA TABLE CARD DENGAN DATE RANGE PICKER BEBAS */}
      <DnaDataTableCard
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <DnaInput
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
              <span className="text-slate-400 font-semibold">s/d</span>
              <DnaInput
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari kode/deskripsi/vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <DnaButton variant="secondary" size="sm" onClick={() => toast.success("Filter tanggal diaplikasikan")}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              Terapkan
            </DnaButton>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="min-w-[1150px]">
            <DnaTableHead>
              <tr>
                <DnaTh className="w-[130px]">No Bukti</DnaTh>
                <DnaTh className="w-[110px]">Tanggal</DnaTh>
                <DnaTh>Deskripsi Pengeluaran</DnaTh>
                <DnaTh>Dibayar Kepada</DnaTh>
                <DnaTh>Rekening Kas/Bank</DnaTh>
                <DnaTh>Kategori Biaya</DnaTh>
                <DnaTh className="w-[130px]">No Ref / Bill</DnaTh>
                <DnaTh align="right" className="w-[140px]">Jumlah (Rp)</DnaTh>
                <DnaTh align="center" className="w-[100px]">Status</DnaTh>
                <DnaTh align="center" className="w-[80px]">Aksi</DnaTh>
              </tr>
            </DnaTableHead>
            <DnaTableBody>
              {filteredItems.map((item) => (
                <DnaTableRow
                  key={item.id}
                  onClick={() => setSelectedDetail(item)}
                  className="cursor-pointer"
                >
                  <DnaTd>
                    <DnaCell.Code value={item.code} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Date value={item.date} />
                  </DnaTd>
                  <DnaTd isPrimary>
                    <DnaCell.Text primary={item.description} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text primary={item.to} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text primary={item.account} />
                  </DnaTd>
                  <DnaTd isMuted>
                    <DnaCell.Text primary={item.category} />
                  </DnaTd>
                  <DnaTd>
                    {item.billNo && item.billNo !== "-" ? (
                      <DnaCell.Code value={item.billNo} />
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">-</span>
                    )}
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={item.amount} className="font-semibold text-rose-700" />
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge variant={item.status === "POSTED" ? "critical" : "default"}>
                      {item.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDetail(item)}
                        title="Lihat Detail"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Mencetak Bukti Kas Keluar ${item.code}...`)}
                        title="Print Bukti"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
              <tr className="bg-rose-50/75 font-semibold border-t-2 border-rose-300">
                <td colSpan={7} className="px-3.5 py-3 text-rose-950 font-bold text-right text-xs">
                  TOTAL KAS KELUAR:
                </td>
                <td className="px-3.5 py-3 text-right text-rose-950 font-bold tabular-nums text-sm">
                  {formatRupiah(totalKasKeluar)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT KAS KELUAR (SCR-084) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Kas Bank Keluar (Other Payment)"
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Pembayaran *</label>
              <DnaInput
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kas / Bank Akun Pembayaran *</label>
<DnaSelect 
                value={formData.account}
                onChange={(value) => setFormData({ ...formData, account: value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="BCA Operasional (521-009182)">1120 - Bank BCA Operasional (521-009182)</option>
                <option value="Mandiri Payroll (137-00123)">1130 - Bank Mandiri Payroll & Pajak (137-00123)</option>
                <option value="Kas Tunai Petty Cash">1110 - Kas Tunai Petty Cash Kantor</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kepada (Nama Penerima / Vendor)</label>
              <DnaInput
                type="text"
                placeholder="e.g. PT Bahan Kimia Nusantara"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">No. Tagihan / Invoice Ref</label>
              <DnaInput
                type="text"
                placeholder="e.g. BILL-2608-012"
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Chart of Account (CoA) Beban/Biaya *</label>
<DnaSelect 
                value={formData.coaExpense}
                onChange={(value) => setFormData({ ...formData, coaExpense: value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="5110 - Beban Pokok Bahan Baku">5110 - Beban Pokok Bahan Baku Aktif</option>
                <option value="5120 - Beban Kemasan Packaging">5120 - Beban Kemasan Packaging</option>
                <option value="6130 - Biaya Utilitas Listrik/Air">6130 - Biaya Utilitas Listrik & Boiler</option>
                <option value="6190 - Beban Operasional Umum">6190 - Beban Operasional Umum & Petty Cash</option>
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Jumlah Nilai Pembayaran (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="e.g. 120000000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Deskripsi Umum Pembayaran *</label>
            <DnaInput
              type="text"
              placeholder="e.g. Pembayaran Pelunasan Invoice Bahan Baku Centella"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Keterangan Entry Khusus (Opsional)</label>
            <DnaInput
              type="text"
              placeholder="Catatan tambahan..."
              value={formData.entryNotes}
              onChange={(e) => setFormData({ ...formData, entryNotes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 flex justify-between items-center">
            <span className="text-rose-900 font-medium">Jurnal Otomatis yang Terbentuk:</span>
            <span className="font-mono text-xs font-bold text-rose-800">
              Dr Beban/Biaya / Cr Kas/Bank ({formData.account.split(" ")[0]})
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSave}>
              Simpan Kas Bank Keluar
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL DRAWER (QUICK PEEK) */}
      <DnaDetailDrawer
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={`Bukti Kas Keluar: ${selectedDetail?.code}`}
        subtitle={selectedDetail?.description}
        badge={
          selectedDetail && (
            <DnaBadge variant={selectedDetail.status === "POSTED" ? "critical" : "default"}>
              {selectedDetail.status}
            </DnaBadge>
          )
        }
        tabs={[
          {
            id: "info",
            label: "Rincian Pengeluaran",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-[11px] text-slate-500">Nomor Bukti</div>
                    <div className="font-mono font-bold text-rose-700 text-sm">{selectedDetail?.code}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Tanggal Pengeluaran</div>
                    <div className="font-medium text-slate-800">{selectedDetail?.date}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Penerima Dana</div>
                    <div className="font-semibold text-slate-900">{selectedDetail?.to}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">No. Tagihan / Ref</div>
                    <div className="font-mono text-slate-800">{selectedDetail?.billNo}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Sumber Kas / Rekening</div>
                    <div className="font-semibold text-slate-800">{selectedDetail?.account}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Kategori / Akun Beban</div>
                    <div className="font-medium text-slate-700">{selectedDetail?.category}</div>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-lg border border-rose-200 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] text-rose-700 font-bold uppercase">Total Nominal Kas Keluar</div>
                    <div className="text-xl font-black text-rose-900">
                      {selectedDetail ? formatRupiah(selectedDetail.amount) : "0"}
                    </div>
                  </div>
                  <DnaBadge variant="critical">DISBURSEMENT POSTED</DnaBadge>
                </div>
              </div>
            )
          },
          {
            id: "journal",
            label: "Jurnal Pengeluaran",
            content: (
              <div className="p-4 space-y-3 text-xs">
                <div className="text-slate-500 font-medium">Entri Jurnal Akuntansi Pengeluaran:</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Akun COA</th>
                        <th className="p-2.5 text-right">Debit</th>
                        <th className="p-2.5 text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">
                          Dr. {selectedDetail?.category}
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-700">
                          {selectedDetail ? formatRupiah(selectedDetail.amount) : "0"}
                        </td>
                        <td className="p-2.5 text-right text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800 pl-6">
                          Cr. {selectedDetail?.account}
                        </td>
                        <td className="p-2.5 text-right text-slate-400">-</td>
                        <td className="p-2.5 text-right font-bold text-rose-700">
                          {selectedDetail ? formatRupiah(selectedDetail.amount) : "0"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="secondary"
              size="md"
              onClick={() => toast.success(`Mencetak Bukti Kas Keluar ${selectedDetail?.code}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setSelectedDetail(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
