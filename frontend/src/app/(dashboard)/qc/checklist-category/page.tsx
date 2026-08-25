"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  History,
  Eye,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  Save,
  GitCommit,
  Clock,
  ArrowRight,
  Layers,
  Settings2,
  Workflow,
  CheckCircle2,
  ShieldAlert,
  ArrowDownWideNarrow,
  Timer,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OperationalDataTable,
  OperationalField,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
} from "@/components/operational";

const STATIC_CATEGORIES = [
  { nama: "Desain Logo", urutan: 1, lama_hari: 7, setelah: "-", type: "Design" },
  { nama: "HKI", urutan: 2, lama_hari: 14, setelah: "Desain Logo", type: "Legal" },
  { nama: "BPOM NA", urutan: 3, lama_hari: 30, setelah: "HKI", type: "Legal" },
  { nama: "BPOM Merk", urutan: 4, lama_hari: 30, setelah: "HKI", type: "Legal" },
  { nama: "Produksi", urutan: 5, lama_hari: 7, setelah: "BPOM NA", type: "Ops" },
  { nama: "Packing", urutan: 6, lama_hari: 3, setelah: "Produksi", type: "Ops" },
  { nama: "Delivery", urutan: 7, lama_hari: 1, setelah: "Packing", type: "Logistics" },
  { nama: "Uji Lab", urutan: 8, lama_hari: 14, setelah: "-", type: "QA" },
];

const DEPENDENCY_OPTIONS = [
  "Desain Logo", "HKI", "BPOM NA", "BPOM Merk", "MOU", "Desain Kemasan",
  "Approval Desain", "Bahan Baku", "Bahan Kemas", "Label", "Box",
  "Produksi", "Packing", "Delivery", "Halal", "Uji Lab",
];

const TYPE_TONE: Record<string, "process" | "success" | "pending" | "danger" | "neutral" | "purple" | "pending"> = {
  Design: "purple",
  Legal: "pending",
  Ops: "success",
  Logistics: "process",
  QA: "danger",
};

