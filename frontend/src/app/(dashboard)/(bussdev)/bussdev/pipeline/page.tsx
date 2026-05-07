"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Target, Plus } from "lucide-react";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { GranularPipelineTable } from "@/components/bussdev/GranularPipelineTable";
import { BussdevActionDialog } from "@/components/bussdev/BussdevActionDialog";
import { SLABanner } from "@/components/bussdev/SLABanner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import Link from "next/link";
import { useGranularData } from "@/hooks/use-granular-data";

export default function PipelinePage() {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { data: granularData } = useGranularData();

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["bussdev-analytics", "pipeline"],
    queryFn: async () => (await api.get("/bussdev/analytics/pipeline")).data
  });

  if (isAnalyticsLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;
  }

  return (
    <DashboardShell
      title="Sales"
      titleAccent="Pipeline"
      actions={
        <div className="flex gap-3">
          <Link href="/bussdev/intake">
            <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 rounded-xl shadow-lg transition-all uppercase tracking-tighter text-[10px] gap-2">
              <Plus className="h-4 w-4 stroke-[3px]" /> New Acquisition
            </Button>
          </Link>
        </div>
      }
    >
      <SLABanner />
      <DashboardCards variant="pipeline" data={analytics} />
      <GranularPipelineTable
        data={granularData}
        onAction={(lead) => {
          setSelectedLead(lead);
          setIsActionModalOpen(true);
        }}
      />
      <BussdevActionDialog
        isOpen={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        lead={selectedLead}
      />
    </DashboardShell>
  );
}

