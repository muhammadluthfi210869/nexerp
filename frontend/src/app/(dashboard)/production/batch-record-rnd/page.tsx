"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  Printer,
  X,
  Building2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast
} from "@/components/dna";
import { Input } from "@/components/ui/input";

interface BatchRecord {
  id: string;
  batchRecordCode: string;
  tanggal: string;
  salesCode: string;
  tanggalSales: string;
  customerName: string;
  category: string;
  productName: string;
  creatorName: string;
  status: "PENDING" | "PROCESS" | "READY_TO_PRODUCE" | "RELEASED";
  statusLabel: string;
  notes?: string;
}

const INITIAL_BATCH_RECORDS: BatchRecord[] = [
  {
    id: "br-01",
    batchRecordCode: "BR-2026-0012",
    tanggal: "2026-03-09",
    salesCode: "SO-2026-0041",
    tanggalSales: "2026-03-01",
    customerName: "PT Cantika Glow Nusantara",
    category: "Skincare",
    productName: "Brightening Glow Serum 10% Niacinamide 30ml",
    creatorName: "Ahmad Maulana",
    status: "READY_TO_PRODUCE",
    statusLabel: "Siap Produksi",
    notes: "Line clearance ruang mixing steril. Timbangan Mettler Toledo terkalibrasi."
  },
  {
    id: "br-02",
    batchRecordCode: "BR-2026-0015",
    tanggal: "2026-03-08",
    salesCode: "SO-2026-0044",
    tanggalSales: "2026-02-28",
    customerName: "PT Miracle Beauty Lab",
    category: "Skincare",
    productName: "Ceramide 5X Barrier Repair Moisturizer 50g",
    creatorName: "Hendro Wibowo",
    status: "PROCESS",
    statusLabel: "Dalam Proses",
    notes: "Penimbangan bahan baku fase aktif Cica dan Ceramide selesai."
  },
  {
    id: "br-03",
    batchRecordCode: "BR-2026-0018",
    tanggal: "2026-03-05",
    salesCode: "SO-2026-0049",
    tanggalSales: "2026-02-25",
    customerName: "PT Cantika Herbal Nusantara",
    category: "Bodycare",
    productName: "Soothing Acne Gel Cica + Tea Tree 30gr",
    creatorName: "Ahmad Maulana",
    status: "PENDING",
    statusLabel: "Menunggu APJ",
    notes: "Menunggu rilis sertifikat CoA bahan baku pengawet dari QC Lab."
  },
  {
    id: "br-04",
    batchRecordCode: "BR-2026-0021",
    tanggal: "2026-03-01",
    salesCode: "SO-2026-0052",
    tanggalSales: "2026-02-20",
    customerName: "CV Royal Beauty Luxe",
    category: "Decorative",
    productName: "Hydrating Lip Oil Peptide Tint 5ml",
    creatorName: "Hendro Wibowo",
    status: "RELEASED",
    statusLabel: "Selesai (Released)",
    notes: "Pelepasan batch disetujui APJ & QC. Produk siap masuk karantina gudang."
  }
];

function BatchRecordContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<BatchRecord[]>(INITIAL_BATCH_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BatchRecord | null>(null);
  const toast = useDnaToast();

  // Create Form State
  const [formData, setFormData] = useState({
    salesCode: "SO-2026-0055",
    productName: "Moisturizing Sunscreen Gel 50ml",
    tanggal: new Date().toISOString().slice(0, 10),
    customerName: "PT Cantika Glow Nusantara",
    category: "Skincare",
    notes: ""
  });

  // Handle URL action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        r.batchRecordCode.toLowerCase().includes(q) ||
        r.salesCode.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.creatorName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const totalRecords = records.length;
  const readyCount = records.filter((r) => r.status === "READY_TO_PRODUCE").length;
  const processCount = records.filter((r) => r.status === "PROCESS").length;

  const handleSaveBatchRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: BatchRecord = {
      id: `br-${Date.now()}`,
      batchRecordCode: `PRD-2026-${String(records.length + 1).padStart(4, "0")}`,
      tanggal: formData.tanggal,
      salesCode: formData.salesCode,
      tanggalSales: formData.tanggal,
      customerName: formData.customerName,
      category: formData.category,
      productName: formData.productName,
      creatorName: "Operator Produksi",
      status: "PROCESS",
      statusLabel: "Dalam Proses",
      notes: formData.notes
    };

    setRecords([newRecord, ...records]);
    setIsCreateModalOpen(false);
    toast.success("Batch Record Dibuat", "Nomor batch record universal PRD berhasil diterbitkan.");
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Batch Record Pra-Produksi"
        description="Dokumentasi penelusuran riwayat penimbangan bahan, spesifikasi CPKB, dan otorisasi produksi (1:1 G-SERP Parity)."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Pra Produksi", href: "/batch-record" },
          { label: "Batch Record", href: "/batch-record" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Excel", "Data batch record berhasil diunduh.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Batch Record
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL BATCH RECORD"
          value={`${totalRecords} Batch`}
          subValue="Terdaftar di Pra-Produksi"
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="SIAP PRODUKSI (RELEASED APJ)"
          value={`${readyCount} Batch`}
          subValue="Menunggu Antrian Mixing"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="DALAM PROSES PENIMBANGAN"
          value={`${processCount} Batch`}
          subValue="Line Clearance & Timbang"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable (1:1 G-SERP Row 132 — EXACT 9 COLUMNS) */}
      <DnaDataTableCard
        title="Daftar Batch Record Pra-Produksi"
        description="Pelacakan status batch manufacturing, referensi sales order, pelanggan, dan nama produk maklon."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode batch, sales, pelanggan, produk..."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="READY_TO_PRODUCE">Siap Produksi</option>
              <option value="PROCESS">Dalam Proses</option>
              <option value="PENDING">Menunggu APJ</option>
              <option value="RELEASED">Selesai (Released)</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3 w-28">Kode</th>
                <th className="py-3 px-3 w-24">Tanggal</th>
                <th className="py-3 px-3 w-28">Sales</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3 w-24">Kategori</th>
                <th className="py-3 px-3">Produk</th>
                <th className="py-3 px-3 text-center w-28">Status</th>
                <th className="py-3 px-3 text-center w-20">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data batch record ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{row.batchRecordCode}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{row.tanggal}</td>
                    <td className="py-3 px-3 font-mono text-indigo-600 font-bold">{row.salesCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.customerName}</td>
                    <td className="py-3 px-3 text-slate-700">{row.category}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{row.productName}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "READY_TO_PRODUCE"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "PROCESS"
                            ? "bg-blue-100 text-blue-800"
                            : row.status === "RELEASED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedRecord(row)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Lihat Detail Batch Record (ajaxDetail)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Buat Batch Record (SCR-133 / ?action=create) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Buat Batch Record Pra-Produksi</h3>
                <p className="text-xs text-slate-500">Penerbitan nomor urut batch manufaktur CPKB (Format Universal Global)</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Nomor Sales Order <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.salesCode}
                    onChange={(e) => setFormData({ ...formData, salesCode: e.target.value })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Tanggal Batch Record <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Pilih Produk dari Detail Sales <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Pelanggan</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kategori Produk</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Upload File Lampiran (Opsional)</label>
                <Input type="file" className="h-8 text-xs" />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Catatan Tambahan</label>
                <Input
                  placeholder="Instruksi khusus atau catatan penimbangan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <DnaButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Kembali
                </DnaButton>
                <DnaButton type="submit" variant="primary">
                  Simpan Batch Record
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Detail Batch Record (1:1 G-SERP Row 132 ajaxDetail) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Detail Batch Record Pra-Produksi</h3>
                <p className="text-xs font-mono text-blue-600">{selectedRecord.batchRecordCode}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Status:</span>
                <span className="font-bold text-slate-800">{selectedRecord.statusLabel}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Tanggal Dibuat:</span>
                <span className="font-mono text-slate-700">{selectedRecord.tanggal}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Kode Sales:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedRecord.salesCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Tanggal Sales:</span>
                <span className="font-mono text-slate-700">{selectedRecord.tanggalSales}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Pelanggan:</span>
                <span className="font-semibold text-slate-900">{selectedRecord.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Kategori / Produk:</span>
                <span className="font-medium text-slate-800">{selectedRecord.category} • {selectedRecord.productName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-bold block">Dibuat Oleh:</span>
                <span className="text-slate-800 font-medium">{selectedRecord.creatorName}</span>
              </div>
            </div>

            {/* Tabel Detail Bahan */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                Rincian Alokasi Bahan Baku:
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Kode Barang</th>
                    <th className="p-2.5">Nama Barang</th>
                    <th className="p-2.5 text-center">Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 text-slate-400">1</td>
                    <td className="p-2.5 font-mono font-bold text-blue-600">BBK00001</td>
                    <td className="p-2.5 font-medium text-slate-800">Hydro Marine Collagen 99%</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">gr</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-400">2</td>
                    <td className="p-2.5 font-mono font-bold text-blue-600">BBK00002</td>
                    <td className="p-2.5 font-medium text-slate-800">Aqua Demineralisata (USP Grade)</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="outline" onClick={() => setSelectedRecord(null)}>
                Tutup Modal
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}

export default function BatchRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Batch Record...</div>}>
      <BatchRecordContent />
    </Suspense>
  );
}
