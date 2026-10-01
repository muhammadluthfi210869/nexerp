"use client";

import React from "react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
} from "@/components/dna";
import { GraduationCap } from "lucide-react";
import { useTrainingOperations } from "../_hooks/useTrainingOperations";
import { TrainingKpiGrid } from "./TrainingKpiGrid";
import { TrainingTable } from "./TrainingTable";
import { TrainingModal } from "./TrainingModal";

export function TrainingView() {
  const {
    trainings,
    allTrainings,
    employees,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isModalOpen,
    setIsModalOpen,
    selectedRecord,
    setSelectedRecord,
    addTraining,
    isAdding,
  } = useTrainingOperations();

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* 01. MODULAR PAGE HEADER */}
      {/* 01. MODULAR PAGE HEADER */}
      <DnaPageHeader
        backHref="/hr/dashboard"
        backText="Kembali ke Dashboard HR"
        title="PELATIHAN & ONBOARDING"
        subtitle="Tracking Jam Pelatihan Karyawan, Onboarding 3 Hari, Target Goal & Import Sertifikat"
        action={
          <DnaButton
            onClick={() => {
              setSelectedRecord(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 font-bold"
          >
            <GraduationCap className="w-4 h-4" />
            Input Pelatihan
          </DnaButton>
        }
      />

      {/* Tabs Filter Pelatihan */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "ALL", label: "Semua Pelatihan", count: allTrainings.length },
          { key: "CPKB", label: "CPKB & Sanitasi", count: allTrainings.filter((t) => t.trainingType.toLowerCase().includes("cpkb")).length },
          { key: "K3", label: "K3 & Keselamatan", count: allTrainings.filter((t) => t.trainingType.toLowerCase().includes("k3")).length },
          { key: "ONBOARDING", label: "Onboarding 3 Hari", count: allTrainings.filter((t) => t.trainingType.toLowerCase().includes("onboarding")).length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === t.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
            onClick={() => setFilterType(t.key)}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] tabular-nums font-black ${
              filterType === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 02. METRIC CARDS */}
      <TrainingKpiGrid trainings={allTrainings} />

      {/* 03. TRAINING DATA TABLE */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari berdasarkan nama karyawan, jenis pelatihan, target goal...",
          filterColumns: [],
          selectedColumn: "",
          onSelectColumn: () => {},
          filterValue: "ALL",
          onFilterValueChange: () => {},
        }}
      >
        <TrainingTable
          trainings={trainings}
          isLoading={isLoading}
          onSelectRecord={setSelectedRecord}
        />
      </DnaDataTableCard>

      {/* 04. FLOATING MODAL */}
      <TrainingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={addTraining}
        isSubmitting={isAdding}
        employees={employees}
        viewingRecord={selectedRecord}
      />
    </div>
  );
}
