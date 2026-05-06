"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  Package, 
  Zap 
} from "lucide-react";

interface ProductionEvent {
  workOrderId: string;
  stage: string;
  status: string;
  timestamp: string;
}

export function BusDevActivityStream() {
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || "http://5.223.80.88"}/events/busdev`);

    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [data, ...prev].slice(0, 5));
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-[#050505] border border-white/5 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="font-black italic text-sm tracking-tight text-white">LIVE PRODUCTION STREAM</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
          <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">
            {isConnected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      <div className="p-2">
        {events.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center opacity-20">
            <Zap className="w-8 h-8 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Events...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event, i) => (
              <div 
                key={i}
                className="p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black italic text-amber-500 uppercase tracking-tighter">
                      WO-{event.workOrderId.slice(-4)}
                    </span>
                    <span className="text-[8px] font-black uppercase text-white/20 tracking-widest px-2 py-0.5 border border-white/10 rounded-full">
                      {event.stage}
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-white/20">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-white/70 font-medium">
                    Tahap <span className="text-white font-black">{event.stage}</span> telah berhasil diperbarui oleh sistem.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors">
          VIEW ALL AUDIT LOGS
        </button>
      </div>
    </div>
  );
}

