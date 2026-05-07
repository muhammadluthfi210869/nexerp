"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Search, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">R&D Protocol</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            Lab Test <span className="text-indigo-600">Center</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">pH, Viscosity, Density &amp; Stability Analysis</p>
        </div>
        <Button onClick={() => { setForm({ ...form, formulaId: selectedFormulaId }); setIsModalOpen(true); }} disabled={!selectedFormulaId} className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-2xl shadow-xl border-none uppercase tracking-tighter text-sm">
          <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> New Test Result
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-6 bg-white">
          <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">Tests Today</p>
          <p className="text-2xl font-black tracking-tighter text-indigo-600 mt-1">{results?.length || 0}</p>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedFormulaId} onValueChange={(v) => setSelectedFormulaId(v || "")}>
          <SelectTrigger className="w-80 h-12 bg-white border-2 border-slate-100 rounded-2xl font-bold">
            <SelectValue placeholder="Select Formula..." />
          </SelectTrigger>
          <SelectContent>
            {formulas?.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.name} (v{f.version})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search results..." className="h-12 pl-12 bg-white border-2 border-slate-100 rounded-2xl font-bold" />
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Date</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9pxs]">pH</TableHead>
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
              <TableRow key={r.id} className="group hover:bg-indigo-50/30 transition-all border-slate-50">
                <TableCell className="py-6 pl-10 font-bold text-slate-400 text-[10px]">{new Date(r.testDate).toLocaleDateString("id-ID")}</TableCell>
                <TableCell className="font-black text-slate-900">{r.actualPh || "—"}</TableCell>
                <TableCell className="font-black text-slate-900">{r.actualViscosity || "—"}</TableCell>
                <TableCell className="font-black text-slate-900">{r.actualDensity || "—"}</TableCell>
                <TableCell><Badge className={cn("rounded-lg font-black text-[8px]", r.stability40C === "STABLE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{r.stability40C || "—"}</Badge></TableCell>
                <TableCell><Badge className={cn("rounded-lg font-black text-[8px]", r.stabilityRT === "STABLE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{r.stabilityRT || "—"}</Badge></TableCell>
                <TableCell><Badge className={cn("rounded-lg font-black text-[8px]", r.stability4C === "STABLE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{r.stability4C || "—"}</Badge></TableCell>
                <TableCell className="font-bold text-slate-400 text-[10px]">{r.tester?.fullName || "—"}</TableCell>
              </TableRow>
            ))}
            {(!results || results.length === 0) && selectedFormulaId && (
              <TableRow><TableCell colSpan={8} className="text-center py-16 text-slate-400 font-bold">No test results for this formula.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-y-auto max-h-[90vh]">
          <div className="bg-indigo-600 p-8 text-white">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">New Lab Test</DialogTitle>
            <DialogDescription className="text-indigo-100 font-medium uppercase text-[10px] tracking-tight mt-2">Record analysis results</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[ 
                { label: "pH", key: "actualPh" }, { label: "Viscosity", key: "actualViscosity" },
                { label: "Density", key: "actualDensity" }, { label: "Color", key: "colorResult" },
                { label: "Aroma", key: "aromaResult" }, { label: "Texture", key: "textureResult" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{field.label}</label>
                  <Input value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={`Enter ${field.label}...`} className="h-11 bg-slate-50 border-none rounded-xl font-bold" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["stability40C", "stabilityRT", "stability4C"].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">{key.replace("stability", "").replace(/([A-Z])/g, " $1")}°C</label>
                  <Select value={(form as any)[key]} onValueChange={(v) => setForm({ ...form, [key]: v })}>
                    <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
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
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full h-24 bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm resize-none" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px]">
              {createMutation.isPending ? "Saving..." : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

