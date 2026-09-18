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

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dna-visual/catalog"
            className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer text-decoration-none"
          >
            <span>📚 Buka Komponen Catalog</span>
          </Link>
          <Link
            href="/dna-visual/golden-reference"
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-[12px] flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer text-decoration-none"
          >
            <span>🚀 Golden Reference Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
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

      {/* ── 04. LIVE STANDARDIZED DNA COMPONENTS SHOWCASE ── */}
      <DnaShowcaseSection />
    </div>
  );
}

import {
  DnaToolbar,
  DnaConfirmDialog,
  DnaCurrencyInput,
  DnaNumberInput,
  DnaPercentageInput,
  DnaSearchableSelect,
  DnaDatePicker,
  DnaSwitch,
  DnaRadioGroup,
  DnaTextarea,
  DnaInput,
  DnaResultModal,
  DnaVoidDialog,
  DnaLineItemsTable,
  DnaFormSection,
  DnaStickyFooter,
  DnaWorkflowBar,
  DnaToastProvider,
  useDnaToast,
  type DnaConfirmVariant,
  type DnaLineItem,
} from "@/components/dna";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  FileX2,
  Package,
} from "lucide-react";

function DnaShowcaseSection() {
  return (
    <DnaToastProvider>
      <DnaShowcaseContent />
    </DnaToastProvider>
  );
}

