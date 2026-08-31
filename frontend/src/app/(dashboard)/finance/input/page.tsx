"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
 OperationalPageShell,
 OperationalStatusBadge,
} from "@/components/operational";

export default function FinanceInputPage() {
 const router = useRouter();

 const inputs = [
 {
 title: "Kas Masuk",
 subtitle: "Pencatatan penerimaan dana masuk",
 icon: ArrowUpCircle,
 href: "/finance/cash-in",
 color: "from-emerald-500 to-emerald-600",
 iconColor: "text-emerald-500",
 bgColor: "bg-emerald-50",
 borderColor: "border-emerald-200 hover:border-emerald-400",
 },
 {
 title: "Kas Keluar",
 subtitle: "Pencatatan pengeluaran dana",
 icon: ArrowDownCircle,
 href: "/finance/cash-out",
 color: "from-rose-500 to-rose-600",
 iconColor: "text-rose-500",
 bgColor: "bg-rose-50",
 borderColor: "border-rose-200 hover:border-rose-400",
 },
 ];

 return (
 <OperationalPageShell
 title="Finance Input"
 subtitle="Pencatatan transaksi kas masuk dan kas keluar"
 actions={<OperationalStatusBadge status="process">Input Terminal</OperationalStatusBadge>}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {inputs.map((item) => (
 <button
 key={item.href}
 onClick={() => router.push(item.href)}
 className={`group relative overflow-hidden rounded-2xl border ${item.borderColor} bg-white p-8 text-left transition-all duration-300 hover: cursor-pointer`}
 >
 <div className={`absolute top-0 right-0 p-6 opacity-5 pointer-events-none ${item.iconColor}`}>
 <item.icon size={120} />
 </div>
 <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${item.bgColor} mb-4`}>
 <item.icon className={`h-7 w-7 ${item.iconColor}`} />
 </div>
 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
 {item.title}
 </h3>
 <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
 {item.subtitle}
 </p>
 </button>
 ))}
 </div>
 </OperationalPageShell>
 );
}
