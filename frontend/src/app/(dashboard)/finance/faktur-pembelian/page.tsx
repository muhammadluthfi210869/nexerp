"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaBadge,
  DnaButton,
  DnaModal,
  DnaPagination,
  DnaColumnFilter,
  ColumnOption,
  DnaInput,
} from "@/components/dna";
import {
  FileSpreadsheet,
  Plus,
  Eye,
  CreditCard,
  Upload,
  Calendar,
  Filter,
  Save,
  Trash2,
  FileText,
  DollarSign,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export interface BillItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discount: number; // Diskon nominal
  total: number;
  rejectQty?: number; // Qty barang reject (exclude from payment)
}

export interface PurchaseBillItem {
  id: string;
  billNumber: string;
  poNumber: string;
  vendorName: string;
  procurementCategory: string; // Kategori pengadaan riil / COA
  invoiceDate: string; // Tanggal invoice custom
  dueDate: string;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  unpaidReason?: string; // Alasan belum dibayar
  notes?: string;
  items: BillItemDetail[];
  pic: string;
}

const INITIAL_BILLS_DATA: PurchaseBillItem[] = [
  {
    id: "b-1",
    billNumber: "FP-202609-000001",
    poNumber: "PO-202608-000033",
    vendorName: "Marga Duwi Kencana",
    procurementCategory: "Bahan Baku (11510)",
    invoiceDate: "2026-08-31",
    dueDate: "2026-09-30",
    subtotal: 1508750.00,
    totalDiscount: 50000.00,
    taxAmount: 160462.50,
    grandTotal: 1619212.50,
    paidAmount: 0.00,
    paymentStatus: "UNPAID",
    unpaidReason: "Menunggu termin jatuh tempo 30 hari sesuai kesepakatan PO.",
    notes: "Pengadaan bahan aktif pelembab batch September.",
    pic: "Mega Utami",
    items: [
      {
        id: "bi-1",
        itemCode: "BBK00028",
        itemName: "Super Moisturing Max",
        qty: 1000,
        unit: "gr",
        price: 1508.75,
        discount: 50000.00,
        total: 1458750.00,
        rejectQty: 50
      }
    ]
  },
  {
    id: "b-2",
    billNumber: "FP-202609-000002",
    poNumber: "PO-202608-000030",
    vendorName: "Multi Kemas Plasindo",
    procurementCategory: "Bahan Kemasan (11520)",
    invoiceDate: "2026-08-28",
    dueDate: "2026-09-28",
    subtotal: 12500000.00,
    totalDiscount: 250000.00,
    taxAmount: 1347500.00,
    grandTotal: 13597500.00,
    paidAmount: 13597500.00,
    paymentStatus: "PAID",
    notes: "Botol dropper 20ml amber gold foil (Lunas via Transfer BCA).",
    pic: "Dewi Sartika",
    items: [
      {
        id: "bi-2",
        itemCode: "KMS00015",
        itemName: "Botol Dropper 20ml Amber Gold",
        qty: 5000,
        unit: "pcs",
        price: 2500.00,
        discount: 250000.00,
        total: 12250000.00
      }
    ]
  },
  {
    id: "b-3",
    billNumber: "FP-202609-000003",
    poNumber: "PO-202608-000032",
    vendorName: "Marga Duwi Kencana",
    procurementCategory: "Bahan Baku (11510)",
    invoiceDate: "2026-08-31",
    dueDate: "2026-09-15",
    subtotal: 2150000.00,
    totalDiscount: 0.00,
    taxAmount: 236500.00,
    grandTotal: 2386500.00,
    paidAmount: 0.00,
    paymentStatus: "UNPAID",
    unpaidReason: "Dokumen faktur pajak fisik belum diterima dari supplier.",
    notes: "Niacinamide PC Grade kosmetik.",
    pic: "Mega Utami",
    items: [
      {
        id: "bi-3",
        itemCode: "BBK00012",
        itemName: "Niacinamide PC Grade",
        qty: 5000,
        unit: "gr",
        price: 430.00,
        discount: 0.00,
        total: 2150000.00
      }
    ]
  }
];

