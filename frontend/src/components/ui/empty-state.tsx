"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, Package } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title = "Belum ada data",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">{title}</h3>
      {description && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorFallback({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-rose-500" />
      </div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Terjadi Kesalahan</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 max-w-sm">{error.message}</p>
      {retry && (
        <Button onClick={retry} className="mt-6 rounded-xl font-black uppercase text-[10px]">
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

