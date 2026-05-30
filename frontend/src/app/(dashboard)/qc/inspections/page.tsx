"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  FlaskConical,
  Package,
  Archive,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaBadge, DnaInput } from "@/components/dna";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TableWrapper } from "@/components/dna/TableWrapper";

const QC_STAGE_META: Record<string, { icon: React.ReactNode; label: string; params: string[] }> = {
  inbound: {
    icon: <ClipboardCheck className="h-4 w-4" />,
    label: "Inbound",
    params: ["COA Document", "Integrity Packing", "Labeling Check"],
  },
  bulk: {
    icon: <FlaskConical className="h-4 w-4" />,
    label: "Bulk",
    params: ["pH Value", "Viscosity", "Organoleptic"],
  },
  filling: {
    icon: <Package className="h-4 w-4" />,
    label: "Filling",
    params: ["Sampling Volume", "Sealing Check"],
  },
  final: {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Final",
    params: ["Sampling Weight (±1%)", "Inkjet Coding", "Barcode Scan"],
  },
  retention: {
    icon: <Archive className="h-4 w-4" />,
    label: "Retention",
    params: ["Sample Saved", "Rack Location", "Expiry Match"],
  },
};

const MOCK_PENDING = [
  { id: "INB-001", source: "PO-2026-001", batch: "B-2405-01", material: "Sodium Lauryl Sulfate", supplier: "PT Kimia Jaya", stage: "inbound", date: "2026-05-25", priority: "HIGH" },
  { id: "BULK-001", source: "WO-2026-012", batch: "B-2405-02", material: "Hair Mask Formula V3", stage: "bulk", date: "2026-05-25", priority: "MEDIUM" },
  { id: "FIL-001", source: "WO-2026-010", batch: "B-2405-03", material: "Body Lotion SPF 30", stage: "filling", date: "2026-05-24", priority: "LOW" },
  { id: "FIN-001", source: "WO-2026-008", batch: "B-2405-04", material: "Sunscreen Stick SPF 50", stage: "final", date: "2026-05-23", priority: "MEDIUM" },
  { id: "RET-001", source: "WO-2026-005", batch: "B-2405-05", material: "Brightening Serum", stage: "retention", date: "2026-05-20", priority: "LOW" },
];

const statusBadge = (status: "PASS" | "FAIL" | "PENDING") => (
  <DnaBadge status={status === "PASS" ? "success" : status === "FAIL" ? "critical" : "warning"}>
    {status === "PASS" && <CheckCircle2 className="h-3 w-3 mr-1" />}
    {status === "FAIL" && <XCircle className="h-3 w-3 mr-1" />}
    {status === "PENDING" && <AlertTriangle className="h-3 w-3 mr-1" />}
    {status}
  </DnaBadge>
);

export default function QCInspectionsPage() {
  const [activeTab, setActiveTab] = useState("inbound");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PENDING.filter(
    (i) => i.stage === activeTab && (search === "" || i.material.toLowerCase().includes(search.toLowerCase()) || i.batch.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardShell
      title="Inspeksi"
      titleAccent="QC"
      subtitle="Per-Stage Quality Inspection — Inbound, Bulk, Filling, Final, Retention"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100">
            {Object.entries(QC_STAGE_META).map(([key, meta]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
              >
                {meta.icon}
                {meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <DnaInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari batch / material..."
                icon={<Search className="h-4 w-4" />}
                className="w-64"
              />
            </div>
          </div>
        </div>

        {Object.entries(QC_STAGE_META).map(([key, meta]) => (
          <TabsContent key={key} value={key} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="col-span-2 rounded-[24px] border border-[var(--border-color)] shadow-sm overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {meta.label} Inspection — Parameters
                  </h3>
                  <DnaBadge status="info">{meta.params.length} Checks</DnaBadge>
                </div>
                <div className="p-6 space-y-4">
                  {meta.params.map((param, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-[24px] bg-slate-50 border border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">{param}</span>
                      <div className="flex gap-2">
                        <DnaButton variant="primary" size="sm"><CheckCircle2 className="h-3 w-3" /> OK</DnaButton>
                        <DnaButton variant="danger" size="sm"><XCircle className="h-3 w-3" /> NOK</DnaButton>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end gap-3">
                    <DnaButton variant="outline" size="md">Reset</DnaButton>
                    <DnaButton variant="secondary" className="gap-2"><ShieldCheck className="h-4 w-4" /> Submit Inspection</DnaButton>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-6 bg-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Inspection Notes</h3>
                <textarea
                  placeholder="Catatan inspektur..."
                  className="w-full h-32 p-4 rounded-[24px] border border-[var(--border-color)] bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                    Hasil akan tercatat di QCAudit
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    FAIL trigger auto RejectExecution
                  </div>
                </div>
              </div>
            </div>

            <TableWrapper>
              <table className="table-dense">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="text-table-header text-slate-400 py-4 px-4">ID</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Source</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Batch</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Material / Product</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Date</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Priority</th>
                      <th className="text-table-header text-slate-400 py-4 px-4">Status</th>
                      <th className="text-table-header text-slate-400 py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                          No pending {meta.label} inspections
                        </td>
                      </tr>
                    )}
                    {filtered.map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <td className="py-3 px-4 font-black text-slate-900 text-xs tabular-nums">{item.id}</td>
                        <td className="py-3 px-4 text-slate-500">{item.source}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-xs tabular-nums">{item.batch}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-xs uppercase">{item.material}</td>
                        <td className="py-3 px-4 text-slate-400">{item.date}</td>
                        <td className="py-3 px-4">
                          <DnaBadge status={item.priority === "HIGH" ? "critical" : item.priority === "MEDIUM" ? "warning" : "default"}>
                            {item.priority}
                          </DnaBadge>
                        </td>
                      <td>{statusBadge("PENDING")}</td>
                      <td className="pr-4 text-right">
                        <DnaButton variant="ghost" size="sm"><Eye className="h-3 w-3 mr-1" /> Inspect</DnaButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </TabsContent>
        ))}
      </Tabs>
    </DashboardShell>
  );
}
