"use client";
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { 
  FileBadge, 
  FlaskConical, 
  History,
  Calendar,
  ShieldAlert,
  Plus,
  ArrowRightCircle,
  Loader2,
  MessageSquare,
  Activity,
  Moon
} from "lucide-react";
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
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DnaBadge, DnaButton } from "@/components/dna";

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

  const { data: halalData, isLoading: loadingHalal } = useQuery({
    queryKey: ["halal-records"],
    queryFn: async () => {
      const resp = await api.get("/legality/halal");
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

  const advanceHalalMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/legality/halal/${id}/advance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      toast.success("Halal Stage Advanced Successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to advance Halal stage");
    }
  });

  return (
    <DashboardShell
      title="REGISTRATION"
      titleAccent="AUDITORY LOG"
      subtitle="Compliance Repository"
      actions={
        <Link href="/legality/input">
            <DnaButton variant="secondary" size="lg" icon={<Plus />}>
                ADD NEW RECORD
            </DnaButton>
        </Link>
      }
    >
        <Tabs defaultValue="hki" onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 flex gap-2 w-fit">
            <TabsTrigger 
              value="hki" 
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <FileBadge className="w-4 h-4" /> HKI BRANDING
                <DnaBadge status="info">{hkiData?.length || 0}</DnaBadge>
            </TabsTrigger>
            <TabsTrigger 
              value="bpom" 
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <FlaskConical className="w-4 h-4" /> BPOM PRODUCT
                <DnaBadge status="success">{bpomData?.length || 0}</DnaBadge>
            </TabsTrigger>
            <TabsTrigger 
              value="halal" 
              className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all gap-2"
            >
              <Moon className="w-4 h-4" /> HALAL CERT
                <DnaBadge status="success">{halalData?.length || 0}</DnaBadge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hki" className="outline-none m-0 focus:outline-none">
            <ComplianceGrid 
               data={hkiData} 
               type="HKI" 
               isLoading={loadingHki} 
               onAdvance={(id: string) => advanceHkiMutation.mutate(id)} 
               isAdvancing={advanceHkiMutation.isPending}
               onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: 'HKI' })}
            />
          </TabsContent>

          <TabsContent value="bpom" className="outline-none m-0 focus:outline-none">
            <ComplianceGrid 
               data={bpomData} 
               type="BPOM" 
               isLoading={loadingBpom} 
               onAdvance={(id: string) => advanceBpomMutation.mutate(id)}
               isAdvancing={advanceBpomMutation.isPending}
               onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: 'BPOM' })}
            />
          </TabsContent>

          <TabsContent value="halal" className="outline-none m-0 focus:outline-none">
            <ComplianceGrid 
               data={halalData} 
               type="HALAL" 
               isLoading={loadingHalal} 
               onAdvance={(id: string) => advanceHalalMutation.mutate(id)}
               isAdvancing={advanceHalalMutation.isPending}
               onViewTimeline={(r: any) => setSelectedRecord({ ...r, recordType: 'HALAL' })}
            />
          </TabsContent>
        </Tabs>
      {selectedRecord && (
        <TimelineDialog 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </DashboardShell>
  );
}

