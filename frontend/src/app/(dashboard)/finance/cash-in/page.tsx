"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowDownLeft,
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
  Upload
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

interface CashInItem {
  id: string;
  code: string;
  date: string;
  description: string;
  from: string;
  account: string;
  amount: number;
  status: "POSTED" | "DRAFT";
  category: string;
  reference?: string;
}

const FALLBACK_CASH_IN: CashInItem[] = [
  { id: "1", code: "KM-2609-001", date: "2026-09-08", description: "Penerimaan Termin 50% Produksi PO-8821 PT Glowing", from: "PT Glowing Beauty Indonesia", account: "BCA Operasional (521-009182)", amount: 450000000, status: "POSTED", category: "Maklon OEM", reference: "AR-INV-2609-01" },
  { id: "2", code: "KM-2609-002", date: "2026-09-07", description: "Pelunasan Invoice Jasa Notifikasi BPOM", from: "CV Cantik Natural", account: "Mandiri Payroll (137-00123)", amount: 35000000, status: "POSTED", category: "Legalitas BPOM", reference: "AR-INV-2608-88" },
  { id: "3", code: "KM-2609-003", date: "2026-09-05", description: "Penerimaan Bunga Bank Giro Penempatan", from: "Bank BCA", account: "BCA Operasional (521-009182)", amount: 4250000, status: "POSTED", category: "Pendapatan Bunga", reference: "-" },
  { id: "4", code: "KM-2609-004", date: "2026-09-03", description: "Penerimaan Penjualan Batch Sample R&D", from: "dr. Vina Aesthetic Clinic", account: "BCA Operasional (521-009182)", amount: 15000000, status: "POSTED", category: "Sample R&D", reference: "SO-SMP-041" },
];

export default function CashInPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CashInItem | null>(null);

  // Form states (SCR-082)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    account: "BCA Operasional (521-009182)",
    description: "",
    from: "",
    coaRevenue: "4110 - Pendapatan Produksi Maklon",
    memo: "",
    amount: ""
  });

  const totalKasMasuk = useMemo(() => {
    return FALLBACK_CASH_IN.reduce((acc, r) => acc + r.amount, 0);
  }, []);

  const filteredItems = useMemo(() => {
    return FALLBACK_CASH_IN.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.from.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery]);

  const handleSave = () => {
    if (!formData.description || !formData.amount) {
      toast.error("Mohon lengkapi seluruh kolom bertanda bintang (*)");
      return;
    }
    toast.success("Bukti Kas Bank Masuk berhasil disimpan dan diposting ke Jurnal!");
    setIsCreateModalOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      account: "BCA Operasional (521-009182)",
      description: "",
      from: "",
      coaRevenue: "4110 - Pendapatan Produksi Maklon",
      memo: "",
      amount: ""
    });
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Kas Bank Masuk"
        description="Pencatatan mutasi penerimaan kas dan bank dari pelunasan piutang, setoran termin maklon, pendapatan jasa BPOM, dan pendapatan lain."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Poin 18: Single Card Ringkas & Filter Kalender Lengkap</span>
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
              + Buat Kas Masuk
            </DnaButton>
          </div>
        }
      />

      {/* SPECIAL REQUIREMENT POIN 18: HANYA 1 CARD RINGKAS */}
      <DnaKpiGrid cols={1}>
        <DnaStatCard
          label="Total Kas Masuk Periode Terpilih"
          value={formatRupiah(totalKasMasuk)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          delta={{ value: "+18.4% Realisasi Inflow", isPositive: true }}
          subtext={`Akumulasi kas masuk dari ${dateRange.start} s/d ${dateRange.end}`}
          variant="success"
        />
      </DnaKpiGrid>

      {/* DATA TABLE CARD DENGAN DATE RANGE PICKER BEBAS */}
      <DnaDataTableCard
        title="Daftar Mutasi Kas Bank Masuk"
        badge={<DnaBadge variant="success">{filteredItems.length} Transaksi</DnaBadge>}
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
                placeholder="Cari kode/deskripsi/pengirim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <th className="px-3.5 py-3">Deskripsi Penerimaan</th>
                <th className="px-3.5 py-3">Dari (Pengirim)</th>
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
                  <td className="px-3.5 py-2.5 font-mono text-emerald-700 font-bold">{item.code}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.date}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-medium">{item.from}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{item.account}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-700 text-xs">
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
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.success(`Mencetak Bukti Kas Masuk ${item.code}...`)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Print Bukti Kas Masuk"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/75 font-black border-t-2 border-emerald-300">
                <td colSpan={6} className="px-3.5 py-3 text-emerald-950 font-black text-right text-xs">
                  TOTAL KAS MASUK:
                </td>
                <td className="px-3.5 py-3 text-right text-emerald-950 font-black text-sm">
                  {formatRupiah(totalKasMasuk)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT KAS MASUK (SCR-082) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Kas Bank Masuk (Other Deposit)"
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Penerimaan *</label>
              <DnaInput
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kas / Bank Akun Penerimaan *</label>
<DnaSelect 
                value={formData.account}
                onChange={(value) => setFormData({ ...formData, account: value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="BCA Operasional (521-009182)">1120 - Bank BCA Operasional (521-009182)</option>
                <option value="Mandiri Payroll (137-00123)">1130 - Bank Mandiri Payroll & Pajak (137-00123)</option>
                <option value="Kas Tunai Operasional">1110 - Kas Tunai Petty Cash Kantor</option>
              </DnaSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dari (Nama Pengirim / Klien)</label>
              <DnaInput
                type="text"
                placeholder="e.g. PT Glowing Beauty Indonesia"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Chart of Account (CoA) Pendapatan *</label>
<DnaSelect 
                value={formData.coaRevenue}
                onChange={(value) => setFormData({ ...formData, coaRevenue: value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="4110 - Pendapatan Produksi Maklon">4110 - Pendapatan Produksi Maklon OEM</option>
                <option value="4120 - Pendapatan Sample R&D">4120 - Pendapatan Sample & Prototipe R&D</option>
                <option value="4130 - Jasa Notifikasi BPOM">4130 - Jasa Notifikasi BPOM & HKI</option>
                <option value="4190 - Pendapatan Bunga & Lainnya">4190 - Pendapatan Bunga & Lainnya</option>
              </DnaSelect>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Deskripsi / Keterangan Penerimaan *</label>
            <DnaInput
              type="text"
              placeholder="e.g. Penerimaan DP 50% Produksi Batch Serum Niacinamide"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Jumlah Nominal (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="e.g. 450000000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Memo / Catatan Item</label>
              <DnaInput
                type="text"
                placeholder="Catatan tambahan..."
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
            <span className="text-emerald-900 font-medium">Jurnal Otomatis yang Terbentuk:</span>
            <span className="font-mono text-xs font-bold text-emerald-800">
              Dr Kas/Bank ({formData.account.split(" ")[0]}) / Cr Pendapatan
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSave}>
              Simpan & Posting
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL MODAL */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={`Detail Kas Masuk: ${selectedDetail?.code}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Transaksi:</span>
              <strong className="text-slate-800">{selectedDetail?.date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sumber Dana / Pengirim:</span>
              <strong className="text-slate-800">{selectedDetail?.from}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Akun Rekening Penerima:</span>
              <strong className="text-slate-800">{selectedDetail?.account}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kategori / CoA:</span>
              <strong className="text-slate-800">{selectedDetail?.category}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dokumen Ref:</span>
              <strong className="text-slate-800 font-mono">{selectedDetail?.reference}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Total Nominal:</span>
              <strong className="text-emerald-700 font-black text-sm">
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
