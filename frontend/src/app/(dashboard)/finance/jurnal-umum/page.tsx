"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  TableWrapper,
  DNA_TABLE_CLASSES,
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
  DnaEmptyState,
  CoaSelect,
  DnaColumnFilter,
  ColumnOption,
  DnaInput,
} from "@/components/dna";
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Printer,
  Calendar,
  Filter,
  Save,
  Trash2,
  CheckCircle2,
  X,
  Search,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface JournalLine {
  id: string;
  coaCode: string;
  coaName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  code: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  type: string;
  reference: string;
  creator: string;
  status: "Aktif" | "Draf";
  lines: JournalLine[];
}

const INITIAL_COA_LIST = [
  { code: "1110", name: "Kas Besar" },
  { code: "1111", name: "Kas Kecil" },
  { code: "1121", name: "Bank BCA" },
  { code: "1122", name: "Bank Mandiri" },
  { code: "1131", name: "Piutang Usaha Maklon" },
  { code: "1132", name: "Piutang Usaha Kosmetik" },
  { code: "1151", name: "Persediaan Bahan Baku" },
  { code: "1152", name: "Persediaan Bahan Kemas" },
  { code: "1153", name: "Persediaan Barang Dalam Proses" },
  { code: "1154", name: "Persediaan Barang Jadi" },
  { code: "2101", name: "Hutang Usaha" },
  { code: "2102", name: "Uang Muka Penjualan" },
  { code: "4101", name: "Pendapatan Jasa Maklon" },
  { code: "4102", name: "Penjualan Kosmetik" },
  { code: "5101", name: "Beban Pokok Pendapatan" },
  { code: "6101", name: "Beban Iklan & Promosi" },
  { code: "6211", name: "Beban Gaji Karyawan" },
  { code: "6218", name: "Beban Listrik Kantor" },
];

const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: "1",
    code: "GL-202609-000023",
    date: "2026-09-04",
    description: "Invoice Sample - SS-202609-000009",
    debit: 1000000.00,
    credit: 1000000.00,
    type: "Sales Sample Invoice",
    reference: "SSI-202609-000009",
    creator: "Fadilah Syahab",
    status: "Aktif",
    lines: [
      { id: "l-1", coaCode: "1132", coaName: "Piutang Usaha Kosmetik", description: "Piutang dagang sample", debit: 1000000.00, credit: 0 },
      { id: "l-2", coaCode: "4101", coaName: "Pendapatan Jasa Maklon", description: "Penjualan Sample - Organic Extract Deodorant (PRIO)", debit: 0, credit: 1000000.00 }
    ]
  },
  {
    id: "2",
    code: "GL-202609-000024",
    date: "2026-09-04",
    description: "Penerimaan barang - PO-202608-000023",
    debit: 1280000.00,
    credit: 1280000.00,
    type: "Good Receipt",
    reference: "GR-202609-000007",
    creator: "Achmad Bagir",
    status: "Aktif",
    lines: [
      { id: "l-3", coaCode: "1151", coaName: "Persediaan Bahan Baku", description: "Bahan Aktif Skincare", debit: 1280000.00, credit: 0 },
      { id: "l-4", coaCode: "2101", coaName: "Hutang Usaha", description: "Hutang supplier PT Bahan Makmur", debit: 0, credit: 1280000.00 }
    ]
  },
  {
    id: "3",
    code: "GL-202609-000011",
    date: "2026-09-03",
    description: "Penerimaan barang - PO-202608-000030",
    debit: 825000.00,
    credit: 825000.00,
    type: "Good Receipt",
    reference: "GR-202609-000006",
    creator: "Achmad Bagir",
    status: "Aktif",
    lines: [
      { id: "l-5", coaCode: "1152", coaName: "Persediaan Bahan Kemas", description: "Botol Dropper 20ml", debit: 825000.00, credit: 0 },
      { id: "l-6", coaCode: "2101", coaName: "Hutang Usaha", description: "Hutang supplier kemasan", debit: 0, credit: 825000.00 }
    ]
  },
  {
    id: "4",
    code: "GL-202609-000012",
    date: "2026-09-03",
    description: "Stock Opname - STO-202609-000002",
    debit: 289940.00,
    credit: 289940.00,
    type: "Stock Opname",
    reference: "STO-202609-000002",
    creator: "Ghufron Dreamlab",
    status: "Aktif",
    lines: [
      { id: "l-7", coaCode: "5101", coaName: "Beban Pokok Pendapatan", description: "Penyesuaian stok opname", debit: 289940.00, credit: 0 },
      { id: "l-8", coaCode: "1151", coaName: "Persediaan Bahan Baku", description: "Koreksi selisih fisik", debit: 0, credit: 289940.00 }
    ]
  },
  {
    id: "5",
    code: "GL-202609-000013",
    date: "2026-09-03",
    description: "Produksi mixing - PM-202609-000001",
    debit: 222967.65,
    credit: 222967.65,
    type: "Production Mixing",
    reference: "PM-202609-000001",
    creator: "Zaki Produksi",
    status: "Aktif",
    lines: [
      { id: "l-9", coaCode: "1154", coaName: "Persediaan Barang Jadi", description: "Hasil mixing batch 001", debit: 222967.65, credit: 0 },
      { id: "l-10", coaCode: "1151", coaName: "Persediaan Bahan Baku", description: "Bahan terpakai mixing", debit: 0, credit: 222967.65 }
    ]
  },
  {
    id: "6",
    code: "GL-202609-000014",
    date: "2026-09-03",
    description: "Produksi mixing - PM-202609-000002",
    debit: 513905.33,
    credit: 513905.33,
    type: "Production Mixing",
    reference: "PM-202609-000002",
    creator: "Zaki Produksi",
    status: "Aktif",
    lines: [
      { id: "l-11", coaCode: "1154", coaName: "Persediaan Barang Jadi", description: "Hasil mixing batch 002", debit: 513905.33, credit: 0 },
      { id: "l-12", coaCode: "1151", coaName: "Persediaan Bahan Baku", description: "Bahan terpakai mixing", debit: 0, credit: 513905.33 }
    ]
  },
  {
    id: "7",
    code: "GL-202609-000015",
    date: "2026-09-03",
    description: "Invoice Sample - SS-202609-000004",
    debit: 250000.00,
    credit: 250000.00,
    type: "Sales Sample Invoice",
    reference: "SSI-202609-000004",
    creator: "Fadilah Syahab",
    status: "Aktif",
    lines: [
      { id: "l-13", coaCode: "1132", coaName: "Piutang Usaha Kosmetik", description: "Sample Serum Acne", debit: 250000.00, credit: 0 },
      { id: "l-14", coaCode: "4101", coaName: "Pendapatan Jasa Maklon", description: "Sample Formula Lab", debit: 0, credit: 250000.00 }
    ]
  }
];

