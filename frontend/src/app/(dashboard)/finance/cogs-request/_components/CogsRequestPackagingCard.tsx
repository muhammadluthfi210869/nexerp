import React from "react";
import { Boxes, X } from "lucide-react";
import { DataCard, DnaBadge, DnaButton, DnaInput } from "@/components/dna";

interface CogsRequestPackagingCardProps {
  currentMoq: string;
  onCurrentMoqChange: (value: string) => void;
  onAddMoq: () => void;
  moqList: number[];
  onRemoveMoq: (index: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

export function CogsRequestPackagingCard({
  currentMoq,
  onCurrentMoqChange,
  onAddMoq,
  moqList,
  onRemoveMoq,
  notes,
  onNotesChange,
}: CogsRequestPackagingCardProps) {
  return (
    <DataCard
      dotColor="bg-blue-600"
      title="PACKAGING & SCALE"
      titleColor="text-slate-400"
      className="!p-5 rounded-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Primary Packaging</label>
          <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
            <option>Bottle Airless 30ml Gold</option>
            <option>Jar Acrylic 50g White</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Secondary Packaging</label>
          <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
            <option>Inner Box Ivory 350gsm + Doff</option>
            <option>Inner Box Silver Foil Gloss</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">MOQ Points for Analysis</label>
          <DnaBadge variant="info">Comparative Costing</DnaBadge>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <DnaInput 
              type="text" 
              value={currentMoq}
              onChange={(e) => onCurrentMoqChange(e.target.value)}
              placeholder="E.g., 1000, 5000, 10000" 
              icon={<Boxes className="w-4 h-4 text-slate-400" />}
              className="bg-slate-50 border-none rounded-xl text-xs h-11" 
            />
          </div>
          <DnaButton 
            variant="primary"
            onClick={onAddMoq}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ADD POINT
          </DnaButton>
        </div>

        {moqList.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {moqList.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg px-3 py-1 shadow-sm">
                {m.toLocaleString()} PCS
                <button onClick={() => onRemoveMoq(i)}>
                  <X className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-4 border-t border-slate-100 mt-4">
        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Commercial Notes / Context</label>
        <textarea 
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all" 
          rows={3} 
          placeholder="Provide context for valuation (e.g., promotional bundle or high-volume export order)..."
        />
      </div>
    </DataCard>
  );
}
