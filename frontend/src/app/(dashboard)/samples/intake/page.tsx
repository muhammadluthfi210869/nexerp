"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaInput,
  DnaButton,
  SectionLabel,
  DnaBadge,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Card,
} from "@/components/dna";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  DollarSign,
  CheckCircle2,
  Shield,
  Calculator,
} from "lucide-react";

import { FormShell } from "@/components/layout/FormShell";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { useAuth } from "@/hooks/useAuth";

const DRAFT_KEY = "bussdev-intake-draft";

const SOURCES = ["Instagram", "TikTok", "TikTok Ads", "Referral", "Website", "Offline Event", "WhatsApp"];

export default function LeadIntakePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPic, setSelectedPic] = useState<string | null>("AUTO");
  const [moq, setMoq] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.roles?.includes("SUPER_ADMIN");

  const { data: staffs } = useQuery({
    queryKey: ["bussdev-staffs"],
    queryFn: async () => {
      const res = await api.get("/bussdev/staffs");
      return res.data;
    },
  });

  React.useEffect(() => {
    if (staffs && user && !isAdmin) {
      const myStaff = staffs.find((s: any) => s.userId === user.id);
      if (myStaff) {
        setSelectedPic(myStaff.id);
      }
    }
  }, [staffs, user, isAdmin]);

  // ── Auto-save draft to localStorage on form blur ──
  const saveDraft = useCallback((form: HTMLFormElement) => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const data = Object.fromEntries(new FormData(form));
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    }, 800);
  }, []);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        const el = document.getElementById("intake-form") as HTMLFormElement | null;
        if (el) {
          Object.entries(draft).forEach(([key, value]) => {
            const input = el.elements.namedItem(key) as HTMLInputElement | null;
            if (input) input.value = String(value ?? "");
          });
        }
        toast.info("Draft restored from previous session");
      }
    } catch {}
    return () => {
      // Save draft on unmount (navigation away)
      const el = document.getElementById("intake-form") as HTMLFormElement | null;
      if (el) saveDraft(el);
    };
  }, [saveDraft]);

  const createLeadMutation = useMutation({
    mutationFn: async (newLead: any) => {
      const res = await api.post("/bussdev/lead", newLead);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Lead registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-leads"] });
      window.location.href = "/bussdev/pipeline";
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const moqVal = Number(rawData.moq) || 0;
    const unitPriceVal = Number(rawData.unitPrice) || 0;
    const computedValue = moqVal * unitPriceVal;

    if (computedValue <= 0) {
      toast.error("MOQ dan HPP harus diisi.");
      return;
    }

    setPendingFormData({
      ...rawData,
      moq: moqVal,
      unitPrice: unitPriceVal,
      estimatedValue: computedValue,
      picId: (selectedPic === "AUTO" || !selectedPic) ? undefined : selectedPic,
    });
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    if (pendingFormData) {
      localStorage.removeItem(DRAFT_KEY);
      createLeadMutation.mutate(pendingFormData);
    }
  };

  return (
    <FormShell
      title="Client"
      titleAccent="Intake"
      subtitle="Prospect Registration & Workload Assignment Protocol"
      actions={
        <DnaBadge status="default" className="bg-white border-slate-200 text-slate-500">
          Lead Registration
        </DnaBadge>
      }
      sidebar={
        <div className="animate-fade-slide-in space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <SectionLabel as="h3" className="flex items-center gap-2 text-slate-400">
              <Shield size={12} className="text-blue-500" /> Internal Logistics
            </SectionLabel>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase">Assignment</Label>
              <Select
                name="picId"
                value={selectedPic || ""}
                onValueChange={(val) => val && setSelectedPic(val)}
              >
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase">
                  <SelectValue placeholder="Detecting..." />
                </SelectTrigger>
                <SelectContent className="font-black text-[11px] uppercase">
                  <SelectItem value="AUTO">AUTO-BALANCE</SelectItem>
                  {staffs?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DnaButton
              onClick={() => (document.getElementById('intake-form') as HTMLFormElement)?.requestSubmit()}
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={createLeadMutation.isPending}
            >
              {createLeadMutation.isPending ? <Loader2 className="animate-spin" /> : "Commit Lead Registry"}
            </DnaButton>
          </div>

          <Card className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <CheckCircle2 size={100} className="text-blue-500" />
            </div>
            <div className="relative z-10 space-y-3">
              <h4 className="text-xs font-black uppercase italic text-slate-800">SLA Protocol</h4>
              <p className="text-[9px] font-medium text-slate-400 uppercase leading-relaxed">
                Response must be initiated within 24 hours of submission.
              </p>
            </div>
          </Card>
        </div>
      }
    >
      <form id="intake-form" onSubmit={handleSubmit} onBlur={(e) => saveDraft(e.currentTarget)} className="animate-fade-slide-in space-y-6">
        {/* Section 1: Client Identity */}
        <div>
          <SectionDivider number={1} title="CLIENT IDENTITY" accentColor="primary" />
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormItem label="Legal Entity / Client Name" id="clientName" required>
                <DnaInput id="clientName" name="clientName" required placeholder="PT. NAME" className="font-black uppercase text-xs" />
              </FormItem>
              <FormItem label="Brand Identity" id="brandName">
                <DnaInput id="brandName" name="brandName" placeholder="BRAND NAME" className="font-black uppercase text-xs" />
              </FormItem>
              <FormItem label="Contact Channel" id="contactInfo" required>
                <DnaInput id="contactInfo" name="contactInfo" required placeholder="+62" icon={<Phone className="h-4 w-4" />} className="font-black uppercase text-xs" />
              </FormItem>
            </div>
          </div>
        </div>

        {/* Section 2: Opportunity Analysis */}
        <div>
          <SectionDivider number={2} title="OPPORTUNITY ANALYSIS" accentColor="primary" />
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormItem label="Lead Source" id="source" required>
                <Select name="source">
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="font-black text-xs uppercase">{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
              <FormItem label="Product Interest" id="productInterest" required>
                <DnaInput id="productInterest" name="productInterest" required placeholder="e.g. SERUM" className="font-black uppercase text-xs" />
              </FormItem>
              <FormItem label="Product Vertical" id="category" required>
                <Select name="category">
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="font-black text-xs uppercase">
                    {["SKINCARE", "BODYCARE", "BABYCARE", "HAIRCARE", "DECORATIVE", "PARFUM"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormItem label="Estimated MOQ (Pcs)" id="moq" required>
                <DnaInput id="moq" name="moq" type="number" required placeholder="e.g. 1000" className="font-black uppercase text-xs" value={moq} onChange={(e) => setMoq(e.target.value)} />
              </FormItem>
              <FormItem label="HPP / Unit Price (Rp)" id="unitPrice" required>
                <DnaInput id="unitPrice" name="unitPrice" type="number" required placeholder="e.g. 150000" icon={<DollarSign className="h-4 w-4" />} className="font-black uppercase text-xs" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </FormItem>
              <FormItem label="Estimated Value (MOQ × HPP)" id="estimatedValue">
                <DnaInput
                  id="estimatedValue" name="estimatedValue"
                  value={(Number(moq) * Number(unitPrice) || 0).toLocaleString()}
                  readOnly
                  icon={<Calculator className="h-4 w-4 text-blue-500" />}
                  className="font-black uppercase text-xs bg-blue-50/50 border-blue-100 text-blue-900"
                />
              </FormItem>
            </div>
            <FormItem label="Brief / Requirements" id="notes">
              <textarea id="notes" name="notes" placeholder="ADDITIONAL NOTES..." className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-all resize-none" />
            </FormItem>
          </div>
        </div>

      </form>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormShell>
  );
}

function FormItem({ label, id, required, children }: { label: string; id: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[10px] font-black uppercase text-slate-400 ml-1">{label} {required && <span className="text-red-500">*</span>}</Label>
      {children}
    </div>
  );
}
