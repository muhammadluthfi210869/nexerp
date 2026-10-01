"use client";

import React from "react";
import {
  DnaDetailDrawer,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { OperationalLeadBatch } from "../_types/crm-leads.types";

interface BatchDetailDrawerProps {
  batch: OperationalLeadBatch | null;
  onClose: () => void;
}

export function BatchDetailDrawer({ batch, onClose }: BatchDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!batch}
      onClose={onClose}
      title="Detail Distribusi Leads"
      subtitle={batch?.id}
      badge={batch ? `${batch.totalQtyLeads} Leads` : undefined}
      badgeVariant="primary"
      actions={
        <DnaButton variant="outline" onClick={onClose}>
          Tutup
        </DnaButton>
      }
    >
      {batch && (
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Leads</span>
              <span className="text-sm font-bold text-slate-800">{batch.tanggalLeads}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Catatan Distribusi</span>
              <span className="text-xs text-slate-700">{batch.catatan}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Rincian Penerima Leads</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="p-3">#</DnaTh>
                    <DnaTh className="p-3">Penerima Leads</DnaTh>
                    <DnaTh className="p-3 text-center">Qty</DnaTh>
                    <DnaTh className="p-3 text-center">Porsi (%)</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {batch.items.map((item, idx) => {
                    const pct = Math.round((item.qty / batch.totalQtyLeads) * 100);
                    return (
                      <DnaTableRow key={idx}>
                        <DnaTd className="p-3 text-slate-400">{idx + 1}</DnaTd>
                        <DnaTd className="p-3 font-bold text-slate-800">{item.penerima}</DnaTd>
                        <DnaTd className="p-3 text-center font-bold text-slate-700">{item.qty}</DnaTd>
                        <DnaTd className="p-3 text-center font-bold text-blue-600">{pct}%</DnaTd>
                      </DnaTableRow>
                    );
                  })}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