function ComplianceGrid({ data, type, isLoading, onAdvance, isAdvancing, onViewTimeline }: any) {
  if (isLoading) return <div className="p-20 text-center font-black italic text-slate-300 animate-pulse uppercase tracking-[0.2em]">Synchronizing Repository...</div>;

  return (
    <TableWrapper>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
              <th className="py-4 px-6 text-table-header text-slate-400 uppercase tracking-widest">Application Info</th>
              <th className="py-4 px-6 text-table-header text-slate-400 uppercase tracking-widest">Pipeline State</th>
              <th className="py-4 px-6 text-table-header text-slate-400 uppercase tracking-widest">Ownership</th>
              <th className="py-4 px-6 text-right text-table-header text-slate-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.map((record: any) => (
              <tr key={record.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="py-3 px-6">
                  <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 shrink-0">
                          <Calendar className="w-4 h-4 mb-0.5" />
                          <span className="text-[8px] font-black leading-none">{new Date(record.applicationDate).getFullYear()}</span>
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase text-indigo-500 mb-0.5">{record.hkiId || record.bpomId || record.halalId}</p>
                          <h4 className="text-sm font-black uppercase text-slate-800 tracking-tight">{record.brandName || record.productName || record.manufacturer}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{record.type || record.category}</p>
                      </div>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <div className="space-y-2">
                      <div className="flex items-center gap-2">
                          <DnaBadge status={
                              record.status === 'DONE' ? 'success' : 
                              record.status === 'IN_PROGRESS' ? 'info' : 
                              'critical'
                          }>
                              {record.status}
                          </DnaBadge>
                          <ArrowRightCircle className="w-4 h-4 text-slate-300" />
                          <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">{record.stage.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <div>
                              <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Days Elapsed</p>
                              <p className="text-xs font-black text-slate-700 mt-1">{record.daysElapsed}d</p>
                          </div>
                          {record.daysLeft !== null && (
                               <div>
                                  <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Expiry left</p>
                                  <p className={`text-xs font-black mt-1 ${record.daysLeft <= 90 ? 'text-amber-600' : 'text-slate-700'}`}>{record.daysLeft}d</p>
                              </div>
                          )}
                      </div>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <div className="space-y-1.5">
                      <div>
                          <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Owner Client</p>
                          <p className="text-[10px] font-black text-slate-700 uppercase mt-1">{record.clientName}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-slate-700 flex items-center justify-center text-[7px] text-white font-bold">
                              {record.pic?.name.substring(0,2).toUpperCase()}
                          </div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">PIC: {record.pic?.name}</p>
                      </div>
                  </div>
                </td>
                <td className="py-3 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                      <DnaButton 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewTimeline(record)}
                          icon={<History className="w-4 h-4" />}
                      />
                      {record.status !== 'DONE' ? (
                          <DnaButton 
                              variant="secondary"
                              size="sm"
                              onClick={() => onAdvance(record.id)}
                              disabled={isAdvancing}
                              icon={isAdvancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                          >
                              ADVANCE
                          </DnaButton>
                      ) : (
                          <DnaBadge status="success" className="gap-1 shadow-none">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              SECURED
                          </DnaBadge>
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
                <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                          <ShieldAlert className="w-12 h-12 text-slate-200 mb-3" />
                          <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">Repository Empty</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">No {type} records found in auditory log.</p>
                      </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </TableWrapper>
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
      <DialogContent className="max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Activity className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-widest">Auditory Timeline</span>
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800">
             {record.brandName || record.productName}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-[10px] uppercase font-bold mt-1">
             Trace the complete lifecycle of this compliance record.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {isLoading ? (
               <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 animate-pulse uppercase tracking-widest">Analyzing Timeline...</div>
            ) : (
                logs?.map((log: any, idx: number) => (
                    <div key={log.id} className="relative flex gap-4">
                        {/* Vertical Line Connector */}
                        {idx !== logs.length - 1 && (
                            <div className="absolute left-[9px] top-5 bottom-[-28px] w-[2px] bg-slate-100" />
                        )}
                        
                        <div className={`h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm ${
                            log.action === 'CREATED' ? 'bg-blue-500' : 
                            log.action === 'STAGE_UPDATED' ? 'bg-amber-500' : 
                            'bg-slate-700'
                        }`}>
                            {log.action === 'CREATED' ? <Plus className="w-3 h-3 text-white stroke-[3px]" /> : 
                             log.action === 'STAGE_UPDATED' ? <ArrowRightCircle className="w-3 h-3 text-white" /> :
                             <MessageSquare className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                                <DnaBadge status="default" className="py-0 px-1.5 text-[7px] rounded-md shadow-none">{log.action}</DnaBadge>
                            </div>
                            <p className="text-xs font-black uppercase text-slate-800 tracking-tight">
                                {log.action === 'STAGE_UPDATED' ? `${log.previousStage} → ${log.newStage}` : log.action}
                            </p>
                            {log.notes && <p className="text-xs text-slate-500 italic leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">{log.notes}</p>}
                            <p className="text-[8px] font-bold text-slate-400 uppercase">By {log.staffName}</p>
                        </div>
                    </div>
                ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-1.5">
                <Label className="text-[8px] uppercase font-black tracking-widest text-slate-400">Add Auditory Note</Label>
                <Textarea 
                    placeholder="Capture essential compliance updates..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="rounded-xl bg-slate-50 border border-slate-200 min-h-[80px] text-[10px] font-bold focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 uppercase"
                />
            </div>
            <DnaButton 
                onClick={handleAddLog}
                disabled={!note || logMutation.isPending}
                variant="secondary"
                size="md"
                className="w-full"
                icon={logMutation.isPending ? <Loader2 className="animate-spin" /> : <ArrowRightCircle />}
            >
                APPEND TO TIMELINE
            </DnaButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
