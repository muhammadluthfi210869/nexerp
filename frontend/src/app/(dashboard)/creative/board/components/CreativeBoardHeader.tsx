"use client";

import React from "react";
import { Palette, AlertCircle, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dna";

export function CreativeBoardHeader({ tasks }: { tasks: any[] }) {
  const stats = {
    active: tasks.filter(t => ['IN_PROGRESS', 'WAITING_APJ', 'WAITING_CLIENT'].includes(t.kanbanState)).length,
    revision: tasks.filter(t => t.kanbanState === 'REVISION').length,
    locked: tasks.filter(t => t.kanbanState === 'LOCKED').length,
    breach: tasks.filter(t => t.isLocked).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <StatCard 
        label="Live Projects" 
        value={stats.active} 
        icon={<Palette className="text-blue-500" />} 
      />

      <StatCard 
        label="In Revision" 
        value={stats.revision} 
        icon={<AlertCircle className="text-amber-500" />} 
      />

      <StatCard 
        label="Ready to Print" 
        value={stats.locked} 
        icon={<CheckCircle2 className="text-emerald-500" />} 
      />

      <StatCard 
        label="Total Breach" 
        value={stats.breach} 
        icon={<AlertCircle className="text-rose-500" />} 
      />
    </div>
  );
}