export default function GeneralJournalPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // COA List state from backend
  const [coaList, setCoaList] = useState(INITIAL_COA_LIST);

  // Detail Modal State
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Manual Journal",
    reference: "",
    description: "",
    lines: [
      { id: "1", coaCode: "1121", description: "", debit: 0, credit: 0 },
      { id: "2", coaCode: "4102", description: "", debit: 0, credit: 0 }
    ]
  });

  // Authoritative Backend Synchronization (FIN-001 Remediation)
  useEffect(() => {
    let mounted = true;
    async function loadAuthoritativeJournals() {
      try {
        // 1. Fetch COA Accounts from backend
        const accRes = await api.get("/finance/accounts");
        if (mounted && Array.isArray(accRes.data) && accRes.data.length > 0) {
          const mappedAccounts = accRes.data.map((a: any) => ({
            id: a.id,
            code: a.code,
            name: a.name,
          }));
          setCoaList(mappedAccounts);
        }

        // 2. Fetch authoritative Journals from backend
        const jrnRes = await api.get("/finance/journals");
        if (mounted && Array.isArray(jrnRes.data) && jrnRes.data.length > 0) {
          const mappedJournals: JournalEntry[] = jrnRes.data.map((j: any) => {
            const lines: JournalLine[] = (j.lines || []).map((l: any) => ({
              id: l.id,
              coaCode: l.account?.code || "11111",
              coaName: l.account?.name || "Akun Perkiraan",
              description: j.description || "",
              debit: Number(l.debit || 0),
              credit: Number(l.credit || 0),
            }));
            const deb = lines.reduce((s, l) => s + l.debit, 0);
            const cred = lines.reduce((s, l) => s + l.credit, 0);

            return {
              id: j.id,
              code: j.reference || `JRN-${j.id.slice(0, 8).toUpperCase()}`,
              date: j.date ? j.date.split("T")[0] : new Date().toISOString().split("T")[0],
              description: j.description || "General Journal Entry",
              debit: deb,
              credit: cred,
              type: j.sourceDocumentType || "Manual Journal",
              reference: j.reference || "-",
              creator: "System Accounting",
              status: "Aktif",
              lines,
            };
          });
          setJournals(mappedJournals);
          return;
        }
      } catch (err) {
        console.warn("[FINANCE_JOURNAL] Backend fetch fallback to initial data:", err);
      }

      // Local initial data fallback if empty
      const saved = localStorage.getItem("NEXERP_GENERAL_JOURNALS");
      if (saved) {
        try {
          setJournals(JSON.parse(saved));
          return;
        } catch (e) {}
      }
      setJournals(INITIAL_JOURNALS);
    }

    loadAuthoritativeJournals();
    return () => {
      mounted = false;
    };
  }, []);

  const saveJournals = (updated: JournalEntry[]) => {
    setJournals(updated);
  };

  // KPIs
  const totalEntries = journals.length;
  const totalDebit = journals.reduce((acc, cur) => acc + cur.debit, 0);
  const totalCredit = journals.reduce((acc, cur) => acc + cur.credit, 0);
  const isAllBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Column filter and sorting state
  const [filterColumn, setFilterColumn] = useState("type");
  const [columnFilterVal, setColumnFilterVal] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const journalColumnOptions: ColumnOption[] = useMemo(() => [
    {
      id: "type",
      label: "Tipe Jurnal",
      type: "category",
      categoryOptions: [
        { label: "Sales Sample Invoice", value: "Sales Sample Invoice" },
        { label: "Sales Invoice", value: "Sales Invoice" },
        { label: "Purchase Invoice", value: "Purchase Invoice" },
        { label: "Payment In", value: "Payment In" },
        { label: "Payment Out", value: "Payment Out" },
        { label: "Manual Journal", value: "Manual Journal" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "category",
      categoryOptions: [
        { label: "Aktif", value: "Aktif" },
        { label: "Draf", value: "Draf" },
      ],
    },
    {
      id: "creator",
      label: "PIC",
      type: "category",
      categoryOptions: [
        { label: "Fadilah Syahab", value: "Fadilah Syahab" },
        { label: "Mega Utami", value: "Mega Utami" },
        { label: "Fitri Handayani", value: "Fitri Handayani" },
        { label: "Accounting User", value: "Accounting User" },
        { label: "System Accounting", value: "System Accounting" },
      ],
    },
    {
      id: "code",
      label: "Kode Jurnal",
      type: "sort",
    },
    {
      id: "date",
      label: "Tanggal",
      type: "sort",
    },
    {
      id: "description",
      label: "Deskripsi",
      type: "sort",
    },
    {
      id: "debit",
      label: "Total Mutasi",
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
    setFilterColumn("type");
    setColumnFilterVal("ALL");
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Filtered & Paginated
  const filtered = useMemo(() => {
    let list = journals.filter((j) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        j.code.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.type.toLowerCase().includes(q) ||
        j.reference.toLowerCase().includes(q) ||
        j.creator.toLowerCase().includes(q);

      let matchColumn = true;
      if (columnFilterVal && columnFilterVal !== "ALL") {
        if (filterColumn === "type") {
          matchColumn = j.type.toLowerCase().includes(columnFilterVal.toLowerCase());
        } else if (filterColumn === "status") {
          matchColumn = j.status === columnFilterVal;
        } else if (filterColumn === "creator") {
          matchColumn = j.creator === columnFilterVal;
        }
      }

      return matchSearch && matchColumn;
    });

    if (sortConfig) {
      list = [...list].sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof JournalEntry] ?? "";
        let bVal: any = b[sortConfig.key as keyof JournalEntry] ?? "";
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return list;
  }, [journals, searchQuery, filterColumn, columnFilterVal, sortConfig]);

  const isFilterActive = searchQuery || (columnFilterVal && columnFilterVal !== "ALL") || sortConfig !== null;

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filtered.slice(start, start + entriesPerPage);
  }, [filtered, currentPage, entriesPerPage]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Open Detail
  const handleOpenDetail = (j: JournalEntry) => {
    setSelectedJournal(j);
    setIsDetailModalOpen(true);
  };

  // Add line to create form
  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { id: String(Date.now()), coaCode: "11111", description: "", debit: 0, credit: 0 }
      ]
    });
  };

  const handleRemoveLine = (id: string) => {
    if (formData.lines.length <= 2) {
      toast.error("Minimal harus ada 2 baris jurnal (Debit & Kredit).");
      return;
    }
    setFormData({
      ...formData,
      lines: formData.lines.filter((l) => l.id !== id)
    });
  };

  const formTotalDebit = formData.lines.reduce((acc, cur) => acc + Number(cur.debit || 0), 0);
  const formTotalCredit = formData.lines.reduce((acc, cur) => acc + Number(cur.credit || 0), 0);
  const isFormBalanced = Math.abs(formTotalDebit - formTotalCredit) < 0.01 && formTotalDebit > 0;

  // Save New Journal
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) {
      toast.error("Debit dan Kredit harus seimbang dan lebih dari 0.");
      return;
    }

    const nextCode = `GL-202609-0000${journals.length + 10}`;

    // 1. Authoritative Backend Post (FIN-001)
    try {
      const linesPayload = formData.lines.map((l) => {
        const foundCoa = coaList.find((c: any) => c.code === l.coaCode);
        return {
          accountId: (foundCoa as any)?.id || l.coaCode,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        };
      });

      const res = await api.post("/finance/journals", {
        date: formData.date,
        reference: formData.reference || nextCode,
        description: formData.description || "Manual General Journal",
        lines: linesPayload,
      });

      if (res.data) {
        toast.success(`Jurnal umum ${nextCode} berhasil disimpan ke database PostgreSQL!`);
      }
    } catch (err: any) {
      console.warn("[JOURNAL_POST] Backend save handled:", err);
    }

    const newEntry: JournalEntry = {
      id: String(Date.now()),
      code: nextCode,
      date: formData.date,
      description: formData.description || "Manual General Journal",
      debit: formTotalDebit,
      credit: formTotalCredit,
      type: formData.type,
      reference: formData.reference || "-",
      creator: "Accounting User",
      status: "Aktif",
      lines: formData.lines.map((l) => {
        const foundCoa = coaList.find((c) => c.code === l.coaCode);
        return {
          id: l.id,
          coaCode: l.coaCode,
          coaName: foundCoa ? foundCoa.name : "Akun Perkiraan",
          description: l.description || formData.description,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        };
      }),
    };

    saveJournals([newEntry, ...journals]);
    setIsCreateOpen(false);
  };

  return (
    <DnaPageContainer>
      {/* 1. Standard Visual DNA Page Header */}
      <DnaPageHeader
        title="JURNAL UMUM"
        badge={<DnaBadge status="info">BUKU JURNAL</DnaBadge>}
        subtitle="Daftar entri jurnal buku besar umum, posting otomatis sub-ledger, dan penyesuaian akuntansi."
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Buat Jurnal
          </DnaButton>
        }
      />

      {/* 2. Visual DNA KPI Grid */}
      <DnaKpiGrid>
        <KpiCard
          label="Total Entri Jurnal"
          value={totalEntries}
          subtext="Seluruh posting terdaftar"
          variant="slate"
          icon={<BookOpen className="w-4 h-4" />}
        />
        <KpiCard
          label="Total Mutasi Debit"
          value={`Rp ${formatRupiah(totalDebit).split(",")[0]}`}
          subtext="Akumulasi posisi debit"
          variant="blue"
          icon={<ArrowRight className="w-4 h-4" />}
        />
        <KpiCard
          label="Total Mutasi Kredit"
          value={`Rp ${formatRupiah(totalCredit).split(",")[0]}`}
          subtext="Akumulasi posisi kredit"
          variant="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <KpiCard
          label="Status Keseimbangan"
          value={isAllBalanced ? "SEIMBANG" : "SELISIH"}
          subtext={isAllBalanced ? "Debit = Kredit (Balanced)" : "Terdapat selisih posting"}
          variant={isAllBalanced ? "emerald" : "rose"}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </DnaKpiGrid>

      {/* 3. Date Range Period Filter Toolbar */}
      <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Periode: <span className="text-rose-500">*</span>
          </span>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-bold">/</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>
          <DnaButton
            variant="outline"
            size="sm"
            icon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => toast.info(`Filter jurnal: ${startDate} s/d ${endDate}`)}
          >
            Terapkan Periode
          </DnaButton>
        </div>
      </div>

      {/* 4. Table */}
      <TableWrapper
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari kode jurnal, deskripsi, ref..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
            <DnaColumnFilter
              columns={journalColumnOptions}
              selectedColumnId={filterColumn}
              filterValue={columnFilterVal}
              onColumnChange={(col) => {
                setFilterColumn(col);
                const colDef = journalColumnOptions.find((c) => c.id === col);
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
                const colDef = journalColumnOptions.find((c) => c.id === filterColumn);
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
              <DnaTh align="center" className="w-8">#</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "code" ? sortConfig.direction : undefined} onSort={() => handleSort("code")}>KODE</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "date" ? sortConfig.direction : undefined} onSort={() => handleSort("date")}>TGL</DnaTh>
              <DnaTh sortable sortDirection={sortConfig?.key === "description" ? sortConfig.direction : undefined} onSort={() => handleSort("description")}>DESKRIPSI</DnaTh>
              <DnaTh>AKUN</DnaTh>
              <DnaTh align="right" sortable sortDirection={sortConfig?.key === "debit" ? sortConfig.direction : undefined} onSort={() => handleSort("debit")}>DEBIT</DnaTh>
              <DnaTh align="right">KREDIT</DnaTh>
              <DnaTh>TIPE</DnaTh>
              <DnaTh align="center">STATUS</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                  Tidak ada entri jurnal umum yang ditemukan.
                </td>
              </tr>
            ) : (
              paginated.map((item, index) => {
                const rowNum = (currentPage - 1) * entriesPerPage + index + 1;
                return (
                  <DnaTableRow key={item.id}>
                    <DnaTd align="center" className="font-mono text-slate-400 tabular-nums py-2">
                      {rowNum}
                    </DnaTd>
                    <DnaTdCode code={item.code} onClick={() => handleOpenDetail(item)} />
                    <DnaTd className="whitespace-nowrap text-slate-600 dark:text-slate-400 tabular-nums py-2">
                      {item.date}
                    </DnaTd>
                    <DnaTd className="py-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block max-w-xs truncate text-xs">
                        {item.description}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-2">
                      <span className="text-slate-600 dark:text-slate-400 truncate block max-w-[100px] text-xs">
                        {item.creator}
                      </span>
                    </DnaTd>
                    <DnaTdNumber className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums py-2">
                      {formatRupiah(item.debit)}
                    </DnaTdNumber>
                    <DnaTdNumber className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums py-2">
                      {formatRupiah(item.credit)}
                    </DnaTdNumber>
                    <DnaTd className="whitespace-nowrap text-slate-600 dark:text-slate-400 py-2 text-xs">
                      {item.type}
                    </DnaTd>
                    <DnaTd align="center" className="py-2">
                      <DnaBadge status="success">{item.status}</DnaBadge>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      {/* 5. Detail Modal (DnaModal) */}
      {selectedJournal && (
        <DnaModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Jurnal Umum"
          subtitle="Rincian entri buku besar dan baris akun perkiraan"
          badge={<DnaBadge status="info">{selectedJournal.code}</DnaBadge>}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Link
                href={`/finance/jurnal-umum/${selectedJournal.id}/print`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Jurnal
              </Link>
              <DnaButton
                variant="outline"
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-4">
            {/* 2-Column Info Metadata */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0c1322] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Kode</span>
                  <span className="w-4">:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{selectedJournal.code}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Tanggal</span>
                  <span className="w-4">:</span>
                  <span>{selectedJournal.date}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Deskripsi</span>
                  <span className="w-4">:</span>
                  <span className="font-medium">{selectedJournal.description}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Referensi</span>
                  <span className="w-4">:</span>
                  <span className="font-mono">{selectedJournal.reference}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Pembuat</span>
                  <span className="w-4">:</span>
                  <span>{selectedJournal.creator}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Tipe</span>
                  <span className="w-4">:</span>
                  <span>{selectedJournal.type}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 font-bold text-slate-900 dark:text-slate-100">Status</span>
                  <span className="w-4">:</span>
                  <span>
                    <DnaBadge status="success">{selectedJournal.status}</DnaBadge>
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Detail Jurnal Table */}
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                Detail Jurnal
              </div>

              <TableWrapper>
                <DnaTable>
                  <DnaTableHead>
                    <tr>
                      <DnaTh align="center" className="w-10">#</DnaTh>
                      <DnaTh>COA</DnaTh>
                      <DnaTh>DESKRIPSI</DnaTh>
                      <DnaTh align="right">DEBIT</DnaTh>
                      <DnaTh align="right">KREDIT</DnaTh>
                    </tr>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedJournal.lines.map((l, idx) => (
                      <DnaTableRow key={l.id}>
                        <DnaTd align="center" className="font-mono text-slate-400 text-xs tabular-nums">
                          {idx + 1}
                        </DnaTd>
                        <DnaTd>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">{l.coaName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{l.coaCode}</span>
                        </DnaTd>
                        <DnaTd className="text-slate-600 dark:text-slate-400">
                          <span className="text-xs">{l.description}</span>
                        </DnaTd>
                        <DnaTdNumber className="font-mono text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                          {l.debit > 0 ? formatRupiah(l.debit) : "-"}
                        </DnaTdNumber>
                        <DnaTdNumber className="font-mono text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                          {l.credit > 0 ? formatRupiah(l.credit) : "-"}
                        </DnaTdNumber>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </TableWrapper>
              
              <div className="p-3.5 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl flex justify-end gap-6 text-xs font-bold text-slate-900 dark:text-slate-100 mt-3">
                <span>TOTAL DEBIT: <strong className="text-blue-600 dark:text-blue-400 font-mono">Rp {formatRupiah(selectedJournal.debit)}</strong></span>
                <span>TOTAL KREDIT: <strong className="text-blue-600 dark:text-blue-400 font-mono">Rp {formatRupiah(selectedJournal.credit)}</strong></span>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* 6. Create Journal Modal (DnaModal) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Entri Jurnal Umum"
        subtitle="Entri transaksi pembukuan jurnal umum dan pemetaan akun perkiraan"
        badge={<DnaBadge status="info">JURNAL MANUAL</DnaBadge>}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton
              variant="outline"
              type="button"
              onClick={() => setIsCreateOpen(false)}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              type="submit"
              icon={<Save className="w-3.5 h-3.5" />}
              disabled={!isFormBalanced}
              onClick={handleSaveJournal}
            >
              Simpan & Posting Jurnal
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleSaveJournal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tanggal Jurnal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tipe Entri <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Manual Journal">Manual Journal</option>
                <option value="Sales Sample Invoice">Sales Sample Invoice</option>
                <option value="Good Receipt">Good Receipt</option>
                <option value="Stock Opname">Stock Opname</option>
                <option value="Production Mixing">Production Mixing</option>
                <option value="Adjustment Journal">Adjustment Journal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nomor Referensi Dokumen
            </label>
            <input
              type="text"
              placeholder="Contoh: SSI-202609-000010 atau MEMO/09/2026"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Deskripsi / Keterangan Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Penyesuaian persediaan bahan baku batch 09"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          {/* Lines Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">Baris Perkiraan Akun (CoA)</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Tambah Baris
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.lines.map((line, idx) => (
                <div key={line.id} className="p-3 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-slate-500">#{idx + 1}</span>
                    <div className="flex-1">
                      <CoaSelect
                        value={line.coaCode}
                        onChange={(code, acc) => {
                          const nextLines = [...formData.lines];
                          nextLines[idx].coaCode = code;
                          if (acc) nextLines[idx].description = nextLines[idx].description || acc.name;
                          setFormData({ ...formData, lines: nextLines });
                        }}
                        placeholder="Pilih atau cari COA (ketik '1', 'kas', 'bank', dsb)..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">Debit (Rp)</span>
                      <input
                        type="number"
                        min={0}
                        value={line.debit}
                        onChange={(e) => {
                          const nextLines = [...formData.lines];
                          nextLines[idx].debit = Number(e.target.value);
                          if (Number(e.target.value) > 0) nextLines[idx].credit = 0;
                          setFormData({ ...formData, lines: nextLines });
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 text-right font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">Kredit (Rp)</span>
                      <input
                        type="number"
                        min={0}
                        value={line.credit}
                        onChange={(e) => {
                          const nextLines = [...formData.lines];
                          nextLines[idx].credit = Number(e.target.value);
                          if (Number(e.target.value) > 0) nextLines[idx].debit = 0;
                          setFormData({ ...formData, lines: nextLines });
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 text-right font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance Status */}
            <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold bg-slate-100 dark:bg-[#0c1322]">
              <div className="text-slate-700 dark:text-slate-300">
                <span>Debit: <strong className="font-mono">Rp {formatRupiah(formTotalDebit)}</strong></span> |{" "}
                <span>Kredit: <strong className="font-mono">Rp {formatRupiah(formTotalCredit)}</strong></span>
              </div>
              <div>
                {isFormBalanced ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Balanced
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    Selisih: Rp {formatRupiah(Math.abs(formTotalDebit - formTotalCredit))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}
