"use client";

import React from "react";
import { PhoneCall } from "lucide-react";
import { DnaDetailDrawer, DnaButton } from "@/components/dna";
import type { LeadConversion } from "../_types/crm-leads.types";

interface LeadDetailDrawerProps {
  lead: LeadConversion | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ lead, onClose }: LeadDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!lead}
      onClose={onClose}
      title={lead?.nama || "Detail Lead Inbound"}
      subtitle={lead?.perusahaan || "Perusahaan Belum Terdaftar"}
      badge={lead?.status}
      badgeVariant={
        lead?.status === "Qualified" || lead?.status === "WON"
          ? "success"
          : lead?.status === "Contacted"
          ? "warning"
          : "neutral"
      }
      actions={
        <>
          {lead?.hp && (
            <a
              href={`https://wa.me/${lead.hp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Hubungi via WhatsApp
            </a>
          )}
          <DnaButton variant="outline" onClick={onClose}>
            Tutup
          </DnaButton>
        </>
      }
    >
      {lead && (
        <div className="space-y-5 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waktu Masuk</span>
                <span className="font-semibold text-slate-800">
                  {new Date(lead.timestamp).toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status Saat Ini</span>
                <span className="font-bold text-slate-900">{lead.status}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nomor WhatsApp</span>
              <span className="font-bold text-emerald-600 tabular-nums text-sm">{lead.hp || "-"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Atribut Landing Page & Traffic</h4>
            <div className="grid grid-cols-2 gap-3 border border-slate-200 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kanal Traffic</span>
                <span className="font-bold text-slate-800">{lead.trafficSource || "Direct"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sumber Brand</span>
                <span className="font-bold text-slate-800">{lead.source || "Dreamlab"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Produk Peminatan</span>
                <span className="font-bold text-blue-600">{lead.produk || "Formulasi Kosmetik"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Bertugas</span>
                <span className="font-bold text-slate-800">{lead.assignedTo || "Unassigned"}</span>
              </div>
            </div>
          </div>

          {lead.pageUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">URL Landing Page</span>
              <span className="text-slate-600 break-all text-[11px] tabular-nums">{lead.pageUrl}</span>
            </div>
          )}
        </div>
      )}
    </DnaDetailDrawer>
  );
}
