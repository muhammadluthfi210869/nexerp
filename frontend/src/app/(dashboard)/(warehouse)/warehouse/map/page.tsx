"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Map as MapIcon, 
  Layers, 
  Maximize2, 
  Filter,
  Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function WarehouseMapPage() {
  const { data: locations = [] } = useQuery({
    queryKey: ["map-locations"],
    queryFn: () => api.get("/warehouse/locations").then(r => r.data || []),
  });

  const zones = React.useMemo(() => {
    if (locations.length === 0) {
      return [
        { name: "ZONE A", code: "AMBIENT", racks: 12, color: "bg-blue-600" },
        { name: "ZONE B", code: "COLD STORAGE", racks: 6, color: "bg-cyan-500" },
        { name: "ZONE C", code: "FLAMMABLE", racks: 4, color: "bg-orange-500" },
      ];
    }
    const grouped: Record<string, any> = {};
    for (const loc of locations) {
      const type = (loc.type || 'AMBIENT') as string;
      if (!grouped[type]) grouped[type] = { name: `ZONE ${type.charAt(0)}${type.slice(1).toLowerCase()}`, code: type, racks: 0, color: type === 'AMBIENT' ? 'bg-blue-600' : type === 'COOL_ROOM' ? 'bg-cyan-500' : type === 'FLAMMABLE' ? 'bg-orange-500' : 'bg-slate-600', totalCapacity: 0, totalUsage: 0 };
      grouped[type].racks++;
      grouped[type].totalCapacity += Number(loc.capacity || 0);
      grouped[type].totalUsage += Number(loc.currentUsage || 0);
    }
    return Object.values(grouped);
  }, [locations]);

  const racks = React.useMemo(() => {
    if (locations.length === 0) {
      return Array.from({ length: 24 }).map((_, i) => ({
        id: `RACK-${i + 1}`,
        utilization: Math.floor(((i * 7) % 100)),
        status: (i % 5 === 0) ? "MAINTENANCE" : "ACTIVE",
        zone: i < 12 ? "A" : i < 18 ? "B" : "C"
      }));
    }
    return locations.map((loc: any, i: number) => {
      const cap = Number(loc.capacity || 1);
      const usage = Number(loc.currentUsage || 0);
      const utilization = Math.min(100, Math.round((usage / cap) * 100));
      const zone = (loc.type === 'COOL_ROOM' ? 'B' : loc.type === 'FLAMMABLE' ? 'C' : 'A');
      return {
        id: loc.name || `LOC-${i + 1}`,
        utilization,
        status: usage === 0 ? "MAINTENANCE" : "ACTIVE",
        zone,
      };
    });
  }, [locations]);

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <MapIcon className="w-8 h-8 text-blue-600" />
             Interactive Warehouse Map
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">Digital Twin & Spatial Inventory Audit</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl border-slate-200">
              <Layers className="w-4 h-4 mr-2" /> LAYERS
           </Button>
           <Button className="rounded-2xl bg-slate-900 font-black uppercase text-[10px] h-11 tracking-tight px-6 shadow-lg shadow-slate-200">
              EDIT LAYOUT
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR ZONE SELECTOR */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-6 space-y-4">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Zone Overview</h3>
               <div className="space-y-2">
                 {zones.map(z => (
                   <div key={z.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${z.color}`} />
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{z.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{z.code}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-700">{z.racks} Racks</span>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-6 space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-400">Environment</h3>
                 <Activity className="w-4 h-4 text-emerald-400" />
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-300">Avg Temp</span>
                     <span className="text-sm font-black">24.2 °C</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-300">Humidity</span>
                     <span className="text-sm font-black">45%</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* INTERACTIVE GRID */}
        <div className="lg:col-span-3">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Low (0-50%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Med (51-80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">High (81%+)</span>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="rounded-xl text-slate-400 uppercase font-black text-[9px]">
                    <Maximize2 className="w-4 h-4 mr-1" /> Fullscreen
                 </Button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                 {racks.map((rack: any) => (
                   <div 
                    key={rack.id} 
                    className={`group aspect-square rounded-2xl border-2 transition-all p-2 cursor-pointer relative flex flex-col items-center justify-center gap-1
                      ${rack.status === 'MAINTENANCE' ? 'border-dashed border-slate-200 bg-slate-50 grayscale' : 
                        rack.utilization > 80 ? 'border-red-100 bg-red-50/30' : 
                        rack.utilization > 50 ? 'border-amber-100 bg-amber-50/30' : 
                        'border-blue-100 bg-blue-50/30'}
                       hover:scale-105 active:scale-95 hover:shadow-lg
                    `}
                   >
                     {rack.status === 'MAINTENANCE' && (
                       <div className="absolute top-1 right-1">
                          <Activity className="w-3 h-3 text-slate-300" />
                       </div>
                     )}
                     <span className="text-[9px] font-black text-slate-400 uppercase">{rack.id}</span>
                     <span className={`text-xs font-black ${rack.status === 'MAINTENANCE' ? 'text-slate-300' : 'text-slate-900'}`}>{rack.utilization}%</span>
                     <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${rack.utilization > 80 ? 'bg-red-500' : rack.utilization > 50 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                          style={{ width: `${rack.utilization}%` }} 
                        />
                     </div>
                   </div>
                 ))}
              </div>

              <div className="mt-12 flex justify-center">
                 <div className="px-8 py-4 rounded-3xl bg-slate-100 border border-slate-200 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Docking Area / Inbound Loading</p>
                    <div className="flex gap-4 justify-center mt-3">
                       <div className="w-16 h-8 rounded-lg bg-white border border-slate-200" />
                       <div className="w-16 h-8 rounded-lg bg-white border border-slate-200" />
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