function DnaShowcaseContent() {
  const toast = useDnaToast();

  // Toolbar state
  const [searchVal, setSearchVal] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const isFiltered = Boolean(searchVal || filterCategory !== "ALL");

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    variant: DnaConfirmVariant;
    title: string;
    description: string;
    confirmTextRequired?: string;
  }>({
    isOpen: false,
    variant: "danger",
    title: "",
    description: "",
  });

  // Form input state
  const [currencyVal, setCurrencyVal] = useState<number>(15750000);
  const [textInputVal, setTextInputVal] = useState("Serum Anti Aging 30ml");
  const [hasError, setHasError] = useState(false);
  const [searchableVal, setSearchableVal] = useState<string | number | null>("PRD-01");
  const [dateVal, setDateVal] = useState<string>("2026-08-31");
  const [qtyVal, setQtyVal] = useState<number>(5000);
  const [percentVal, setPercentVal] = useState<number>(11);
  const [radioVal, setRadioVal] = useState<string | number>("NET30");
  const [switchVal1, setSwitchVal1] = useState<boolean>(true);
  const [switchVal2, setSwitchVal2] = useState<boolean>(false);
  const [notesVal, setNotesVal] = useState<string>("Batch lulus uji mikrobiologi & stabilitas tanpa catatan.");

  // Workflow state
  const [activeWorkflowStage, setActiveWorkflowStage] = useState("APPROVED");
  const [isWorkflowVoided, setIsWorkflowVoided] = useState(false);

  // Result & Void modal states
  const [resultModalState, setResultModalState] = useState<{
    isOpen: boolean;
    status: "success" | "error";
  }>({
    isOpen: false,
    status: "success",
  });
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);

  // Line items state
  const [demoLineItems, setDemoLineItems] = useState<DnaLineItem[]>([
    {
      id: "item-1",
      itemId: "PRD-01",
      itemName: "Acne Clarifying Serum 30ml",
      qty: 2500,
      unit: "Pcs",
      unitPrice: 18500,
      discountPercent: 5,
    },
    {
      id: "item-2",
      itemId: "PRD-02",
      itemName: "Hydrating Barrier Toner 100ml",
      qty: 1200,
      unit: "Pcs",
      unitPrice: 14200,
      discountPercent: 0,
    },
  ]);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
        <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
          04. Standardized Visual DNA Components Showcase
        </h2>
      </div>

      {/* A. STANDARDIZED TABLE TOOLBAR HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
              Layer 04 · Canonical Toolbar
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              DnaToolbar (Header Tabel Terpadu: Search + Filter + Reset + Primary Action)
            </h3>
            <p className="text-xs text-slate-500">
              Menyatukan search bar beradius 12px, dropdown filter, tombol reset conditional, dan single primary button di kanan.
            </p>
          </div>
        </div>

        <DnaToolbar
          variant="card"
          searchPlaceholder="Cari nomor dokumen, nama klien..."
          searchValue={searchVal}
          onSearchChange={setSearchVal}
          isFiltered={isFiltered}
          onReset={() => {
            setSearchVal("");
            setFilterCategory("ALL");
            toast.info("Filter direset ke nilai default");
          }}
          filters={
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-[12px] text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SKINCARE">Skincare & Serum</option>
              <option value="SUNCARE">Suncare & Lotion</option>
              <option value="BODYCARE">Bodycare</option>
            </select>
          }
          actionButton={
            <button
              type="button"
              onClick={() => toast.success("Tombol Aksi Utama Ditekan", "Membuka modal input data baru")}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dokumen Baru</span>
            </button>
          }
        />
      </div>

      {/* B. CONFIRMATION DIALOG WINDOWS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
            Overlays & Window
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            DnaConfirmDialog (Window Konfirmasi Terstandarisasi)
          </h3>
          <p className="text-xs text-slate-500">
            Window konfirmasi baku dengan backdrop blur halus, ikon semantik, feedback loading, dan opsi validasi ketik teks konfirmasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                variant: "danger",
                title: "Hapus Work Order #WO-2608-01?",
                description:
                  "Tindakan ini akan menghapus alokasi batch bahan baku dan tidak dapat dibatalkan.",
                confirmTextRequired: "HAPUS",
              })
            }
            className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Test Dialog Hapus (Danger + Validasi)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                variant: "warning",
                title: "Batalkan Posting Faktur #FP-2026-08?",
                description:
                  "Faktur akan dikembalikan ke status DRAFT dan jurnal penyesuaian akan dibuat otomatis.",
              })
            }
            className="h-9 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Test Dialog Warning (Unpost)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                variant: "success",
                title: "Submit & Posting Dokumen Final",
                description:
                  "Seluruh mutasi stok dan jurnal buku besar akan diperbarui secara permanen.",
              })
            }
            className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Test Dialog Sukses (Posting)</span>
          </button>
        </div>

        <DnaConfirmDialog
          isOpen={confirmDialog.isOpen}
          variant={confirmDialog.variant}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmTextRequired={confirmDialog.confirmTextRequired}
          onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
          onConfirm={async () => {
            await new Promise((r) => setTimeout(r, 600));
            setConfirmDialog((p) => ({ ...p, isOpen: false }));
            toast.success("Aksi Berhasil Dijalankan!", "Status dokumen telah diperbarui.");
          }}
        />
      </div>

      {/* C. FORM CONTROLS & COMPREHENSIVE INPUTS SUITE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
            Form Controls & Inputs Suite
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Visual DNA Comprehensive Inputs (Master Search, Tanggal, Angka, Diskon, Radio & Switch)
          </h3>
          <p className="text-xs text-slate-500">
            Katalog kendali form terstandarisasi untuk seluruh modul operasional NEX ERP.
          </p>
        </div>

        {/* Row 1: Searchable Combobox with Min Char Threshold & DatePicker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Searchable Autocomplete (Min 2 Karakter)
              </h4>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                minSearchChars = 2
              </span>
            </div>
            <DnaSearchableSelect
              label="Pilih Produk Master (Ketik 'ac' atau 'ton')"
              placeholder="Cari nama produk / kode..."
              minSearchChars={2}
              value={searchableVal}
              onValueChange={setSearchableVal}
              options={[
                { value: "PRD-01", label: "Acne Clarifying Serum 30ml", description: "Bahan Baku Skincare • Batch QC Rilis", badge: "Aktif", badgeVariant: "emerald" },
                { value: "PRD-02", label: "Hydrating Barrier Toner 100ml", description: "Mixing Line B • Stok: 1.200 Pcs", badge: "Stok Rendah", badgeVariant: "amber" },
                { value: "PRD-03", label: "Sunscreen Gel SPF 50 50ml", description: "Menunggu UV Filter Zinc Oxide", badge: "Pending", badgeVariant: "purple" },
                { value: "PRD-04", label: "Gentle Cleanser Oat 120ml", description: "Warehouse FG • Batch #2026-085", badge: "Tersedia", badgeVariant: "emerald" },
              ]}
              helperText="Hasil dropdown hanya akan muncul setelah mengetik minimal 2 karakter"
              required
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Input Pemilih Tanggal (DnaDatePicker)
            </h4>
            <DnaDatePicker
              label="Tanggal Faktur / Jatuh Tempo"
              value={dateVal}
              onChange={setDateVal}
              helperText={`Format tersimpan ISO: ${dateVal || "Belum dipilih"}`}
              required
            />
          </div>
        </div>

        {/* Row 2: Currency Input & Number Stepper & Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Rupiah Currency Input
            </h4>
            <DnaCurrencyInput
              label="Nilai Total Kontrak"
              value={currencyVal}
              onValueChange={setCurrencyVal}
              helperText={`Number value: ${currencyVal}`}
              required
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Number Stepper (Kuantitas)
            </h4>
            <DnaNumberInput
              label="Jumlah Batch Produksi"
              value={qtyVal}
              onValueChange={setQtyVal}
              unit="Pcs"
              min={1}
              max={50000}
              step={100}
              helperText="Tombol + / - dengan step 100"
              required
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              5. Percentage Input (Diskon/Pajak)
            </h4>
            <DnaPercentageInput
              label="Tarif PPN / Diskon Promo"
              value={percentVal}
              onValueChange={setPercentVal}
              min={0}
              max={100}
              helperText="Auto-clamping 0% – 100%"
            />
          </div>
        </div>

        {/* Row 3: Radio Group & Switch & Textarea */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              6. Radio Group (Card Variant)
            </h4>
            <DnaRadioGroup
              label="Metode Pembayaran / TOP"
              value={radioVal}
              onValueChange={setRadioVal}
              options={[
                { value: "CASH", label: "Cash Before Delivery (CBD)", description: "Pelunasan sebelum barang dikirim" },
                { value: "NET30", label: "Tempo 30 Hari (Net 30)", description: "Batas jatuh tempo 30 hari kalender" },
              ]}
              required
            />
          </div>

          <div className="space-y-4 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              7. Toggle Switch
            </h4>
            <div className="space-y-3 pt-1">
              <DnaSwitch
                checked={switchVal1}
                onCheckedChange={setSwitchVal1}
                label="Status Dokumen Aktif"
                description="Izinkan transaksi menggunakan master data ini"
              />
              <DnaSwitch
                checked={switchVal2}
                onCheckedChange={setSwitchVal2}
                label="Kirim Notifikasi WhatsApp"
                description="Kirim link PDF otomatis ke nomor PIC klien"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              8. Textarea dengan Counter
            </h4>
            <DnaTextarea
              label="Catatan Khusus Batch QC"
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              placeholder="Tuliskan catatan inspeksi..."
              maxLength={150}
              showCount
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* D. TOAST NOTIFICATIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded">
            Feedback System
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            DnaToast (Notifikasi Alert Melayang)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => toast.success("Data Berhasil Disimpan", "Faktur #FP-092 telah masuk ke antrean approval.")}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[12px] font-semibold cursor-pointer border-none shadow-xs"
          >
            Toast Success
          </button>
          <button
            type="button"
            onClick={() => toast.error("Gagal Menyimpan Data", "Koneksi ke database timeout atau field wajib belum diisi.")}
            className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[12px] font-semibold cursor-pointer border-none shadow-xs"
          >
            Toast Error
          </button>
          <button
            type="button"
            onClick={() => toast.warning("Stok Menipis", "Bahan baku Zinc Oxide tersisa di bawah minimum safety stock.")}
            className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[12px] font-semibold cursor-pointer border-none shadow-xs"
          >
            Toast Warning
          </button>
          <button
            type="button"
            onClick={() => toast.info("Sinkronisasi Selesai", "24 mutasi kas berhasil disinkronkan.")}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[12px] font-semibold cursor-pointer border-none shadow-xs"
          >
            Toast Info
          </button>
        </div>
      </div>

      {/* E. WORKFLOW STATUS STEPPER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded">
              Lifecycle & Status
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              DnaWorkflowBar (Indikator Tahapan Status Dokumen)
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan progres tahapan approval dan operasional dokumen. Klik tahapan untuk menguji perubahan status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsWorkflowVoided(!isWorkflowVoided)}
            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer border-none bg-transparent"
          >
            Toggle Status Void/Batal
          </button>
        </div>

        <DnaWorkflowBar
          stages={[
            { key: "DRAFT", label: "Draft Awal", description: "Oleh Operator" },
            { key: "SUBMITTED", label: "Menunggu Review", description: "Verifikasi QC" },
            { key: "APPROVED", label: "Disetujui", description: "SPV Rilis Batch" },
            { key: "PRODUCTION", label: "Proses Produksi", description: "Line Homogenizer" },
            { key: "COMPLETED", label: "Selesai FG", description: "Gudang Logistik" },
          ]}
          currentStageKey={activeWorkflowStage}
          onStageClick={setActiveWorkflowStage}
          isVoided={isWorkflowVoided}
          voidReason="Formula parfum dibatalkan oleh permintaan resmi klien."
        />
      </div>

      {/* F. POST-ACTION RESULT SCREENS & VOID DIALOG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
            Post-Action & Outcome
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            DnaResultModal & DnaVoidDialog (Layar Hasil Transaksi & Pembatalan)
          </h3>
          <p className="text-xs text-slate-500">
            Standar tampilan hasil eksekusi form (Sukses dengan tombol Cetak/Detail / Gagal dengan Checklist Rincian Error) serta pembatalan transaksi dengan alasan wajib.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setResultModalState({ isOpen: true, status: "success" })}
            className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Test Pop-up Hasil Sukses (Next Actions)</span>
          </button>

          <button
            type="button"
            onClick={() => setResultModalState({ isOpen: true, status: "error" })}
            className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Test Pop-up Hasil Gagal (Error Checklist)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoidDialogOpen(true)}
            className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileX2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Test Dialog Pembatalan / Void</span>
          </button>
        </div>

        {/* Result Modal Demo */}
        <DnaResultModal
          isOpen={resultModalState.isOpen}
          status={resultModalState.status}
          onClose={() => setResultModalState((p) => ({ ...p, isOpen: false }))}
          title={
            resultModalState.status === "success"
              ? "Work Order Berhasil Diterbitkan!"
              : "Gagal Menerbitkan Dokumen"
          }
          subtitle={
            resultModalState.status === "success"
              ? "Batch produksi telah dialokasikan ke Line B dan nomor batch resmi telah diterbitkan."
              : "Sistem menemukan inkonsistensi data pada form input. Harap perbaiki field yang bermasalah."
          }
          documentCode={resultModalState.status === "success" ? "WO-2026-088" : undefined}
          summaryItems={[
            { label: "Produk", value: "Acne Clarifying Serum 30ml" },
            { label: "Target Batch", value: "5.000 Pcs" },
            { label: "Estimasi Selesai", value: "15 September 2026" },
            { label: "Total Nilai", value: "Rp 92.500.000" },
          ]}
          errorList={[
            "Baris 2: Stok Bahan Baku 'Zinc Oxide' tidak mencukupi (Sisa 4 Kg, dibutuhkan 10 Kg).",
            "Field 'Tanggal Jatuh Tempo' tidak boleh mendahului tanggal faktur.",
            "Rekening Kas/Bank belum dipilih untuk metode pembayaran Tunai.",
          ]}
          onPrint={() => toast.info("Membuka dialog cetak PDF...", "Dokumen siap dicetak")}
          onViewDetail={() => toast.info("Navigasi ke halaman detail...", "Membuka WO-2026-088")}
          onCreateAnother={() => {
            setResultModalState((p) => ({ ...p, isOpen: false }));
            toast.success("Form direset!", "Siap menginput data baru");
          }}
          onBackToList={() => {
            setResultModalState((p) => ({ ...p, isOpen: false }));
            toast.info("Kembali ke tabel list master data");
          }}
        />

        {/* Void Dialog Demo */}
        <DnaVoidDialog
          isOpen={isVoidDialogOpen}
          onClose={() => setIsVoidDialogOpen(false)}
          documentCode="PO-202608-000033"
          documentTitle="Purchase Order"
          onConfirmVoid={async (reason) => {
            await new Promise((r) => setTimeout(r, 600));
            setIsVoidDialogOpen(false);
            toast.warning("Dokumen Dibatalkan!", `Alasan: ${reason}`);
          }}
        />
      </div>

      {/* G. MASTER-DETAIL TRANSACTION FORM */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
            Master-Detail Form Pattern
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            DnaFormSection & DnaLineItemsTable (Tabel Dinamis Tambah/Hapus Baris Barang)
          </h3>
          <p className="text-xs text-slate-500">
            Pola standar untuk seluruh form transaksi ERP (PO, Faktur, SPK, Resep Mixing, Jurnal).
          </p>
        </div>

        <DnaFormSection
          title="Rincian Item Barang & Alokasi Kuantitas"
          subtitle="Tambahkan baris barang, tentukan kuantitas, harga, dan diskon. Subtotal & PPN terhitung otomatis."
          icon={<Package />}
          badge="FORM TRANSAKSI"
          columns={1}
        >
          <DnaLineItemsTable
            items={demoLineItems}
            onItemsChange={setDemoLineItems}
            itemOptions={[
              { value: "PRD-01", label: "Acne Clarifying Serum 30ml", price: 18500, unit: "Pcs" },
              { value: "PRD-02", label: "Hydrating Barrier Toner 100ml", price: 14200, unit: "Pcs" },
              { value: "PRD-03", label: "Sunscreen Gel SPF 50 50ml", price: 21000, unit: "Pcs" },
              { value: "PRD-04", label: "Gentle Cleanser Oat 120ml", price: 12500, unit: "Pcs" },
            ]}
          />
        </DnaFormSection>

        {/* Bottom Form Action Footer Demo */}
        <DnaStickyFooter
          isFixed={false}
          onCancel={() => toast.info("Aksi form dibatalkan")}
          onSaveDraft={() => toast.success("Draft Disimpan", "Faktur tersimpan sebagai DRAFT")}
          onSubmit={() => setResultModalState({ isOpen: true, status: "success" })}
        />
      </div>
    </div>
  );
}

