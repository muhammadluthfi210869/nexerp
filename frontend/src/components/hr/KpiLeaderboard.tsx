import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  ArrowUpRight, 
} from "lucide-react";
import { cn } from "@/lib/utils";

export async function KpiLeaderboard() {
  const prisma = (await import("@/lib/prisma")).default;
  try {
    const currentMonth = "2024-05"; // Simplified for now
    
    // Fetch Top 5 Employees based on KpiScores
    const leaderboard = await prisma.kpiScore.findMany({
      orderBy: { finalScore: "desc" },
      take: 10,
      include: { 
        employee: { 
          include: { 
            roles: true 
          } 
        } 
      }
    });


    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-emerald-500 rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📈 II. PERFORMANCE MATRIX (HUMAN CAPITAL)</h3>
        </div>
        <Card className="bento-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Personnel Audit - {currentMonth}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Score</span>
                  <span className="text-xl font-black text-brand-black tabular">88.4 <span className="text-[10px] text-emerald-500 italic">+2.4%</span></span>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">RANK</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">PERSONNEL / ROLE</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">DIVISION</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">OBJ (70%)</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">SUBJ (30%)</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">FINAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-black uppercase text-[10px] italic tabular">AWAITING HARVEST DATA...</td>
                  </tr>
                ) : (
                  leaderboard.map((row, index) => (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-black italic text-[11px] tabular",
                          index === 0 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          index === 1 ? "bg-slate-100 text-slate-700 border border-slate-200" :
                          index === 2 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                          "bg-slate-50 text-slate-400"
                        )}>
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-brand-black uppercase tracking-tight italic">{row.employee.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{row.employee.roles[0]?.roleName || 'UNASSIGNED'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-1 bg-slate-100 rounded-md">
                          {row.employee.roles[0]?.division || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${row.objectiveScore || 0}%` }} />
                           </div>
                           <span className="text-[10px] font-black text-emerald-600 tabular">{(row.objectiveScore || 0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${row.subjectiveScore || 0}%` }} />
                           </div>
                           <span className="text-[10px] font-black text-indigo-600 tabular">{(row.subjectiveScore || 0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm font-black text-brand-black tabular tracking-tighter">{row.finalScore.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    return <div className="bento-card p-10 text-slate-400 text-center uppercase font-black text-[10px] italic tabular border-dashed border-2">Leaderboard Offline - Harvesting Engine Reconnecting...</div>;
  }
}

