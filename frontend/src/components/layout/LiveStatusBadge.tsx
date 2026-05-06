"use client";

import React from "react";

interface LiveStatusBadgeProps {
  label?: string;
}

/**
 * Standardized live status badge for dashboard headers.
 * Shows a pulsing green dot + timestamp.
 */
export function LiveStatusBadge({ label = "Live" }: LiveStatusBadgeProps) {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
        {label}: {time || "--:--:--"}
      </span>
    </div>
  );
}

