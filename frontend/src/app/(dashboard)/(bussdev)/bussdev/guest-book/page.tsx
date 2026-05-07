"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Globe, ArrowUpRight, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const FU_CONFIG = {
  NOT_FOLLOWED_UP: { label: "Belum FU", color: "bg-slate-100 text-slate-500" },
  FU_1: { label: "FU 1", color: "bg-amber-100 text-amber-700" },
  FU_2: { label: "FU 2", color: "bg-orange-100 text-orange-700" },
  FU_3: { label: "FU 3", color: "bg-rose-100 text-rose-700" },
};

export default function GuestBookPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmGuest, setConfirmGuest] = useState<any>(null);

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "guest"],
    queryFn: async () => {
      try { return (await api.get("/bussdev/analytics/guest")).data; }
      catch { return null; }
    },
  });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guest-logs"],
    queryFn: async () => (await api.get<any[]>("/guests")).data,
  });

  const convertMutation = useMutation({
    mutationFn: async (guestId: string) => api.post(`/bussdev/guest/${guestId}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-logs"] });
      queryClient.invalidateQueries({ queryKey: ["bussdev-analytics", "guest"] });
      toast.success("Guest berhasil dikonversi menjadi Sales Lead aktif!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal mengkonversi guest"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-base min-h-screen font-inter">
      {/* ── Header HUD ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-violet-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 italic">
              Lead Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
            Master Database <span className="text-violet-600">Buku Tamu</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <Globe className="h-3 w-3" /> Comprehensive Lead Audit & Performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tight">
          <BookOpen className="h-4 w-4" />
          <span>{guests?.length || 0} Tamu Terdaftar</span>
        </div>
      </div>

      {/* ── Dashboard Cards ──────────────────────────────────────── */}
      <DashboardCards variant="guest" data={analytics} />

      {/* ── Main Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-violet-600 rounded-full" />
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                Comprehensive Guest Log
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Audit-Ready • Follow Up Locked</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input 
                placeholder="Cari tamu/perusahaan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-none rounded-full text-[10px] font-bold placeholder:text-slate-300"
              />
            </div>
            <Badge className="bg-violet-50 text-violet-600 border-none font-black text-[9px] py-2 px-4 rounded-full">
              {guests?.length || 0} Records
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                {["Tanggal/Wkt", "Nama Client", "Busdev", "Kontak (WA/Mail)", "Kota", "Produk", "MOQ", "Launch", "Target Market", "Kategorisasi", "FU Status", "Actions"].map(h => (
                  <TableHead key={h} className="py-4 font-black uppercase text-[9px] text-slate-500 tracking-tight whitespace-nowrap px-4">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests && guests.length > 0 ? (
                guests
                  .filter((g: any) => 
                    g.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (g.instansi && g.instansi.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((guest: any) => {
                  const fuStatus = guest.fuStatus || "NOT_FOLLOWED_UP";
                  const fuCfg = FU_CONFIG[fuStatus as keyof typeof FU_CONFIG] || FU_CONFIG.NOT_FOLLOWED_UP;

                  return (
                    <TableRow key={guest.id} className="group hover:bg-violet-50/30 transition-colors border-slate-50">
                      <TableCell className="py-5 px-4 font-bold text-slate-400 text-[10px] uppercase whitespace-nowrap">
                        {new Date(guest.visitDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                        <br />
                        <span className="text-[9px] text-slate-300">
                          {new Date(guest.visitDate).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 font-black text-slate-900 uppercase italic text-sm whitespace-nowrap">
                        {guest.clientName}
                        {guest.instansi && (
                          <p className="text-[9px] font-bold text-slate-400 normal-case">{guest.instansi}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <span className="text-violet-600 font-black text-xs italic">
                          {guest.bd?.fullName || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs">{guest.phoneNo || "—"}</span>
                          <span className="text-[9px] text-slate-400">{guest.email || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 font-black text-slate-700 text-xs uppercase">{guest.city || "—"}</TableCell>
                      <TableCell className="px-4 text-center font-black text-blue-600 text-xs uppercase italic whitespace-nowrap">
                        {guest.productInterest || "—"}
                      </TableCell>
                      <TableCell className="px-4 text-center font-black text-slate-900 text-xs">
                        {guest.moqPlan?.toLocaleString("id-ID") || "—"}
                      </TableCell>
                      <TableCell className="px-4 text-center font-bold text-slate-600 text-[10px] uppercase whitespace-nowrap">
                        {guest.launchingPlan || "—"}
                      </TableCell>
                      <TableCell className="px-4 font-bold text-slate-500 text-[10px] uppercase max-w-[120px] truncate">
                        {guest.targetMarket || "—"}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase rounded-lg px-2",
                          guest.category === "BRANDED" ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {guest.category || "—"}
                        </Badge>
                      </TableCell>
                      {/* FU Status — Display Only, Cannot Modify */}
                      <TableCell className="px-4 text-center">
                        <Badge className={cn("text-[9px] font-black uppercase rounded-lg px-2 border-none", fuCfg.color)}>
                          {fuCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 rounded-full hover:bg-violet-50 hover:text-violet-600 text-[9px] font-black uppercase tracking-tight gap-1"
                          onClick={() => setConfirmGuest(guest)}
                          disabled={convertMutation.isPending}
                        >
                          {convertMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
                          Convert
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-16 text-slate-400 font-bold text-sm">
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="h-8 w-8 text-slate-200" />
                      <p>Belum ada data buku tamu.</p>
                      <p className="text-[10px] text-slate-300">Mulai tambahkan tamu baru melalui halaman Intake.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!confirmGuest} onOpenChange={() => setConfirmGuest(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Konversi Tamu</DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Yakin mengkonversi "{confirmGuest?.clientName}" menjadi Sales Lead aktif?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setConfirmGuest(null)} className="rounded-xl font-black uppercase text-[10px]">
              Batal
            </Button>
            <Button
              onClick={() => {
                if (confirmGuest) convertMutation.mutate(confirmGuest.id);
                setConfirmGuest(null);
              }}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px]"
            >
              Konversi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

