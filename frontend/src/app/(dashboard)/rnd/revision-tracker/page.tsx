"use client";

import React, { useState } from "react";
import {
 GitCommit,
 RefreshCw,
 AlertTriangle,
 Search,
 Play,
 CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatCard, TableWrapper, DnaInput, DnaButton } from "@/components/dna";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api";

type RevisionStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

interface Lead {
 clientName: string;
 brandName: string;
}

interface Pic {
 name: string;
}

interface Formula {
 id: string;
 formulaCode: string;
 version: number;
}

interface RevisionSample {
 id: string;
 sampleCode: string;
 productName: string;
 lead: Lead;
 pic: Pic;
 revisionStatus: RevisionStatus;
 latestRevisionDate: string;
 completedAt: string | null;
 formulas: Formula[];
}

const STATUS_STYLE: Record<RevisionStatus, { label: string; bg: string; text: string; dot: string }> = {
 NOT_STARTED: { label: "Not Started", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
 IN_PROGRESS: { label: "In Progress", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
 DONE: { label: "Done", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
 CANCELLED: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
};

export default function RevisionTrackerPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");
 const [activeTab, setActiveTab] = useState("new");

 const { data: activeRevisions = [] } = useQuery<RevisionSample[]>({
 queryKey: ["rnd-revisions"],
 queryFn: async () => (await api.get("/rnd/revisions")).data,
 });

 const { data: revisionHistory = [] } = useQuery<RevisionSample[]>({
 queryKey: ["rnd-revision-history"],
 queryFn: async () => (await api.get("/rnd/revisions/history")).data,
 });

 const startMutation = useMutation({
 mutationFn: (id: string) => api.post(`/rnd/revision/${id}/start`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["rnd-revisions"] });
 toast.success("Revision started");
 },
 onError: () => {
 toast.error("Failed to start revision");
 },
 });

 const completeMutation = useMutation({
 mutationFn: (id: string) => api.post(`/rnd/revision/${id}/complete`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["rnd-revisions"] });
 toast.success("Revision completed");
 },
 onError: () => {
 toast.error("Failed to complete revision");
 },
 });

 const allRevisions = [...activeRevisions, ...revisionHistory];
 const totalRevisions = allRevisions.length;
 const stuckRevisions = allRevisions.filter(
 (r) => r.formulas.length > 3 && r.revisionStatus === "IN_PROGRESS",
 ).length;
 const avgRevisionCount =
 allRevisions.length > 0
 ? (allRevisions.reduce((sum, r) => sum + r.formulas.length, 0) / allRevisions.length).toFixed(1)
 : "0";

 const filteredActive = activeRevisions.filter(
 (r) =>
 r.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.lead?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()),
 );

 const filteredHistory = revisionHistory.filter(
 (r) =>
 r.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.lead?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()),
 );

 function renderTable(samples: RevisionSample[], readOnly: boolean) {
 return (
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Sample Code</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Product</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Client</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">PIC</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Revisions</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Status</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400">Date</TableHead>
 <TableHead className="py-4 px-4 pr-6 text-table-header text-slate-400 text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {samples.length === 0 && (
 <TableRow>
 <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">
 No revisions found
 </TableCell>
 </TableRow>
 )}
 {samples.map((entry) => {
 const style = STATUS_STYLE[entry.revisionStatus];
 return (
 <TableRow
 key={entry.id}
 className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50"
 >
 <TableCell className="py-3 px-4">
 <span className="font-mono text-[11px] font-black text-slate-800">
 {entry.sampleCode}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4">
 <span className="font-black text-slate-900 tracking-tight text-xs">
 {entry.productName}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4">
 <span className="text-[11px] font-medium text-slate-600">
 {entry?.lead?.clientName ?? 'Unknown'}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4">
 <span className="text-[11px] font-medium text-slate-500">
 {entry?.pic?.name ?? 'Unknown'}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4 text-center">
 <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 text-slate-800 font-black text-[11px]">
 {entry.formulas.length}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4">
 <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-black uppercase text-[9px] ${style.bg} ${style.text}`}>
 <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
 {style.label}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4">
 <span className="text-[11px] font-medium text-slate-500">
 {entry.latestRevisionDate || entry.completedAt || "\u2014"}
 </span>
 </TableCell>
 <TableCell className="py-3 px-4 pr-6 text-right">
 {!readOnly && (
 <div className="flex gap-2 justify-end">
 {entry.revisionStatus === "NOT_STARTED" && (
 <DnaButton
 variant="outline"
 size="sm"
 icon={<Play />}
 onClick={() => startMutation.mutate(entry.id)}
 disabled={startMutation.isPending}
 >
 Start
 </DnaButton>
 )}
 {entry.revisionStatus === "IN_PROGRESS" && (
 <DnaButton
 variant="primary"
 size="sm"
 icon={<CheckCircle2 />}
 onClick={() => completeMutation.mutate(entry.id)}
 disabled={completeMutation.isPending}
 >
 Complete
 </DnaButton>
 )}
 </div>
 )}
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 );
 }

 return (
 <DashboardShell
 title="Revision"
 titleAccent="Board"
 subtitle="Track sample revision history and identify stuck iterations"
 >
 <div className="animate-fade-slide-in space-y-10">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <StatCard
 label="Total Revisions"
 value={totalRevisions}
 icon={<GitCommit className="text-blue-500" />}
 />
 <StatCard
 label="Stuck (>3 revisions)"
 value={stuckRevisions}
 icon={<AlertTriangle className="text-rose-500" />}
 />
 <StatCard
 label="Avg Revision Count"
 value={avgRevisionCount}
 icon={<RefreshCw className="text-amber-500" />}
 />
 </div>

 <TableWrapper
 filters={
 <div className="flex justify-between items-center bg-white">
 <div className="relative w-72">
 <DnaInput
 placeholder="Search sample, product or client..."
 icon={<Search className="h-4 w-4" />}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="text-xs font-black"
 />
 </div>
 </div>
 }
 >
 <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="bg-white border-b border-slate-200 mb-4">
 <TabsTrigger value="new" className="flex items-center gap-2">
 NEW
 <span className="ml-1.5 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white">
 {activeRevisions.length}
 </span>
 </TabsTrigger>
 <TabsTrigger value="history" className="flex items-center gap-2">
 HISTORY
 <span className="ml-1.5 rounded-full bg-slate-300 px-2 py-0.5 text-[9px] font-black text-white">
 {revisionHistory.length}
 </span>
 </TabsTrigger>
 </TabsList>
 <TabsContent value="new">
 <div className="overflow-x-auto">
 {renderTable(filteredActive, false)}
 </div>
 </TabsContent>
 <TabsContent value="history">
 <div className="overflow-x-auto">
 {renderTable(filteredHistory, true)}
 </div>
 </TabsContent>
 </Tabs>
 </TableWrapper>
 </div>
 </DashboardShell>
 );
}
