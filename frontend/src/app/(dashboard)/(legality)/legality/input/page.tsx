"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  FlaskConical, 
  UserCircle, 
  Calendar, 
  Building2,
  Tag,
  Loader2,
  ShieldCheck,
  Send,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ComplianceInput() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: staffs } = useQuery({
    queryKey: ["legal-staffs"],
    queryFn: async () => {
      const resp = await api.get("/legality/staffs");
      return resp.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ type, data }: { type: 'hki' | 'bpom', data: any }) => {
      return api.post(`/legality/${type}`, data);
    },
    onSuccess: () => {
      toast.success("Record filed successfully in Auditory Log");
      queryClient.invalidateQueries({ queryKey: ["hki-records"] });
      queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      router.push("/legality/records");
    },
    onError: (err) => {
      toast.error("Failed to file record. Check connection.");
      console.error(err);
    }
  });

  const handleSubmit = async (e: React.FormEvent, type: 'hki' | 'bpom') => {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target as HTMLFormElement);
        const rawData = Object.fromEntries(formData.entries());
        
        // Prepare payload with proper data types
        const payload = {
          ...rawData,
          applicationDate: new Date(rawData.applicationDate as string).toISOString(),
          expiryDate: rawData.expiryDate ? new Date(rawData.expiryDate as string).toISOString() : null,
        };

        // WAJIB: Console log payload exactly as requested
        console.log("PAYLOAD DIKIRIM:", payload);
        
        toast.loading(`Filing ${type.toUpperCase()} record...`, { id: "submit-toast" });

        // Using mutateAsync to handle flow in try-catch as requested
        await mutation.mutateAsync({ type, data: payload });
        
        toast.success(`${type.toUpperCase()} record registered successfully!`, { id: "submit-toast" });
        
        // Success actions
        queryClient.invalidateQueries({ queryKey: ["hki-records"] });
        queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
        queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
        
        // Slight delay before redirect to show toast
        setTimeout(() => {
            router.push("/legality/records");
        }, 1500);

    } catch (error) {
        console.error("GAGAL SUBMIT:", error);
        toast.error("Submission failed. Please check your data and connection.", { id: "submit-toast" });
    }
  };

  return (
    <div className="p-8 md:p-14 font-sans text-slate-800 bg-base min-h-screen">
      <header className="max-w-4xl mx-auto mb-16">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
             <div className="h-8 w-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FileCheck className="w-4 h-4 text-white" />
             </div>
             <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Data Injection</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic text-slate-900 leading-[0.8]">COMPLIANCE<br/>ENTRY PORTAL</h1>
          <p className="text-slate-400 mt-6 text-lg font-medium italic opacity-70">Initialize new HKI Branding or BPOM Product registration into the audit cycle.</p>
        </motion.div>
      </header>

      <main className="max-w-4xl mx-auto">
        <Tabs defaultValue="hki" className="space-y-8">
           <TabsList className="bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm w-fit flex gap-2">
                <TabsTrigger value="hki" className="px-8 py-3 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all font-black italic">
                   HKI BRANDING
                </TabsTrigger>
                <TabsTrigger value="bpom" className="px-8 py-3 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all font-black italic">
                   BPOM PRODUCT
                </TabsTrigger>
           </TabsList>

           <TabsContent value="hki">
               <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                  <form onSubmit={(e) => handleSubmit(e, 'hki')}>
                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormGroup label="HKI ID / Application Number" name="hkiId" icon={<Tag className="w-4 h-4" />} placeholder="e.g. IPT20240001" required />
                            <FormGroup label="Brand Name" name="brandName" icon={<ShieldCheck className="w-4 h-4" />} placeholder="e.g. Nex White" required />
                            <FormGroup label="Type / Class" name="type" icon={<FileCheck className="w-4 h-4" />} placeholder="e.g. Cosmetic Class 3" required />
                            <FormGroup label="Client Name" name="clientName" icon={<Building2 className="w-4 h-4" />} placeholder="e.g. PT Nex Industri" required />
                            <FormGroup label="Application Date" name="applicationDate" icon={<Calendar className="w-4 h-4" />} type="date" required />
                            <FormGroup label="Expiry Date (Optional)" name="expiryDate" icon={<Clock className="w-4 h-4" />} type="date" />
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-tight text-slate-400 flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" /> Assigned PIC
                                </Label>
                                <select 
                                    name="picId" 
                                    required 
                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Select PIC Officer</option>
                                    {staffs?.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-8 flex justify-end">
                        <Button type="submit" disabled={mutation.isPending} className="rounded-2xl h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black italic gap-3 shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all">
                            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} 
                            FILE HKI RECORD
                        </Button>
                    </div>
                  </form>
               </Card>
           </TabsContent>

           <TabsContent value="bpom">
               <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                  <form onSubmit={(e) => handleSubmit(e, 'bpom')}>
                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormGroup label="BPOM ID / NI Number" name="bpomId" icon={<Tag className="w-4 h-4" />} placeholder="e.g. NA18240001" required />
                            <FormGroup label="Product Name" name="productName" icon={<FlaskConical className="w-4 h-4" />} placeholder="e.g. Anti-Aging Serum" required />
                            <FormGroup label="Category" name="category" icon={<FileCheck className="w-4 h-4" />} placeholder="e.g. Skin Care" required />
                            <FormGroup label="Client Name" name="clientName" icon={<Building2 className="w-4 h-4" />} placeholder="e.g. PT Artha Prima" required />
                            <FormGroup label="Application Date" name="applicationDate" icon={<Calendar className="w-4 h-4" />} type="date" required />
                            <FormGroup label="Expiry Date (Optional)" name="expiryDate" icon={<Clock className="w-4 h-4" />} type="date" />
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-tight text-slate-400 flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" /> Assigned PIC
                                </Label>
                                <select 
                                    name="picId" 
                                    required 
                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Select PIC Officer</option>
                                    {staffs?.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-8 flex justify-end">
                        <Button type="submit" disabled={mutation.isPending} className="rounded-2xl h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black italic gap-3 shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all">
                            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} 
                            FILE BPOM RECORD
                        </Button>
                    </div>
                  </form>
               </Card>
           </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function FormGroup({ label, name, icon, placeholder, type = "text", required = false }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-tight text-slate-400 flex items-center gap-2">
                {icon} {label}
            </Label>
            <Input 
                name={name}
                type={type}
                placeholder={placeholder}
                required={required}
                className="h-14 bg-slate-50 border-none rounded-2xl px-5 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 transition-all"
            />
        </div>
    );
}

