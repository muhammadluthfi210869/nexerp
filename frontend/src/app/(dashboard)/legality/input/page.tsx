"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, 
  FlaskConical, 
  UserCircle, 
  Calendar, 
  Building2,
  Tag,
  ShieldCheck,
  Send,
  Clock,
  Moon
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DataCard, DnaButton } from "@/components/dna";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ComplianceInput() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: staffs } = useQuery({
    queryKey: ["legal-staffs"],
    queryFn: async () => {
      const resp = await api.get("/legality/staffs");
      return resp.data;
    }
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ type: 'hki' | 'bpom' | 'halal'; data: any } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ type, data }: { type: 'hki' | 'bpom' | 'halal', data: any }) => {
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

  const handleSubmit = async (e: React.FormEvent, type: 'hki' | 'bpom' | 'halal') => {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target as HTMLFormElement);
        const rawData = Object.fromEntries(formData.entries());
        
        const payload = {
          ...rawData,
          applicationDate: new Date(rawData.applicationDate as string).toISOString(),
          expiryDate: rawData.expiryDate ? new Date(rawData.expiryDate as string).toISOString() : null,
        };

        setPendingSubmit({ type, data: payload });
        setShowConfirm(true);
    } catch (error) {
        console.error("GAGAL SUBMIT:", error);
        toast.error("Submission failed. Please check your data and connection.");
    }
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    if (!pendingSubmit) return;
    const { type, data: payload } = pendingSubmit;
    
    try {
        console.log("PAYLOAD DIKIRIM:", payload);
        toast.loading(`Filing ${type.toUpperCase()} record...`, { id: "submit-toast" });
        await mutation.mutateAsync({ type, data: payload });
        toast.success(`${type.toUpperCase()} record registered successfully!`, { id: "submit-toast" });
        queryClient.invalidateQueries({ queryKey: ["hki-records"] });
        queryClient.invalidateQueries({ queryKey: ["bpom-records"] });
        queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
        setTimeout(() => {
            router.push("/legality/records");
        }, 1500);
    } catch (error) {
        console.error("GAGAL SUBMIT:", error);
        toast.error("Submission failed. Please check your data and connection.", { id: "submit-toast" });
    }
  };

  return (
    <DashboardShell
      title="COMPLIANCE"
      titleAccent="ENTRY PORTAL"
      subtitle="Initialize new HKI Branding or BPOM Product registration into the audit cycle."
    >
      <Tabs defaultValue="hki" className="space-y-6 animate-fade-slide-in">
        <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 flex gap-2 w-fit">
          <TabsTrigger value="hki" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
            HKI BRANDING
          </TabsTrigger>
          <TabsTrigger value="bpom" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
            BPOM PRODUCT
          </TabsTrigger>
          <TabsTrigger value="halal" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all">
            HALAL CERT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hki" className="m-0 focus:outline-none">
          <DataCard
            dotColor="bg-blue-600"
            title="HKI BRANDING REGISTRY"
            titleColor="text-slate-400"
            className="!p-5 rounded-2xl"
          >
            <form onSubmit={(e) => handleSubmit(e, 'hki')} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="HKI ID / Application Number" name="hkiId" icon={<Tag className="w-4 h-4 text-slate-400" />} placeholder="e.g. IPT20240001" required />
                <FormGroup label="Brand Name" name="brandName" icon={<ShieldCheck className="w-4 h-4 text-slate-400" />} placeholder="e.g. Nex White" required />
                <FormGroup label="Type / Class" name="type" icon={<FileCheck className="w-4 h-4 text-slate-400" />} placeholder="e.g. Cosmetic Class 3" required />
                <FormGroup label="Client Name" name="clientName" icon={<Building2 className="w-4 h-4 text-slate-400" />} placeholder="e.g. PT Nex Industri" required />
                <FormGroup label="Application Date" name="applicationDate" icon={<Calendar className="w-4 h-4 text-slate-400" />} type="date" required />
                <FormGroup label="Expiry Date (Optional)" name="expiryDate" icon={<Clock className="w-4 h-4 text-slate-400" />} type="date" />
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-slate-400" /> Assigned PIC
                  </label>
                  <select 
                    name="picId" 
                    required 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select PIC Officer</option>
                    {staffs?.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <DnaButton 
                  type="submit" 
                  disabled={mutation.isPending} 
                  variant="primary"
                  icon={<Send />}
                >
                  {mutation.isPending ? "FILING..." : "FILE HKI RECORD"}
                </DnaButton>
              </div>
            </form>
          </DataCard>
        </TabsContent>

        <TabsContent value="bpom" className="m-0 focus:outline-none">
          <DataCard
            dotColor="bg-emerald-600"
            title="BPOM PRODUCT REGISTRY"
            titleColor="text-slate-400"
            className="!p-5 rounded-2xl"
          >
            <form onSubmit={(e) => handleSubmit(e, 'bpom')} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="BPOM ID / NI Number" name="bpomId" icon={<Tag className="w-4 h-4 text-slate-400" />} placeholder="e.g. NA18240001" required />
                <FormGroup label="Product Name" name="productName" icon={<FlaskConical className="w-4 h-4 text-slate-400" />} placeholder="e.g. Anti-Aging Serum" required />
                <FormGroup label="Category" name="category" icon={<FileCheck className="w-4 h-4 text-slate-400" />} placeholder="e.g. Skin Care" required />
                <FormGroup label="Client Name" name="clientName" icon={<Building2 className="w-4 h-4 text-slate-400" />} placeholder="e.g. PT Artha Prima" required />
                <FormGroup label="Application Date" name="applicationDate" icon={<Calendar className="w-4 h-4 text-slate-400" />} type="date" required />
                <FormGroup label="Expiry Date (Optional)" name="expiryDate" icon={<Clock className="w-4 h-4 text-slate-400" />} type="date" />
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-slate-400" /> Assigned PIC
                  </label>
                  <select 
                    name="picId" 
                    required 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select PIC Officer</option>
                    {staffs?.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <DnaButton 
                  type="submit" 
                  disabled={mutation.isPending} 
                  variant="primary"
                  icon={<Send />}
                >
                  {mutation.isPending ? "FILING..." : "FILE BPOM RECORD"}
                </DnaButton>
              </div>
            </form>
          </DataCard>
        </TabsContent>

        <TabsContent value="halal" className="m-0 focus:outline-none">
          <DataCard
            dotColor="bg-emerald-700"
            title="HALAL CERTIFICATION REGISTRY"
            titleColor="text-slate-400"
            className="!p-5 rounded-2xl"
          >
            <form onSubmit={(e) => handleSubmit(e, 'halal')} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Halal ID / Certificate Number" name="halalId" icon={<Tag className="w-4 h-4 text-slate-400" />} placeholder="e.g. ID001100000001" required />
                <FormGroup label="Product Name" name="productName" icon={<Moon className="w-4 h-4 text-slate-400" />} placeholder="e.g. Serum Whitening" required />
                <FormGroup label="Manufacturer" name="manufacturer" icon={<Building2 className="w-4 h-4 text-slate-400" />} placeholder="e.g. PT Nex Industri" required />
                <FormGroup label="Category" name="category" icon={<FileCheck className="w-4 h-4 text-slate-400" />} placeholder="e.g. Kosmetik" required />
                <FormGroup label="Application Date" name="applicationDate" icon={<Calendar className="w-4 h-4 text-slate-400" />} type="date" required />
                <FormGroup label="Expiry Date (Optional)" name="expiryDate" icon={<Clock className="w-4 h-4 text-slate-400" />} type="date" />
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-slate-400" /> Assigned PIC
                  </label>
                  <select 
                    name="picId" 
                    required 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select PIC Officer</option>
                    {staffs?.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <DnaButton 
                  type="submit" 
                  disabled={mutation.isPending} 
                  variant="primary"
                  icon={<Send />}
                >
                  {mutation.isPending ? "FILING..." : "FILE HALAL RECORD"}
                </DnaButton>
              </div>
            </form>
          </DataCard>
        </TabsContent>
      </Tabs>
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
    </DashboardShell>
  );
}

function FormGroup({ label, name, icon, placeholder, type = "text", required = false }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input 
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
      />
    </div>
  );
}