export default function ChecklistCategoryPrototype() {
  const [view, setView] = useState<"list" | "form">("list");

  const columns = [
    {
      accessorKey: "urutan",
      header: () => <div className="text-center">Order</div>,
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex justify-center">
          <span className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            {row.original.urutan}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "nama",
      header: "Category Identity",
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-900 tracking-tight text-sm">
            {row.original.nama}
          </span>
          <OperationalStatusBadge status={TYPE_TONE[row.original.type] || "neutral"}>
            {row.original.type}
          </OperationalStatusBadge>
        </div>
      ),
    },
    {
      accessorKey: "lama_hari",
      header: "Default SLA",
      cell: ({ getValue }: { getValue: () => number }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-900 tabular-nums">
            {getValue()} <span className="text-[10px] text-slate-400 uppercase">Days</span>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "setelah",
      header: "Sequence Hook (After)",
      cell: ({ getValue }: { getValue: () => string }) => {
        const v = getValue();
        if (v === "-") {
          return (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Independent
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase underline decoration-emerald-200 underline-offset-4">
              {v}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: () => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <OperationalPageShell
      title="Kategori Checklist"
      subtitle="Lead-Time Management & Automated Quality Control Sequence Protocols"
      actions={
        view === "list" ? (
          <div className="flex items-center gap-2">
            <button type="button" className="operational-button is-secondary">
              <History className="h-4 w-4 text-blue-500" />
              <span>Version Control</span>
            </button>
            <button
              type="button"
              className="operational-button is-primary"
              style={{ background: "#d97706", color: "#fff", borderColor: "#d97706" }}
              onClick={() => setView("form")}
            >
              <Plus className="h-4 w-4" />
              <span>Define Category</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="operational-button is-secondary"
            onClick={() => setView("list")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to List</span>
          </button>
        )
      }
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="operational-stack"
          >
            <OperationalMetricGrid>
              <OperationalMetricCard
                label="Active Protocols"
                value="24"
                icon={<Workflow className="h-4 w-4" />}
                tone="blue"
              />
              <OperationalMetricCard
                label="Avg. Cycle Time"
                value="84d"
                icon={<Timer className="h-4 w-4" />}
                tone="amber"
              />
              <OperationalMetricCard
                label="Dependencies"
                value="18"
                icon={<GitCommit className="h-4 w-4" />}
                tone="purple"
              />
              <OperationalMetricCard
                label="Critical Path Risk"
                value="Low"
                icon={<ShieldAlert className="h-4 w-4" />}
                tone="green"
              />
            </OperationalMetricGrid>

            <OperationalDataTable
              data={STATIC_CATEGORIES as any[]}
              columns={columns as any}
              getRowId={(row: any) => row.nama}
              searchPlaceholder="Cari protokol..."
              toolbar={
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <button type="button" className="operational-button is-ghost h-8 px-3 text-[10px]">
                    Sort: Execution Order
                  </button>
                </div>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-10"
          >
            <OperationalPanel className="!flex-row justify-between items-center gap-3">
              <button
                type="button"
                className="operational-button is-danger"
                onClick={() => setView("list")}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Cancel Protocol</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Drafting Phase
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-600">
                    Protocol 12-CKL
                  </span>
                </div>
                <span className="h-8 w-px bg-slate-200" />
                <button
                  type="button"
                  className="operational-button is-primary h-11 px-6"
                  style={{ background: "#d97706", color: "#fff", borderColor: "#d97706" }}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Protocol</span>
                </button>
              </div>
            </OperationalPanel>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <OperationalPanel>
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="h-4 w-4 text-amber-600" />
                    <h2 className="text-base font-black uppercase tracking-tight">
                      Identity <span className="text-amber-600">& Sequence</span>
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <OperationalField label="Category Designation Name">
                      <input
                        type="text"
                        placeholder="E.g., Legal Document Submission"
                        className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs italic focus:outline-none focus:border-amber-500"
                      />
                    </OperationalField>

                    <div className="grid grid-cols-2 gap-4">
                      <OperationalField label="Execution Order">
                        <input
                          type="number"
                          placeholder="1"
                          className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                      </OperationalField>
                      <OperationalField label="Default Global SLA (Days)">
                        <input
                          type="number"
                          placeholder="0"
                          className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                      </OperationalField>
                    </div>

                    <OperationalField label="Dependency Hook (Start After)">
                      <select className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs focus:outline-none focus:border-amber-500">
                        <option value="">— No Dependency (Independent) —</option>
                        {DEPENDENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </OperationalField>
                  </div>
                </OperationalPanel>

                <OperationalPanel>
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDownWideNarrow className="h-4 w-4 text-amber-600" />
                    <h2 className="text-base font-black uppercase tracking-tight">
                      Dynamic <span className="text-amber-600">SLA Matrix</span>
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed mb-4">
                    Adjust lead-times specifically for different sales categories. Leave as default if not applicable.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {["New Normal", "Repeat Order Normal", "New Import", "Repeat Order Import"].map((cat) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight italic">
                          {cat}
                        </span>
                        <div className="relative w-28">
                          <input
                            type="number"
                            className="h-10 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 font-bold text-xs text-center focus:outline-none focus:border-amber-500"
                            placeholder="0"
                          />
                          <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase rotate-90">
                            Days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </OperationalPanel>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <OperationalPanel>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        Flow Governance
                      </p>
                      <h2 className="text-2xl font-black italic tracking-tight uppercase mt-2 leading-tight">
                        Critical <br /> <span className="text-amber-500">Milestones</span>
                      </h2>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100">
                      <div className="flex gap-4 relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                        <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 relative z-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-slate-900">
                            Previous Step Done
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 italic uppercase">
                            System triggers new task
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 relative z-10">
                          <Timer className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-slate-900">
                            SLA Countdown Starts
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 italic uppercase">
                            Based on Matrix Definition
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
                        Protocol Intelligence Remarks
                      </label>
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic uppercase">
                        "Dependency mapping ensures production doesn't start before legal BPOM approval is verified."
                      </p>
                    </div>
                  </div>
                </OperationalPanel>

                <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 flex gap-3 items-start">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase italic">
                    "Category sequence changes will not affect existing active projects but will apply to all future Sales Orders."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OperationalPageShell>
  );
}
