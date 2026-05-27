"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { BarChart4, Layers, Loader2 } from "lucide-react";

const KebutuhanPage = dynamic(() => import("../kebutuhan-barang/page"), {
  loading: () => <Skeleton />,
});
const RangkumanPage = dynamic(() => import("../rangkuman-kebutuhan/page"), {
  loading: () => <Skeleton />,
});

function Skeleton() {
  return <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />;
}

export default function MRPPage() {
  const [tab, setTab] = useState("kebutuhan");

  return (
    <DashboardShell
      title="PERENCANAAN"
      titleAccent="MATERIAL"
      subtitle="Perencanaan kebutuhan bahan baku & kemasan"
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-14 w-fit">
          <TabsTrigger value="kebutuhan" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <BarChart4 className="w-4 h-4" /> Kebutuhan Barang
          </TabsTrigger>
          <TabsTrigger value="rangkuman" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <Layers className="w-4 h-4" /> Rangkuman Kebutuhan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kebutuhan"><KebutuhanPage /></TabsContent>
        <TabsContent value="rangkuman"><RangkumanPage /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
