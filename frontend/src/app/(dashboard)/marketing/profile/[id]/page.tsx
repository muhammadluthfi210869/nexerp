"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, CalendarDays, BarChart3 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardCard, PageSection, TableWrapper } from "@/components/dna";
import { marketingProfiles } from "@/components/marketing/project-management-prototype-extra-data";
import { marketingTasks } from "@/components/marketing/project-management-prototype-data";
import { AvatarPill, ProgressBar, StatusBadge } from "@/components/marketing/project-management-prototype-ui";
import { useMarketingPrototypeBundle } from "@/components/marketing/use-marketing-prototype";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";

type ProfileRow = {
 id: string;
 name: string;
 role: string;
 email: string;
 phone: string;
 joinDate: string;
 bio: string;
 monthKpi: number;
 breakdown: {
 completion: number;
 discipline: number;
 quality: number;
 productivity: number;
 };
};

type TaskRow = {
 id: string;
 title: string;
 project: string;
 dueDate: string;
 status: string;
 pic: string;
};

export default function MarketingProfilePage({ params }: { params: { id: string } }) {
 const { data: prototype } = useMarketingPrototypeBundle();
 const profiles = (prototype?.profiles ?? marketingProfiles) as ProfileRow[];
 const tasksSource = (prototype?.tasks ?? marketingTasks) as TaskRow[];
 const profile = profiles.find((item: ProfileRow) => item.id === params.id);
 if (!profile) {
 return (
 <DashboardShell
 title="Marketing"
 titleAccent="Profile"
 subtitle="Employee performance profile with KPI context and current task list."
 >
 <PageSection title="Profile Summary">
 <DashboardCard label="Profile Missing">
 <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
 The requested profile could not be found in the current prototype data.
 </p>
 </DashboardCard>
 </PageSection>
 </DashboardShell>
 );
 }

 const tasks = tasksSource.filter((task: TaskRow) => task.pic === profile.name).slice(0, 8);

 return (
 <DashboardShell
 title="Marketing"
 titleAccent="Profile"
 subtitle="Employee performance profile with KPI context and current task list."
 actions={
 <Link
 href="/marketing/leaderboard"
 className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to Leaderboard
 </Link>
 }
 >
 <PageSection title="Profile Summary">
 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
 <DashboardCard label="Identity">
 <div className="space-y-5">
 <AvatarPill name={profile.name} role={profile.role} />
 <p className="text-[11px] font-semibold leading-relaxed text-slate-500">{profile.bio}</p>
 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
 {(
 [
 [Mail, profile.email],
 [Phone, profile.phone],
 [CalendarDays, profile.joinDate],
 ] as Array<[React.ElementType, string]>
 ).map(([Icon, value]) => (
 <div key={String(value)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
 <div className="flex items-center gap-2">
 <Icon className="h-4 w-4 text-slate-400" />
 <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Detail</p>
 </div>
 <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700">{String(value)}</p>
 </div>
 ))}
 </div>
 </div>
 </DashboardCard>

 <DashboardCard label="Month KPI">
 <div className="space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Current Score</p>
 <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-900">{profile.monthKpi}</p>
 </div>
 <BarChart3 className="h-8 w-8 text-blue-600" />
 </div>
 {(
 [
 ["Completion", profile.breakdown.completion],
 ["Discipline", profile.breakdown.discipline],
 ["Quality", profile.breakdown.quality],
 ["Productivity", profile.breakdown.productivity],
 ] as Array<[string, number]>
 ).map(([label, value]) => (
 <div key={label} className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
 <span className="tabular text-[10px] font-black text-slate-700">{value as number}</span>
 </div>
 <ProgressBar value={value as number} />
 </div>
 ))}
 </div>
 </DashboardCard>
 </div>
 </PageSection>

 <PageSection title="Task Breakdown">
 <TableWrapper>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50/70">
 <TableRow className="border-slate-100 hover:bg-transparent">
 {["Task", "Project", "Due", "Status"].map((header) => (
 <TableHead key={header} className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
 {header}
 </TableHead>
 ))}
 </TableRow>
 </TableHeader>
 <TableBody>
 {tasks.map((task: TaskRow) => (
 <TableRow key={task.id} className="border-slate-50 hover:bg-slate-50/70">
 <TableCell className="px-4 py-4">
 <div>
 <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
 <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.id}</p>
 </div>
 </TableCell>
 <TableCell className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{task.project}</TableCell>
 <TableCell className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{task.dueDate}</TableCell>
 <TableCell className="px-4 py-4"><StatusBadge status={task.status} /></TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </TableWrapper>
 </PageSection>
 </DashboardShell>
 );
}
