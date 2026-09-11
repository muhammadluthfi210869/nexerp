import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/dna";
import { Badge } from "@/components/dna";
import { 
  Fingerprint, 
  MapPin, 
  Clock, 
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";

export async function AttendanceLiveFeed({ fullWidth = false }: { fullWidth?: boolean }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexerp.id/api';
    let attendances: any[] = [];
    try {
      const res = await fetch(`${apiUrl}/v1/hr/attendance/live-feed?limit=${fullWidth ? 50 : 10}`, { next: { revalidate: 30 } });
      if (res.ok) {
        const data = await res.json();
        attendances = Array.isArray(data) ? data : data.data || [];
      }
    } catch {
      attendances = [];
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-1 h-4 bg-indigo-500 rounded-full" />
             <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📡 III. LIVE ATTENDANCE (GEOFENCE AUDIT)</h3>
          </div>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">GEOFENCE ACTIVE</span>
        </div>
        <Card className="bento-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {attendances.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-black uppercase text-[10px] italic tabular">NO ACTIVITY DETECTED...</div>
            ) : (
              attendances.map((row) => (
                <div key={row.id} className="p-4 hover:bg-slate-50/50 transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs tabular">
                       {row.clockIn ? format(new Date(row.clockIn), "HH:mm") : "--:--"}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">
                        {row.employee?.name || "Employee"}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-[9px] text-emerald-600 font-black uppercase">
                          <MapPin className="w-2.5 h-2.5 mr-1" /> {(row.distanceFromFactory || 0).toFixed(1)}M FROM CENTER
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className={cn(
                       "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter",
                       row.status === "ON_TIME" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                       row.status === "LATE" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                       "bg-red-50 text-red-600 border border-red-100"
                     )}>
                       {row.status || "PRESENT"}
                     </span>
                     <Badge variant="outline" className="text-[8px] font-mono border-slate-200">
                        {row.deviceIp || "127.0.0.1"}
                     </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    return <div className="bento-card p-10 text-slate-400 text-center uppercase font-black text-[10px] italic tabular border-dashed border-2">Geofence Offline - Biometric Feed Disconnected...</div>;
  }
}