export default function PurchaseBillsPage() {
  const [bills, setBills] = useState<PurchaseBillItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedBill, setSelectedBill] = useState<PurchaseBillItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Load / Save localStorage
  useEffect(() => {
    const saved = localStorage.getItem("NEXERP_PURCHASE_BILLS");
    if (saved) {
      try {
        setBills(JSON.parse(saved));
        return;
      } catch (e) {
        // ignore
      }
    }
    setBills(INITIAL_BILLS_DATA);
    localStorage.setItem("NEXERP_PURCHASE_BILLS", JSON.stringify(INITIAL_BILLS_DATA));
  }, []);

  const saveBills = (updated: PurchaseBillItem[]) => {
    setBills(updated);
    localStorage.setItem("NEXERP_PURCHASE_BILLS", JSON.stringify(updated));
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // KPIs
  const totalBillsCount = bills.length;
  const paidCount = bills.filter((b) => b.paymentStatus === "PAID").length;
  const unpaidCount = bills.filter((b) => b.paymentStatus === "UNPAID").length;
  const totalUnpaidNominal = bills
    .filter((b) => b.paymentStatus === "UNPAID")
    .reduce((acc, cur) => acc + (cur.grandTotal - cur.paidAmount), 0);

  // Column filter & sorting
  const [filterColumn, setFilterColumn] = useState("paymentStatus");
  const [columnFilterVal, setColumnFilterVal] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const billColumnOptions: ColumnOption[] = useMemo(() => [
    {
      id: "paymentStatus",
      label: "Status Bayar",
      type: "category",
      categoryOptions: [
        { label: "Lunas (PAID)", value: "PAID" },
        { label: "Belum Bayar (UNPAID)", value: "UNPAID" },
      ],
    },
    {
      id: "procurementCategory",
      label: "Kategori Pengadaan",
      type: "category",
      categoryOptions: [
        { label: "Bahan Baku (11510)", value: "Bahan Baku (11510)" },
        { label: "Bahan Kemasan (11520)", value: "Bahan Kemasan (11520)" },
      ],
    },
    {
      id: "pic",
      label: "PIC",
      type: "category",
      categoryOptions: [
        { label: "Mega Utami", value: "Mega Utami" },
        { label: "Dewi Sartika", value: "Dewi Sartika" },
      ],
    },
    {
      id: "billNumber",
      label: "No. Faktur",
      type: "sort",
    },
    {
      id: "vendorName",
      label: "Supplier / Vendor",
      type: "sort",
    },
    {
      id: "grandTotal",
      label: "Total Tagihan",
      type: "sort",
    },
    {
      id: "invoiceDate",
      label: "Tgl Faktur",
      type: "sort",
    },
    {
      id: "dueDate",
      label: "Jatuh Tempo",
      type: "sort",
    },
  ], []);

  const handleSort = (key: string) => {
    setSortConfig((curr) => {
      if (curr?.key === key) {
        if (curr.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setFilterColumn("paymentStatus");
    setColumnFilterVal("ALL");
    setSortConfig(null);
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  // Filtered & Paginated
  const filtered = useMemo(() => {
    let list = bills.filter((b) => {
      if (activeTab === "PAID" && b.paymentStatus !== "PAID") return false;
      if (activeTab === "UNPAID" && b.paymentStatus !== "UNPAID") return false;

      const q = searchQuery.toLowerCase();
      const matchSearch =
        b.billNumber.toLowerCase().includes(q) ||
        b.vendorName.toLowerCase().includes(q) ||
        b.poNumber.toLowerCase().includes(q) ||
        b.procurementCategory.toLowerCase().includes(q) ||
        (b.pic || "").toLowerCase().includes(q);

      let matchColumn = true;
      if (columnFilterVal && columnFilterVal !== "ALL") {
        if (filterColumn === "paymentStatus") {
          matchColumn = b.paymentStatus === columnFilterVal;
        } else if (filterColumn === "procurementCategory") {
          matchColumn = b.procurementCategory === columnFilterVal;
        } else if (filterColumn === "pic") {
          matchColumn = (b.pic || "Finance AP") === columnFilterVal;
        }
      }

      return matchSearch && matchColumn;
    });

    if (sortConfig) {
      list = [...list].sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof PurchaseBillItem] ?? "";
        let bVal: any = b[sortConfig.key as keyof PurchaseBillItem] ?? "";
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return list;
  }, [bills, activeTab, searchQuery, filterColumn, columnFilterVal, sortConfig]);

  const isFilterActive = searchQuery || (columnFilterVal && columnFilterVal !== "ALL") || sortConfig !== null || activeTab !== "ALL";

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filtered.slice(start, start + entriesPerPage);
  }, [filtered, currentPage, entriesPerPage]);

  const handleOpenDetail = (bill: PurchaseBillItem) => {
    setSelectedBill(bill);
    setIsDetailOpen(true);
  };

  const handleUpdateUnpaidReason = (id: string, currentReason?: string) => {
    const reason = prompt("Masukkan / Edit Alasan Belum Dibayar:", currentReason || "");
    if (reason === null) return;

    const updated = bills.map((b) => (b.id === id ? { ...b, unpaidReason: reason } : b));
    saveBills(updated);
    if (selectedBill && selectedBill.id === id) {
      setSelectedBill({ ...selectedBill, unpaidReason: reason });
    }
    toast.success("Catatan alasan belum dibayar berhasil diperbarui.");
  };

  const navTabs = [
    { id: "ALL", label: "Semua Tagihan", count: bills.length },
    { id: "UNPAID", label: "Belum Dibayar", count: unpaidCount },
    { id: "PAID", label: "Sudah Lunas", count: paidCount },
  ];

  return (
    <DnaPageContainer>
      {/* 1. Standard Visual DNA Page Header */}
      <DnaPageHeader
        title="FAKTUR PEMBELIAN"
        badge={<DnaBadge status="info">HUTANG USAHA</DnaBadge>}
        subtitle="Pencatatan tagihan masuk vendor, pemantauan status pembayaran, dan rincian diskon pengadaan."
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setIsImportOpen(true)}
            >
              Import Faktur (Excel)
            </DnaButton>
          </div>
        }
      />

      {/* 2. Visual DNA KPI Grid */}
      <DnaKpiGrid>
        <KpiCard
          label="Total Faktur Tagihan"
          value={totalBillsCount}
          subtext="Seluruh faktur pengadaan"
          variant="blue"
          icon={<FileText className="w-4 h-4" />}
        />
        <KpiCard
          label="Tagihan Belum Dibayar"
          value={unpaidCount}
          subtext="Menunggu jadwal pembayaran"
          variant="rose"
          icon={<Clock className="w-4 h-4" />}
        />
        <KpiCard
          label="Tagihan Sudah Lunas"
          value={paidCount}
          subtext="Selesai dibayar kas/bank"
          variant="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <KpiCard
          label="Total Saldo Hutang"
          value={`Rp ${formatRupiah(totalUnpaidNominal).split(",")[0]}`}
          subtext="Total kewajiban terbuka"
          variant="amber"
          icon={<DollarSign className="w-4 h-4" />}
        />
      </DnaKpiGrid>

      {/* 3. Sub-Navbar Tabs: Semua Tagihan | Sudah Dibayar | Belum Dibayar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-blue-700/80 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Table with custom invoice date, procurement category, discount & unpaid reason */}
      <TableWrapper
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari faktur, supplier, PO..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
            <DnaColumnFilter
              columns={billColumnOptions}
              selectedColumnId={filterColumn}
              filterValue={columnFilterVal}
              onColumnChange={(col) => {
                setFilterColumn(col);
                const colDef = billColumnOptions.find((c) => c.id === col);
                if (colDef?.type === "sort") {
                  setColumnFilterVal("asc");
                  setSortConfig({ key: col, direction: "asc" });
                } else {
                  setColumnFilterVal("ALL");
                }
                setCurrentPage(1);
              }}
              onValueChange={(val) => {
                setColumnFilterVal(val);
                const colDef = billColumnOptions.find((c) => c.id === filterColumn);
                if (colDef?.type === "sort") {
                  if (val === "asc" || val === "desc") {
                    setSortConfig({ key: filterColumn, direction: val });
                  } else {
                    setSortConfig(null);
                  }
                }
                setCurrentPage(1);
              }}
            />
            {isFilterActive && (
              <DnaButton
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
              >
                Reset Filter
              </DnaButton>
            )}
          </div>
        }
        pagination={
          <DnaPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={entriesPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(ps) => {
              setEntriesPerPage(ps);
              setCurrentPage(1);
            }}
          />
        }
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh align="center" className="w-10">#</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "billNumber" ? sortConfig.direction : undefined} onSort={() => handleSort("billNumber")}>NO. FAKTUR</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "invoiceDate" ? sortConfig.direction : undefined} onSort={() => handleSort("invoiceDate")}>TGL FAKTUR</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "dueDate" ? sortConfig.direction : undefined} onSort={() => handleSort("dueDate")}>JATUH TEMPO</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "vendorName" ? sortConfig.direction : undefined} onSort={() => handleSort("vendorName")}>SUPPLIER / VENDOR</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "procurementCategory" ? sortConfig.direction : undefined} onSort={() => handleSort("procurementCategory")}>KATEGORI COA</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "pic" ? sortConfig.direction : undefined} onSort={() => handleSort("pic")}>PIC</DnaTh>
              <DnaTh align="right">DISKON</DnaTh>
              <DnaTh align="right" sortable sortDirection={sortConfig?.key === "grandTotal" ? sortConfig.direction : undefined} onSort={() => handleSort("grandTotal")}>TOTAL TAGIHAN</DnaTh>
              <DnaTh align="center" sortable sortDirection={sortConfig?.key === "paymentStatus" ? sortConfig.direction : undefined} onSort={() => handleSort("paymentStatus")}>STATUS BAYAR</DnaTh>
              <DnaTh>ALASAN BELUM BAYAR</DnaTh>
              <DnaTh align="right">AKSI</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                  Tidak ada data faktur pembelian.
                </td>
              </tr>
            ) : (
              paginated.map((b, idx) => {
                const rowNum = (currentPage - 1) * entriesPerPage + idx + 1;
                const staffPic = b.pic || "Mega Utami";
                return (
                  <DnaTableRow key={b.id}>
                    <DnaTd align="center" className="font-mono text-slate-400 text-xs tabular-nums">
                      {rowNum}
                    </DnaTd>
                    <DnaTdCode code={b.billNumber} onClick={() => handleOpenDetail(b)} />
                    <DnaTd className="text-xs whitespace-nowrap text-slate-600 dark:text-slate-400 tabular-nums">
                      {b.invoiceDate}
                    </DnaTd>
                    <DnaTd className="text-xs whitespace-nowrap text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                      {b.dueDate}
                    </DnaTd>
                    <DnaTd className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {b.vendorName}
                    </DnaTd>
                    <DnaTd className="text-xs text-slate-600 dark:text-slate-400">
                      {b.procurementCategory}
                    </DnaTd>
                    {/* Kolom PIC */}
                    <DnaTd>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {staffPic.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {staffPic}
                        </span>
                      </div>
                    </DnaTd>
                    <DnaTdNumber className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono tabular-nums">
                      {b.totalDiscount > 0 ? `Rp ${formatRupiah(b.totalDiscount)}` : "-"}
                    </DnaTdNumber>
                    <DnaTdNumber className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
                      Rp {formatRupiah(b.grandTotal)}
                    </DnaTdNumber>
                    <DnaTd align="center">
                      {b.paymentStatus === "PAID" ? (
                        <DnaBadge status="success">LUNAS</DnaBadge>
                      ) : (
                        <DnaBadge status="critical">BELUM BAYAR</DnaBadge>
                      )}
                    </DnaTd>
                    <DnaTd>
                      {b.paymentStatus === "UNPAID" ? (
                        <div
                          onClick={() => handleUpdateUnpaidReason(b.id, b.unpaidReason)}
                          className="cursor-pointer group flex items-center gap-1 max-w-xs"
                          title="Klik untuk edit alasan"
                        >
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {b.unpaidReason || "Klik untuk isi alasan..."}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </DnaTd>
                    <DnaTd align="right">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenDetail(b)}
                      >
                        Detail
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      {/* 5. Detail Modal (DnaModal) with Purchased Items Table + Discount Column */}
      {selectedBill && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Detail Faktur Pembelian"
          subtitle="Rincian tagihan vendor dan jadwal termin"
          badge={<DnaBadge status="info">{selectedBill.billNumber}</DnaBadge>}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <DnaButton
                variant="outline"
                type="button"
                onClick={() => setIsDetailOpen(false)}
              >
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-5">
            {/* 2-Column Info */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0c1322] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">No. Faktur</span>
                  <span className="w-3">:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{selectedBill.billNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">No. Purchase Order</span>
                  <span className="w-3">:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedBill.poNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">Supplier</span>
                  <span className="w-3">:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBill.vendorName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">Kategori COA</span>
                  <span className="w-3">:</span>
                  <span>{selectedBill.procurementCategory}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">Tanggal Faktur</span>
                  <span className="w-3">:</span>
                  <span>{selectedBill.invoiceDate}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">Jatuh Tempo</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedBill.dueDate}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 font-bold text-slate-900 dark:text-slate-100">Status Bayar</span>
                  <span className="w-3">:</span>
                  <span>
                    {selectedBill.paymentStatus === "PAID" ? (
                      <DnaBadge status="success">LUNAS</DnaBadge>
                    ) : (
                      <DnaBadge status="critical">BELUM BAYAR</DnaBadge>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Alasan Belum Dibayar Banner */}
            {selectedBill.paymentStatus === "UNPAID" && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">Alasan Belum Dibayar:</span>
                  <span className="text-rose-800 dark:text-rose-400">{selectedBill.unpaidReason || "Belum ada alasan tercatat."}</span>
                </div>
                <DnaButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateUnpaidReason(selectedBill.id, selectedBill.unpaidReason)}
                >
                  Edit Alasan
                </DnaButton>
              </div>
            )}

            {/* Detail Items Purchased Table + Diskon */}
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Rincian Barang & Diskon Pembelian
              </div>

              <TableWrapper>
                <DnaTable>
                  <DnaTableHead>
                    <tr>
                      <DnaTh align="center" className="w-10">#</DnaTh>
                      <DnaTh>KODE & NAMA BARANG</DnaTh>
                      <DnaTh align="right">QTY</DnaTh>
                      <DnaTh align="right">HARGA SATUAN</DnaTh>
                      <DnaTh align="right">DISKON</DnaTh>
                      <DnaTh align="right">SUBTOTAL</DnaTh>
                    </tr>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedBill.items.map((it, idx) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd align="center" className="font-mono text-slate-400 text-xs tabular-nums">
                          {idx + 1}
                        </DnaTd>
                        <DnaTd>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block font-mono text-xs">{it.itemCode}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{it.itemName}</span>
                        </DnaTd>
                        <DnaTdNumber className="font-medium font-mono text-xs tabular-nums">
                          {it.qty.toLocaleString("id-ID")} {it.unit}
                        </DnaTdNumber>
                        <DnaTdNumber className="font-mono text-xs tabular-nums">
                          Rp {formatRupiah(it.price)}
                        </DnaTdNumber>
                        <DnaTdNumber className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs tabular-nums">
                          {it.discount > 0 ? `-Rp ${formatRupiah(it.discount)}` : "-"}
                        </DnaTdNumber>
                        <DnaTdNumber className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs tabular-nums">
                          Rp {formatRupiah(it.total)}
                        </DnaTdNumber>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </TableWrapper>
              
              <div className="p-3.5 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs mt-3">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp {formatRupiah(selectedBill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Total Diskon:</span>
                  <span className="font-semibold font-mono">-Rp {formatRupiah(selectedBill.totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>PPN (11.00%):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp {formatRupiah(selectedBill.taxAmount)}</span>
                </div>
                {selectedBill.items.some(i => (i.rejectQty || 0) > 0) && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Exclude Reject:</span>
                    <span className="font-semibold font-mono">
                      {selectedBill.items.filter(i => (i.rejectQty || 0) > 0).map(i => `${i.rejectQty} ${i.unit} ${i.itemName}`).join('; ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">Rp {formatRupiah(selectedBill.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* 6. Import Excel Modal (DnaModal) */}
      <DnaModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Faktur Pembelian (Excel)"
        subtitle="Unggah berkas Excel (.xlsx / .csv) untuk impor tagihan faktur pembelian massal"
        badge={<DnaBadge status="info">IMPORT</DnaBadge>}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton
              variant="outline"
              type="button"
              onClick={() => setIsImportOpen(false)}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              type="button"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => {
                toast.success("Berhasil mengimpor 3 faktur pembelian dari file Excel.");
                setIsImportOpen(false);
              }}
            >
              Mulai Import
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50 dark:bg-[#0c1322] hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">Klik untuk pilih file Excel atau drag & drop di sini</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Format yang didukung: .XLSX, .XLS, .CSV (Maksimal 10MB)</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              id="faktur-import-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target?.result as string;
                  if (!text) return;
                  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                  if (lines.length <= 1) { toast.error("File tidak memiliki data."); return; }
                  const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
                  const parsed = lines.slice(1).map((line, idx) => {
                    const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
                    return {
                      id: `imp-${Date.now()}-${idx}`,
                      billNumber: cols[headers.indexOf("no faktur")] || cols[0] || `FP-IMP-${String(idx+1).padStart(6,'0')}`,
                      poNumber: cols[headers.indexOf("no po")] || cols[1] || "",
                      vendorName: cols[headers.indexOf("vendor")] || cols[2] || "Vendor Impor",
                      procurementCategory: cols[headers.indexOf("kategori coa")] || cols[3] || "Bahan Baku (11510)",
                      invoiceDate: cols[headers.indexOf("tgl faktur")] || cols[4] || new Date().toISOString().split('T')[0],
                      dueDate: cols[headers.indexOf("jatuh tempo")] || cols[5] || "",
                      subtotal: Number(cols[headers.indexOf("subtotal")] || cols[6] || 0),
                      totalDiscount: Number(cols[headers.indexOf("diskon")] || cols[7] || 0),
                      taxAmount: Number(cols[headers.indexOf("pajak")] || cols[8] || 0),
                      grandTotal: Number(cols[headers.indexOf("grand total")] || cols[9] || 0),
                      paidAmount: 0,
                      paymentStatus: "UNPAID" as const,
                      pic: cols[headers.indexOf("pic")] || cols[10] || "Finance",
                      items: []
                    };
                  });
                  const newBills = [...parsed, ...bills];
                  saveBills(newBills);
                  toast.success(`${parsed.length} faktur berhasil diimpor dari file Excel.`);
                  setIsImportOpen(false);
                  (document.getElementById('faktur-import-file') as HTMLInputElement).value = '';
                };
                reader.readAsText(file);
              }}
            />
            <label htmlFor="faktur-import-file" className="cursor-pointer block mt-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Pilih File Excel
              </span>
            </label>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-900 dark:text-blue-300 space-y-1">
            <p className="font-bold">Kolom Template Excel:</p>
            <p className="text-[11px] font-mono">No Faktur | No PO | Vendor | Kategori COA | Tgl Faktur | Jatuh Tempo | Subtotal | Diskon | Pajak | Grand Total | PIC</p>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
