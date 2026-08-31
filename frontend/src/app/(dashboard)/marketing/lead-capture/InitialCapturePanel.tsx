"use client";

/**
 * Batch 5 — Phase B. Surface operasional BusDev untuk hasil initial-capture.
 *
 * Tujuan: menjawab 3 pertanyaan, kilat.
 * 1. Siapa customer ini?
 * 2. Produk apa yang diminatinya?
 * 3. Apa yang sebenarnya dikatakan customer?
 *
 * Bahasa yang TIDAK dipakai (§4): confidence score, reasoning trace,
 * model name, "AI", tier, kompleks badge. Prefill AI adalah prefill, bukan
 * keputusan. Edit manusia OTORITATIF — confirmed=true mencegah extractor
 * menimpa di inbound berikutnya.
 */

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
 CheckCircle2,
 Pencil,
 X,
 User as UserIcon,
 Package,
 MessageSquare,
} from "lucide-react";

interface LeadAttr {
 id: string;
 key: string;
 value: string | null;
 confirmed: boolean;
 source?: string | null;
 confidence?: number | null;
}

interface LeadLite {
 id: string;
 fullName?: string | null;
 waName?: string | null;
 waMessage?: string | null;
 messages?: { body: string; createdAt: string | number | Date }[] | null;
 attributes?: LeadAttr[] | null;
}

const ATTR_LABELS: Record<string, string> = {
 fullName: "Nama",
 niche: "Produk Diminati",
 rawProductInterest: "Pesan Awal",
};

export function InitialCapturePanel({
 lead,
 onSaved,
}: {
 lead: LeadLite;
 onSaved: () => void;
}) {
 // ── read state from existing attributes (already loaded on the detail)
 const attr = useMemo(() => {
 const m: Record<string, LeadAttr | undefined> = {};
 (lead.attributes || []).forEach((a) => (m[a.key] = a));
 return m;
 }, [lead.attributes]);

 const nameValue = (attr.fullName?.value ?? lead.fullName ?? lead.waName ?? "") as string;
 const nicheValue = attr.niche?.value ?? "";
 const rawProduct = attr.rawProductInterest?.value ?? "";
 // Pesan Awal = raw product; kalau AI tidak menulisnya (gak ada sama sekali),
 // pakai waMessage / pesan pertama sebagai jaring pengaman §6.
 const fallbackMessage =
 rawProduct ||
 (lead.waMessage ?? "") ||
 (lead.messages && lead.messages[0]?.body) ||
 "";

 const products = useMemo(
 () => nicheValue.split(";").map((s) => s.trim()).filter(Boolean),
 [nicheValue],
 );

 // name confirmed? ← manusia pernah set ini (AI tidak akan pernah menimpa).
 const nameConfirmed = !!attr.fullName?.confirmed;

 return (
 <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
 <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
 Data Customer (Initial Capture)
 </p>

 <NameRow
 leadId={lead.id}
 initial={nameValue}
 confirmed={nameConfirmed}
 onSaved={onSaved}
 />

 <ProductRow
 leadId={lead.id}
 initial={products}
 rawProduct={rawProduct}
 customerSaid={fallbackMessage}
 onSaved={onSaved}
 />
 </div>
 );
}

