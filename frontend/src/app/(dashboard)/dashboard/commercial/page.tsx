"use client";

import { useState, useEffect } from "react";
import { LeadBoard } from "@/components/commercial/lead-board";
import { MarketingForm } from "@/components/commercial/marketing-form";
import { Zap, Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { RetentionRadar } from "@/components/commercial/retention-radar";

export default function CommercialDashboard() {
  useEffect(() => {
    // Storing user in state if needed in future, otherwise just verify existence
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        // user verified
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-white flex items-center">
            <Target className="mr-3 h-8 w-8 text-emerald-500" />
            COMMERCIAL WORKSPACE
          </h2>
          <p className="text-zinc-500 font-medium">Strategic lead management & digital marketing operations.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEADS TRACKER: Main Area */}
        <div className="lg:col-span-3 space-y-6">
           <LeadBoard />
        </div>

        {/* SIDEBAR: Tools & Marketing */}
        <div className="space-y-6">
           <RetentionRadar />
           <MarketingForm />

           <Card className="border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-30" />
             <CardHeader>
                <CardTitle className="text-white text-xs font-bold uppercase tracking-tight flex items-center">
                   <Zap className="mr-2 h-4 w-4 text-emerald-500" />
                   Growth Metrics
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 font-sans">Live Conversion Data</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-xs text-zinc-400">Conversion Rate</span>
                   <span className="text-sm font-bold text-white">4.2%</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs text-zinc-400">SLA Violation Rate</span>
                   <span className="text-sm font-bold text-red-500">12%</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

