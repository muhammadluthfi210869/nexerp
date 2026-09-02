"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  User,
  Bell,
  Sun,
  Zap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── COLOR TOKENS DATA ──
const COLOR_TOKENS = {
  primary: [
    { name: "Primary 600", hex: "#2563EB", bg: "bg-[#2563EB]", text: "text-white" },
    { name: "Primary Light", hex: "#EFF6FF", bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" },
  ],
  neutral: [
    { name: "Slate 900", hex: "#0F172A", bg: "bg-[#0F172A]", text: "text-white" },
    { name: "Slate 700", hex: "#334155", bg: "bg-[#334155]", text: "text-white" },
    { name: "Slate 500", hex: "#64748B", bg: "bg-[#64748B]", text: "text-white" },
    { name: "Slate 300", hex: "#CBD5E1", bg: "bg-[#CBD5E1]", text: "text-slate-900" },
    { name: "Slate 200", hex: "#E2E8F0", bg: "bg-[#E2E8F0]", text: "text-slate-900" },
    { name: "Slate 100", hex: "#F1F5F9", bg: "bg-[#F1F5F9]", text: "text-slate-900" },
    { name: "White", hex: "#FFFFFF", bg: "bg-white border border-slate-200", text: "text-slate-900" },
  ],
  semantic: [
    { name: "Success 600", hex: "#16A34A", bg: "bg-[#16A34A]", text: "text-white" },
    { name: "Success Light", hex: "#DCFCE7", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
    { name: "Warning 600", hex: "#D97706", bg: "bg-[#D97706]", text: "text-white" },
    { name: "Warning Light", hex: "#FEF3C7", bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
    { name: "Danger 600", hex: "#DC2626", bg: "bg-[#DC2626]", text: "text-white" },
    { name: "Danger Light", hex: "#FEF2F2", bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" },
  ],
  surface: [
    { name: "Background", hex: "#F8FAFC", bg: "bg-[#F8FAFC] border border-slate-200", text: "text-slate-900" },
    { name: "Surface 1", hex: "#FFFFFF", bg: "bg-white border border-slate-200", text: "text-slate-900" },
    { name: "Surface 2", hex: "#F5F7FA", bg: "bg-[#F5F7FA] border border-slate-200", text: "text-slate-900" },
    { name: "Border", hex: "#E2E8F0", bg: "bg-[#E2E8F0]", text: "text-slate-900" },
    { name: "Divider", hex: "#E5E7EB", bg: "bg-[#E5E7EB]", text: "text-slate-900" },
  ],
};

export default function DnaVisualPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="space-y-6 pb-16 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── SPEC BOARD HEADER BANNER ── */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-2xs shrink-0">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
                NEX ERP Design System Tokens & Foundations
              </h1>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                FOUNDATIONS BOARD
              </span>
            </div>
            <p className="text-[13px] leading-[18px] text-slate-500 font-normal mt-0.5">
              Core Design Tokens, Typography Scale, and Canonical Header. For full operational page simulation (05-11), go to Golden Reference.
            </p>
          </div>
        </div>

        <Link
          href="/dna-visual/golden-reference"
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-[12px] flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer text-decoration-none"
        >
          <span>🚀 Go to 100% Golden Reference Page</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── CLEAN 3-PART FOUNDATIONS BOARD (ONLY 01, 02, 03) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 01. COLOR TOKENS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[14px] leading-[20px] font-bold text-slate-900 uppercase tracking-wide">
                01. Color Tokens
              </h2>
              {copiedHex && (
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Copied {copiedHex}!
                </span>
              )}
            </div>

            <div className="space-y-3.5">
              {/* Primary */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Primary Accent</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_TOKENS.primary.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => handleCopyHex(c.hex)}
                      className="group cursor-pointer p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      <div className={cn("w-full h-7 rounded-lg shadow-2xs mb-1.5", c.bg)} />
                      <p className="font-semibold text-[11px] text-slate-800 leading-tight">{c.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Semantic Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_TOKENS.semantic.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => handleCopyHex(c.hex)}
                      className="group cursor-pointer p-1.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-center"
                    >
                      <div className={cn("w-full h-5 rounded-md shadow-2xs mb-1", c.bg)} />
                      <p className="font-semibold text-[10px] text-slate-800 truncate">{c.name}</p>
                      <p className="text-[8px] text-slate-400 font-mono">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Neutral */}
              <div className="pt-2.5 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Neutral Slate Palette</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_TOKENS.neutral.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => handleCopyHex(c.hex)}
                      className="group cursor-pointer p-1.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-center"
                    >
                      <div className={cn("w-full h-5 rounded-md shadow-2xs mb-1", c.bg)} />
                      <p className="font-semibold text-[9px] text-slate-800 truncate">{c.name}</p>
                      <p className="text-[8px] text-slate-400 font-mono">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surface */}
              <div className="pt-2.5 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Surface Fills & Borders</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {COLOR_TOKENS.surface.map((c) => (
                    <div key={c.name} className="p-1.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className={cn("w-full h-4.5 rounded-md shadow-2xs mb-1", c.bg)} />
                      <p className="font-semibold text-[9px] text-slate-800 truncate">{c.name}</p>
                      <p className="text-[8px] text-slate-400 font-mono">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 02. TYPOGRAPHY SCALE */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-[14px] leading-[20px] font-bold text-slate-900 uppercase tracking-wide mb-3.5">
              02. Typography Scale
            </h2>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="font-bold text-[18px] text-slate-900 w-8 shrink-0">Aa</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-slate-900">Page Title</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">32 / 40 - Bold</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Untuk judul halaman utama. Contoh: <span className="font-bold text-slate-900">Work Orders & Production</span></p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="font-semibold text-[16px] text-slate-800 w-8 shrink-0">Aa</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-slate-900">Section Title</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">20 / 28 - Semibold</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Untuk judul section / modul. Contoh: <span className="font-semibold text-slate-900">Intake Klien</span></p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="text-[14px] text-slate-700 w-8 shrink-0">Aa</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-normal text-slate-900">Body / Regular</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">14 / 20 - Regular</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Teks utama untuk konten. Contoh: Deskripsi, label</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="font-medium text-[14px] text-slate-800 w-8 shrink-0">Aa</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-medium text-slate-900">Body / Medium</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">14 / 20 - Medium</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Untuk teks penting / emphasized. Contoh: Nilai, highlight</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="font-semibold text-[12px] text-slate-700 uppercase w-8 shrink-0">B</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-slate-900">Table Header</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">12 / 16 - Semibold</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Digunakan di header tabel. Contoh: <span className="font-semibold uppercase text-slate-800">WO, PRODUK, KLIEN</span></p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="text-[12px] text-slate-500 w-8 shrink-0">A</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-700">Helper / Caption</p>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">12 / 16 - Regular</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Teks bantu, catatan, hint. Contoh: Helper text, caption</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/30 flex items-start gap-2.5">
                <span className="font-bold text-[18px] text-blue-600 w-8 shrink-0">2a</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-slate-900">KPI Value</p>
                    <span className="text-[11px] text-blue-600 font-mono font-bold">24 / 32 - Bold</span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-0.5">Nilai utama pada KPI card. Contoh: <span className="font-bold text-slate-900">450 Jt, 64%</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 03. CANONICAL TOP NAVBAR */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-[14px] leading-[20px] font-bold text-slate-900 uppercase tracking-wide mb-3.5">
              03. Canonical Top Navbar
            </h2>

            {/* PREVIEW CONTAINER */}
            <div className="border border-slate-200 rounded-xl bg-white p-3 shadow-2xs mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  N
                </div>

                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    placeholder="Cari parameter, node, atau log..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-10 py-1 text-[11px] text-slate-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 border border-slate-200 rounded px-1">
                    Ctrl+K
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-bold">
                    STABIL V2.0
                  </span>
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold">
                    SINKRONISASI
                  </span>
                  <div className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <div className="relative p-1 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-600 text-white rounded-full text-[7px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    SA
                  </div>
                </div>
              </div>
            </div>

            {/* CALLOUT LEGEND LIST */}
            <div className="space-y-2.5 text-[12px]">
              <div className="p-2 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Search className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">Global Search</p>
                  <p className="text-[11px] text-slate-500">Akses cepat ke parameter, data, dan audit di seluruh sistem</p>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">Version / System Status</p>
                  <p className="text-[11px] text-slate-500">Informasi versi rilis dan status sinkronisasi real-time</p>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Sun className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">Theme Toggle</p>
                  <p className="text-[11px] text-slate-500">Light mode default untuk visibilitas optimal</p>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">Notifications</p>
                  <p className="text-[11px] text-slate-500">Pusat notifikasi sistem dan aktivitas penting</p>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">User Menu</p>
                  <p className="text-[11px] text-slate-500">Akses profil, pengaturan, dan logout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
