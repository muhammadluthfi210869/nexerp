"use client";

import React from "react";
import { DnaDetailDrawer, DnaBadge, formatRupiah } from "@/components/dna";
import { JournalHeader } from "../_types/jurnal-umum.types";

interface JurnalUmumDetailDrawerProps {
  selectedJournal: JournalHeader | null;
  onClose: () => void;
}

export function JurnalUmumDetailDrawer({
  selectedJournal,
  onClose,
}: JurnalUmumDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedJournal}
      onClose={onClose}
      title={`Jurnal: ${selectedJournal?.code}`}
      subtitle={selectedJournal?.description || ""}
      badge={<DnaBadge variant="success">{selectedJournal?.status || "POSTED"}</DnaBadge>}
      tabs={[
        {
          id: "lines",
          label: "Baris Akun (Lines)",
          content: (
            <div className="space-y-4 p-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Tanggal:</span>
                  <strong className="block text-slate-800">{selectedJournal?.date}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Referensi:</span>
                  <strong className="block text-slate-800">{selectedJournal?.reference}</strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Akun COA</th>
                      <th className="p-2.5">Keterangan</th>
                      <th className="p-2.5 text-right">Debit (Rp)</th>
                      <th className="p-2.5 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedJournal?.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <span className="font-bold text-blue-700">{line.accountCode}</span>
                          <div className="text-[11px] text-slate-600">{line.accountName}</div>
                        </td>
                        <td className="p-2.5 text-slate-700">{line.lineDescription}</td>
                        <td className="p-2.5 text-right font-semibold text-emerald-700 tabular-nums">
                          {line.debit > 0 ? formatRupiah(line.debit) : "-"}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-800 tabular-nums">
                          {line.credit > 0 ? formatRupiah(line.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right">Total:</td>
                      <td className="p-2.5 text-right text-emerald-700">{formatRupiah(selectedJournal?.totalDebit || 0)}</td>
                      <td className="p-2.5 text-right text-slate-900">{formatRupiah(selectedJournal?.totalCredit || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        }
      ]}
    />
  );
}
