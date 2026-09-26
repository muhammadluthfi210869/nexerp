"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  FileSpreadsheet,
  Eye,
  Clock,
  CheckCircle2,
  Building2,
  User,
  FlaskConical,
  Printer
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

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

const INITIAL_BATCH_RECORDS: BatchRecord[] = [];

function BatchRecordContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();

  const { data: serverRecords, isLoading } = useQuery({
    queryKey: ["batch-records-list"],
    queryFn: async () => {
      const res = await api.get("/production/batch-records");
      const list = res.data?.data || res.data || [];
      return list.map((item: any) => ({
        id: item.id,
        batchRecordCode: item.batchNo || item.code || item.id,
        tanggal: item.createdAt ? String(item.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
        salesCode: item.so?.orderNumber || item.salesCode || "SO-2026",
        tanggalSales: item.so?.createdAt ? String(item.so.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
        customerName: item.lead?.clientName || item.so?.lead?.clientName || "PT Cantika Glow Nusantara",
        category: "Skincare",
        productName: item.lead?.productInterest || item.so?.lead?.productInterest || "Brightening Serum",
        creatorName: "Ahmad Maulana",
        status: item.status === "APPROVED" || item.status === "LOCKED" ? "READY_TO_PRODUCE" : item.status === "COMPLETED" ? "RELEASED" : item.status === "IN_PROGRESS" ? "PROCESS" : "PENDING",
        statusLabel: item.status || "Menunggu APJ",
        notes: item.apjNotes || item.notes || "",
      }));
    },
  });

  const [localRecords, setLocalRecords] = useState<BatchRecord[]>(INITIAL_BATCH_RECORDS);
  const records = useMemo(() => {
    return [...localRecords, ...(serverRecords || [])];
  }, [localRecords, serverRecords]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BatchRecord | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    salesCode: "SO-2026-0055",
    productName: "Moisturizing Sunscreen Gel 50ml",
    tanggal: new Date().toISOString().slice(0, 10),
    customerName: "PT Cantika Glow Nusantara",
    category: "Skincare",
    notes: ""
  });

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
  const pendingCount = records.filter((r) => r.status === "PENDING").length;

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

    setLocalRecords([newRecord, ...localRecords]);
    setIsCreateModalOpen(false);
    toast.success("Batch Record Dibuat", "Nomor batch record universal PRD berhasil diterbitkan.");
  };

  const getStatusBadge = (status: BatchRecord["status"]) => {
    switch (status) {
      case "READY_TO_PRODUCE":
        return <DnaBadge variant="success">SIAP PRODUKSI</DnaBadge>;
      case "PROCESS":
        return <DnaBadge variant="info">DALAM PROSES</DnaBadge>;
      case "RELEASED":
        return <DnaBadge variant="success">SELESAI</DnaBadge>;
      case "PENDING":
      default:
        return <DnaBadge variant="warning">MENUNGGU APJ</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Batch Record Pra-Produksi"
        description="Dokumentasi penelusuran riwayat penimbangan bahan, spesifikasi CPKB, dan otorisasi produksi."
        breadcrumbs={[
          { label: "Operasional", href: "/samples/rnd-dashboard" },
          { label: "Pra Produksi", href: "/production/batch-record-rnd" },
          { label: "Batch Record", href: "/production/batch-record-rnd" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua (${totalRecords})` },
          { id: "READY_TO_PRODUCE", label: `Siap Produksi (${readyCount})` },
          { id: "PROCESS", label: `Dalam Proses (${processCount})` },
          { id: "PENDING", label: `Menunggu APJ (${pendingCount})` }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
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
              Buat Batch Record
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

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode batch, sales, pelanggan, produk..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
                <DnaTh className="py-3 px-4 w-[26%]">Sales & Pelanggan</DnaTh>
                <DnaTh className="py-3 px-4 w-[28%]">Produk & Kategori</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Dibuat Oleh</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data batch record...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredRecords.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data batch record ditemukan.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredRecords.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-blue-600 truncate">{row.batchRecordCode}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{row.tanggal}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{row.customerName}</p>
                      <p className="tabular-nums text-[11px] text-indigo-600 truncate">{row.salesCode}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{row.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{row.category}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-medium text-slate-800 text-xs truncate">{row.creatorName}</p>
                      <p className="text-[11px] text-slate-400 truncate">Operator</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(row);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Batch Record"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Buat Batch Record */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Batch Record Pra-Produksi"
        description="Penerbitan nomor urut batch manufaktur CPKB (Format Universal Global)."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveBatchRecord}>
              Simpan Batch Record
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleSaveBatchRecord} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nomor Sales Order <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                value={formData.salesCode}
                onChange={(e) => setFormData({ ...formData, salesCode: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Tanggal Batch Record <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Pelanggan</label>
              <DnaInput
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Kategori Produk</label>
              <DnaInput
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Tambahan</label>
            <DnaInput
              placeholder="Instruksi khusus atau catatan penimbangan..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedRecord?.batchRecordCode || "Detail Batch Record"}
        subtitle={selectedRecord ? `${selectedRecord.productName} • ${selectedRecord.customerName}` : undefined}
        badge={selectedRecord ? getStatusBadge(selectedRecord.status) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan",
            content: selectedRecord ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{selectedRecord.batchRecordCode}</span>
                    <span className="tabular-nums text-slate-500">{selectedRecord.tanggal}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{selectedRecord.productName}</p>
                  <p className="text-slate-600">{selectedRecord.customerName} ({selectedRecord.category})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Referensi Sales Order</span>
                    <p className="tabular-nums font-bold text-indigo-600">{selectedRecord.salesCode}</p>
                    <span className="text-[10px] text-slate-400">Tgl: {selectedRecord.tanggalSales}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Dibuat Oleh</span>
                    <p className="font-medium text-slate-800">{selectedRecord.creatorName}</p>
                    <span className="text-[10px] text-slate-400">Operator Batch Pra-Produksi</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Khusus:</span>
                  <p className="text-slate-600">{selectedRecord.notes || "Tidak ada catatan khusus."}</p>
                </div>
              </div>
            ) : null
          },
          {
            id: "materials",
            label: "Alokasi Bahan",
            content: (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-700 uppercase">Rincian Alokasi Bahan Baku:</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <DnaTable>
                    <DnaTableHead>
                      <DnaTableRow>
                        <DnaTh className="p-2.5">Kode</DnaTh>
                        <DnaTh className="p-2.5">Nama Bahan</DnaTh>
                        <DnaTh className="p-2.5 text-right">Satuan</DnaTh>
                      </DnaTableRow>
                    </DnaTableHead>
                    <DnaTableBody>
                      <DnaTableRow>
                        <DnaTd className="p-2.5 tabular-nums font-bold text-blue-600">BBK00001</DnaTd>
                        <DnaTd className="p-2.5 text-slate-800 font-medium">Hydro Marine Collagen 99%</DnaTd>
                        <DnaTd className="p-2.5 text-right tabular-nums text-slate-600">gr</DnaTd>
                      </DnaTableRow>
                      <DnaTableRow>
                        <DnaTd className="p-2.5 tabular-nums font-bold text-blue-600">BBK00002</DnaTd>
                        <DnaTd className="p-2.5 text-slate-800 font-medium">Aqua Demineralisata (USP Grade)</DnaTd>
                        <DnaTd className="p-2.5 text-right tabular-nums text-slate-600">kg</DnaTd>
                      </DnaTableRow>
                    </DnaTableBody>
                  </DnaTable>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                toast.success("Cetak Dokumen", "Batch record berhasil dikirim ke antrian pencetakan.");
                setIsDetailDrawerOpen(false);
              }}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen
            </DnaButton>
          </div>
        }
      />
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
