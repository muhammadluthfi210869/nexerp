import React from "react";

interface PoNotesSectionProps {
  noteText: string;
  setNoteText: (val: string) => void;
}

export function PoNotesSection({ noteText, setNoteText }: PoNotesSectionProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        3. Catatan Khusus PO
      </h3>
      <div>
        <label className="font-bold text-slate-700 block mb-1 text-xs">Catatan Khusus PO</label>
        <textarea
          className="w-full h-32 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Catatan instruksi packing, lot expired date, atau syarat COA..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
      </div>
    </div>
  );
}
