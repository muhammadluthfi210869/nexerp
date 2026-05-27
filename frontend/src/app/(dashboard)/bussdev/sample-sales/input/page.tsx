"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  UserCircle,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  Send,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DataCard, DnaButton, DnaInput } from "@/components/dna";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SampleSalesInputPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["master-customers"],
    queryFn: async () => {
      const resp = await api.get("/master/customers");
      return resp.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/bussdev/samples", payload);
    },
    onSuccess: () => {
      toast.success("Sample order berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] });
      setTimeout(() => {
        router.push("/bussdev/sample-sales");
      }, 1200);
    },
    onError: (err: any) => {
      toast.error("Gagal membuat sample order", {
        description: err?.response?.data?.message || err.message,
      });
    },
  });

  const canSubmit =
    !mutation.isPending &&
    customerId &&
    productName.trim() &&
    qty &&
    Number(qty) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading("Membuat sample order...", { id: "submit-sample" });

    const payload: any = {
      customerId,
      productName: productName.trim(),
      description: description.trim(),
      qty: Number(qty),
      unitPrice: unitPrice ? Number(unitPrice) : 0,
      targetDeliveryDate: targetDeliveryDate
        ? new Date(targetDeliveryDate).toISOString()
        : null,
      notes: notes.trim(),
    };

    await mutation.mutateAsync(payload);
  };

  return (
    <DashboardShell
      title="BUAT"
      titleAccent="SALES SAMPLE"
      subtitle="Form input permintaan sample baru — Sample Request Portal"
    >
      <DataCard
        dotColor="bg-blue-600"
        title="SAMPLE ORDER DETAILS"
        titleColor="text-slate-400"
        className="!p-5 rounded-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5" /> Customer
              </Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v || "")}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all">
                  <SelectValue placeholder="Pilih Customer..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {customers?.map((c: any) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-xs font-bold uppercase"
                    >
                      {c.clientName || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Nama Produk
              </Label>
              <DnaInput
                placeholder="e.g. Serum Brightening 30ml"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="h-11 bg-slate-50 border-none font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Deskripsi
              </Label>
              <textarea
                rows={3}
                placeholder="Deskripsi detail sample..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Qty
              </Label>
              <DnaInput
                type="number"
                min="1"
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-11 bg-slate-50 border-none font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Harga Satuan (IDR)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[10px]">
                  Rp
                </span>
                <DnaInput
                  type="number"
                  min="0"
                  placeholder="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="h-11 pl-12 bg-slate-50 border-none font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Target Delivery
              </Label>
              <DnaInput
                type="date"
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                className="h-11 bg-slate-50 border-none font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Catatan
              </Label>
              <DnaInput
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11 bg-slate-50 border-none font-black uppercase text-[10px] tracking-wider focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <DnaButton
              type="submit"
              disabled={!canSubmit}
              variant="primary"
              icon={<Send className="h-4 w-4" />}
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {mutation.isPending ? "MEMPROSES..." : "SUBMIT SAMPLE ORDER"}
            </DnaButton>
          </div>
        </form>
      </DataCard>
    </DashboardShell>
  );
}
