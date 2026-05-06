"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users2, 
  Network, 
  UserPlus, 
  ChevronRight,
  MoreVertical,
  Scale
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function OrganogramManager() {
  const [employees] = useState([
    { 
      id: "EMP-001", 
      name: "Irma", 
      roles: [
        { division: "FINANCE", name: "Controller", weight: 80, isPrimary: true },
        { division: "SCM", name: "Purchasing", weight: 20, isPrimary: false }
      ]
    },
    { 
      id: "EMP-002", 
      name: "Amira", 
      roles: [
        { division: "RND", name: "Lab Manager", weight: 70, isPrimary: true },
        { division: "COMPLIANCE", name: "Halal Supervisor", weight: 30, isPrimary: false }
      ]
    }
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 🕸️ VIII. DIGITAL TWIN ORGANOGRAM */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-blue-500 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">🕸️ VIII. DIGITAL TWIN ORGANOGRAM (REPORTING AUDIT)</h3>
            </div>
            <Button className="h-9 bg-brand-black text-white hover:bg-slate-800 font-black uppercase text-[10px] px-6 rounded-lg transition-all">
               <UserPlus className="w-3.5 h-3.5 mr-2" /> REGISTER PERSONNEL
            </Button>
          </div>
          
          <Card className="bento-card overflow-hidden">
            <div className="divide-y divide-slate-100">
               {employees.map((emp) => (
                  <div key={emp.id} className="p-8 hover:bg-slate-50/30 transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                              <Users2 className="w-6 h-6 text-slate-400" />
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-brand-black uppercase italic tracking-tight">{emp.name}</h4>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.id} • ACTIVE FULL-TIME</p>
                           </div>
                        </div>
                        <Button variant="ghost" className="h-8 w-8 text-slate-300 hover:text-brand-black rounded-lg">
                           <MoreVertical className="w-4 h-4" />
                        </Button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emp.roles.map((role, idx) => (
                           <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className={cn(
                                   "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                   role.isPrimary ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-white text-slate-400 border border-slate-100"
                                 )}>
                                    {role.isPrimary ? "PRIMARY ROLE" : "SECONDARY ROLE"}
                                 </span>
                                 <span className="text-sm font-black text-brand-black tabular">{role.weight}%</span>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{role.division}</p>
                                 <p className="text-[11px] font-black text-brand-black uppercase italic">{role.name}</p>
                              </div>
                              <Slider 
                                 defaultValue={[role.weight]} 
                                 max={100} 
                                 step={5} 
                                 className="w-full"
                              />
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
          </Card>
        </div>

        {/* ⚖️ IX. WEIGHTED BALANCE & HIERARCHY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-slate-900 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">⚖️ IX. WEIGHTED BALANCE</h3>
            </div>
            <Card className="bento-card p-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                   Personnel with dual-roles have their performance harvested proportionally. Ensure aggregate weight across roles equals 100% for audit precision.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">REPORTING HIERARCHIES</p>
                {['MANAGEMENT', 'OPERATIONS', 'FACTORY STAF'].map((dept) => (
                   <div key={dept} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-brand-black">{dept}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-black" />
                   </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bento-card p-6 bg-brand-black text-white border-none">
             <div className="relative z-10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">SYSTEM PIC</p>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs italic text-white/50">AM</div>
                   <div>
                      <p className="text-[11px] font-black uppercase italic">AMIRA MANAGEMENT</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase">HEAD OF HUMAN INTELLIGENCE</p>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    );
}

