"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ArrowRightLeft, ArrowRight, MoveHorizontal, Loader2 } from "lucide-react";

const PindahGudang = dynamic(() => import("../pindah-gudang/page"), {
  loading: () => <Skeleton />,
});
const TransferBarang = dynamic(() => import("../transfers/page"), {
  loading: () => <Skeleton />,
});
const MutasiBarang = dynamic(() => import("../../scm/warehouse/mutation/page"), {
  loading: () => <Skeleton />,
});

function Skeleton() {
  return <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />;
}

export default function MutasiStokPage() {
  const [tab, setTab] = useState("pindah");

  return (
    <DashboardShell
      title="Mutasi"
      titleAccent="Stok"
      subtitle="Pindah Gudang, Transfer & Riwayat Mutasi Barang"
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-14 w-fit">
          <TabsTrigger value="pindah" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Pindah Gudang
          </TabsTrigger>
          <TabsTrigger value="transfer" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ArrowRight className="w-4 h-4" /> Transfer
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <MoveHorizontal className="w-4 h-4" /> Riwayat Mutasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pindah"><PindahGudang /></TabsContent>
        <TabsContent value="transfer"><TransferBarang /></TabsContent>
        <TabsContent value="riwayat"><MutasiBarang /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
