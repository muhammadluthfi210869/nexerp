import React from "react";
import { DataCard, DnaBadge, DnaInput } from "@/components/dna";
import { CogsSampleMap } from "../_types/cogs-request.types";

interface CogsRequestEntityCardProps {
  clientName: string;
  onClientNameChange: (value: string) => void;
  valuationDate: string;
  onValuationDateChange: (value: string) => void;
  selectedSample: string | null;
  onSelectedSampleChange: (value: string) => void;
  samples: CogsSampleMap;
  samplesLoading: boolean;
}

export function CogsRequestEntityCard({
  clientName,
  onClientNameChange,
  valuationDate,
  onValuationDateChange,
  selectedSample,
  onSelectedSampleChange,
  samples,
  samplesLoading,
}: CogsRequestEntityCardProps) {
  return (
    <DataCard
      dotColor="bg-blue-600"
      title="ENTITY IDENTIFICATION"
      titleColor="text-slate-400"
      className="!p-5 rounded-2xl animate-fade-slide-in"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Target Client</label>
          <div className="relative">
            <select
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">â€” SELECT CLIENT â€”</option>
              <option value="PT Maju Jaya">PT Maju Jaya</option>
              <option value="Beauty Hub Indonesia">Beauty Hub Indonesia</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Valuation Date</label>
          <div className="relative">
            <DnaInput 
              type="date" 
              value={valuationDate}
              onChange={(e) => onValuationDateChange(e.target.value)}
              className="bg-slate-50 border-none rounded-xl text-xs h-11" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mt-4">
        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Source Sample (R&D)</label>
        <select 
          onChange={(e) => onSelectedSampleChange(e.target.value)}
          value={selectedSample || ""}
          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
        >
          <option value="">â€” SELECT APPROVED SAMPLE â€”</option>
          {samplesLoading ? (
            <option disabled>Loading...</option>
          ) : (
            Object.entries(samples).map(([key, s]) => (
              <option key={key} value={key}>{s.name || key}</option>
            ))
          )}
        </select>
      </div>

      {selectedSample && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-0.5">
            <p className="text-[7px] font-black text-slate-400 uppercase">Product Name</p>
            <p className="font-black text-slate-900 text-[11px] uppercase italic">
              {samples[selectedSample]?.name || selectedSample}
            </p>
          </div>
          <div className="space-y-0.5 text-left md:text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase">Netto / Size</p>
            <p className="font-black text-slate-900 text-[11px] uppercase">
              {samples[selectedSample]?.netto || "-"}
            </p>
          </div>
          <div className="space-y-0.5 text-left md:text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase">Current Formula</p>
            <DnaBadge variant="purple">
              {`${samples[selectedSample]?.formula || "FML"} ${samples[selectedSample]?.revision || "Rev 1"}`}
            </DnaBadge>
          </div>
        </div>
      )}
    </DataCard>
  );
}
