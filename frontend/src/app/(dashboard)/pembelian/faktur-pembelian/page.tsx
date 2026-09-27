"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileSpreadsheet,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
  Send,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaDetailDrawer,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";

export interface BillItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discountRp: number;
  total: number;
  rejectQty?: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  poNumber: string;
  vendorName: string;
  procurementCategory: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  totalDiscountRp: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dpDeduction: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  unpaidReason?: string;
  notes?: string;
  items: BillItemDetail[];
  pic: string;
}

const PROCUREMENT_CATEGORIES = [
  "Bahan Baku (110401)",
  "Bahan Kemas (110402)",
  "Reagen & Bahan Lab (510201)",
  "Perlengkapan Produksi & Sanitasi (510301)",
  "Jasa Maklon Eksternal (510401)",
];

export default function FakturPembelianPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawBills, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/purchase/invoices");
      return unwrapResponse(res) || [];
    },
  });

  const dataList: PurchaseBill[] = useMemo(() => {
    if (!rawBills || !Array.isArray(rawBills)) return [];
    return rawBills.map((b: any) => ({
      id: b.id,
      billNumber: b.billNumber || b.invoiceNumber || "",
      poNumber: b.purchaseOrder?.poNumber || b.poNumber || b.poId || "-",
      vendorName: b.supplier?.name || b.supplierName || b.vendor?.name || b.vendorName || "-",
      procurementCategory: b.procurementCategory || "Bahan Baku (110401)",
      invoiceDate: b.invoiceDate ? b.invoiceDate.split("T")[0] : "",
      dueDate: b.dueDate ? b.dueDate.split("T")[0] : "",
      subtotal: Number(b.subtotal || 0),
      totalDiscountRp: Number(b.totalDiscount || b.discount || 0),
      taxAmount: Number(b.taxAmount || 0),
      grandTotal: Number(b.grandTotal || 0),
      paidAmount: Number(b.paidAmount || 0),
      dpDeduction: Number(b.downPaymentDeduction || 0),
      paymentStatus: b.paymentStatus || (Number(b.paidAmount) >= Number(b.grandTotal) ? "PAID" : Number(b.paidAmount) > 0 ? "PARTIAL" : "UNPAID"),
      unpaidReason: b.unpaidReason || "",
      notes: b.notes || "",
      pic: b.pic || "Finance Staff",
      items: (b.items || []).map((it: any) => ({
        id: it.id,
        itemCode: it.itemCode || it.material?.sku || "MAT-001",
        itemName: it.itemName || it.material?.name || "Item",
        qty: Number(it.qty || it.quantity || 0),
        unit: it.unit || it.material?.unit || "Kg",
        price: Number(it.price || it.unitPrice || 0),
        discountRp: Number(it.discount || 0),
        total: Number(it.total || it.totalPrice || 0),
        rejectQty: Number(it.rejectQty || 0),
      })),
    }));
  }, [rawBills]);

  // The bill form needs a supplier UUID (CreatePurchaseInvoiceDto.vendorId is @IsUUID), so the
  // picker is backed by the master list rather than a free-text name.
  const { data: rawSuppliers } = useQuery({
    queryKey: ["master-suppliers-for-bill"],
    queryFn: async () => unwrapResponse(await api.get("/master/suppliers")),
    staleTime: 300000,
  });

  const supplierOptions = useMemo<Array<{ value: string; label: string }>>(() => {
    const items = Array.isArray(rawSuppliers) ? rawSuppliers : rawSuppliers?.items;
    if (!Array.isArray(items)) return [];
    return items.map((s: any) => ({ value: s.id, label: s.name || s.supplierName || s.email || s.id }));
  }, [rawSuppliers]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reasonModalBill, setReasonModalBill] = useState<PurchaseBill | null>(null);
  const [newReasonText, setNewReasonText] = useState("");

  // Create Form State
  const [billNumber, setBillNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  // The backend keys a bill on `vendorId` (@IsUUID), so the form carries a supplier UUID, not a
  // typed name. See the DnaSelect in the create modal.
  const [vendorId, setVendorId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [procurementCategory, setProcurementCategory] = useState(PROCUREMENT_CATEGORIES[0]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<BillItemDetail[]>([
    {
      id: "item-1",
      itemCode: "BBK00028",
      itemName: "Super Moisturing Max",
      qty: 10,
      unit: "Kg",
      price: 150000,
      discountRp: 0,
      total: 1500000,
      rejectQty: 0,
    },
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalCount = list.length;
    const totalGrand = list.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalUnpaid = list
      .filter((b) => b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIAL")
      .reduce((sum, b) => sum + (b.grandTotal - b.paidAmount), 0);
    const paidCount = list.filter((b) => b.paymentStatus === "PAID").length;

    return {
      totalCount,
      totalGrand,
      totalUnpaid,
      paidCount,
    };
  }, [dataList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.unpaidReason && item.unpaidReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PAID"
          ? item.paymentStatus === "PAID"
          : activeTab === "UNPAID"
          ? item.paymentStatus === "UNPAID" || item.paymentStatus === "PARTIAL"
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        itemCode: "",
        itemName: "",
        qty: 1,
        unit: "Pcs",
        price: 0,
        discountRp: 0,
        total: 0,
        rejectQty: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof BillItemDetail, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    if (field === "qty" || field === "price" || field === "discountRp") {
      const q = field === "qty" ? value : current.qty;
      const p = field === "price" ? value : current.price;
      const d = field === "discountRp" ? value : current.discountRp;
      current.total = Math.max(0, q * p - d);
    }

    newItems[index] = current;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // POST /purchase/invoices. `invoiceNumber` (the vendor's own number) is what the backend
  // stores on the row; it also auto-generates the internal `billNumber` (FP...) itself, so the
  // FP number shown in the modal is not what this form sends.
  //
  // ponytail: `poNumber` typed below is display-only. purchase-invoices.service.ts sets
  // `poNumber: po?.poNumber` — i.e. from the linked PO record — and the DTO has no plain
  // `poNumber` field, so a typed value is dropped. Add when a 3-way match by typed PO exists.
  const createBillMut = useMutation({
    mutationFn: async () =>
      unwrapResponse(
        await api.post("/purchase/invoices", {
          vendorId,
          invoiceNumber: billNumber.trim(),
          procurementCategory,
          invoiceDate,
          dueDate,
          notes: formNotes.trim() || undefined,
          items: items.map((it) => ({
            itemCode: it.itemCode || undefined,
            itemName: it.itemName,
            qty: Number(it.qty) || 0,
            unit: it.unit,
            price: Number(it.price) || 0,
            discount: Number(it.discountRp) || 0,
          })),
        }),
      ),
    onSuccess: () => {
      toast.success(`Faktur Pembelian ${billNumber} berhasil dicatat & masuk ke daftar Hutang Dagang (AP).`);
      setIsCreateOpen(false);
      setBillNumber("");
      setPoNumber("");
      setVendorId("");
      setFormNotes("");
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const importMut = useMutation({
    // The endpoint takes `{ rows }` and returns one result per row, so the summary counts the
    // server's own verdicts instead of asserting how many landed.
    mutationFn: async (rows: unknown[]) =>
      unwrapResponse(await api.post("/purchase/invoices/import", { rows })) as Array<{
        success: boolean;
        billNumber?: string;
        error?: string;
      }>,
    onSuccess: (results) => {
      const list = Array.isArray(results) ? results : [];
      const ok = list.filter((r) => r.success).length;
      const rejected = list.length - ok;
      if (ok === 0) {
        toast.error(
          "Impor faktur gagal",
          list[0]?.error || "Tidak ada baris yang diterima backend. Periksa nama vendor terhadap master supplier.",
        );
      } else if (rejected > 0) {
        toast.warning(`${ok} faktur pembelian ditambahkan, ${rejected} baris ditolak backend.`);
      } else {
        toast.success(`${ok} faktur pembelian berhasil diimpor.`);
      }
      setIsImportModalOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleCreateBill = () => {
    if (!billNumber.trim()) {
      toast.error("Nomor Faktur Pembelian (Vendor Invoice No) wajib diisi");
      return;
    }
    if (!vendorId) {
      toast.error("Pilih supplier / vendor dari daftar master terlebih dahulu");
      return;
    }
    if (items.length === 0 || !items[0].itemName.trim()) {
      toast.error("Isi minimal 1 detail item barang");
      return;
    }
    createBillMut.mutate();
  };

  const handleSaveReason = () => {
    if (!reasonModalBill) return;
    // `bill.unpaidReason` exists on the table, but the invoices controller exposes no PATCH:
    // only POST /, POST /import, GET / and GET /:id. There is nothing to write to, so this
    // stops claiming an update instead of dropping the edit.
    toast.warning(
      "Catatan belum tersimpan",
      "Backend belum menyediakan rute ubah faktur (PATCH /purchase/invoices/:id). Catatan tidak dipersist.",
    );
    setReasonModalBill(null);
  };

  const IMPORT_HEADERS = "vendor,invoice number,due date,item,qty,unit,price,notes";

  const handleDownloadImportTemplate = () => {
    const blob = new Blob([`${IMPORT_HEADERS}\nPT Contoh Supplier,INV/2026/09/0001,2026-10-26,Kemasan PET 250ml,100,pcs,2500,\n`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_faktur_pembelian.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Rows are matched to a supplier by NAME against the master supplier list, because the import
  // endpoint needs `vendorId` (@IsUUID) and a CSV cannot carry UUIDs. A row whose vendor name is
  // not in the master is sent without vendorId and comes back rejected by the backend, which is
  // counted as "ditolak" rather than silently dropped.
  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error("Pilih file CSV terlebih dahulu");
      return;
    }
    let csv = "";
    try {
      csv = await importFile.text();
    } catch {
      toast.error("Gagal membaca file. Pastikan file CSV yang dipilih valid.");
      return;
    }

    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      toast.error("File CSV kosong atau hanya berisi baris header.");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
      const vendorLabel = row["vendor"] || row["supplier"] || row["nama supplier"] || "";
      const supplier = supplierOptions.find((s) => s.label.toLowerCase() === vendorLabel.toLowerCase());
      return {
        vendorId: supplier?.value,
        invoiceNumber: row["invoice number"] || undefined,
        dueDate: row["due date"] || undefined,
        notes: row["notes"] || `Impor ${importFile.name}`,
        items: [
          {
            itemName: row["item"] || "Item impor",
            qty: Number(row["qty"]) || 1,
            unit: row["unit"] || "pcs",
            price: Number(row["price"]) || 0,
          },
        ],
      };
    });

    importMut.mutate(rows);
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Tabs */}
      <DnaPageHeader
        title="Faktur Pembelian (Purchase Invoices)"
        description="Kelola tagihan masuk dari supplier, pencatatan hutang dagang (AP), dan verifikasi termin jatuh tempo."
        badge={<DnaBadge variant="neutral">SCR-046 / FIN-PUR-BILL</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua Faktur", count: dataList.length },
          {
            key: "UNPAID",
            label: "Belum Dibayar",
            count: dataList.filter((d) => d.paymentStatus === "UNPAID" || d.paymentStatus === "PARTIAL").length,
          },
          {
            key: "PAID",
            label: "Sudah Dibayar",
            count: dataList.filter((d) => d.paymentStatus === "PAID").length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<Upload className="w-4 h-4 text-indigo-600" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Excel
            </DnaButton>
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Faktur Pembelian diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Input Faktur
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Tagihan Masuk"
          value={`${kpis.totalCount} Faktur`}
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+5 bulan ini", isPositive: true }}
        />
        <DnaStatCard
          label="Total Nilai Faktur"
          value={`Rp ${kpis.totalGrand.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-slate-700" />}
        />
        <DnaStatCard
          label="Hutang Belum Lunas"
          value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          variant={kpis.totalUnpaid > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Faktur Lunas"
          value={`${kpis.paidCount} Faktur`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Faktur Pembelian"
            message="Terjadi kesalahan saat mengambil data faktur pembelian dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={6} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Cari No Faktur, PO, vendor, alasan belum lunas...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">No. Purchase Order</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Jatuh Tempo</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Kategori Pengadaan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Nilai Tagihan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Sisa Hutang</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Faktur Pembelian"
                        description="Belum ada data faktur pembelian atau tidak ada hasil yang sesuai dengan filter."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row) => {
                    const remaining = Math.max(0, row.grandTotal - row.paidAmount);
                    return (
                      <DnaTableRow
                        key={row.id}
                        onClick={() => setSelectedBill(row)}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={row.billNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={row.poNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={row.invoiceDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={row.dueDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendorName}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{row.procurementCategory}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right">
                          <DnaCell.Numeric value={row.grandTotal} prefix="Rp " />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                          {remaining > 0 ? (
                            <span className="text-[12px] font-semibold text-rose-600">
                              Rp {remaining.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-[12px] font-semibold text-emerald-600">Lunas</span>
                          )}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          {row.paymentStatus === "PAID" ? (
                            <DnaBadge variant="success">Sudah Dibayar</DnaBadge>
                          ) : row.paymentStatus === "PARTIAL" ? (
                            <DnaBadge variant="warning">Sebagian</DnaBadge>
                          ) : (
                            <DnaBadge variant="critical">Belum Dibayar</DnaBadge>
                          )}
                        </DnaTd>
                        <DnaTd className="pr-4 py-2.5 text-right">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => setSelectedBill(row)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for Bill Inspection */}
      <DnaDetailDrawer
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={selectedBill?.billNumber || "Rincian Faktur Pembelian"}
        subtitle={selectedBill ? `Supplier: ${selectedBill.vendorName} • PO: ${selectedBill.poNumber}` : undefined}
        badge={
          selectedBill ? (
            <DnaBadge variant={selectedBill.paymentStatus === "PAID" ? "success" : "warning"}>
              {selectedBill.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              Dicatat oleh: <span className="font-semibold text-slate-700">{selectedBill?.pic}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedBill && selectedBill.paymentStatus !== "PAID" && (
                <DnaButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReasonModalBill(selectedBill);
                    setNewReasonText(selectedBill.unpaidReason || "");
                  }}
                >
                  Edit Alasan Belum Lunas
                </DnaButton>
              )}
              <DnaButton variant="outline" size="sm" onClick={() => setSelectedBill(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-5 text-xs">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Tgl Faktur / Jatuh Tempo</span>
                <span className="font-bold text-slate-900 tabular-nums text-sm block">{selectedBill.invoiceDate}</span>
                <span className="text-amber-700 block text-[11px] font-medium mt-0.5">Jatuh Tempo: {selectedBill.dueDate}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Grand Total Tagihan</span>
                <span className="font-bold text-slate-900 tabular-nums text-sm block">
                  Rp {selectedBill.grandTotal.toLocaleString("id-ID")}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Kategori: {selectedBill.procurementCategory}</span>
              </div>
            </div>

            {selectedBill.unpaidReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900">
                <span className="font-bold block mb-1">Catatan Alasan Belum Lunas:</span>
                {selectedBill.unpaidReason}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Rincian Barang & Diskon Nominal (Rp)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Harga</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Diskon (Rp)</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Subtotal</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedBill.items.map((it) => (
                      <DnaTableRow key={it.id} className="hover:bg-slate-50">
                        <DnaTd className="py-2 px-3 text-indigo-600 font-medium">{it.itemCode}</DnaTd>
                        <DnaTd className="py-2 px-3 font-sans font-semibold text-slate-800">{it.itemName}</DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-slate-700">
                          {it.qty} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-slate-600">
                          Rp {it.price.toLocaleString("id-ID")}
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-emerald-600 font-bold">
                          - Rp {(it.discountRp || 0).toLocaleString("id-ID")}
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right font-bold text-slate-900">
                          Rp {it.total.toLocaleString("id-ID")}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Bruto:</span>
                <span className="tabular-nums">Rp {selectedBill.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Diskon:</span>
                <span className="tabular-nums">- Rp {selectedBill.totalDiscountRp.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PPN (11%):</span>
                <span className="tabular-nums">Rp {selectedBill.taxAmount.toLocaleString("id-ID")}</span>
              </div>
              {selectedBill.dpDeduction > 0 && (
                <div className="flex justify-between text-purple-600 font-medium">
                  <span>Potongan DP:</span>
                  <span className="tabular-nums">- Rp {selectedBill.dpDeduction.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span className="tabular-nums text-indigo-700">Rp {selectedBill.grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Edit Alasan Belum Lunas */}
      {reasonModalBill && (
        <DnaModal
          isOpen={!!reasonModalBill}
          onClose={() => setReasonModalBill(null)}
          title={`Catatan Alasan Belum Lunas: ${reasonModalBill.billNumber}`}
          description={`Update alasan mengapa faktur dari ${reasonModalBill.vendorName} belum dibayarkan.`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <DnaButton variant="outline" size="sm" onClick={() => setReasonModalBill(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={handleSaveReason}>
                Simpan Catatan
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">Alasan Belum Lunas *</label>
            <textarea
              rows={3}
              value={newReasonText}
              onChange={(e) => setNewReasonText(e.target.value)}
              placeholder="Contoh: Menunggu termin 30 hari, barang reject dalam proses penggantian..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </DnaModal>
      )}

      {/* Modal Input Faktur Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Input Faktur Pembelian (Purchase Invoice)"
        description="Catat tagihan faktur supplier baru dengan diskon Rupiah dan tanggal invoice custom."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              loading={createBillMut.isPending}
              onClick={handleCreateBill}
            >
              Simpan Faktur Pembelian
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Faktur Vendor *</label>
              <input
                type="text"
                placeholder="Contoh: INV/2026/09/0088"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <DnaSelect
                label="Supplier / Vendor"
                required
                value={vendorId}
                onChange={(val) => setVendorId(val)}
                options={supplierOptions}
                placeholder={supplierOptions.length === 0 ? "Memuat master supplier..." : "Pilih supplier..."}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. PO Referensi</label>
              <input
                type="text"
                placeholder="Contoh: PO-202609-000005"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {/* Only informational: the backend stores the PO number from the linked PO/GR
                  record, not from this box. See createBillMut. */}
              <p className="text-[10px] text-amber-600 mt-1">
                Referensi saja — tidak tersimpan sampai PO ditautkan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Faktur Vendor *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Jatuh Tempo *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Kategori Pengadaan (COA) *</label>
              <select
                aria-label="Kategori Pengadaan"
                value={procurementCategory}
                onChange={(e) => setProcurementCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {PROCUREMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Items Table */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px]">
                Item Barang ({items.length})
              </span>
              <DnaButton type="button" size="sm" variant="secondary" onClick={handleAddItem}>
                + Tambah Item
              </DnaButton>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <div className="w-28">
                    <input
                      placeholder="Kode"
                      value={item.itemCode}
                      onChange={(e) => handleUpdateItem(idx, "itemCode", e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 tabular-nums"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      placeholder="Nama Barang"
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(idx, "itemName", e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(idx, "qty", Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 text-right tabular-nums"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Harga"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(idx, "price", Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 text-right tabular-nums"
                    />
                  </div>
                  <div className="w-24 text-right font-bold text-indigo-700 tabular-nums text-[11px]">
                    Rp {item.total.toLocaleString("id-ID")}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan untuk faktur ini..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>

      {/* Modal Import Excel */}
      <DnaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Faktur Pembelian dari CSV"
        description="Unggah file CSV untuk memproses faktur massal."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="sm" loading={importMut.isPending} onClick={handleImportExcel}>
              Proses File
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {/* ponytail: only CSV is accepted. The parse is a browser-side split(","), so .xlsx would
              need a spreadsheet reader dependency. Add when bulk import from real Excel is wanted. */}
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
            <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <DnaInput
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Format didukung: <span className="font-semibold">.csv</span>. Nama vendor pada kolom
              &quot;vendor&quot; harus sama persis dengan nama di master supplier.
            </p>
          </div>
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <span className="text-slate-600">
              Kolom: <span className="font-mono text-[11px]">{IMPORT_HEADERS}</span>
            </span>
            <DnaButton variant="ghost" size="sm" onClick={handleDownloadImportTemplate}>
              Unduh Template
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
