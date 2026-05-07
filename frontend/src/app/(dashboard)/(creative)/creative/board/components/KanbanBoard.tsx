"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle2, UserCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

const COLUMNS = [
  { id: 'INBOX', label: 'Inbox', color: 'bg-slate-100 text-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'WAITING_APJ', label: 'Waiting Legal', color: 'bg-amber-100 text-amber-600' },
  { id: 'WAITING_CLIENT', label: 'Waiting Client', color: 'bg-blue-100 text-blue-600' },
  { id: 'REVISION', label: 'Revision', color: 'bg-rose-100 text-rose-600' },
  { id: 'LOCKED', label: 'Locked / Print', color: 'bg-emerald-100 text-emerald-600' },
];

export function KanbanBoard({ tasks, onTaskClick }: { tasks: any[], onTaskClick: (task: any) => void }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-10 min-h-[70vh]">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex-1 min-w-[320px] max-w-[350px]">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{col.label}</h3>
               <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-black border-none", col.color)}>
                  {tasks.filter(t => t.kanbanState === col.id).length}
               </Badge>
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
                    "p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer rounded-3xl group bg-white relative overflow-hidden",
                    task.isLocked && "ring-2 ring-rose-500/20"
                  )}
                >
                  {/* Progress Indicator */}
                  <div 
                    className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-700" 
                    style={{ width: `${Math.min((task.revisionCount / 3) * 100, 100)}%` }} 
                  />

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tight mb-1">
                            {task.lead?.brandName || 'UNTITLED'}
                          </p>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{task.lead?.clientName}</h4>
                       </div>
                       {task.isLocked && <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium line-clamp-2 italic leading-relaxed">
                       "{task.brief}"
                    </p>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                             {[1, 2].map(i => (
                               <div key={i} className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                  {i === 1 ? 'BD' : 'APJ'}
                               </div>
                             ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Rev {task.revisionCount}/3</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Clock className={cn(
                            "w-3 h-3",
                            task.slaDeadline && differenceInDays(new Date(task.slaDeadline), new Date()) < 3 ? "text-rose-500" : "text-slate-300"
                          )} />
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-tighter italic",
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
               <div className="py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 opacity-20 grayscale">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                     <AlertTriangle className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero Traffic</p>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

