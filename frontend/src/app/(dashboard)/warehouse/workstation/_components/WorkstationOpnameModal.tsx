"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/dna";
import { ShieldCheck, Trash2 } from "lucide-react";
import type { Warehouse, Material } from "../_types/workstation.types";

interface WorkstationOpnameModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  warehouses: Warehouse[];
  materials: Material[];
  setOpnameWarehouse: (wId: string) => void;
  onAddMaterial: (mId: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function WorkstationOpnameModal({
  isOpen,
  onClose,
  warehouses,
  materials,
  setOpnameWarehouse,
  onAddMaterial,
  onSubmit,
  isPending,
}: WorkstationOpnameModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="bg-brand-black p-10 text-white relative">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            STOCK <span className="text-slate-500">AUDIT ENGINE</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            PHYSICAL STOCK VERIFICATION & RECONCILIATION
          </p>
          <ShieldCheck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
        </div>
        <div className="p-10 space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
              TARGET WAREHOUSE
            </label>
            <Select onValueChange={(v: any) => setOpnameWarehouse(typeof v === "string" ? v : "")}>
              <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                <SelectValue placeholder="SELECT WAREHOUSE TO AUDIT..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w: any) => (
                  <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-brand-black rounded-full" />
              <label className="text-[9px] font-black uppercase text-brand-black tracking-widest">
                ADD MATERIALS TO AUDIT
              </label>
            </div>
            <Select onValueChange={(v: any) => typeof v === "string" && onAddMaterial(v)}>
              <SelectTrigger className="h-14 border-2 border-dashed border-slate-200 bg-white rounded-2xl font-black uppercase text-[10px] text-slate-400">
                <SelectValue placeholder="+ APPEND MATERIAL TO AUDIT" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m: any) => (
                  <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">
                    {m.name} (STOCK: {m.stockQty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {materials.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase italic">{item.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      SYSTEM: {item.stockQty}
                    </p>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      className="h-10 bg-white border-slate-200 font-black text-center text-blue-600 text-xs rounded-xl"
                      defaultValue={item.stockQty}
                    />
                  </div>
                  <div className="w-16 text-right font-black text-[10px] uppercase text-slate-300 italic">
                    0
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={onSubmit}
            className="w-full h-16 bg-brand-black hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl italic"
            disabled={isPending}
          >
            {isPending ? "PROCESSING..." : "CREATE OPNAME REPORT"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
