"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  UserPlus, 
  Briefcase, 
  Phone, 
  DollarSign, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Shield,
  User,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { FormShell } from "@/components/layout/FormShell";
import { SectionDivider } from "@/components/layout/SectionDivider";

const SOURCES = ["Instagram", "TikTok", "TikTok Ads", "Referral", "Website", "Offline Event", "WhatsApp"];

export default function LeadIntakePage() {
  const queryClient = useQueryClient();
  const [isRepeatOrder, setIsRepeatOrder] = useState(false);
  const [selectedPic, setSelectedPic] = useState<string | null>("AUTO");
  const [displayValue, setDisplayValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
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
      const myStaff = staffs.find((s: any) => s.userId === user.id || s.userId === user.userId);
      if (myStaff) {
         setSelectedPic(myStaff.id);
      }
    }
  }, [staffs, user, isAdmin]);

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
    
    const val = rawData.estimatedValue ? Number(rawData.estimatedValue.toString().replace(/[^0-9]/g, "")) : 0;
    
    if (val <= 0 && !isRepeatOrder) {
      toast.error("Estimated Value harus diisi untuk lead baru.");
      return;
    }

    // Collect samples from table
    const sampleRequests = [];
    for (let i = 1; i <= 3; i++) {
      const name = rawData[`sampleName_${i}`] as string;
      const qty = Number(rawData[`sampleQty_${i}`]);
      const price = Number(rawData[`samplePrice_${i}`]);
      const notes = rawData[`sampleNotes_${i}`] as string;

      if (name && name.trim() !== "") {
        sampleRequests.push({ productName: name, quantity: qty, targetPrice: price, notes });
      }
    }

    createLeadMutation.mutate({
      ...rawData,
      estimatedValue: val,
      isRepeatOrder,
      picId: (selectedPic === "AUTO" || !selectedPic) ? undefined : selectedPic,
      sampleRequests,
    });
  };

  return (
    <FormShell
      title="Client"
      titleAccent="Intake"
      subtitle="Prospect Registration & Workload Assignment Protocol"
      actions={
        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold uppercase py-1.5 px-4 rounded-full">
          Intake Form v4.2
        </Badge>
      }
      sidebar={
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Shield size={12} /> Internal Logistics
            </h3>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Assignment</Label>
              <Select 
                name="picId" 
                value={selectedPic || ""} 
                onValueChange={(val) => val && setSelectedPic(val)}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-[11px] uppercase">
                  <SelectValue placeholder="Detecting..." />
                </SelectTrigger>
                <SelectContent className="font-bold text-[11px] uppercase">
                  <SelectItem value="AUTO">AUTO-BALANCE</SelectItem>
                  {staffs?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <Checkbox 
                  id="isRepeatOrder" 
                  checked={isRepeatOrder} 
                  onCheckedChange={(checked) => setIsRepeatOrder(!!checked)}
                  className="h-5 w-5"
                />
                <div className="grid gap-0.5 leading-none">
                  <label htmlFor="isRepeatOrder" className="text-[11px] font-bold uppercase text-slate-800">Repeat Order</label>
                  <p className="text-[9px] font-bold text-blue-500 uppercase">Priority VIP</p>
                </div>
            </div>

            <Button 
              onClick={() => (document.getElementById('intake-form') as HTMLFormElement)?.requestSubmit()}
              className="w-full h-12 bg-brand-black hover:bg-brand-blue text-white font-bold uppercase text-xs rounded-xl shadow-lg shadow-slate-200"
              disabled={createLeadMutation.isPending}
            >
              {createLeadMutation.isPending ? <Loader2 className="animate-spin" /> : "Commit Lead Registry"}
            </Button>
          </div>

          <Card className="rounded-2xl border-none bg-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <CheckCircle2 size={100} />
             </div>
             <div className="relative z-10 space-y-3">
                <h4 className="text-sm font-bold uppercase italic">SLA Protocol</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                   Response must be initiated within 24 hours of submission.
                </p>
             </div>
          </Card>
        </>
      }
    >
      <form id="intake-form" onSubmit={handleSubmit} className="space-y-[var(--section-gap)]">
        {/* Section 1: Client Identity */}
        <div>
          <SectionDivider number={1} title="CLIENT IDENTITY" accentColor="primary" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              <FormItem label="Legal Entity / Client Name" id="clientName">
                <Input id="clientName" name="clientName" required placeholder="PT. NAME" className="h-11 bg-slate-50 border-none font-bold uppercase text-xs" />
              </FormItem>
              <FormItem label="Brand Identity" id="brandName">
                <Input id="brandName" name="brandName" placeholder="BRAND NAME" className="h-11 bg-slate-50 border-none font-bold uppercase text-xs" />
              </FormItem>
            </div>
            <div className="mt-6">
              <FormItem label="Contact Channel" id="contactInfo">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="contactInfo" name="contactInfo" required placeholder="+62" className="h-11 pl-11 bg-slate-50 border-none font-bold uppercase text-xs" />
                </div>
              </FormItem>
            </div>
          </div>
        </div>

        {/* Section 2: Opportunity Analysis */}
        <div>
          <SectionDivider number={2} title="OPPORTUNITY ANALYSIS" accentColor="primary" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormItem label="Lead Source" id="source">
                <Select name="source" required>
                  <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="font-bold text-xs uppercase">{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
              <FormItem label="Estimated Value (IDR)" id="estimatedValue">
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="estimatedValue" name="estimatedValue" required 
                    value={displayValue} onChange={(e) => setDisplayValue(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "."))} 
                    className="h-11 pl-11 bg-slate-50 border-none font-bold uppercase text-xs" 
                  />
                </div>
              </FormItem>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <FormItem label="Sales Category" id="salesCategory">
                <Select name="salesCategory" required>
                  <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="font-bold text-xs uppercase">
                    {["B2B", "B2C", "MAKLON_FULL"].map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem label="Estimated MOQ (Pcs)" id="moq">
                <Input id="moq" name="moq" type="number" required placeholder="e.g. 1000" className="h-11 bg-slate-50 border-none font-bold uppercase text-xs" />
              </FormItem>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <FormItem label="Product Vertical" id="category">
                <Select name="category" required>
                  <SelectTrigger className="h-11 bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="font-bold text-xs uppercase">
                    {["SKINCARE", "BODYCARE", "BABYCARE", "HAIRCARE", "DECORATIVE", "PARFUM"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem label="Product Interest" id="productInterest">
                <Input id="productInterest" name="productInterest" required placeholder="e.g. SERUM" className="h-11 bg-slate-50 border-none font-bold uppercase text-xs" />
              </FormItem>
            </div>
            <FormItem label="Brief / Requirements" id="notes">
              <Textarea id="notes" name="notes" placeholder="ADDITIONAL NOTES..." className="min-h-[100px] bg-slate-50 border-none font-bold uppercase text-xs p-4" />
            </FormItem>
          </div>
        </div>

        {/* Section 3: Pre-Sales Sample Table (Operational Compliance) */}
        <div>
          <SectionDivider number={3} title="PRE-SALES SAMPLE REQUEST" accentColor="primary" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="pb-3 px-2">Sample Name / Formula</th>
                         <th className="pb-3 px-2 w-24">Qty</th>
                         <th className="pb-3 px-2 w-32">Price (Est)</th>
                         <th className="pb-3 px-2">Notes</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[1, 2, 3].map((row) => (
                        <tr key={row}>
                          <td className="py-3 px-2">
                            <Input name={`sampleName_${row}`} placeholder="e.g. Brightening Serum V1" className="h-9 bg-slate-50 border-none font-bold text-[10px] uppercase" />
                          </td>
                          <td className="py-3 px-2">
                            <Input name={`sampleQty_${row}`} type="number" placeholder="0" className="h-9 bg-slate-50 border-none font-bold text-[10px]" />
                          </td>
                          <td className="py-3 px-2">
                            <Input name={`samplePrice_${row}`} type="number" placeholder="0" className="h-9 bg-slate-50 border-none font-bold text-[10px]" />
                          </td>
                          <td className="py-3 px-2">
                            <Input name={`sampleNotes_${row}`} placeholder="Notes..." className="h-9 bg-slate-50 border-none font-bold text-[10px] uppercase" />
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase italic">
               * Pre-sales sample items will be automatically logged into the Activity Stream.
             </p>
          </div>
        </div>
      </form>
    </FormShell>
  );
}

function FormItem({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[10px] font-bold uppercase text-slate-400 ml-1">{label}</Label>
      {children}
    </div>
  );
}

