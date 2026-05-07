"use client";
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  FileBadge, 
  FlaskConical, 
  Clock, 
  History,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Plus,
  ArrowRightCircle,
  Loader2,
  FileText,
  MessageSquare,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function LegalityRecords() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hki");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: hkiData, isLoading: loadingHki } = useQuery({
    queryKey: ["hki-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/hki");
      return resp.data;
    },
  });

  const { data: bpomData, isLoading: loadingBpom } = useQuery({
    queryKey: ["bpom-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/bpom");
      return resp.data;
    },
  });

  const advanceHkiMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/hki/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("HKI Stage Advanced Successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to advance HKI stage");
    }
  });

  const advanceBpomMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/bpom/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("BPOM Stage Advanced Successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to advance BPOM stage");
    }
  });

  return (
    <div className="p-8 md:p-14 font-sans text-slate-800 bg-base min-h-screen">
      <header className="max-w-7xl mx-auto mb-16 px-4 flex justify-between items-end">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-600/60">Compliance Repository</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic text-slate-900 leading-[0.8]">REGISTRATION<br/>AUDITORY LOG</h1>
        </motion.div>
        
        <Link href="/legality/input">
            <Button className="rounded-2xl h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black italic gap-3 shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> ADD NEW RECORD
            </Button>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <Tabs defaultValue="hki" onValueChange={setActiveTab} className="w-full space-y-12">
          <TabsList className="bg-slate-50 p-2 rounded-[2rem] h-auto flex gap-4 border border-slate-200/50 w-fit">
            <TabsTrigger 
              value="hki" 
              className="px-10 py-5 rounded-[1.5rem] data-[state=active]:bg-white data-[state=active]:shadow-lg flex gap-3 font-black italic text-lg transition-all"
            >
              <FileBadge className="w-6 h-6" /> HKI BRANDING
              <Badge variant="outline" className="ml-2 font-sans text-[10px] bg-indigo-50">{hkiData?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="bpom" 
              className="px-10 py-5 rounded-[1.5rem] data-[state=active]:bg-white data-[state=active]:shadow-lg flex gap-3 font-black italic text-lg transition-all"
            >
              <FlaskConical className="w-6 h-6" /> BPOM PRODUCT
              <Badge variant="outline" className="ml-2 font-sans text-[10px] bg-emerald-50">{bpomData?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hki" className="outline-none">
            <ComplianceGrid 
               data={hkiData} 
               type="HKI" 
               isLoading={loadingHki} 
               onAdvance={(id: string) => advanceHkiMutation.mutate(id)} 
               isAdvancing={advanceHkiMutation.isPending}
               onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: 'HKI' })}
            />
          </TabsContent>

          <TabsContent value="bpom" className="outline-none">
            <ComplianceGrid 
               data={bpomData} 
               type="BPOM" 
               isLoading={loadingBpom} 
               onAdvance={(id: string) => advanceBpomMutation.mutate(id)}
               isAdvancing={advanceBpomMutation.isPending}
               onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: 'BPOM' })}
            />
          </TabsContent>
        </Tabs>
      </main>

      {selectedRecord && (
        <TimelineDialog 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
}

function ComplianceGrid({ data, type, isLoading, onAdvance, isAdvancing, onViewTimeline }: any) {
  if (isLoading) return <div className="p-20 text-center font-black italic text-slate-300 animate-pulse uppercase tracking-[0.2em]">Synchronizing Repository...</div>;

  return (
    <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-left">
            <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Application Info</th>
            <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pipeline State</th>
            <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ownership</th>
            <th className="p-10 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data?.map((record: any) => (
            <tr key={record.id} className="hover:bg-slate-50/10 transition-colors group">
              <td className="p-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-400">
                        <Calendar className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-black leading-none">{new Date(record.applicationDate).getFullYear()}</span>
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase text-indigo-500 mb-1">{record.hkiId || record.bpomId}</p>
                        <h4 className="text-xl font-black italic text-slate-800">{record.brandName || record.productName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 italic mt-1">{record.type || record.category}</p>
                    </div>
                </div>
              </td>
              <td className="p-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase border-none tracking-tight ${
                            record.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 
                            record.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                            'bg-rose-50 text-rose-600'
                        }`}>
                            {record.status}
                        </Badge>
                        <ArrowRightCircle className="w-4 h-4 text-slate-200" />
                        <p className="text-xs font-black italic text-slate-600 uppercase tracking-tighter">{record.stage.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-300">Days Elapsed</p>
                            <p className="text-sm font-black italic text-slate-800">{record.daysElapsed}d</p>
                        </div>
                        {record.daysLeft !== null && (
                             <div>
                                <p className="text-[9px] font-black uppercase text-slate-300">Expiry left</p>
                                <p className={`text-sm font-black italic ${record.daysLeft <= 90 ? 'text-amber-600' : 'text-slate-800'}`}>{record.daysLeft}d</p>
                            </div>
                        )}
                    </div>
                </div>
              </td>
              <td className="p-10">
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Owner Client</p>
                        <p className="text-xs font-bold text-slate-800 italic uppercase">{record.clientName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold">
                            {record.pic?.name.substring(0,2).toUpperCase()}
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">PIC: {record.pic?.name}</p>
                    </div>
                </div>
              </td>
              <td className="p-10 text-right">
                <div className="flex items-center justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onViewTimeline(record)}
                        className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                    >
                        <History className="w-4 h-4" />
                    </Button>
                    {record.status !== 'DONE' ? (
                        <Button 
                            onClick={() => onAdvance(record.id)}
                            disabled={isAdvancing}
                            className="rounded-2xl bg-white border border-slate-200 text-slate-900 font-black italic shadow-sm hover:bg-slate-900 hover:text-white transition-all group-hover:scale-105"
                        >
                            {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4 mr-2" />}
                            ADVANCE
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-500 font-black italic text-[10px] uppercase">
                            <ShieldAlert className="w-4 h-4" />
                            SECURED
                        </div>
                    )}
                </div>
              </td>
            </tr>
          ))}
          {data?.length === 0 && (
              <tr>
                  <td colSpan={4} className="p-32 text-center">
                    <div className="flex flex-col items-center">
                        <ShieldAlert className="w-16 h-16 text-slate-100 mb-6" />
                        <p className="text-xl font-black italic text-slate-300 uppercase tracking-tighter">Repository Empty</p>
                        <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tight mt-2">No {type} records found in auditory log.</p>
                    </div>
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TimelineDialog({ record, onClose }: { record: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["record-logs", record.id],
    queryFn: async () => {
      const resp = await api.get(`/legality/${record.id}/logs`);
      return resp.data;
    }
  });

  const logMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/legality/log", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["record-logs", record.id] });
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      setNote("");
      toast.success("Progress Log Synchronized");
    }
  });

  const handleAddLog = () => {
    if (!note) return;
    logMutation.mutate({
      recordId: record.id,
      recordType: record.recordType,
      action: 'NOTE_ADDED',
      newStage: record.stage,
      notes: note,
      staffName: 'Legal Officer' // Mocked user
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-tight">Auditory Timeline</span>
          </div>
          <DialogTitle className="text-3xl font-black italic tracking-tighter">
            {record.brandName || record.productName}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold italic">
            Trace the complete lifecycle of this compliance record.
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-8 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
            {isLoading ? (
               <div className="h-full flex items-center justify-center italic font-black text-slate-300 animate-pulse uppercase tracking-tight">Analyzing Timeline...</div>
            ) : (
                logs?.map((log: any, idx: number) => (
                    <div key={log.id} className="relative flex gap-6">
                        {/* Vertical Line Connector */}
                        {idx !== logs.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-[-32px] w-[2px] bg-slate-100" />
                        )}
                        
                        <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm ${
                            log.action === 'CREATED' ? 'bg-indigo-500' : 
                            log.action === 'STAGE_UPDATED' ? 'bg-amber-500' : 
                            'bg-slate-900'
                        }`}>
                            {log.action === 'CREATED' ? <Plus className="w-3 h-3 text-white" /> : 
                             log.action === 'STAGE_UPDATED' ? <ArrowRightCircle className="w-3 h-3 text-white" /> :
                             <MessageSquare className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                                <Badge variant="outline" className="text-[8px] font-black uppercase py-0 border-slate-100">{log.action}</Badge>
                            </div>
                            <p className="text-sm font-black italic text-slate-800 uppercase tracking-tighter">
                                {log.action === 'STAGE_UPDATED' ? `${log.previousStage} → ${log.newStage}` : log.action}
                            </p>
                            {log.notes && <p className="text-xs text-slate-500 italic leading-relaxed">{log.notes}</p>}
                            <p className="text-[9px] font-bold text-slate-300 uppercase">By {log.staffName}</p>
                        </div>
                    </div>
                ))
            )}
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-tight text-slate-400">Add Auditory Note</Label>
                <Textarea 
                    placeholder="Capture essential compliance updates..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="rounded-2xl bg-slate-50 border-none min-h-[100px] font-bold focus:ring-2 focus:ring-slate-900 transition-all text-slate-900"
                />
            </div>
            <Button 
                onClick={handleAddLog}
                disabled={!note || logMutation.isPending}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black italic gap-3 shadow-xl hover:shadow-slate-900/10"
            >
                {logMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                APPEND TO TIMELINE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Send(props: any) {
    return <ArrowRightCircle {...props} />
}

