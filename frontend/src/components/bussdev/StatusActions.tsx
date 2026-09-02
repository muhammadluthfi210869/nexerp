"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Zap, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface StatusActionsProps {
  currentStatus: string;
  allowedTransitions: string[];
  onTransition: (to: string, overridePin?: string) => void;
  isPending?: boolean;
  entityType?: string;
}

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead", CONTACTED: "Contacted", FOLLOW_UP_1: "Follow Up 1",
  FOLLOW_UP_2: "Follow Up 2", FOLLOW_UP_3: "Follow Up 3",
  NEGOTIATION: "Negotiation", SAMPLE_REQUESTED: "Sample Requested",
  WAITING_FINANCE_APPROVAL: "Waiting Finance", SAMPLE_SENT: "Sample Sent",
  SAMPLE_APPROVED: "Sample Approved", SPK_SIGNED: "SPK Signed",
  DP_PAID: "DP Paid", PRODUCTION_PLAN: "Production Plan",
  READY_TO_SHIP: "Ready to Ship", WON_DEAL: "Won Deal",
  LOST: "Lost", ABORTED: "Aborted",
};

const LOST_STAGES = ["LOST", "ABORTED"];

export default function StatusActions({
  currentStatus,
  allowedTransitions,
  onTransition,
  isPending,
}: StatusActionsProps) {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const [overrideModal, setOverrideModal] = useState<{ target: string } | null>(null);
  const [overridePin, setOverridePin] = useState("");

  if (allowedTransitions.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200">
        <Lock className="w-5 h-5 text-slate-400" />
        <div>
          <p className="font-black text-slate-500 text-xs uppercase tracking-tight">Status Final / Terkunci</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
            Tidak ada transisi yang tersedia dari {STAGE_LABELS[currentStatus] || currentStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-slate-900 text-white font-black uppercase text-[9px] px-3 py-1 rounded-lg border-none">
          {STAGE_LABELS[currentStatus] || currentStatus}
        </Badge>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Pilih tujuan</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {allowedTransitions.map((target) => {
          const isLost = LOST_STAGES.includes(target);
          return (
            <Button
              key={target}
              onClick={() => {
                if (isLost && !isSuperAdmin) {
                  onTransition(target);
                } else if (isSuperAdmin) {
                  onTransition(target);
                } else {
                  onTransition(target);
                }
              }}
              disabled={isPending}
              className={cn(
                "h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-tight transition-all",
                isLost
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border-none"
                  : "bg-slate-900 text-white hover:bg-slate-800 border-none",
              )}
            >
              {STAGE_LABELS[target] || target}
            </Button>
          );
        })}
      </div>

      {isSuperAdmin && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => setOverrideModal({ target: "" })}
            className="h-10 px-4 rounded-xl text-amber-600 font-black uppercase text-[9px] gap-2 hover:bg-amber-50"
          >
            <Zap className="w-4 h-4" />
            Emergency Override
          </Button>
        </div>
      )}

      <Dialog open={!!overrideModal} onOpenChange={() => { setOverrideModal(null); setOverridePin(""); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl p-0">
          <div className="bg-amber-600 p-8 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <ShieldAlert className="w-6 h-6" /> Emergency Override
            </DialogTitle>
            <DialogDescription className="text-amber-100 font-bold uppercase text-[10px] tracking-tight mt-2">
              Masukkan PIN SUPER_ADMIN untuk memaksa transisi status
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Status Tujuan</label>
              <select
                value={overrideModal?.target || ""}
                onChange={(e) => setOverrideModal({ target: e.target.value })}
                className="w-full h-12 bg-slate-50 border-none rounded-2xl font-bold px-4"
              >
                <option value="">Pilih status...</option>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">PIN Override</label>
              <Input
                type="password"
                value={overridePin}
                onChange={(e) => setOverridePin(e.target.value)}
                placeholder="Masukkan PIN SUPER_ADMIN..."
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button variant="ghost" onClick={() => { setOverrideModal(null); setOverridePin(""); }} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
            <Button
              onClick={() => {
                if (overrideModal?.target && overridePin) {
                  onTransition(overrideModal.target, overridePin);
                  setOverrideModal(null);
                  setOverridePin("");
                }
              }}
              disabled={!overrideModal?.target || !overridePin}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px]"
            >
              Execute Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

