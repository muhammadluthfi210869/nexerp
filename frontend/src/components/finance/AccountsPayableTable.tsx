"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, CreditCard } from "lucide-react";

interface Bill {
  id: string;
  billNumber: string;
  supplierName: string;
  totalAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: string;
}

interface AccountsPayableTableProps {
  data?: Bill[];
  isLoading?: boolean;
}

export function AccountsPayableTable({ data = [], isLoading }: AccountsPayableTableProps) {
  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />;

  return (
    <Card className="bg-white/80 backdrop-blur shadow-xl border-none rounded-[2.5rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-black/[0.03] px-6 py-4">
        <div>
          <CardTitle className="text-lg font-black italic text-orange-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-600" /> HUTANG (AP) HUB
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-text-muted">
            Vendor Bills & Operational Liability Tracking
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b-black/[0.03]">
              <TableHead className="font-bold text-[10px] uppercase text-text-muted px-6 py-2">Bill No</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Supplier</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Due</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-text-muted text-right px-6">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center opacity-40">No records.</TableCell></TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-b-black/[0.02]">
                  <TableCell className="px-6 font-bold text-orange-600">{row.billNumber}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-700">{row.supplierName}</TableCell>
                  <TableCell className="text-xs">{new Date(row.dueDate).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell className="text-right font-black font-sans text-red-600 px-6">{formatCurrency(row.outstandingAmount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

