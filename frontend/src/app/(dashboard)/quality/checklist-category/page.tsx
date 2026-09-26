"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import {
  History,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  Save,
  GitCommit,
  Clock,
  ArrowRight,
  Settings2,
  Workflow,
  CheckCircle2,
  ShieldAlert,
  ArrowDownWideNarrow,
  Timer,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Input,
  Card,
  DnaBadge,
  StatCard,
  DnaButton,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { FormShell } from "@/components/layout/FormShell";

/** A field the backend does not send is shown as unknown, never guessed. */
interface CategoryRow {
  nama: string;
  urutan: number;
  lama_hari: number | null;
  setelah: string;
  type: string;
}

const UNKNOWN = "—";

const DEPENDENCY_OPTIONS = [
  "Desain Logo", "HKI", "BPOM NA", "BPOM Merk", "MOU", "Desain Kemasan", 
  "Approval Desain", "Bahan Baku", "Bahan Kemas", "Label", "Box", 
  "Produksi", "Packing", "Delivery", "Halal", "Uji Lab"
];

export default function ChecklistCategoryPrototype() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Kategori Checklist...</div>}>
      <ChecklistCategoryContent />
    </Suspense>
  );
}

function ChecklistCategoryContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "form">("list");
  // Rows come only from the live endpoint. A failed or empty response renders
  // an empty/honest state — it must never be backfilled with a literal.
  const { data: categories = [], isLoading, isError, refetch } = useQuery<CategoryRow[]>({
    queryKey: ["qc-checklist-categories"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists/categories");
      const raw = res.data?.data || res.data || [];
      if (!Array.isArray(raw)) return [];
      return raw.map((c: any): CategoryRow => {
        // `/qc/checklists/categories` sends { id, label, order, gate }. Only
        // those are real; anything else is reported as unknown rather than
        // filled with a default that reads like data.
        const days = c.defaultDays ?? c.lama_hari ?? null;
        return {
          nama: c.label || c.name || c.id,
          urutan: Number(c.order ?? c.sequence ?? 0),
          lama_hari: days === null || days === "" ? null : Number(days),
          setelah: c.after || c.afterCategory || "-",
          type: c.gate || c.type || UNKNOWN,
        };
      });
    },
  });

  const dependencies = categories.filter((c) => c.setelah && c.setelah !== "-").length;
  const knownDays = categories.map((c) => c.lama_hari).filter((d): d is number => d !== null);
  const maxDays = knownDays.length > 0 ? Math.max(...knownDays) : null;

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setView("form");
    }
  }, [searchParams]);

  return (
    <FormShell
      title="Kategori"
      titleAccent="Checklist"
      subtitle="Lead-Time Management & Automated Quality Control Sequence Protocols"
      actions={
        <div className="flex gap-4">
          <DnaButton 
            variant="outline"
            className="rounded-[14px] text-[12px]"
          >
            <History className="mr-2 h-4 w-4 text-blue-500" /> Version Control
          </DnaButton>
          <DnaButton
            variant="secondary"
            onClick={() => setView("form")}
            className="rounded-[14px] text-[12px]"
          >
            <Plus className="mr-2 h-5 w-5" /> Define Category
          </DnaButton>
        </div>
      }
    >

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Kategori Aktif" value={String(categories.length)} icon={<Workflow className="h-6 w-6" />} />
              <StatCard
                label="SLA Terpanjang"
                value={maxDays === null ? UNKNOWN : `${maxDays}d`}
                icon={<Timer className="h-6 w-6" />}
              />
              <StatCard label="Kategori Berdependensi" value={String(dependencies)} icon={<GitCommit className="h-6 w-6" />} />
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="flex justify-between items-center">
                  <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search Protocols..." className="pl-10 h-11 bg-[var(--gray-50)] border border-[var(--border-color)] rounded-[12px] text-xs font-medium" />
                  </div>
                  <div className="flex gap-4">
                    <DnaButton variant="ghost">
                      Sort: Execution Order
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="hover:bg-transparent border-[var(--border-color)]">
                    <DnaTh className="py-6 pl-10 text-table-header w-24 text-center">Order</DnaTh>
                    <DnaTh className="text-table-header">Category Identity</DnaTh>
                    <DnaTh className="text-table-header">Default SLA</DnaTh>
                    <DnaTh className="text-table-header">Sequence Hook (After)</DnaTh>
                    <DnaTh className="pr-10 text-right text-table-header">Action</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {isError && (
                    <DnaTableRow className="hover:bg-transparent">
                      <DnaTd colSpan={5} className="py-10 text-center">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-tight">
                          Gagal memuat kategori checklist dari server.
                        </p>
                        <DnaButton variant="outline" className="mt-3 rounded-[14px] text-[12px]" onClick={() => refetch()}>
                          Coba lagi
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  )}
                  {!isError && !isLoading && categories.length === 0 && (
                    <DnaTableRow className="hover:bg-transparent">
                      <DnaTd colSpan={5} className="py-10 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                          Belum ada kategori checklist yang terdaftar.
                        </p>
                      </DnaTd>
                    </DnaTableRow>
                  )}
                  {categories.map((cat) => (
                    <DnaTableRow key={cat.nama} className="group hover:bg-amber-50/30 transition-all duration-300 border-b border-[var(--border-color)]">
                      <DnaTd className="py-6 pl-10 text-center">
                          <span className="h-10 w-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center mx-auto font-bold shadow-sm group-hover:scale-110 transition-transform">
                            {cat.urutan}
                         </span>
                      </DnaTd>
                      <DnaTd>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 tracking-tight text-sm">{cat.nama}</span>
                            <DnaBadge variant="default" className="w-fit mt-1">{cat.type}</DnaBadge>
                          </div>
                        </div>
                      </DnaTd>
                      <DnaTd>
                         <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            {cat.lama_hari === null ? (
                              <span className="text-sm font-bold text-slate-400 tabular-nums">{UNKNOWN}</span>
                            ) : (
                              <span className="text-sm font-bold text-slate-900 tabular-nums">{cat.lama_hari} <span className="text-[10px] text-slate-400 uppercase">Days</span></span>
                            )}
                         </div>
                      </DnaTd>
                      <DnaTd>
                        {cat.setelah === "-" ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Independent</span>
                        ) : (
                          <div className="flex items-center gap-2">
                             <ArrowRight className="h-4 w-4 text-emerald-500" />
                             <span className="text-[10px] font-bold text-emerald-600 uppercase underline decoration-emerald-200 underline-offset-4">{cat.setelah}</span>
                          </div>
                        )}
                      </DnaTd>
                      <DnaTd className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                            <DnaButton variant="ghost" className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                               <Settings2 className="h-5 w-5" />
                            </DnaButton>
                           <DnaButton variant="ghost" className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                              <Trash2 className="h-5 w-5" />
                           </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </TableWrapper>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-10 pb-20"
          >
            {/* Form Nav */}
            <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border border-[var(--border-color)] shadow-sm">
               <DnaButton
                  variant="ghost"
                  onClick={() => setView("list")}
                  className="group rounded-2xl p-2 pr-6 hover:bg-rose-50 hover:text-rose-600"
                >
                   <div className="h-11 w-11 rounded-xl bg-gray-100 text-gray-600 shadow-lg flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                     <ChevronLeft className="h-5 w-5" />
                  </div>
                  <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-rose-600">Cancel Protocol</span>
                </DnaButton>
               <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Drafting Phase</span>
                     <span className="text-xs font-black uppercase text-amber-600">Protocol 12-CKL</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <DnaButton variant="primary" className="h-12 px-8 bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-xl shadow-amber-100 tracking-widest text-[10px]">
                     <Save className="mr-2 h-4 w-4" /> Save Protocol
                  </DnaButton>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Left: General Config */}
               <div className="lg:col-span-7 space-y-10">
                   <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white space-y-10">
                      <div className="flex items-center gap-3">
                         <LayoutGrid className="h-5 w-5 text-amber-600" />
                         <h2 className="text-lg font-black uppercase tracking-tighter">Identity <span className="text-amber-600">& Sequence</span></h2>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Designation Name</label>
                           <Input placeholder="E.g., Legal Document Submission" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs italic focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution Order</label>
                              <Input type="number" placeholder="1" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black text-xs" />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Global SLA</label>
                              <div className="relative">
                                 <Input type="number" placeholder="0" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black text-xs" />
                                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Days</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dependency Hook (Start After)</label>
                           <select className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-amber-500 transition-all italic">
                              <option value="">â€” NO DEPENDENCY (INDEPENDENT) â€”</option>
                              {DEPENDENCY_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </Card>

                  {/* Matrix Panel */}
                   <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white space-y-10">
                      <div className="flex items-center gap-3">
                         <ArrowDownWideNarrow className="h-5 w-5 text-amber-600" />
                         <h2 className="text-lg font-black uppercase tracking-tighter">Dynamic <span className="text-amber-600">SLA Matrix</span></h2>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-relaxed">
                        Adjust lead-times specifically for different sales categories. Leave as default if not applicable.
                     </p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-4">
                        {[
                          "New Normal", "Repeat Order Normal", "New Import", "Repeat Order Import"
                        ].map((cat) => (
                          <div key={cat} className="flex items-center justify-between group">
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic group-hover:text-amber-600 transition-colors">{cat}</span>
                             <div className="relative w-32">
                                <Input type="number" className="h-12 px-4 bg-slate-50 border-none rounded-xl font-black text-xs text-center" placeholder="0" />
                                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase rotate-90">Days</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>
               </div>

               {/* Right: Overview & Flow */}
               <div className="lg:col-span-5 space-y-10">
                    <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white text-gray-900 overflow-hidden relative">
                     <div className="relative z-10 space-y-10">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Flow Governance</p>
                           <h2 className="text-3xl font-black italic tracking-tighter uppercase mt-2">Critical <br/> <span className="text-amber-500">Milestones</span></h2>
                        </div>

                             <div className="space-y-8 pt-10 border-t border-[var(--border-color)]">
                            <div className="flex gap-6 relative">
                               <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gray-100" />
                               <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 relative z-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-gray-900">Previous Step Done</span>
                                  <span className="text-[9px] font-bold text-gray-400 italic uppercase">System triggers new task</span>
                               </div>
                            </div>
                            <div className="flex gap-6">
                               <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 relative z-10">
                                  <Timer className="h-4 w-4 text-amber-400" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-gray-900">SLA Countdown Starts</span>
                                  <span className="text-[9px] font-bold text-gray-400 italic uppercase">Based on Matrix Definition</span>
                               </div>
                            </div>
                         </div>

                          <div className="p-6 bg-gray-50 rounded-[24px] border border-[var(--border-color)] space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Protocol Intelligence Remarks</label>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic uppercase">
                               "Dependency mapping ensures production doesn't start before legal BPOM approval is verified."
                            </p>
                         </div>
                     </div>
                      <Workflow className="h-48 w-48 text-black/5 absolute -right-12 -bottom-12 rotate-12" />
                  </Card>

                   <div className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-[24px] bg-white/50 flex gap-4 items-start">
                     <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
                     <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase italic">
                        "Category sequence changes will not affect existing active projects but will apply to all future Sales Orders."
                     </p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FormShell>
  );
}
