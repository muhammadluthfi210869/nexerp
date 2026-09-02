"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, Send, Loader2, Upload, FileText, X } from "lucide-react";
import { STAGES } from "./pipeline-constants";
import { cn } from "@/lib/utils";

// Stage-specific file requirements (all optional)
const FILE_FIELDS: Record<string, { name: string; fieldName: string; label: string; accept: string }[]> = {
  SAMPLE_REQUESTED: [{ name: "pnfFile", fieldName: "pnfFile", label: "NPF (Product New Form)", accept: ".pdf,.doc,.docx" }],
  SPK_SIGNED: [{ name: "spkFile", fieldName: "spkFile", label: "SPK (Surat Perintah Kerja)", accept: ".pdf,.doc,.docx" }],
  DP_PAID: [{ name: "paymentProof", fieldName: "paymentProof", label: "Bukti Pembayaran DP", accept: ".pdf,.jpg,.jpeg,.png" }],
  WON_DEAL: [{ name: "spkFile", fieldName: "spkFile", label: "SPK Final", accept: ".pdf,.doc,.docx" }],
};

interface StageConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  targetStage: string;
}

export function StageConfirmDialog({
  isOpen,
  onOpenChange,
  lead,
  targetStage,
}: StageConfirmDialogProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileFields = FILE_FIELDS[targetStage] || [];

  const advanceMutation = useMutation({
    mutationFn: async () => {
      // If file is selected, use FormData; otherwise use JSON
      if (selectedFile && fileFields.length > 0) {
        const formData = new FormData();
        formData.append("action", "STAGE_UPDATED");
        formData.append("newStatus", targetStage);
        formData.append("notes", notes);
        formData.append("loggedBy", "USER");
        formData.append(fileFields[0].fieldName, selectedFile);

        const res = await api.patch("/bussdev/lead/" + lead.id + "/advance", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      } else {
        const res = await api.patch("/bussdev/lead/" + lead.id + "/advance", {
          action: "STAGE_UPDATED",
          newStatus: targetStage,
          notes,
          loggedBy: "USER",
        });
        return res.data;
      }
    },
    onSuccess: () => {
      const label = STAGES[targetStage]?.label || targetStage;
      toast.success("Lead dipindahkan ke " + label);
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads-group"] });
      setNotes("");
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengubah stage");
    },
  });

  const currentLabel = STAGES[lead?.status || lead?.stage]?.label || lead?.status || lead?.stage || "-";
  const targetLabel = STAGES[targetStage]?.label || targetStage;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
              {lead?.clientName}
            </DialogTitle>
            <DialogDescription className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
              Konfirmasi perubahan stage pipeline
            </DialogDescription>
          </div>

          {/* Stage transition */}
          <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-black text-slate-500 uppercase bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {currentLabel}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
            <span className={cn(
              "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg",
              STAGES[targetStage]?.bg || "bg-blue-100",
              STAGES[targetStage]?.color || "text-blue-600"
            )}>
              {targetLabel}
            </span>
          </div>

          {/* File upload (if applicable) */}
          {fileFields.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                {fileFields[0].label} <span className="text-slate-300">(opsional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={fileFields[0].accept}
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-[10px] font-black text-blue-700 truncate flex-1">{selectedFile.name}</span>
                  <span className="text-[8px] font-medium text-blue-400">{(selectedFile.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => setSelectedFile(null)} className="p-0.5 hover:bg-blue-100 rounded-md transition-colors">
                    <X className="h-3 w-3 text-blue-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Pilih File</span>
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Catatan (opsional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alasan perubahan stage..."
              className="min-h-[60px] rounded-xl border-slate-200 bg-slate-50 text-xs font-black p-3 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={() => { setNotes(""); setSelectedFile(null); onOpenChange(false); }}
            className="h-10 px-5 rounded-xl font-black uppercase text-[10px] text-slate-500"
          >
            Batal
          </Button>
          <Button
            onClick={() => advanceMutation.mutate()}
            disabled={advanceMutation.isPending}
            className="h-10 px-5 rounded-xl font-black uppercase text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            {advanceMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Konfirmasi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
