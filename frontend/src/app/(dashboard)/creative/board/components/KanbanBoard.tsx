"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { DnaBadge } from "@/components/dna";

const COLUMNS = [
  { id: 'INBOX', label: 'Inbox', status: 'default' as const },
  { id: 'IN_PROGRESS', label: 'In Progress', status: 'info' as const },
  { id: 'WAITING_APJ', label: 'Waiting Legal', status: 'warning' as const },
  { id: 'WAITING_CLIENT', label: 'Waiting Client', status: 'purple' as const },
  { id: 'REVISION', label: 'Revision', status: 'critical' as const },
  { id: 'LOCKED', label: 'Locked / Print', status: 'success' as const },
];

export function KanbanBoard({ tasks, onTaskClick }: { tasks: any[], onTaskClick: (task: any) => void }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-10 min-h-[60vh] custom-scrollbar mt-4">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex-1 min-w-[300px] max-w-[340px]">
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-3">
               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">{col.label}</h3>
               <DnaBadge status={col.status} className="shadow-none rounded-full px-2 py-0.5 text-[8px] font-mono">
                  {tasks.filter(t => t.kanbanState === col.id).length}
               </DnaBadge>
            </div>
          </div>

          <div className="space-y-4">
            {tasks
              .filter((task) => task.kanbanState === col.id)
              .map((task) => (
                <Card 
                  key={task.id} 
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer rounded-[24px] group bg-white relative overflow-hidden animate-fade-slide-in",
                    task.isLocked && "ring-1 ring-rose-500/10 border-rose-100"
                  )}
                >
                  {/* Progress Indicator */}
                  <div 
                    className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-700" 
                    style={{ width: `${Math.min((task.revisionCount / 3) * 100, 100)}%` }} 
                  />

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">
                            {task.lead?.brandName || 'UNTITLED'}
                          </p>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{task.lead?.clientName}</h4>
                       </div>
                       {task.isLocked && <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />}
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold line-clamp-2 italic leading-relaxed">
                       "{task.brief}"
                    </p>

                    <div className="pt-3.5 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                             {[1, 2].map(i => (
                               <div key={i} className="w-4 h-4 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-black text-slate-400 uppercase">
                                  {i === 1 ? 'BD' : 'APJ'}
                               </div>
                             ))}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Rev {task.revisionCount}/3</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <Clock className={cn(
                            "w-3 h-3",
                            task.slaDeadline && differenceInDays(new Date(task.slaDeadline), new Date()) < 3 ? "text-rose-500" : "text-slate-300"
                          )} />
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-tighter",
                            task.slaDeadline && differenceInDays(new Date(task.slaDeadline), new Date()) < 3 ? "text-rose-500" : "text-slate-400"
                          )}>
                            {task.slaDeadline ? `${differenceInDays(new Date(task.slaDeadline), new Date())}D Left` : 'No SLA'}
                          </span>
                       </div>
                    </div>
                  </div>
                </Card>
              ))}
            
            {tasks.filter(t => t.kanbanState === col.id).length === 0 && (
               <div className="py-14 border border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center gap-2 opacity-30">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                     <AlertTriangle className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Zero Traffic</p>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
