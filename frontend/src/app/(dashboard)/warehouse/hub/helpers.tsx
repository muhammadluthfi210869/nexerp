import React from "react";
import { cn } from "@/lib/utils";

export function DetailSection({
 title,
 children,
}: {
 title: string;
 children: React.ReactNode;
}) {
 return (
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
 {title}
 </h3>
 <div className="h-px bg-slate-100 w-full" />
 </div>
 {children}
 </div>
 );
}

export function DataField({
 label,
 value,
 isAlert = false,
}: {
 label: string;
 value: string | number;
 isAlert?: boolean;
}) {
 return (
 <div className="space-y-1.5">
 <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">
 {label}
 </p>
 <p
 className={cn(
 "text-sm font-black uppercase italic tracking-tight",
 isAlert ? "text-rose-600" : "text-slate-900",
 )}
 >
 {value}
 </p>
 </div>
 );
}
