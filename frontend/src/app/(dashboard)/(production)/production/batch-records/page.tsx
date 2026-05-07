"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText, Search, ChevronRight, Printer, Download, History,
  Activity, ClipboardList, FlaskConical, Zap, Package, ShieldCheck, Calendar, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BatchRecordsPage() {
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batch-records"],
    queryFn: async () => (await api.get("/production/batch-records")).data,
  });

  const filtered = Array.isArray(batches)
    ? batches.filter((b: any) =>
        b.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.productName?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-brand-black" />
          <h1 className="text-xl font-black text-brand-black uppercase tracking-tight">Batch Records</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" /> Print</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No records found</TableCell></TableRow>
            ) : (
              filtered.map((batch: any) => (
                <TableRow key={batch.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedBatch(batch)}>
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.productName}</TableCell>
                  <TableCell><Badge variant={batch.status === 'COMPLETED' ? 'default' : 'secondary'}>{batch.status}</Badge></TableCell>
                  <TableCell>{batch.quantity}</TableCell>
                  <TableCell>{batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
