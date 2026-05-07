"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  Activity, 
  Users,
  ShieldAlert,
  BarChart3,
  UserPlus,
  Briefcase,
  Star,
  Search,
  Settings,
  ShieldCheck,
  Package,
  Heart,
  Globe,
  PenTool,
  Scale,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const DIVISION_MAP: Record<string, { number: number; title: string; icon: any; divisions: string[] }> = {
  KEUANGAN: { number: 1, title: "DEPARTEMEN KEUANGAN", icon: Wallet, divisions: ["FINANCE"] },
  SECRETARIAT: { number: 2, title: "SECRETARIAT & PURCHASING", icon: ShoppingCart, divisions: ["MANAGEMENT", "SCM"] },
  COMPLIANCE: { number: 3, title: "COMPLIANCE & QA", icon: ShieldCheck, divisions: ["LEGAL", "QC"] },
  HR_LEGAL: { number: 4, title: "DEPARTEMEN HR & LEGAL", icon: Users, divisions: ["MANAGEMENT"] },
  DIGITAL_MARKETING: { number: 5, title: "STRATEGIST & DIGITAL MARKETING", icon: Globe, divisions: ["CREATIVE", "SYSTEM"] },
  MARKETING: { number: 6, title: "MARKETING & DEVELOPMENT", icon: PenTool, divisions: ["BD"] },
  RND: { number: 7, title: "RESEARCH & DEVELOPMENT", icon: Heart, divisions: ["RND"] },
  PRODUCTION: { number: 8, title: "PRODUCTION & QUALITY CONTROL", icon: Settings, divisions: ["PRODUCTION", "QC"] },
  WAREHOUSE: { number: 9, title: "WAREHOUSE & SHIPPING", icon: Package, divisions: ["WAREHOUSE"] },
};

