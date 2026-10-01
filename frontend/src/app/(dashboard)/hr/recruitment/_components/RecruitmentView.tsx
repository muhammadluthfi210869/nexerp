"use client";

import React from "react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
} from "@/components/dna";
import { UserPlus, Filter } from "lucide-react";
import { useRecruitmentOperations } from "../_hooks/useRecruitmentOperations";
import { RecruitmentKpiGrid } from "./RecruitmentKpiGrid";
import { CandidateTable } from "./CandidateTable";
import { CandidateModal } from "./CandidateModal";

export function RecruitmentView() {
  const {
    candidates,
    allCandidates,
    isLoading,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedCandidate,
    setSelectedCandidate,
    createCandidate,
    isCreating,
    updateStage,
  } = useRecruitmentOperations();

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* 01. MODULAR PAGE HEADER */}
      {/* 01. MODULAR PAGE HEADER */}
      <DnaPageHeader
        backHref="/hr/dashboard"
        backText="Kembali ke Dashboard HR"
        title="REKRUTMEN & PELAMAR (ATS)"
        subtitle="Tracking Pipeline Seleksi Kandidat, CV Review, Interview & Notifikasi Status"
        action={
          <DnaButton
            onClick={() => {
              setSelectedCandidate(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 font-bold"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pelamar
          </DnaButton>
        }
      />

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "ALL", label: "Semua Kandidat", count: allCandidates.length },
          { key: "IN_PROCESS", label: "Dalam Proses", count: allCandidates.filter((c) => c.status === "IN_PROCESS").length },
          { key: "HIRED", label: "Lolos (Hired)", count: allCandidates.filter((c) => c.status === "HIRED").length },
          { key: "REJECTED", label: "Ditolak (Reject)", count: allCandidates.filter((c) => c.status === "REJECTED").length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === t.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
            onClick={() => setFilterTab(t.key as any)}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] tabular-nums font-black ${
              filterTab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 02. METRIC CARDS */}
      <RecruitmentKpiGrid candidates={allCandidates} />

      {/* 03. CANDIDATE DATA TABLE */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari pelamar berdasarkan nama, departemen, email...",
          filterColumns: [],
          selectedColumn: "",
          onSelectColumn: () => {},
          filterValue: "ALL",
          onFilterValueChange: () => {},
        }}
      >
        <CandidateTable
          candidates={candidates}
          isLoading={isLoading}
          onSelectCandidate={setSelectedCandidate}
          onUpdateStage={updateStage}
        />
      </DnaDataTableCard>

      {/* 04. FLOATING MODAL */}
      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCandidate(null);
        }}
        onSubmit={createCandidate}
        isSubmitting={isCreating}
        viewingCandidate={selectedCandidate}
      />
    </div>
  );
}