// ──────────────────────────────────────────────────────────────────────
// Nama — edit inline, simpan sekali
// ──────────────────────────────────────────────────────────────────────
function NameRow({
 leadId,
 initial,
 confirmed,
 onSaved,
}: {
 leadId: string;
 initial: string;
 confirmed: boolean;
 onSaved: () => void;
}) {
 const [editing, setEditing] = useState(false);
 const [draft, setDraft] = useState(initial);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (!editing) setDraft(initial);
 }, [initial, editing]);

 const save = async () => {
 setSaving(true);
 try {
 await api.patch(`/lead-capture/${leadId}/attributes`, {
 key: "fullName",
 value: draft.trim() ? draft.trim() : null,
 });
 onSaved();
 setEditing(false);
 } catch (err: any) {
 alert(
 "Gagal menyimpan nama: " +
 (err?.response?.data?.message || err?.message),
 );
 } finally {
 setSaving(false);
 }
 };

 return (
 <div>
 <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1 flex items-center gap-1.5">
 <UserIcon className="w-3 h-3" /> Nama
 </p>
 {editing ? (
 <div className="flex gap-2">
 <input
 autoFocus
 value={draft}
 onChange={(e) => setDraft(e.target.value)}
 disabled={saving}
 placeholder="Nama customer"
 className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
 />
 <button
 onClick={save}
 disabled={saving}
 className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 hover:bg-emerald-600 transition-all flex items-center gap-1"
 >
 <CheckCircle2 className="w-4 h-4" /> Simpan
 </button>
 <button
 onClick={() => {
 setEditing(false);
 setDraft(initial);
 }}
 disabled={saving}
 className="h-10 px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ) : (
 <div className="flex items-center justify-between gap-2">
 <p
 className={
 "text-base font-bold " +
 (initial ? "text-slate-800" : "text-slate-400 italic")
 }
 >
 {initial || "Belum diisi"}
 </p>
 <div className="flex items-center gap-2 shrink-0">
 {initial && confirmed && (
 <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
 Diedit
 </span>
 )}
 <button
 onClick={() => setEditing(true)}
 className="h-8 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-all flex items-center gap-1"
 >
 <Pencil className="w-3 h-3" /> Edit
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

// ──────────────────────────────────────────────────────────────────────
// Produk Diminati — search/select dari kanonik, multi
// ──────────────────────────────────────────────────────────────────────
function ProductRow({
 leadId,
 initial,
 rawProduct,
 customerSaid,
 onSaved,
}: {
 leadId: string;
 initial: string[];
 rawProduct: string;
 customerSaid: string;
 onSaved: () => void;
}) {
 const [editing, setEditing] = useState(false);
 const [selected, setSelected] = useState<string[]>(initial);
 const [canonical, setCanonical] = useState<string[]>([]);
 const [filter, setFilter] = useState("");
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (!editing) return;
 if (canonical.length > 0) return;
 api
 .get("/lead-capture/products")
 .then((r) => setCanonical(r.data?.products ?? []))
 .catch(() => setCanonical([]));
 }, [editing, canonical.length]);

 useEffect(() => {
 if (!editing) setSelected(initial);
 }, [initial, editing]);

 const toggle = (p: string) => {
 setSelected((cur) =>
 cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
 );
 };

 const filtered = useMemo(() => {
 const q = filter.trim().toLowerCase();
 if (!q) return canonical;
 return canonical.filter((p) => p.toLowerCase().includes(q));
 }, [canonical, filter]);

 const save = async () => {
 setSaving(true);
 try {
 const value = selected.length > 0 ? selected.join("; ") : null;
 await api.patch(`/lead-capture/${leadId}/attributes`, {
 key: "niche",
 value,
 });
 onSaved();
 setEditing(false);
 } catch (err: any) {
 alert(
 "Gagal menyimpan produk: " +
 (err?.response?.data?.message || err?.message),
 );
 } finally {
 setSaving(false);
 }
 };

 const hasName = initial.length > 0;

 return (
 <div>
 <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1 flex items-center gap-1.5">
 <Package className="w-3 h-3" /> Produk Diminati
 </p>

 {editing ? (
 <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
 <input
 autoFocus
 placeholder="Cari produk…"
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5"
 />
 <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-lg">
 {filtered.length === 0 && (
 <p className="p-3 text-[11px] italic text-slate-400">
 Memuat / tidak ditemukan.
 </p>
 )}
 {filtered.map((p) => {
 const active = selected.includes(p);
 return (
 <button
 key={p}
 type="button"
 onClick={() => toggle(p)}
 className={
 "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-all " +
 (active ? "bg-blue-50" : "")
 }
 >
 <span className="font-medium text-slate-700">{p}</span>
 {active && (
 <CheckCircle2 className="w-4 h-4 text-blue-500" />
 )}
 </button>
 );
 })}
 </div>

 {selected.length > 0 && (
 <p className="text-[11px] text-slate-500">
 Dipilih:{" "}
 <span className="font-bold text-slate-700">
 {selected.join(", ")}
 </span>
 </p>
 )}

 <div className="flex justify-end gap-2 pt-1">
 <button
 onClick={() => {
 setEditing(false);
 setSelected(initial);
 }}
 disabled={saving}
 className="h-9 px-3 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all text-sm font-bold"
 >
 Batal
 </button>
 <button
 onClick={save}
 disabled={saving}
 className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 hover:bg-emerald-600 transition-all flex items-center gap-1"
 >
 <CheckCircle2 className="w-4 h-4" />{" "}
 {saving ? "Menyimpan…" : "Simpan"}
 </button>
 </div>
 </div>
 ) : (
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1">
 {hasName ? (
 <p className="text-base font-bold text-slate-800">
 {initial.join(", ")}
 </p>
 ) : (
 <p className="text-base text-slate-400 italic font-medium">
 Belum ditentukan
 </p>
 )}

 {!hasName && customerSaid && (
 <div className="mt-1.5 border border-amber-200 bg-amber-50 rounded-lg p-2.5">
 <p className="text-[10px] font-bold text-amber-700 mb-0.5 flex items-center gap-1">
 <MessageSquare className="w-3 h-3" /> Customer bilang:
 </p>
 <p className="text-sm text-amber-900 italic">
 "{customerSaid}"
 </p>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {hasName && rawProduct && (
 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
 Diedit
 </span>
 )}
 <button
 onClick={() => setEditing(true)}
 className={
 "h-8 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 " +
 (hasName
 ? "bg-slate-50 hover:bg-slate-100 text-slate-600"
 : "bg-blue-500 hover:bg-blue-600 text-white")
 }
 >
 <Pencil className="w-3 h-3" />{" "}
 {hasName ? "Edit" : "Pilih Produk"}
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