const PersonnelTable = ({ title, icon: Icon, number, data }: { title: string; icon: any; number: number; data: any[] }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
       <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-black" />
       </div>
       <h3 className="text-[13px] font-black uppercase tracking-tight text-brand-black italic">{number}. {title}</h3>
    </div>

    <Card className="rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
       <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th colSpan={2} className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">I. IDENTITAS & JABATAN</th>
                <th colSpan={4} className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">II. EVALUASI PERFORMA (KPI)</th>
                <th colSpan={3} className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">III. AUDIT PKWT (KONTRAK)</th>
                <th colSpan={2} className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">IV. STATUS & ACTION</th>
              </tr>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest">NAMA & POSISI</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">TGL MASUK</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">SKOR KPI</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">DISIPLIN</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">OUTPUT</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">ATTITUDE</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">DURASI KONTRAK</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">TIPE</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">REV</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">VISUAL PROGRESS</th>
                <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">AUDIT STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-[10px] font-black text-slate-300 italic uppercase">No personnel data</td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const daysLeft = row.daysLeft ?? 0;
                  const kpiScore = row.kpi ?? 0;
                  const isCritical = kpiScore < 75 || daysLeft < 60;
                  const isExpiring = daysLeft < 30;
                  const progressWidth = daysLeft > 365 ? 60 : daysLeft > 180 ? 70 : daysLeft > 90 ? 80 : daysLeft > 30 ? 90 : 95;

                  return (
                    <tr key={row.id || i} className={cn(
                      "group hover:bg-rose-100/40 transition-colors cursor-default",
                      isCritical ? "bg-rose-50/30" : "bg-white"
                    )}>
                      <td className="px-6 py-4">
                         <p className="text-[10px] font-black text-brand-black uppercase tracking-tight leading-none">{row.name}</p>
                         <p className="text-[7.5px] font-bold text-slate-400 uppercase leading-none mt-1.5">{row.position} | ID: {row.id?.slice(0, 8) || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 border-r border-slate-100">
                         <span className="text-[10px] font-black text-brand-black tabular">
                           {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={cn("text-[13px] font-black tabular", kpiScore < 70 ? "text-rose-500" : "text-brand-black")}>{kpiScore}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-[10px] font-black text-brand-black tabular">{row.disiplin}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-[8.5px] font-black text-brand-black uppercase">{row.output || 'NORMAL'}</span>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                         <span className="text-[10px] font-black text-brand-black tabular">{row.attitude}/5</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {row.contractEnd ? (
                           <>
                             <p className="text-[9px] font-black text-brand-black tabular leading-none">
                               {new Date(row.contractEnd).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                             </p>
                             <p className="text-[7.5px] font-black text-rose-500 uppercase leading-none mt-1 italic">
                               SISA {Math.max(0, daysLeft)} HARI
                             </p>
                           </>
                         ) : (
                           <span className="text-[9px] font-black text-slate-400">-</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-[8.5px] font-black text-indigo-600 uppercase tracking-tighter">{row.type || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                         <span className="text-[10px] font-black text-brand-black">{row.rev ?? 0}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                            <div className={cn("h-full rounded-full", isExpiring ? "bg-rose-500" : isCritical ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${progressWidth}%` }} />
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex flex-col gap-1 items-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-[4px] text-[6px] font-black uppercase tracking-widest",
                              isCritical ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                            )}>
                              {isCritical ? "CRITICAL" : "STABLE"}
                            </span>
                            {isExpiring && (
                              <span className="bg-rose-600 text-white px-2 py-0.5 rounded-[4px] text-[6px] font-black uppercase tracking-widest">EXPIRE</span>
                            )}
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
       </div>
    </Card>
  </div>
);

export default function HRDashboardClient() {
  const [executive, setExecutive] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [execRes, deptRes] = await Promise.all([
          api.get("/hr/executive-summary"),
          api.get("/hr/department-scores"),
        ]);

        setExecutive(execRes.data);

        // Map department scores response to our 9 sections
        const divisions = deptRes.data || [];
        const mapped: Record<string, any[]> = {};

        for (const [key, group] of Object.entries(DIVISION_MAP)) {
          const allEmployees: any[] = [];
          for (const div of group.divisions) {
            const dept = divisions.find((d: any) => d.division === div);
            if (dept?.employees) {
              allEmployees.push(...dept.employees);
            }
          }
          mapped[key] = allEmployees;
        }

        setDepartmentData(mapped);
      } catch (err: any) {
        console.error("HR Dashboard fetch error:", err);
        setError(err?.message || "Failed to load HR data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Synchronizing HR Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic">{error}</p>
          <p className="text-[9px] text-slate-400 font-black uppercase">Run seed first: npx prisma db seed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen space-y-12">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[32px] font-black tracking-tighter uppercase leading-none">
            <span className="text-brand-black">HR COMMAND CENTER</span> 
            <span className="text-slate-400 font-bold ml-2 text-[18px] lowercase">(Financial & Talent Audit)</span>
          </h1>
        </div>
      </div>

      {/* I. EXECUTIVE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="rounded-3xl p-6 border border-blue-100 bg-blue-50/10 shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-500" />
            <p className="text-[8.5px] font-black text-brand-black uppercase tracking-widest">BUDGET & SAVINGS</p>
          </div>
          <div>
            <h2 className="text-[28px] font-black tracking-tighter tabular leading-none text-blue-600">{executive?.budgetSavings || 'N/A'}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-emerald-500">{executive?.savingsValue || ''}</p>
          </div>
        </Card>

        <Card className="rounded-3xl p-6 border border-slate-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-400" />
            <p className="text-[8.5px] font-black text-brand-black uppercase tracking-widest">HIRING SPEED</p>
          </div>
          <div>
            <h2 className="text-[28px] font-black tracking-tighter tabular leading-none text-brand-black">{executive?.hiringSpeed || 'N/A'}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">{executive?.hiringSub || ''}</p>
          </div>
        </Card>

        <Card className="rounded-3xl p-6 border border-slate-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <p className="text-[8.5px] font-black text-brand-black uppercase tracking-widest">STABILITY INDEX</p>
          </div>
          <div>
            <h2 className="text-[28px] font-black tracking-tighter tabular leading-none text-rose-600">{executive?.stabilityIndex || 'N/A'}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">{executive?.stabilitySub || ''}</p>
          </div>
        </Card>

        <Card className="rounded-3xl p-6 border border-slate-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-[8.5px] font-black text-brand-black uppercase tracking-widest">WORKLOAD</p>
          </div>
          <div>
            <h2 className="text-[28px] font-black tracking-tighter tabular leading-none text-brand-black">{executive?.workload ?? 'N/A'}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">{executive?.workloadSub || ''}</p>
          </div>
        </Card>

        <Card className="rounded-3xl p-6 border border-slate-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-blue-400" />
            <p className="text-[8.5px] font-black text-brand-black uppercase tracking-widest">AVG KPI</p>
          </div>
          <div>
            <h2 className="text-[28px] font-black tracking-tighter tabular leading-none text-brand-black">{executive?.avgKpi || 'N/A'}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">{executive?.avgKpiSub || ''}</p>
          </div>
        </Card>
      </div>

      {/* II. RECRUITMENT PIPELINE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <Search className="w-4 h-4 text-indigo-500" />
           <h3 className="text-[11px] font-black uppercase tracking-tighter text-brand-black italic">1. RECRUITMENT PIPELINE (ACTIVE AUDIT)</h3>
        </div>
        <Card className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
           <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50">
                 <tr>
                   <th className="px-8 py-5 text-[8px] font-black text-slate-400 uppercase tracking-widest">CANDIDATE / SOURCE</th>
                   <th className="px-8 py-5 text-[8px] font-black text-slate-400 uppercase tracking-widest">POSITION / DEPT</th>
                   <th className="px-8 py-5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">HR PIC</th>
                   <th className="px-8 py-5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">STAGES (DATE)</th>
                   <th className="px-8 py-5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">STATUS</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-[10px] font-black text-slate-300 italic uppercase">Pipeline data coming soon — integrate with Ticket/Leave system</td>
                </tr>
              </tbody>
           </table>
        </Card>
      </div>

      {/* III. DEPARTMENT AUDITS */}
      <div className="space-y-12 pb-24">
        {Object.entries(DIVISION_MAP).map(([key, group]) => (
          <PersonnelTable
            key={key}
            number={group.number}
            title={group.title}
            icon={group.icon}
            data={departmentData[key] || []}
          />
        ))}
      </div>
    </div>
  );
}
