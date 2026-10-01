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
import { MoveHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Warehouse, Material } from "../_types/workstation.types";

interface WorkstationTransferModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  warehouses: Warehouse[];
  materials: Material[];
  sourceWarehouse: string;
  setSourceWarehouse: (wId: string) => void;
  destWarehouse: string;
  setDestWarehouse: (wId: string) => void;
  vehicleNo: string;
  setVehicleNo: (no: string) => void;
  newMatId: string;
  setNewMatId: (id: string) => void;
  newMatQty: string;
  setNewMatQty: (qty: string) => void;
  onAddMaterial: (matId: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function WorkstationTransferModal({
  isOpen,
  onClose,
  warehouses,
  materials,
  sourceWarehouse,
  setSourceWarehouse,
  destWarehouse,
  setDestWarehouse,
  vehicleNo,
  setVehicleNo,
  newMatId,
  setNewMatId,
  newMatQty,
  setNewMatQty,
  onAddMaterial,
  onSubmit,
  isPending,
}: WorkstationTransferModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="bg-brand-black p-10 text-white relative">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            INTERNAL <span className="text-slate-500">TRANSFER</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            MOVING ASSETS BETWEEN LOCATIONS
          </p>
          <MoveHorizontal className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
        </div>
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                SOURCE WAREHOUSE
              </label>
              <Select onValueChange={(v: any) => typeof v === "string" && setSourceWarehouse(v)}>
                <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                  <SelectValue placeholder="FROM..." />
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
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                DESTINATION
              </label>
              <Select onValueChange={(v: any) => typeof v === "string" && setDestWarehouse(v)}>
                <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                  <SelectValue placeholder="TO..." />
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
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
              VEHICLE PLATE (OPTIONAL)
            </label>
            <Input
              placeholder="E.G. B 1234 ABC"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-brand-black rounded-full" />
              <label className="text-[9px] font-black uppercase text-brand-black tracking-widest">
                ADD ITEMS
              </label>
            </div>
            <div className="flex gap-4">
              <Select onValueChange={(v: any) => typeof v === "string" && setNewMatId(v)}>
                <SelectTrigger className="flex-1 h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                  <SelectValue placeholder="MATERIAL..." />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m: any) => (
                    <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="QTY"
                value={newMatQty}
                onChange={(e) => setNewMatQty(e.target.value)}
                className="w-24 h-14 bg-slate-50 border-slate-200 font-black text-center text-xs rounded-xl"
              />
              <Button
                onClick={() => {
                  if (!newMatId || !newMatQty) return toast.error("Select material and qty");
                  onAddMaterial(newMatId);
                }}
                className="h-14 w-14 bg-brand-black text-white rounded-xl shadow-lg border-none hover:bg-slate-800"
              >
                <Plus />
              </Button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-3 max-h-40 overflow-y-auto border border-slate-100">
              <p className="text-center py-4 text-[10px] font-black text-slate-300 uppercase italic tracking-widest">
                NO ITEMS ADDED TO QUEUE
              </p>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl italic border-none"
            disabled={isPending}
          >
            {isPending ? "PROCESSING..." : "INITIATE INTERNAL TRANSFER"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
