"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Search, Beaker } from "lucide-react";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function LabTestCenterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    formulaId: "", actualPh: "", actualViscosity: "", actualDensity: "",
    colorResult: "", aromaResult: "", textureResult: "",
    stability40C: "", stabilityRT: "", stability4C: "", notes: "",
  });

  const { data: formulas } = useQuery({
    queryKey: ["formulas"],
    queryFn: async () => (await api.get("/formulas")).data,
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ["lab-test-results", selectedFormulaId],
    queryFn: async () => {
      if (!selectedFormulaId) return [];
      return (await api.get(`/rnd/lab-test-results/${selectedFormulaId}`)).data;
    },
    enabled: !!selectedFormulaId,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/rnd/lab-test-results", { ...form, testerId: user?.id }),
    onSuccess: () => {
      toast.success("Lab test result recorded.");
      queryClient.invalidateQueries({ queryKey: ["lab-test-results"] });
      setIsModalOpen(false);
      setForm({ formulaId: "", actualPh: "", actualViscosity: "", actualDensity: "", colorResult: "", aromaResult: "", textureResult: "", stability40C: "", stabilityRT: "", stability4C: "", notes: "" });
    },
    onError: (err: any) => toast.error("Failed", { description: err.response?.data?.message }),
  });

  return (
    <DashboardShell
      title="LAB TEST"
      titleAccent="CENTER"
      subtitle="pH, Viscosity, Density & Stability Analysis"
      actions={
        <DnaButton 
          variant="primary"
          onClick={() => { setForm({ ...form, formulaId: selectedFormulaId }); setIsModalOpen(true); }} 
          disabled={!selectedFormulaId} 
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black px-4 rounded-xl shadow-sm border-none uppercase tracking-tight text-[10px] italic"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[3px]" /> New Test Result
        </DnaButton>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-[2rem] border border-slate-200 shadow-sm p-4 bg-white">
            <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">Tests Today</p>
            <p className="text-xl font-black tracking-tighter text-blue-600 mt-1">{results?.length || 0}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Select value={selectedFormulaId} onValueChange={(v) => setSelectedFormulaId(v || "")}>
            <SelectTrigger className="w-80 h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
              <SelectValue placeholder="Select Formula..." />
            </SelectTrigger>
            <SelectContent>
              {formulas?.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name} (v{f.version})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <DnaInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search results..." className="h-10 bg-white border border-slate-200 rounded-xl font-black text-xs" icon={<Search />} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden bg-white">
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[9px]">Date</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">pH</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Viscosity</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Density</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">40°C</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">RT</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">4°C</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Tester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.map((r: any) => (
                <TableRow key={r.id} className="group hover:bg-slate-50/30 transition-all border-slate-50">
                  <TableCell className="pl-6 font-black text-slate-400 text-[10px]">{new Date(r.testDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="font-black text-slate-900 text-xs">{r.actualPh || "—"}</TableCell>
                  <TableCell className="font-black text-slate-900 text-xs">{r.actualViscosity || "—"}</TableCell>
                  <TableCell className="font-black text-slate-900 text-xs">{r.actualDensity || "—"}</TableCell>
                  <TableCell><DnaBadge status={r.stability40C === "STABLE" ? "success" : "critical"}>{r.stability40C || "—"}</DnaBadge></TableCell>
                  <TableCell><DnaBadge status={r.stabilityRT === "STABLE" ? "success" : "critical"}>{r.stabilityRT || "—"}</DnaBadge></TableCell>
                  <TableCell><DnaBadge status={r.stability4C === "STABLE" ? "success" : "critical"}>{r.stability4C || "—"}</DnaBadge></TableCell>
                  <TableCell className="font-black text-slate-400 text-[10px]">{r.tester?.fullName || "—"}</TableCell>
                </TableRow>
              ))}
              {(!results || results.length === 0) && selectedFormulaId && (
                <TableRow><TableCell colSpan={8} className="text-center py-16 text-slate-400 font-black">No test results for this formula.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[2rem] border-none shadow-sm p-0 overflow-y-auto max-h-[90vh]">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic">New Lab Test</DialogTitle>
            <DialogDescription className="text-blue-100 font-medium uppercase text-[10px] tracking-tight mt-2">Record analysis results</DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[ 
                { label: "pH", key: "actualPh" }, { label: "Viscosity", key: "actualViscosity" },
                { label: "Density", key: "actualDensity" }, { label: "Color", key: "colorResult" },
                { label: "Aroma", key: "aromaResult" }, { label: "Texture", key: "textureResult" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{field.label}</label>
                  <DnaInput value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={`Enter ${field.label}...`} className="h-10 bg-slate-50 border-none rounded-xl font-black" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["stability40C", "stabilityRT", "stability4C"].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{key.replace("stability", "").replace(/([A-Z])/g, " $1")}°C</label>
                  <Select value={(form as any)[key]} onValueChange={(v) => setForm({ ...form, [key]: v })}>
                    <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl font-black"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STABLE">STABLE</SelectItem>
                      <SelectItem value="UNSTABLE">UNSTABLE</SelectItem>
                      <SelectItem value="CHANGE">CHANGE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full h-20 bg-slate-50 border-none rounded-xl p-3 font-black text-xs resize-none" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0">
            <DnaButton variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-black uppercase text-[10px] h-9">Cancel</DnaButton>
            <DnaButton variant="primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] h-9">
              {createMutation.isPending ? "Saving..." : "Save Result"}
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

