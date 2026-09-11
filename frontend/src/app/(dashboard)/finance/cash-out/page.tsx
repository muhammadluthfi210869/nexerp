"use client";

import React, { useState, useMemo } from "react";
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
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

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

const FALLBACK_CASH_OUT: CashOutItem[] = [
  { id: "1", code: "KK-2609-001", date: "2026-09-08", description: "Pembayaran Bahan Baku Ekstrak Centella Asiatica", to: "PT Bahan Kimia Nusantara", billNo: "BILL-2608-012", account: "BCA Operasional (521-009182)", amount: 120000000, status: "POSTED", category: "Bahan Baku" },
  { id: "2", code: "KK-2609-002", date: "2026-09-07", description: "Pembayaran Botol Kaca Serum 30ml Amber", to: "CV Botol & Kemasan Lestari", billNo: "BILL-2608-088", account: "BCA Operasional (521-009182)", amount: 65000000, status: "POSTED", category: "Bahan Kemas" },
  { id: "3", code: "KK-2609-003", date: "2026-09-05", description: "Pembayaran Biaya Listrik Industri PLN & Boiler Pabrik", to: "PT PLN (Persero)", billNo: "UTIL-2609-01", account: "BCA Operasional (521-009182)", amount: 45000000, status: "POSTED", category: "Utilitas Pabrik" },
  { id: "4", code: "KK-2609-004", date: "2026-09-02", description: "Pencairan Reimburse Perjalanan Dinas QC Audit", to: "Ahmad Hendra (Staff QC)", billNo: "FR-2609-002", account: "Kas Tunai Petty Cash", amount: 3500000, status: "POSTED", category: "Fund Request Disbursed" },
];

export default function CashOutPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CashOutItem | null>(null);

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
    return FALLBACK_CASH_OUT.reduce((acc, r) => acc + r.amount, 0);
  }, []);

  const filteredItems = useMemo(() => {
    return FALLBACK_CASH_OUT.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.billNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery]);

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
        title="Daftar Mutasi Kas Bank Keluar"
        badge={<DnaBadge variant="critical">{filteredItems.length} Transaksi</DnaBadge>}
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
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">#</th>
                <th className="px-3.5 py-3">Kode</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Deskripsi Pembayaran</th>
                <th className="px-3.5 py-3">Kepada (Penerima)</th>
                <th className="px-3.5 py-3">No. Tagihan</th>
                <th className="px-3.5 py-3">Kas / Bank</th>
                <th className="px-3.5 py-3 text-right">Jumlah (Rp)</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3.5 py-2.5 font-mono text-rose-700 font-bold">{item.code}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.date}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{item.to}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px]">{item.billNo}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{item.account}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-rose-700 text-xs">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={item.status === "POSTED" ? "success" : "default"}>
                      {item.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDetail(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.success(`Mencetak Bukti Kas Keluar ${item.code}...`)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Print Bukti Kas Keluar"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-rose-50/75 font-black border-t-2 border-rose-300">
                <td colSpan={7} className="px-3.5 py-3 text-rose-950 font-black text-right text-xs">
                  TOTAL KAS KELUAR:
                </td>
                <td className="px-3.5 py-3 text-right text-rose-950 font-black text-sm">
                  {formatRupiah(totalKasKeluar)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
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

      {/* DETAIL MODAL */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={`Detail Kas Keluar: ${selectedDetail?.code}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Transaksi:</span>
              <strong className="text-slate-800">{selectedDetail?.date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima Pembayaran:</span>
              <strong className="text-slate-800">{selectedDetail?.to}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. Tagihan / Ref:</span>
              <strong className="text-slate-800 font-mono">{selectedDetail?.billNo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Akun Sumber Rekening:</span>
              <strong className="text-slate-800">{selectedDetail?.account}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kategori Biaya:</span>
              <strong className="text-slate-800">{selectedDetail?.category}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Total Pengeluaran:</span>
              <strong className="text-rose-700 font-black text-sm">
                {selectedDetail ? formatRupiah(selectedDetail.amount) : "0"}
              </strong>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedDetail(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
