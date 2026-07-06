"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FlaskConical,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Ban,
  Thermometer,
  UserCheck,
} from "lucide-react";

interface QCEvent {
  type: string;
  workOrderId: string;
  stage: string;
  logId: string;
  timestamp: string;
  message?: string;
}

const eventConfig: Record<string, { icon: typeof FlaskConical; color: string; label: string; sound?: string }> = {
  SAMPLE_REQUIRED: {
    icon: FlaskConical,
    color: "bg-blue-600",
    label: "QC REQUIRED",
    sound: "/sounds/notification.mp3",
  },
  qc_verified: {
    icon: CheckCircle2,
    color: "bg-green-600",
    label: "QC VERIFIED",
    sound: "/sounds/success.mp3",
  },
  qc_interlock_triggered: {
    icon: ShieldAlert,
    color: "bg-red-600",
    label: "INTERLOCK TRIGGERED",
    sound: "/sounds/urgent.mp3",
  },
  qc_gate_blocked: {
    icon: Ban,
    color: "bg-orange-600",
    label: "GATE BLOCKED",
    sound: "/sounds/notification.mp3",
  },
  "qc.parameter_out_of_spec": {
    icon: Thermometer,
    color: "bg-amber-600",
    label: "OUT OF SPEC",
    sound: "/sounds/notification.mp3",
  },
  "qc.supervisor_bypass": {
    icon: UserCheck,
    color: "bg-purple-600",
    label: "SUPERVISOR BYPASS",
    sound: "/sounds/notification.mp3",
  },
};

function playSound(soundUrl?: string) {
  if (!soundUrl) return;
  try {
    const audio = new Audio(soundUrl);
    audio.play().catch(() => {});
  } catch {
    // Audio not supported or blocked
  }
}

export function QCNotificationHub() {
  const [notifications, setNotifications] = useState<QCEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/events/qc`
    );

    eventSource.onopen = () => setIsConnected(true);

    const supportedTypes = new Set(Object.keys(eventConfig));

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as QCEvent;
        if (supportedTypes.has(data.type)) {
          setNotifications((prev) => [data, ...prev].slice(0, 3));
          playSound(eventConfig[data.type]?.sound);
        }
      } catch {
        // Malformed event data
      }
    };

    for (const type of supportedTypes) {
      eventSource.addEventListener(type, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as QCEvent;
          setNotifications((prev) => [data, ...prev].slice(0, 3));
          playSound(eventConfig[data.type]?.sound);
        } catch {
          // Malformed event data
        }
      });
    }

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 w-96 z-50 space-y-4">
      {notifications.map((notif, i) => {
        const config = eventConfig[notif.type] || eventConfig.SAMPLE_REQUIRED;
        const Icon = config.icon;
        return (
          <div
            key={`${notif.logId}-${i}`}
            className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in slide-in-from-right-10 duration-500"
          >
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-2xl", config.color)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", config.color.replace("bg-", "text-"))}>
                    {config.label}
                  </span>
                  <span className="text-[8px] font-black text-slate-300 uppercase">JUST NOW</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight mb-1 uppercase italic">
                  {notif.type === "SAMPLE_REQUIRED"
                    ? `SAMPLE REQUIRED: WO-${notif.workOrderId.slice(-4)}`
                    : `${config.label}: WO-${notif.workOrderId.slice(-4)}`}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {notif.message ||
                    (notif.type === "SAMPLE_REQUIRED"
                      ? `Tahap ${notif.stage} selesai. Segera ambil sampel untuk uji stabilitas & kadar.`
                      : `Event ${config.label} diterima untuk work order ${notif.workOrderId}.`)}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    PROSES SEKARANG
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((_, idx) => idx !== i))}
                    className="h-10 px-4 rounded-xl bg-slate-100 text-slate-400 text-[9px] font-black uppercase hover:bg-slate-200 transition-colors"
                  >
                    NANTI
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
