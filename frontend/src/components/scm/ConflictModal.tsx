"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface Props {
  open: boolean;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  onRefresh: () => void;
  onCancel: () => void;
}

export function ConflictModal({ open, lastModifiedAt, lastModifiedBy, onRefresh, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rose-500/10">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold">Data Sudah Diubah</h2>
        </div>

        <p className="text-muted-foreground mb-4">
          Data PO ini sudah diubah oleh{" "}
          <span className="font-medium text-foreground">{lastModifiedBy ?? "user lain"}</span>
          {lastModifiedAt && (
            <> pada <span className="font-medium text-foreground">{new Date(lastModifiedAt).toLocaleString("id-ID")}</span></>
          )}
          .
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Silakan refresh untuk melihat data terbaru, lalu ulangi perubahan Anda.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Batal
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh & Lihat
          </button>
        </div>
      </div>
    </div>
  );
}
