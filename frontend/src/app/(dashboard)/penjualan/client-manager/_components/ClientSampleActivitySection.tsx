"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaModal,
} from "@/components/dna";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  FileSpreadsheet,
  LayoutList,
} from "lucide-react";
import { ClientSampleActivityRecord } from "../_types/ami-sample.types";
import { INITIAL_AMI_SAMPLE_RECORDS } from "../_data/ami-sample-initial";

// Helper: Calculate Target DP = Delivery + 30 days
function computeTargetDp(deliveryDateStr: string): string {
  if (!deliveryDateStr || deliveryDateStr === "-" || deliveryDateStr.trim() === "") return "";
  const parts = deliveryDateStr.trim().split(/[\/\-]/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parts[2] ? parseInt(parts[2], 10) : 26;
    if (year < 100) year += 2000;
    if (!isNaN(day) && !isNaN(month)) {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 30);
      return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    }
  }
  return "";
}

// Helper: check if overdue or marked as deadline issue
function checkIsOverdue(record: ClientSampleActivityRecord): boolean {
  if (record.isOverdue) return true;
  // If sample 1 delivery took > 10 days from NPF or client marked with delay
  if (record.statusProgress.toLowerCase().includes("revisi") && !record.revisi1Delivery) return true;
  if (record.lostReason && record.lostReason.trim() !== "") return true;
  return false;
}

const STORAGE_KEY = "nexerp_client_sample_activity_records_v1";

