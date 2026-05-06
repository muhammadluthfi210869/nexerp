"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  FlaskConical, 
  AlertCircle, 
  Bell, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";

interface QCEvent {
  type: string;
  workOrderId: string;
  stage: string;
  logId: string;
  timestamp: string;
}

export function QCNotificationHub() {
  const [notifications, setNotifications] = useState<QCEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || "http://5.223.80.88"}/events/qc`);

    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SAMPLE_REQUIRED') {
        setNotifications((prev) => [data, ...prev].slice(0, 3));
        // Play notification sound for factory environment
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 w-96 z-50 space-y-4">
      {notifications.map((notif, i) => (
        <div 
          key={i}
          className="bg-white border-2 border-blue-600 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in slide-in-from-right-10 duration-500"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">QC REQUIRED</span>
                <span className="text-[8px] font-black text-slate-300 uppercase">JUST NOW</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight mb-1 uppercase italic">
                SAMPLE REQUIRED: WO-{notif.workOrderId.slice(-4)}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Tahap <span className="font-bold text-slate-900 uppercase italic">{notif.stage}</span> selesai. Segera ambil sampel untuk uji stabilitas & kadar.
              </p>
              
              <div className="mt-4 flex gap-2">
                <button 
                   onClick={() => setNotifications(prev => prev.filter((_, idx) => idx !== i))}
                   className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  PROSES SEKARANG
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button 
                   onClick={() => setNotifications(prev => prev.filter((_, idx) => idx !== i))}
                   className="h-10 px-4 rounded-xl bg-slate-100 text-slate-400 text-[9px] font-black uppercase hover:bg-slate-200 transition-colors"
                >
                  NANTI
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

