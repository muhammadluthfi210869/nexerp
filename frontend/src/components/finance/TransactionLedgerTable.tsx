"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  date: string;
  type: string;
  category: string;
  amount: number;
  method: string;
  status: string;
}

interface TransactionLedgerTableProps {
  data?: Transaction[];
  isLoading?: boolean;
}

export function TransactionLedgerTable({ data = [], isLoading }: TransactionLedgerTableProps) {
  if (isLoading) return <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />;

  return (
    <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-none rounded-[2.5rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-black/[0.03] px-8 py-6">
        <div>
          <CardTitle className="text-xl font-black italic tracking-tighter text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-blue" /> CENTRAL CASH LEDGER
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-text-muted opacity-60">
            Internal Movement & Transactional Audit Trail
          </CardDescription>
        </div>
        <div className="flex gap-2 opacity-40">
            <Badge variant="outline" className="h-8 gap-2 rounded-xl border-slate-200"><Search className="w-3 h-3" /> Search</Badge>
            <Badge variant="outline" className="h-8 gap-2 rounded-xl border-slate-200"><Filter className="w-3 h-3" /> Filter</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-base/30">
            <TableRow className="hover:bg-transparent border-b-black/[0.03]">
              <TableHead className="font-bold text-[10px] uppercase text-text-muted px-8 py-4">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Date</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Category</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Method</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Type</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted text-right px-8">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-text-muted italic">No transactions found.</TableCell></TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-b-black/[0.02] hover:bg-base/20 transition-colors group">
                  <TableCell className="px-8"><StatusBadge status={row.status} /></TableCell>
                  <TableCell className="text-sm font-medium">{new Date(row.date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-[10px] font-black uppercase text-brand-blue/60 tracking-tight">{row.category.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-600">{row.method}</TableCell>
                  <TableCell>
                    <Badge className={row.type === 'IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}>
                        {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-black font-sans text-sm px-8 ${row.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {row.type === 'IN' ? '+' : '-'}{formatCurrency(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

