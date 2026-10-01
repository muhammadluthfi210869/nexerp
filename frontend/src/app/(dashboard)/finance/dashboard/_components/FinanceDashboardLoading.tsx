import React from "react";
import { Activity } from "lucide-react";

export function FinanceDashboardLoading() {
  return (
    <div
      style={{
        height: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
      <p
        style={{
          fontSize: "10px",
          fontWeight: 950,
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Syncing Fiscal DNA...
      </p>
    </div>
  );
}
