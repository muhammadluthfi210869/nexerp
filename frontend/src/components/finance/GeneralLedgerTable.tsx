"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Hash, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JournalLine {
  id: string;
  debit: number;
  credit: number;
  account: {
    code: string;
    name: string;
  };
}

interface JournalEntry {
  id: string;
  date: string;
  reference: string | null;
  description: string;
  lines: JournalLine[];
}

interface GeneralLedgerTableProps {
  data?: JournalEntry[];
  isLoading?: boolean;
}

export function GeneralLedgerTable({ data = [], isLoading }: GeneralLedgerTableProps) {
  if (isLoading) return <Skeleton className="h-[500px] w-full rounded-[3rem]" />;

  return (
    <Card className="bg-white border-none shadow-[0_30px_90px_-20px_rgba(0,0,0,0.05)] rounded-[3rem] overflow-hidden">
      <CardHeader className="p-10 border-b border-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl font-black italic tracking-tighter text-slate-900 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-brand-blue" /> GENERAL JOURNAL LEDGER
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                    Verified Multi-Account Audit Trail
                </CardDescription>
            </div>
            <div className="text-right">
                <Badge variant="outline" className="rounded-xl border-slate-100 font-bold px-4 py-1 text-slate-400">
                    {data.length} ENTRIES ARCHIVED
                </Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FBFBFC]">
                <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-tight pl-10">Date / Ref</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-tight">Description / Entry Detail</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-tight text-right">Debit</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-tight text-right pr-10">Credit</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic font-medium">No archived journal entries found.</td></tr>
              ) : (
                data.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 pl-10 align-top">
                        <p className="font-extrabold text-sm text-slate-900">{new Date(entry.date).toLocaleDateString('en-GB')}</p>
                        <p className="text-[10px] font-black uppercase text-brand-blue/50 mt-1 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> {entry.reference || 'NO REF'}
                        </p>
                    </td>
                    <td className="p-8 align-top">
                        <p className="font-bold text-slate-700 mb-6 italic">"{entry.description}"</p>
                        <div className="space-y-3">
                            {entry.lines.map((line) => (
                                <div key={line.id} className="grid grid-cols-4 items-center gap-4">
                                    <div className="col-span-2">
                                        <div className={`flex items-center gap-2 ${line.credit > 0 ? 'ml-6 border-l-2 border-slate-100 pl-4' : ''}`}>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{line.account.code}</span>
                                            <span className={`text-xs font-bold ${line.credit > 0 ? 'text-slate-500' : 'text-slate-900'}`}>{line.account.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right font-sans font-bold text-xs text-emerald-600">
                                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                    </div>
                                    <div className="text-right font-sans font-bold text-xs text-orange-600 pr-4">
                                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </td>
                    <td className="p-8 text-right align-top bg-emerald-50/5 font-sans font-black text-slate-900 text-sm">
                        {formatCurrency(entry.lines.reduce((sum, l) => sum + Number(l.debit), 0))}
                    </td>
                    <td className="p-8 text-right align-top bg-orange-50/5 font-sans font-black text-slate-900 text-sm pr-10">
                        {formatCurrency(entry.lines.reduce((sum, l) => sum + Number(l.credit), 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