export function ClientSampleActivitySection() {
  const [viewMode, setViewMode] = useState<"compact" | "spreadsheet">("compact");
  const [records, setRecords] = useState<ClientSampleActivityRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_AMI_SAMPLE_RECORDS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>();
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClientSampleActivityRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ClientSampleActivityRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ClientSampleActivityRecord>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }, [records]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalMoq = 0;
    let totalBudget = 0;
    let totalDeal = 0;
    let totalOverdue = 0;

    records.forEach((r) => {
      // Parse MOQ
      const moqClean = r.rencanaMoq.replace(/[^0-9]/g, "");
      const moqVal = parseInt(moqClean, 10);
      if (!isNaN(moqVal)) totalMoq += moqVal;

      // Parse Budget
      const budgetClean = r.rencanaBudgetClosing.replace(/[^0-9]/g, "");
      const budgetVal = parseInt(budgetClean, 10);
      if (!isNaN(budgetVal)) totalBudget += budgetVal;

      if (r.statusAkhir.toUpperCase() === "DEAL") totalDeal++;
      if (checkIsOverdue(r)) totalOverdue++;
    });

    return { totalMoq, totalBudget, totalDeal, totalOverdue };
  }, [records]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.namaClient.toLowerCase().includes(q) ||
        r.namaBrand.toLowerCase().includes(q) ||
        r.sampleProduct.toLowerCase().includes(q) ||
        r.domisili.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        r.statusProgress.toLowerCase().includes(q);

      const matchStatus =
        selectedStatusFilter === "ALL" ||
        r.statusAkhir.toUpperCase() === selectedStatusFilter.toUpperCase();

      let matchColumn = true;
      if (selectedColumn === "source" && filterValue !== "ALL") {
        matchColumn = r.source.toLowerCase().includes(filterValue.toLowerCase());
      }

      return matchSearch && matchStatus && matchColumn;
    });
  }, [records, searchQuery, selectedStatusFilter, selectedColumn, filterValue]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({
      tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "numeric" }),
      no: String(records.length + 1),
      namaClient: "",
      namaBrand: "",
      domisili: "",
      noTelp: "",
      prioStandar: "STANDAR",
      sampleProduct: "",
      rencanaMoq: "500",
      rencanaBudgetClosing: "Rp15.000.000",
      sample1Npf: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "2-digit" }),
      sample1Delivery: "",
      revisi1Npf: "",
      revisi1Delivery: "",
      revisi2Npf: "",
      revisi2Delivery: "",
      statusProgress: "Klien trial sample",
      terakhirFu: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "2-digit" }),
      nextFu: "",
      fixFormula: "-",
      hki: "SUDAH ADA",
      kemasanPrimer: "BELUM PILIH",
      kemasanSekunder: "BELUM PILIH",
      mockUp: "-",
      tglPermintaan: "",
      tglDikasih: "",
      tglTargetDp: "",
      statusAkhir: "PROCESS",
      lostReason: "",
      source: "BusDev",
      arahanHeadBd: "-",
      profilKlien: "",
      rekomendasiBd: "-",
      isOverdue: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: ClientSampleActivityRecord) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (rec: ClientSampleActivityRecord) => {
    setViewingRecord(rec);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data sample klien ini?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.namaClient || !formData.sampleProduct) {
      alert("Nama Client dan Sample Product wajib diisi!");
      return;
    }

    // Auto-calculate Target DP if empty and Sample 1 delivery is present
    let targetDp = formData.tglTargetDp;
    if ((!targetDp || targetDp.trim() === "") && formData.sample1Delivery) {
      targetDp = computeTargetDp(formData.sample1Delivery);
    }

    if (editingRecord) {
      // Update
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? ({
                ...r,
                ...formData,
                tglTargetDp: targetDp || r.tglTargetDp,
              } as ClientSampleActivityRecord)
            : r
        )
      );
    } else {
      // Create
      const newRec: ClientSampleActivityRecord = {
        id: `AMI-JULI-${Date.now()}`,
        tanggal: formData.tanggal || "1/7",
        no: formData.no || String(records.length + 1),
        namaClient: formData.namaClient || "-",
        namaBrand: formData.namaBrand || "-",
        domisili: formData.domisili || "-",
        noTelp: formData.noTelp || "-",
        prioStandar: formData.prioStandar || "STANDAR",
        sampleProduct: formData.sampleProduct || "-",
        rencanaMoq: formData.rencanaMoq || "-",
        rencanaBudgetClosing: formData.rencanaBudgetClosing || "0",
        sample1Npf: formData.sample1Npf || "",
        sample1Delivery: formData.sample1Delivery || "",
        revisi1Npf: formData.revisi1Npf || "",
        revisi1Delivery: formData.revisi1Delivery || "",
        revisi2Npf: formData.revisi2Npf || "",
        revisi2Delivery: formData.revisi2Delivery || "",
        statusProgress: formData.statusProgress || "PROCESS",
        terakhirFu: formData.terakhirFu || "",
        nextFu: formData.nextFu || "",
        fixFormula: formData.fixFormula || "-",
        hki: formData.hki || "-",
        kemasanPrimer: formData.kemasanPrimer || "-",
        kemasanSekunder: formData.kemasanSekunder || "-",
        mockUp: formData.mockUp || "-",
        tglPermintaan: formData.tglPermintaan || "",
        tglDikasih: formData.tglDikasih || "",
        tglTargetDp: targetDp || "",
        statusAkhir: formData.statusAkhir || "PROCESS",
        lostReason: formData.lostReason || "",
        source: formData.source || "-",
        arahanHeadBd: formData.arahanHeadBd || "-",
        profilKlien: formData.profilKlien || "",
        rekomendasiBd: formData.rekomendasiBd || "-",
        isOverdue: formData.isOverdue || false,
      };
      setRecords((prev) => [newRec, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleResetToStandard = () => {
    if (confirm("Reset data tabel ke data standar AMI - ACTIVITY WORK - JULI?")) {
      setRecords(INITIAL_AMI_SAMPLE_RECORDS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Table Card with Golden Reference DnaTableToolbar ── */}
      <DnaDataTableCard
        count={filteredRecords.length}
        totalItems={records.length}
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "compact"
                    ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 text-blue-600" />
                Pipeline 2-Baris
              </button>
              <button
                type="button"
                onClick={() => setViewMode("spreadsheet")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "spreadsheet"
                    ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                Spreadsheet 34 Kolom
              </button>
            </div>

            {/* SLA Rule Tooltip Popover */}
            <div className="group relative">
              <button
                type="button"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors text-xs flex items-center gap-1"
                title="Panduan SLA & Target DP"
              >
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Panduan SLA</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-80 bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl space-y-2 pointer-events-none">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" />
                  Standar Operasional Client Sample
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Target DP:</strong> Dihitung otomatis +30 hari sejak sample pertama dikirim ke klien.
                </p>
                <div className="pt-1 space-y-1 border-t border-slate-800 text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300">Hijau: Sesuai SLA / Terkirim</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-blue-300">Biru: Sedang Dikerjakan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-rose-300">Merah: Overdue / Melebihi Batas Hari</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        toolbarProps={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari klien, brand, produk, status, domisili...",
          statusOptions: [
            { label: "Semua Status", value: "ALL" },
            { label: "Process", value: "PROCESS" },
            { label: "Potential Dealing", value: "POTENTIAL DEALING" },
            { label: "Negotiable", value: "NEGOTIABLE" },
            { label: "Deal", value: "DEAL" },
            { label: "Lost", value: "LOST" },
          ],
          selectedStatus: selectedStatusFilter,
          onSelectStatus: setSelectedStatusFilter,
          statusPlaceholder: "Filter Status Klien",
          filterColumns: [
            {
              key: "source",
              label: "Sumber Leads",
              options: ["ALL", "Instagram", "TikTok", "Website", "Referral", "Walk In", "WhatsApp"],
            },
          ],
          selectedColumn,
          onSelectColumn: setSelectedColumn,
          filterValue,
          onFilterValueChange: setFilterValue,
          onResetAll: () => {
            setSearchQuery("");
            setSelectedStatusFilter("ALL");
            setSelectedColumn(undefined);
            setFilterValue("ALL");
          },
          actionButton: {
            label: "+ Tambah Sample Klien",
            onClick: handleOpenCreate,
          },
        }}
      >
        {/* ── MODE 1: COMPACT INTERACTIVE PIPELINE RAIL (ZERO HORIZONTAL SCROLL) ── */}
        {viewMode === "compact" && (
          <div className="overflow-x-hidden w-full">
            <DnaTable className="w-full text-left text-[11.5px]">
              <DnaTableHead>
                <DnaTableRow className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-xs">
                  <DnaTh className="p-3 w-10 text-center text-slate-400">#</DnaTh>
                  <DnaTh className="p-3 w-20">Tgl</DnaTh>
                  <DnaTh className="p-3 w-48">Klien & Domisili</DnaTh>
                  <DnaTh className="p-3 w-44">Brand & Sample Produk</DnaTh>
                  <DnaTh className="p-3 w-36 text-right">MOQ & Budget</DnaTh>
                  <DnaTh className="p-3 w-72 text-center bg-blue-50/40">
                    <span className="flex items-center justify-center gap-1 text-blue-900 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pipeline Progres Sample (S1 ➔ R1 ➔ R2 ➔ HKI ➔ DP)
                    </span>
                  </DnaTh>
                  <DnaTh className="p-3 w-44">Progress Feedback</DnaTh>
                  <DnaTh className="p-3 w-32 text-center">Status Akhir</DnaTh>
                  <DnaTh className="p-3 w-24 text-center">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredRecords.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data sample klien yang cocok dengan filter.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredRecords.map((r, idx) => {
                    const overdue = checkIsOverdue(r);
                    const targetDp = r.tglTargetDp || (r.sample1Delivery ? computeTargetDp(r.sample1Delivery) : "—");

                    return (
                      <DnaTableRow
                        key={r.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          overdue ? "bg-rose-50/20" : ""
                        }`}
                      >
                        {/* 1: # */}
                        <DnaTd className="p-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </DnaTd>

                        {/* 2: Tgl */}
                        <DnaTd className="p-3 font-mono text-slate-700 whitespace-nowrap">
                          {r.tanggal}
                        </DnaTd>

                        {/* 3: Klien & Domisili */}
                        <DnaTd className="p-3">
                          <div className="font-bold text-slate-900 leading-tight">{r.namaClient}</div>
                          <div className="text-[10.5px] text-slate-500 mt-0.5">
                            {r.domisili || "—"} • <span className="font-mono text-[10px]">{r.noTelp}</span>
                          </div>
                        </DnaTd>

                        {/* 4: Brand & Produk */}
                        <DnaTd className="p-3">
                          <div className="font-semibold text-slate-800 leading-tight">{r.namaBrand}</div>
                          <div className="text-[11px] text-blue-700 font-medium mt-0.5">{r.sampleProduct}</div>
                        </DnaTd>

                        {/* 5: MOQ & Budget */}
                        <DnaTd className="p-3 text-right">
                          <div className="font-mono font-bold text-emerald-600">{r.rencanaBudgetClosing}</div>
                          <div className="text-[10px] text-slate-400">MOQ: {r.rencanaMoq} pcs</div>
                        </DnaTd>

                        {/* 6: Interactive Mini-Stepper Pipeline Rail */}
                        <DnaTd className="p-3 text-center bg-blue-50/20">
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            {/* Step S1: Sample 1 */}
                            <div className="group relative flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-transform group-hover:scale-110 ${
                                  r.sample1Delivery
                                    ? overdue
                                      ? "bg-rose-50 text-rose-800 border-rose-300 font-semibold"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                    : r.sample1Npf
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                S1
                              </div>
                              <span className="text-[8.5px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                                {r.sample1Delivery || r.sample1Npf || "—"}
                              </span>
                              {/* Popover Tooltip */}
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap text-left pointer-events-none">
                                <div className="font-bold text-blue-300">Sample 1</div>
                                <div>NPF: {r.sample1Npf || "Belum"}</div>
                                <div>Delivery: {r.sample1Delivery || "Belum"}</div>
                              </div>
                            </div>

                            <div className="w-2.5 h-0.5 bg-slate-200" />

                            {/* Step R1: Revisi 1 */}
                            <div className="group relative flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-transform group-hover:scale-110 ${
                                  r.revisi1Delivery
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                    : r.revisi1Npf
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                R1
                              </div>
                              <span className="text-[8.5px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                                {r.revisi1Delivery || r.revisi1Npf || "—"}
                              </span>
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap text-left pointer-events-none">
                                <div className="font-bold text-amber-300">Revisi 1</div>
                                <div>NPF: {r.revisi1Npf || "—"}</div>
                                <div>Delivery: {r.revisi1Delivery || "—"}</div>
                              </div>
                            </div>

                            <div className="w-2.5 h-0.5 bg-slate-200" />

                            {/* Step R2: Revisi 2 */}
                            <div className="group relative flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-transform group-hover:scale-110 ${
                                  r.revisi2Delivery
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                    : r.revisi2Npf
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                R2
                              </div>
                              <span className="text-[8.5px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                                {r.revisi2Delivery || r.revisi2Npf || "—"}
                              </span>
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap text-left pointer-events-none">
                                <div className="font-bold text-amber-300">Revisi 2</div>
                                <div>NPF: {r.revisi2Npf || "—"}</div>
                                <div>Delivery: {r.revisi2Delivery || "—"}</div>
                              </div>
                            </div>

                            <div className="w-2.5 h-0.5 bg-slate-200" />

                            {/* Step HKI */}
                            <div className="group relative flex flex-col items-center">
                              <div
                                className={`px-1.5 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border ${
                                  r.hki && (r.hki.toUpperCase().includes("SUDAH") || r.hki.toUpperCase().includes("ADA"))
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                    : r.hki && r.hki.toUpperCase().includes("PROSES")
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                HKI
                              </div>
                              <span className="text-[8.5px] text-slate-400 font-medium mt-0.5 max-w-[42px] truncate">
                                {r.hki || "—"}
                              </span>
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap text-left pointer-events-none">
                                <div className="font-bold text-emerald-300">Status Legalitas & Kemasan</div>
                                <div>HKI: {r.hki || "—"}</div>
                                <div>Primer: {r.kemasanPrimer || "—"}</div>
                                <div>Sekunder: {r.kemasanSekunder || "—"}</div>
                              </div>
                            </div>

                            <div className="w-2.5 h-0.5 bg-slate-200" />

                            {/* Step DP Target (+30 Hari) */}
                            <div className="group relative flex flex-col items-center">
                              <div
                                className={`px-1.5 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border ${
                                  r.statusAkhir.toUpperCase() === "DEAL"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                    : r.statusAkhir.toUpperCase() === "REJECTED" || r.statusAkhir.toUpperCase() === "BATAL"
                                    ? "bg-rose-50 text-rose-800 border-rose-300 font-semibold"
                                    : r.statusAkhir.toUpperCase().includes("PROSES") || r.statusAkhir.toUpperCase().includes("FOLLOW")
                                    ? "bg-blue-600 text-white font-bold animate-pulse shadow-2xs"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                DP
                              </div>
                              <span className="text-[8.5px] text-slate-600 font-mono mt-0.5 whitespace-nowrap">
                                {targetDp}
                              </span>
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap text-left pointer-events-none">
                                <div className="font-bold text-amber-300">Target DP (+30 Hari Kalender)</div>
                                <div>Tgl Target: {targetDp}</div>
                                <div>Status: {r.statusAkhir}</div>
                              </div>
                            </div>
                          </div>
                        </DnaTd>

                        {/* 7: Status Progress */}
                        <DnaTd className="p-3">
                          <div
                            className={`line-clamp-2 text-xs ${
                              overdue ? "text-rose-700 font-semibold" : "text-slate-700"
                            }`}
                            title={r.statusProgress}
                          >
                            {r.statusProgress}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            FU Terakhir: {r.terakhirFu || "—"}
                          </div>
                        </DnaTd>

                        {/* 8: Status Akhir */}
                        <DnaTd className="p-3 text-center">
                          <span
                            className={`whitespace-nowrap inline-flex items-center rounded-full text-[11px] leading-none px-2.5 py-1 font-bold ${
                              r.statusAkhir.toUpperCase() === "DEAL"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : r.statusAkhir.toUpperCase() === "POTENTIAL DEALING"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : r.statusAkhir.toUpperCase() === "NEGOTIABLE"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : r.statusAkhir.toUpperCase() === "LOST"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {r.statusAkhir}
                          </span>
                        </DnaTd>

                        {/* 9: Aksi */}
                        <DnaTd className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(r)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}

        {/* ── MODE 2: SPREADSHEET LEBAR (1:1 AMI ACTIVITY WORK 34 KOLOM) ── */}
        {viewMode === "spreadsheet" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[2600px]">
              {/* TIER 1: GROUP HEADERS */}
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 text-center uppercase tracking-wider text-[11px]">
                  <th colSpan={8} className="p-2.5 border-r border-slate-300 bg-slate-200/70 text-slate-900">
                    DATA KLIEN
                  </th>
                  <th colSpan={2} className="p-2.5 border-r border-slate-300 bg-blue-100/70 text-blue-900">
                    FINANCE (Est. Total: Rp {metrics.totalBudget.toLocaleString("id-ID")})
                  </th>
                  <th colSpan={9} className="p-2.5 border-r border-slate-300 bg-purple-100/70 text-purple-900">
                    STATUS SAMPLE & TRACKING
                  </th>
                  <th colSpan={5} className="p-2.5 border-r border-slate-300 bg-emerald-100/70 text-emerald-900">
                    SUGGEST PROCESS
                  </th>
                  <th colSpan={5} className="p-2.5 border-r border-slate-300 bg-amber-100/70 text-amber-900">
                    NEGOTIATION & TARGET DP (30 HARI)
                  </th>
                  <th colSpan={4} className="p-2.5 border-r border-slate-300 bg-slate-200/70 text-slate-900">
                    NOTED / CATATAN BD
                  </th>
                  <th colSpan={1} className="p-2.5 bg-slate-300/80 text-slate-900">
                    AKSI
                  </th>
                </tr>

                {/* TIER 2: SUB-COLUMNS (Universal Col 1 = #, Col 2 = Tanggal) */}
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                  {/* Data Klien */}
                  <th className="p-2.5 w-12 text-center border-r border-slate-200">#</th>
                  <th className="p-2.5 w-24 border-r border-slate-200">Tgl/Bulan</th>
                  <th className="p-2.5 w-40 border-r border-slate-200">Nama Client</th>
                  <th className="p-2.5 w-36 border-r border-slate-200">Nama Brand/Merk</th>
                  <th className="p-2.5 w-28 border-r border-slate-200">Domisili</th>
                  <th className="p-2.5 w-28 border-r border-slate-200">No. Telp</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200">Prio/Std</th>
                  <th className="p-2.5 w-40 border-r border-slate-200">Sample Product</th>

                  {/* Finance */}
                  <th className="p-2.5 w-28 text-right border-r border-slate-200">Rencana MOQ</th>
                  <th className="p-2.5 w-36 text-right border-r border-slate-200">Budget Closing (Rp)</th>

                  {/* Status Sample */}
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Sample 1 NPF</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Sample 1 Delivery</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Revisi 1 NPF</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Revisi 1 Delivery</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Revisi 2 NPF</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200 bg-purple-50/40">Revisi 2 Delivery</th>
                  <th className="p-2.5 w-48 border-r border-slate-200">Status Progress</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200">Terakhir FU</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200">Next FU</th>

                  {/* Suggest Process */}
                  <th className="p-2.5 w-28 border-r border-slate-200">Fix Formula</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">HKI</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">Kemasan Primer</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">Kemasan Sekunder</th>
                  <th className="p-2.5 w-24 border-r border-slate-200">Mock Up</th>

                  {/* Negotiation */}
                  <th className="p-2.5 w-24 text-center border-r border-slate-200">Tgl Permintaan</th>
                  <th className="p-2.5 w-24 text-center border-r border-slate-200">Tgl Dikasih</th>
                  <th className="p-2.5 w-28 text-center border-r border-slate-200 bg-amber-50/60 font-bold text-amber-900">
                    Target DP (+30d)
                  </th>
                  <th className="p-2.5 w-32 text-center border-r border-slate-200">Status Akhir</th>
                  <th className="p-2.5 w-36 border-r border-slate-200">Lost Reason</th>

                  {/* Catatan BD */}
                  <th className="p-2.5 w-28 border-r border-slate-200">Source</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">Arahan Head BD</th>
                  <th className="p-2.5 w-64 border-r border-slate-200">Profil Klien</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">Rekomendasi BD</th>

                  {/* Actions */}
                  <th className="p-2.5 w-28 text-center">Aksi</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={34} className="p-8 text-center text-slate-400">
                      Tidak ada data sample klien yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => {
                    const overdue = checkIsOverdue(r);
                    const deadlineTextStyle = overdue
                      ? "text-rose-600 font-bold"
                      : "text-slate-900 font-medium";

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          overdue ? "bg-rose-50/20" : ""
                        }`}
                      >
                        {/* 1: # */}
                        <td className="p-2.5 text-center text-slate-400 font-mono border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* 2: Tanggal / Bulan */}
                        <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap border-r border-slate-100">
                          {r.tanggal}
                        </td>

                        {/* 3: Nama Client */}
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap border-r border-slate-100">
                          {r.namaClient}
                        </td>

                        {/* 4: Nama Brand/Merk */}
                        <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100">
                          {r.namaBrand}
                        </td>

                        {/* 5: Domisili */}
                        <td className="p-2.5 text-slate-600 whitespace-nowrap border-r border-slate-100">
                          {r.domisili}
                        </td>

                        {/* 6: No Telp */}
                        <td className="p-2.5 text-slate-600 font-mono text-[10px] whitespace-nowrap border-r border-slate-100">
                          {r.noTelp}
                        </td>

                        {/* 7: Prio / Standar */}
                        <td className="p-2.5 text-center whitespace-nowrap border-r border-slate-100">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.prioStandar === "PRIORITAS"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r.prioStandar}
                          </span>
                        </td>

                        {/* 8: Sample Product */}
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-100">
                          {r.sampleProduct}
                        </td>

                        {/* 9: Rencana MOQ */}
                        <td className="p-2.5 text-right font-mono text-slate-800 border-r border-slate-100">
                          {r.rencanaMoq}
                        </td>

                        {/* 10: Budget Closing */}
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 border-r border-slate-100">
                          {r.rencanaBudgetClosing}
                        </td>

                        {/* 11: Sample 1 NPF */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.sample1Npf || "—"}
                        </td>

                        {/* 12: Sample 1 Delivery */}
                        <td className={`p-2.5 text-center font-mono border-r border-slate-100 ${deadlineTextStyle}`}>
                          {r.sample1Delivery || "—"}
                        </td>

                        {/* 13: Revisi 1 NPF */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.revisi1Npf || "—"}
                        </td>

                        {/* 14: Revisi 1 Delivery */}
                        <td className={`p-2.5 text-center font-mono border-r border-slate-100 ${deadlineTextStyle}`}>
                          {r.revisi1Delivery || "—"}
                        </td>

                        {/* 15: Revisi 2 NPF */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.revisi2Npf || "—"}
                        </td>

                        {/* 16: Revisi 2 Delivery */}
                        <td className={`p-2.5 text-center font-mono border-r border-slate-100 ${deadlineTextStyle}`}>
                          {r.revisi2Delivery || "—"}
                        </td>

                        {/* 17: Status Progress */}
                        <td className={`p-2.5 border-r border-slate-100 ${deadlineTextStyle}`}>
                          <div className="line-clamp-2" title={r.statusProgress}>
                            {r.statusProgress}
                          </div>
                        </td>

                        {/* 18: Terakhir FU */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.terakhirFu || "—"}
                        </td>

                        {/* 19: Next FU */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.nextFu || "—"}
                        </td>

                        {/* 20: Fix Formula */}
                        <td className="p-2.5 font-medium text-slate-800 border-r border-slate-100">
                          {r.fixFormula}
                        </td>

                        {/* 21: HKI */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.hki}
                        </td>

                        {/* 22: Kemasan Primer */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.kemasanPrimer}
                        </td>

                        {/* 23: Kemasan Sekunder */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.kemasanSekunder}
                        </td>

                        {/* 24: Mock Up */}
                        <td className="p-2.5 text-center text-slate-600 border-r border-slate-100">
                          {r.mockUp}
                        </td>

                        {/* 25: Tgl Permintaan */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.tglPermintaan || "—"}
                        </td>

                        {/* 26: Tgl Dikasih */}
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {r.tglDikasih || "—"}
                        </td>

                        {/* 27: Tgl Target DP (30 Hari setelah Sample 1 Delivery) */}
                        <td className="p-2.5 text-center font-mono font-bold text-amber-700 bg-amber-50/40 border-r border-slate-100">
                          {r.tglTargetDp || (r.sample1Delivery ? computeTargetDp(r.sample1Delivery) : "—")}
                        </td>

                        {/* 28: Status Akhir */}
                        <td className="p-2.5 text-center border-r border-slate-100">
                          <span
                            className={`whitespace-nowrap inline-flex items-center rounded-full text-[11px] leading-none px-2.5 py-1 font-bold ${
                              r.statusAkhir.toUpperCase() === "DEAL"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : r.statusAkhir.toUpperCase() === "POTENTIAL DEALING"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : r.statusAkhir.toUpperCase() === "NEGOTIABLE"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : r.statusAkhir.toUpperCase() === "LOST"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {r.statusAkhir}
                          </span>
                        </td>

                        {/* 29: Lost Reason */}
                        <td className="p-2.5 text-slate-500 border-r border-slate-100">
                          {r.lostReason || "—"}
                        </td>

                        {/* 30: Source */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.source}
                        </td>

                        {/* 31: Arahan Head BD */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.arahanHeadBd}
                        </td>

                        {/* 32: Profil Klien */}
                        <td className="p-2.5 text-slate-600 max-w-xs border-r border-slate-100">
                          <div className="line-clamp-2 text-[10px]" title={r.profilKlien}>
                            {r.profilKlien || "—"}
                          </div>
                        </td>

                        {/* 33: Rekomendasi BD */}
                        <td className="p-2.5 text-slate-700 border-r border-slate-100">
                          {r.rekomendasiBd}
                        </td>

                        {/* 34: Aksi */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(r)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>

      {/* ── Form Modal (Create & Edit) ── */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? "Edit Master Sample Klien (AMI Work)" : "Tambah Sample Klien Baru"}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5 text-xs text-slate-800 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Data Klien & Finance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              1. Data Klien & Finance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Input</label>
                <DnaInput
                  value={formData.tanggal || ""}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  placeholder="Contoh: 1/7"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Client *</label>
                <DnaInput
                  value={formData.namaClient || ""}
                  onChange={(e) => setFormData({ ...formData, namaClient: e.target.value })}
                  placeholder="Nama klien"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Brand / Merk</label>
                <DnaInput
                  value={formData.namaBrand || ""}
                  onChange={(e) => setFormData({ ...formData, namaBrand: e.target.value })}
                  placeholder="Nama brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Domisili (Kota)</label>
                <DnaInput
                  value={formData.domisili || ""}
                  onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                  placeholder="Contoh: Surabaya"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Telp / WhatsApp</label>
                <DnaInput
                  value={formData.noTelp || ""}
                  onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
                  placeholder="08xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prioritas / Standar</label>
                <select
                  value={formData.prioStandar || "STANDAR"}
                  onChange={(e) => setFormData({ ...formData, prioStandar: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="STANDAR">STANDAR</option>
                  <option value="PRIORITAS">PRIORITAS</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sample Product *</label>
                <DnaInput
                  value={formData.sampleProduct || ""}
                  onChange={(e) => setFormData({ ...formData, sampleProduct: e.target.value })}
                  placeholder="Contoh: Body Lotion, Hair Oil, Moisturizer..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rencana MOQ</label>
                <DnaInput
                  value={formData.rencanaMoq || ""}
                  onChange={(e) => setFormData({ ...formData, rencanaMoq: e.target.value })}
                  placeholder="Contoh: 500 pcs atau 100-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rencana Budget Closing</label>
                <DnaInput
                  value={formData.rencanaBudgetClosing || ""}
                  onChange={(e) => setFormData({ ...formData, rencanaBudgetClosing: e.target.value })}
                  placeholder="Contoh: Rp35.000.000"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Status Sample & Iterasi */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              2. Status Sample & Pengiriman
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sample 1 - Tgl NPF</label>
                <DnaInput
                  value={formData.sample1Npf || ""}
                  onChange={(e) => setFormData({ ...formData, sample1Npf: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sample 1 - Tgl Delivery
                </label>
                <DnaInput
                  value={formData.sample1Delivery || ""}
                  onChange={(e) => {
                    const del = e.target.value;
                    const autoDp = computeTargetDp(del);
                    setFormData({
                      ...formData,
                      sample1Delivery: del,
                      tglTargetDp: autoDp || formData.tglTargetDp,
                    });
                  }}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revisi 1 - Tgl NPF</label>
                <DnaInput
                  value={formData.revisi1Npf || ""}
                  onChange={(e) => setFormData({ ...formData, revisi1Npf: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revisi 1 - Tgl Delivery</label>
                <DnaInput
                  value={formData.revisi1Delivery || ""}
                  onChange={(e) => setFormData({ ...formData, revisi1Delivery: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revisi 2 - Tgl NPF</label>
                <DnaInput
                  value={formData.revisi2Npf || ""}
                  onChange={(e) => setFormData({ ...formData, revisi2Npf: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revisi 2 - Tgl Delivery</label>
                <DnaInput
                  value={formData.revisi2Delivery || ""}
                  onChange={(e) => setFormData({ ...formData, revisi2Delivery: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Progress Terkini</label>
                <DnaInput
                  value={formData.statusProgress || ""}
                  onChange={(e) => setFormData({ ...formData, statusProgress: e.target.value })}
                  placeholder="Contoh: Klien trial sample, menunggu feedback..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Terakhir Follow Up</label>
                <DnaInput
                  value={formData.terakhirFu || ""}
                  onChange={(e) => setFormData({ ...formData, terakhirFu: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Follow Up</label>
                <DnaInput
                  value={formData.nextFu || ""}
                  onChange={(e) => setFormData({ ...formData, nextFu: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-overdue"
                  checked={formData.isOverdue || false}
                  onChange={(e) => setFormData({ ...formData, isOverdue: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="chk-overdue" className="text-xs font-bold text-rose-700">
                  Flag: Tidak Sesuai Deadline (Tampilkan Merah)
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Suggest Process & Negotiation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              3. Suggest Process & Negotiation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fix Formula</label>
                <DnaInput
                  value={formData.fixFormula || ""}
                  onChange={(e) => setFormData({ ...formData, fixFormula: e.target.value })}
                  placeholder="Contoh: SAMPLE 1, -"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status HKI</label>
                <DnaInput
                  value={formData.hki || ""}
                  onChange={(e) => setFormData({ ...formData, hki: e.target.value })}
                  placeholder="SUDAH ADA / BELUM ADA"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kemasan Primer</label>
                <DnaInput
                  value={formData.kemasanPrimer || ""}
                  onChange={(e) => setFormData({ ...formData, kemasanPrimer: e.target.value })}
                  placeholder="BELUM PILIH / SUDAH PILIH"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kemasan Sekunder</label>
                <DnaInput
                  value={formData.kemasanSekunder || ""}
                  onChange={(e) => setFormData({ ...formData, kemasanSekunder: e.target.value })}
                  placeholder="BELUM PILIH / SUDAH PILIH"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mock Up</label>
                <DnaInput
                  value={formData.mockUp || ""}
                  onChange={(e) => setFormData({ ...formData, mockUp: e.target.value })}
                  placeholder="-"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tgl Permintaan</label>
                <DnaInput
                  value={formData.tglPermintaan || ""}
                  onChange={(e) => setFormData({ ...formData, tglPermintaan: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tgl Dikasih</label>
                <DnaInput
                  value={formData.tglDikasih || ""}
                  onChange={(e) => setFormData({ ...formData, tglDikasih: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tgl Target DP (Otomatis +30 Hari)
                </label>
                <DnaInput
                  value={formData.tglTargetDp || ""}
                  onChange={(e) => setFormData({ ...formData, tglTargetDp: e.target.value })}
                  placeholder="dd/mm/yy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Akhir</label>
                <select
                  value={formData.statusAkhir || "PROCESS"}
                  onChange={(e) => setFormData({ ...formData, statusAkhir: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="PROCESS">PROCESS</option>
                  <option value="POTENTIAL DEALING">POTENTIAL DEALING</option>
                  <option value="NEGOTIABLE">NEGOTIABLE</option>
                  <option value="DEAL">DEAL</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lost Reason (Jika LOST)</label>
                <DnaInput
                  value={formData.lostReason || ""}
                  onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
                  placeholder="Alasan pembatalan/lost deal..."
                />
              </div>
            </div>
          </div>

          {/* Section 4: Catatan BusDev */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              4. Catatan & Arahan BusDev
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Source Lead</label>
                <DnaInput
                  value={formData.source || ""}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Contoh: Ibu Irma, Mas Diaz, Kak Jess..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Arahan Head BD</label>
                <DnaInput
                  value={formData.arahanHeadBd || ""}
                  onChange={(e) => setFormData({ ...formData, arahanHeadBd: e.target.value })}
                  placeholder="Arahan dari pimpinan..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rekomendasi BD</label>
                <DnaInput
                  value={formData.rekomendasiBd || ""}
                  onChange={(e) => setFormData({ ...formData, rekomendasiBd: e.target.value })}
                  placeholder="Rekomendasi tim..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profil Klien & Catatan Khusus</label>
                <textarea
                  value={formData.profilKlien || ""}
                  onChange={(e) => setFormData({ ...formData, profilKlien: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Karakteristik klien, preferensi formula, catatan pertemuan..."
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSave}>
              Simpan Data Sample
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── Detail Inspection Modal ── */}
      {viewingRecord && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Client Sample: ${viewingRecord.namaClient} (${viewingRecord.namaBrand})`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Client</span>
                <span className="font-bold text-slate-900 text-sm">{viewingRecord.namaClient}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Brand</span>
                <span className="font-bold text-slate-800 text-sm">{viewingRecord.namaBrand}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Produk Sample</span>
                <span className="font-semibold text-slate-900">{viewingRecord.sampleProduct}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Akhir</span>
                <span className="font-bold text-blue-600">{viewingRecord.statusAkhir}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Rencana MOQ</span>
                <span className="font-bold text-slate-800">{viewingRecord.rencanaMoq}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Budget Closing</span>
                <span className="font-bold text-emerald-600">{viewingRecord.rencanaBudgetClosing}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Target DP (30 Hari)</span>
                <span className="font-bold text-amber-600">
                  {viewingRecord.tglTargetDp || (viewingRecord.sample1Delivery ? computeTargetDp(viewingRecord.sample1Delivery) : "—")}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">Riwayat Iterasi Sample:</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-slate-50">
                  <span className="font-semibold block text-[10px] text-slate-500">Sample 1</span>
                  <span className="text-xs">NPF: {viewingRecord.sample1Npf || "—"}</span>
                  <span className="text-xs block text-slate-700">Deliv: {viewingRecord.sample1Delivery || "—"}</span>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="font-semibold block text-[10px] text-slate-500">Revisi 1</span>
                  <span className="text-xs">NPF: {viewingRecord.revisi1Npf || "—"}</span>
                  <span className="text-xs block text-slate-700">Deliv: {viewingRecord.revisi1Delivery || "—"}</span>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="font-semibold block text-[10px] text-slate-500">Revisi 2</span>
                  <span className="text-xs">NPF: {viewingRecord.revisi2Npf || "—"}</span>
                  <span className="text-xs block text-slate-700">Deliv: {viewingRecord.revisi2Delivery || "—"}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">Profil Klien & Catatan:</h5>
              <p className="text-slate-700 text-xs leading-relaxed">{viewingRecord.profilKlien || "Tidak ada catatan khusus."}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(viewingRecord);
                }}
              >
                Edit Data
              </DnaButton>
            </div>
          </div>
        </DnaModal>
      )}
    </div>
  );
}
