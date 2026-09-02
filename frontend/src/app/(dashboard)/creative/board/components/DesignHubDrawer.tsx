"use client";

import React, { useState, useRef } from "react";
import { 
  Sheet, 
  SheetContent, 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  History, 
  Upload, 
  Lock, 
  ChevronRight,
  ShieldCheck,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

export function DesignHubDrawer({ 
  task, 
  isOpen, 
  onClose,
  onAction 
}: { 
  task: any; 
  isOpen: boolean; 
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [unlockAction, setUnlockAction] = useState<'CHARGE' | 'WAIVE' | null>(null);
  const [managerPin, setManagerPin] = useState("");
  const artworkRef = useRef<HTMLInputElement>(null);
  const mockupRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const handleUpload = () => {
    const artworkFile = artworkRef.current?.files?.[0];
    const mockupFile = mockupRef.current?.files?.[0];
    if (!artworkFile && !mockupFile) return;
    onAction('UPLOAD', { artwork: artworkFile, mockup: mockupFile });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl border-none p-0 overflow-hidden">
        <div className="h-full flex flex-col bg-white shadow-2xl">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100">
                <FileText className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                  {task.lead?.brandName || 'UNTITLED PROJECT'}
                </h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[.2em] mt-2">
                  {task.kanbanState} • REVISION {task.revisionCount}/3
                </p>
              </div>
            </div>
            {task.isLocked && (
              <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px] px-4 py-2 rounded-full italic animate-pulse">
                <Lock className="w-3 h-3 mr-2" /> OVERLIMIT
              </Badge>
            )}
          </div>

          <Tabs defaultValue="brief" className="flex-1 flex flex-col">
            <TabsList className="bg-transparent border-b border-slate-100 rounded-none h-16 px-8 gap-8">
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-8">
              <TabsContent value="brief" className="m-0 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Client</p>
                       <p className="text-sm font-bold text-slate-900">{task.lead?.clientName}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</p>
                       <p className="text-sm font-bold text-slate-900">
                         {task.slaDeadline ? format(new Date(task.slaDeadline), 'dd MMM yyyy') : 'N/A'}
                       </p>
                       {task.slaDeadline && (
                         <p className={cn(
                           "text-[9px] font-black uppercase mt-1",
                           differenceInDays(new Date(task.slaDeadline), new Date()) < 3 ? "text-rose-500" : "text-emerald-500"
                         )}>
                           {differenceInDays(new Date(task.slaDeadline), new Date())} Days Remaining
                         </p>
                       )}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-indigo-600" /> DESIGN BRIEF
                    </h3>
                    <div className="text-sm text-slate-600 font-medium leading-relaxed bg-indigo-50/30 p-8 rounded-[24px] border border-indigo-100/50 italic">
                       {task.brief}
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="versions" className="m-0 space-y-6">
                {!task.isLocked && (task.kanbanState === 'INBOX' || task.kanbanState === 'IN_PROGRESS' || task.kanbanState === 'REVISION') && (
                  <div className="space-y-4 p-8 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-900 text-center">Push New Revision</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase text-center">Ai, PDF or CDR up to 50MB</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Artwork File</p>
                        <input ref={artworkRef} type="file" accept=".pdf,.ai,.cdr,.jpg,.jpeg,.png,.svg,.tif,.tiff" className="w-full text-xs" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Mockup File</p>
                        <input ref={mockupRef} type="file" accept=".jpg,.jpeg,.png,.svg" className="w-full text-xs" />
                      </div>
                    </div>
                    <Button 
                      className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold uppercase text-xs"
                      onClick={handleUpload}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Upload Version
                    </Button>
                  </div>
                )}

                <div className="space-y-6">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" /> VERSION HISTORY
                   </h3>
                   {task.versions?.map((v: any) => (
                     <div key={v.id} className="p-8 rounded-[2rem] border border-slate-100 hover:bg-slate-50 transition-all flex flex-col gap-6 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-indigo-400 font-black text-xs shadow-xl">
                                 V{v.versionNumber}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">Master Assets v{v.versionNumber}.0</p>
                                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                   {format(new Date(v.createdAt), 'MMM dd, yyyy • HH:mm')}
                                 </p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                             {v.artworkUrl && (
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="rounded-xl border-slate-200 font-black text-[10px] uppercase gap-2 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                 onClick={() => window.open(v.artworkUrl, '_blank')}
                               >
                                  <FileText className="w-3 h-3" /> Artwork
                               </Button>
                             )}
                             {v.mockupUrl && (
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="rounded-xl border-slate-200 font-black text-[10px] uppercase gap-2 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                                 onClick={() => window.open(v.mockupUrl, '_blank')}
                               >
                                  Mockup
                               </Button>
                             )}
                          </div>
                        </div>

                        {v.printSpecs && (
                          <div className="grid grid-cols-4 gap-4 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm relative z-10">
                             {Object.entries(v.printSpecs).map(([key, val]: [string, any]) => (
                               <div key={key}>
                                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{key}</p>
                                  <p className="text-[11px] font-black text-slate-600 uppercase truncate">{val}</p>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                   ))}
                   {(!task.versions || task.versions.length === 0) && (
                     <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase italic tracking-widest">Awaiting first artifact submission</p>
                     </div>
                   )}
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="m-0 space-y-6">
                 <div className="space-y-6">
                   {task.feedbacks?.map((f: any) => (
                     <div key={f.id} className="relative pl-8 border-l-2 border-slate-100 py-2">
                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
                        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                           <div className="flex items-center justify-between">
                              <Badge className={cn(
                                "border-none font-black text-[9px] px-3 py-1 rounded-full",
                                f.approvalStatus === 'APPROVED' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                              )}>
                                {f.approvalStatus}
                              </Badge>
                              <span className="text-[10px] font-black text-slate-400 uppercase italic">
                                {new Date(f.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                           <p className="text-sm text-slate-600 font-medium italic leading-relaxed">"{f.content}"</p>
                           <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between opacity-50">
                              <div className="flex items-center gap-2">
                                 <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Verified PIN</span>
                              </div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">By {f.fromDivision}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                   {(!task.feedbacks || task.feedbacks.length === 0) && (
                     <p className="text-center py-10 text-xs font-bold text-slate-300 uppercase italic tracking-widest">No feedback records yet</p>
                   )}
                 </div>
              </TabsContent>
            </div>

            {/* Actions Bar */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-4">
               {task.kanbanState === 'WAITING_APJ' && !showRejectInput && (
                 <>
                  <Button 
                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                    onClick={() => onAction('APJ_REVIEW', { status: 'APPROVED' })}
                  >
                     <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-14 rounded-2xl border-rose-200 text-rose-600 font-bold uppercase text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    onClick={() => setShowRejectInput(true)}
                  >
                     <XCircle className="w-4 h-4" /> Reject
                  </Button>
                 </>
               )}
               {task.kanbanState === 'WAITING_APJ' && showRejectInput && (
                 <div className="col-span-2 space-y-4">
                   <Textarea 
                     placeholder="Describe what needs to be fixed..."
                     value={rejectNotes}
                     onChange={(e) => setRejectNotes(e.target.value)}
                     className="min-h-[100px] rounded-2xl"
                   />
                   <div className="flex gap-4">
                     <Button 
                       variant="outline"
                       className="flex-1 h-12 rounded-2xl"
                       onClick={() => { setShowRejectInput(false); setRejectNotes(""); }}
                     >
                       Cancel
                     </Button>
                     <Button 
                       className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-xs"
                       onClick={() => {
                         onAction('APJ_REVIEW', { status: 'REJECTED', notes: rejectNotes });
                         setShowRejectInput(false);
                         setRejectNotes("");
                       }}
                     >
                       Send Rejection
                     </Button>
                   </div>
                 </div>
               )}

               {task.kanbanState === 'WAITING_CLIENT' && !showRejectInput && (
                 <>
                  <Button 
                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                    onClick={() => onAction('CLIENT_REVIEW', { status: 'APPROVED' })}
                  >
                     <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-14 rounded-2xl border-rose-200 text-rose-600 font-bold uppercase text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    onClick={() => setShowRejectInput(true)}
                  >
                     <XCircle className="w-4 h-4" /> Reject
                  </Button>
                 </>
               )}
               {task.kanbanState === 'WAITING_CLIENT' && showRejectInput && (
                 <div className="col-span-2 space-y-4">
                   <Textarea 
                     placeholder="Describe what the client wants changed..."
                     value={rejectNotes}
                     onChange={(e) => setRejectNotes(e.target.value)}
                     className="min-h-[100px] rounded-2xl"
                   />
                   <div className="flex gap-4">
                     <Button 
                       variant="outline"
                       className="flex-1 h-12 rounded-2xl"
                       onClick={() => { setShowRejectInput(false); setRejectNotes(""); }}
                     >
                       Cancel
                     </Button>
                     <Button 
                       className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-xs"
                       onClick={() => {
                         onAction('CLIENT_REVIEW', { status: 'REJECTED', notes: rejectNotes });
                         setShowRejectInput(false);
                         setRejectNotes("");
                       }}
                     >
                       Send Rejection
                     </Button>
                   </div>
                 </div>
               )}

               {task.kanbanState === 'IN_PROGRESS' && (
                 <Button 
                   className="col-span-2 h-14 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold uppercase text-xs tracking-widest shadow-xl transition-all"
                   onClick={() => onAction('SUBMIT_APJ')}
                 >
                    Submit to Legal
                 </Button>
               )}

               {task.kanbanState === 'INBOX' && (
                 <div className="col-span-2 text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-[.3em] italic">
                   Upload artwork to begin
                 </div>
               )}

               {task.isLocked && !unlockAction && (
                 <div className="col-span-2 space-y-4">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Task locked — overlimit revision</p>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl border-amber-200 text-amber-600 font-bold uppercase text-xs hover:bg-amber-50"
                      onClick={() => setUnlockAction('WAIVE')}
                    >
                      Waive (No Charge)
                    </Button>
                    <Button 
                      className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs"
                      onClick={() => onAction('UNLOCK', { action: 'CHARGE' })}
                    >
                      Charge Client
                    </Button>
                  </div>
                 </div>
               )}
               {unlockAction === 'WAIVE' && (
                 <div className="col-span-2 space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Enter Manager PIN to waive</p>
                   <input 
                     type="password" 
                     maxLength={6}
                     placeholder="6-digit PIN"
                     value={managerPin}
                     onChange={(e) => setManagerPin(e.target.value)}
                     className="w-full h-14 rounded-2xl bg-slate-50 border-none text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                   <div className="flex gap-4">
                     <Button 
                       variant="outline"
                       className="flex-1 h-12 rounded-2xl"
                       onClick={() => { setUnlockAction(null); setManagerPin(""); }}
                     >
                       Cancel
                     </Button>
                     <Button 
                       className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold uppercase text-xs"
                       disabled={managerPin.length < 6}
                       onClick={() => {
                         onAction('UNLOCK', { action: 'WAIVE', managerPin });
                         setUnlockAction(null);
                         setManagerPin("");
                       }}
                     >
                       Confirm Waive
                     </Button>
                   </div>
                 </div>
               )}

               {task.kanbanState === 'REVISION' && (
                 <div className="col-span-2 text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-[.3em] italic">
                   Upload a new version to continue
                 </div>
               )}
               {task.kanbanState === 'LOCKED' && (
                 <div className="col-span-2 text-center py-4 text-[10px] font-black text-emerald-500 uppercase tracking-[.3em] italic flex items-center justify-center gap-2">
                   <CheckCircle className="w-4 h-4" /> Design Finalized — Ready for Print
                 </div>
               )}
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

