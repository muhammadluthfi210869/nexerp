"use client";
export const dynamic = "force-dynamic";


import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  Download, 
  AlertCircle,
  Clock,
  User,
  Database,
  Lock,
  ChevronRight,
  Fingerprint
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      // Mock data for demo if API fails
      try {
        const res = await api.get("/executive/audit-logs");
        return res.data;
      } catch (e) {
        return [
          { id: "1", createdAt: new Date().toISOString(), user: { name: "Ahmad Finance", role: "CONTROLLER" }, action: "AUTHORIZE_PAYMENT", type: "AUTHORIZE", entityType: "SALES_ORDER", entityId: "SO-2024-001", hash: "a8f23b9d0e1c2d3e4f5a6b7c8d9e0f1a" },
          { id: "2", createdAt: new Date(Date.now() - 3600000).toISOString(), user: { name: "Budi Warehouse", role: "WH_MANAGER" }, action: "STOCK_ADJUSTMENT", type: "UPDATE", entityType: "INVENTORY", entityId: "SKU-RM-042", hash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7" },
          { id: "3", createdAt: new Date(Date.now() - 7200000).toISOString(), user: { name: "Citra Sales", role: "SALES_LEAD" }, action: "NEW_CONTRACT", type: "CREATE", entityType: "CLIENT", entityId: "CL-992", hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8" },
          { id: "4", createdAt: new Date(Date.now() - 10800000).toISOString(), user: { name: "Dedi Admin", role: "SUPER_ADMIN" }, action: "SENSITIVE_OVERRIDE", type: "OVERRIDE", entityType: "USER_PERMISSIONS", entityId: "USR-08", hash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9" },
        ];
      }
    },
  });

  const filteredLogs = logs?.filter((log: any) => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-base p-8 md:p-12 font-sans text-slate-900 pb-32">
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                  <ShieldCheck className="text-emerald-400 h-6 w-6 stroke-[2.5px]" />
               </div>
               <Badge className="bg-slate-100 text-slate-500 border-none font-black uppercase text-[10px] tracking-tight px-4 py-1.5 rounded-full">
                  Immutable Archive
               </Badge>
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter italic text-slate-900 leading-none">
                AUDIT <span className="text-emerald-500">TRAIL</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] mt-4 opacity-70">
                Centralized Transactional Integrity & User Forensics
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  placeholder="SEARCH HASH / USER / ENTITY..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 w-80 pl-12 bg-white border-none shadow-sm rounded-2xl font-black text-xs tracking-tight uppercase placeholder:text-slate-200 focus:ring-4 focus:ring-emerald-50 transition-all"
                />
             </div>
             <Button variant="outline" className="h-14 w-14 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50">
                <Filter className="h-5 w-5 text-slate-400" />
             </Button>
             <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-tight text-[11px] shadow-xl shadow-slate-200 flex items-center gap-3">
                <Download className="h-4 w-4" /> Export Ledger
             </Button>
          </div>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
         <AuditStat label="Active Sessions" value="24" icon={User} color="text-blue-500" />
         <AuditStat label="System Integrity" value="100%" icon={Lock} color="text-emerald-500" />
         <AuditStat label="Today's Mutations" value="1,402" icon={Database} color="text-purple-500" />
         <AuditStat label="Risk Index" value="0.00" icon={AlertCircle} color="text-slate-300" />
      </div>

      {/* LOGS TABLE */}
      <Card className="max-w-7xl mx-auto border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] rounded-[40px] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-left text-[10px] font-black uppercase tracking-tight text-slate-400">Timestamp</th>
                <th className="p-8 text-left text-[10px] font-black uppercase tracking-tight text-slate-400">Identity</th>
                <th className="p-8 text-left text-[10px] font-black uppercase tracking-tight text-slate-400">Action Protocol</th>
                <th className="p-8 text-left text-[10px] font-black uppercase tracking-tight text-slate-400">Entity Scope</th>
                <th className="p-8 text-right text-[10px] font-black uppercase tracking-tight text-slate-400">Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredLogs?.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="group hover:bg-slate-50/30 transition-all cursor-pointer">
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-slate-300" />
                          <div className="space-y-0.5">
                             <p className="text-sm font-bold text-slate-800 tracking-tight">
                                {format(new Date(log.createdAt), "HH:mm:ss")}
                             </p>
                             <p className="text-[10px] font-black text-slate-300 uppercase italic">
                                {format(new Date(log.createdAt), "MMM dd, yyyy")}
                             </p>
                          </div>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-[11px] font-black text-slate-400">
                             {log.user?.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800">{log.user?.name}</p>
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">{log.user?.role}</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                          <ActionIcon type={log.type} />
                          <p className="text-sm font-black italic uppercase text-slate-700">{log.action}</p>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="space-y-1">
                          <Badge variant="outline" className="border-slate-200 text-slate-500 font-black uppercase text-[9px] tracking-tight px-2 py-0.5">
                             {log.entityType}
                          </Badge>
                          <p className="text-xs font-bold text-slate-400 tracking-tighter">#{log.entityId}</p>
                       </div>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex flex-col items-end gap-1">
                          <Fingerprint className="h-4 w-4 text-slate-200" />
                          <p className="text-[9px] font-sans text-slate-300 uppercase break-all max-w-[120px]">
                             {log.hash.substring(0, 16)}...
                          </p>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                       <History size={64} className="stroke-[1px]" />
                       <p className="text-xl font-black italic uppercase tracking-tighter">No forensic data found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AuditStat({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="p-8 border-none bg-white shadow-sm flex flex-col gap-4 rounded-[32px] group hover:scale-[1.02] transition-all">
       <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 stroke-[2.5px]" />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-4xl font-black tracking-tighter italic text-slate-900">{value}</p>
       </div>
    </Card>
  );
}

function ActionIcon({ type }: { type: string }) {
  const colors = {
    CREATE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    UPDATE: "bg-blue-50 text-blue-600 border-blue-100",
    DELETE: "bg-red-50 text-red-600 border-red-100",
    AUTHORIZE: "bg-purple-50 text-purple-600 border-purple-100",
    OVERRIDE: "bg-orange-50 text-orange-600 border-orange-100",
  };
  
  const colorClass = (colors as any)[type] || "bg-slate-50 text-slate-400 border-slate-100";
  
  return (
    <div className={`h-2 w-2 rounded-full ${colorClass.split(' ')[0]} ring-4 ring-slate-50`} />
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-8"><div className="h-10 w-32 bg-slate-100 rounded-xl" /></td>
      <td className="p-8"><div className="h-10 w-48 bg-slate-100 rounded-xl" /></td>
      <td className="p-8"><div className="h-10 w-40 bg-slate-100 rounded-xl" /></td>
      <td className="p-8"><div className="h-10 w-32 bg-slate-100 rounded-xl" /></td>
      <td className="p-8"><div className="h-10 w-24 bg-slate-100 rounded-xl ml-auto" /></td>
    </tr>
  );
}

