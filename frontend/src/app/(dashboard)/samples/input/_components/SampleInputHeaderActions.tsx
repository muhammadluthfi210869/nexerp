"use client";

import React from "react";
import { Calendar, History, Save } from "lucide-react";
import { DnaButton } from "@/components/dna";

interface SampleInputHeaderActionsProps {
  date: string;
  setDate: (date: string) => void;
  pullPreviousData: () => void;
  loading: boolean;
  activeTab: string;
  submitAds: () => Promise<void>;
  submitOrganic: () => Promise<void>;
}

export function SampleInputHeaderActions({
  date,
  setDate,
  pullPreviousData,
  loading,
  activeTab,
  submitAds,
  submitOrganic,
}: SampleInputHeaderActionsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-4 transition-all hover:border-blue-400">
        <Calendar className="w-5 h-5 text-blue-600" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent border-none outline-none font-black text-sm text-slate-700"
        />
      </div>

      <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden md:block" />

      <DnaButton
        variant="outline"
        onClick={pullPreviousData}
        icon={<History className="w-4 h-4" />}
      >
        Pull H-1
      </DnaButton>

      <DnaButton
        variant="primary"
        size="lg"
        disabled={loading}
        onClick={activeTab === "paid" ? submitAds : submitOrganic}
        icon={loading ? undefined : <Save className="w-5 h-5" />}
        className="shadow-2xl shadow-blue-200 active:scale-95"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Sync to Cloud"
        )}
      </DnaButton>
    </div>
  );
}
