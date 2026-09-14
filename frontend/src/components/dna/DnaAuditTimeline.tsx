"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, ShieldCheck, AlertCircle, Info, User, CheckCircle2 } from "lucide-react";
import { DnaBadge } from "./DnaBadge";
import { getSharedAuditLogs, type SharedAuditLog } from "@/lib/shared-erp-flow";

export interface DnaAuditTimelineProps {
  entityId?: string;
  logs?: SharedAuditLog[];
  events?: any[];
  items?: any[];
  compact?: boolean;
  className?: string;
}

const ROLE_BADGE_MAP: Record<string, "info" | "purple" | "emerald" | "amber" | "slate" | "blue" | "danger"> = {
  Finance: "emerald",
  SCM: "blue",
  PPIC: "purple",
  QC: "amber",
  BussDev: "info",
  Gudang: "slate",
  Direksi: "danger",
  Produksi: "info",
};

export function DnaAuditTimeline({
  entityId,
  logs: externalLogs,
  compact = false,
  className,
}: DnaAuditTimelineProps) {
  const [logs, setLogs] = useState<SharedAuditLog[]>(externalLogs || []);

  useEffect(() => {
    if (externalLogs) {
      setLogs(externalLogs);
      return;
    }

    const loadLogs = () => {
      if (!entityId) return;
      const found = getSharedAuditLogs(entityId);
      setLogs(found);
    };

    loadLogs();

    const handleUpdate = () => {
      loadLogs();
    };

    window.addEventListener("nexerp:audit-updated", handleUpdate);
    return () => {
      window.removeEventListener("nexerp:audit-updated", handleUpdate);
    };
  }, [entityId, externalLogs]);

  if (logs.length === 0) {
    return (
      <div className={cn("p-6 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50", className)}>
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Belum ada riwayat audit trail tercatat</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Semua aksi kritis dan perubahan status akan terekam otomatis di sini.</p>
      </div>
    );
  }

  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="-mb-8">
        {logs.map((item, itemIdx) => {
          const isLast = itemIdx === logs.length - 1;
          const roleStatus = ROLE_BADGE_MAP[item.role] || "slate";

          return (
            <li key={item.id || `${item.timestamp}-${itemIdx}`}>
              <div className="relative pb-8">
                {!isLast ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-950",
                        item.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          : item.severity === "WARNING"
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {item.severity === "CRITICAL" ? (
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      ) : item.severity === "WARNING" ? (
                        <Info className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.action}
                        </span>
                        <DnaBadge variant={roleStatus} className="text-[10px] px-1.5 py-0 font-medium">
                          {item.role}
                        </DnaBadge>
                        {item.severity && item.severity !== "INFO" && (
                          <DnaBadge
                            variant={item.severity === "CRITICAL" ? "danger" : "warning"}
                            className="text-[10px] px-1.5 py-0 font-semibold"
                          >
                            {item.severity}
                          </DnaBadge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.actor}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{item.timestamp}</span>
                      </div>

                      {item.notes && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 rounded-md p-2 font-normal leading-relaxed">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
