"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Zap, TrendingDown } from "lucide-react";

const metricSchema = z.object({
  ad_spend: z.number().min(0, "Ad spend cannot be negative"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type MetricFormValues = z.infer<typeof metricSchema>;

export function MarketingForm() {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MetricFormValues>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: MetricFormValues) => {
      return api.post("/marketing/metrics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-trends"] });
      queryClient.invalidateQueries({ queryKey: ["executive-kpis"] });
      toast.success("Ad spend record logged. CPL updated in command center.");
      reset();
    },
    onError: () => {
      toast.error("Vector collision. Failed to log marketing performance.");
    }
  });

  const onSubmit = (data: MetricFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Zap className="h-12 w-12 text-yellow-500" />
      </div>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center">
          <TrendingDown className="mr-2 h-5 w-5 text-emerald-500" />
          AD SPEND ENTRY
        </CardTitle>
        <CardDescription className="text-zinc-500 uppercase text-[10px] tracking-tight font-bold font-sans">
          DIGIMAR OPERATIONAL SECTOR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-zinc-400 text-xs">Reporting Date</Label>
            <Input 
              id="date" 
              type="date"
              className="bg-zinc-900 border-zinc-800 text-white text-xs h-9 focus:ring-zinc-700"
              {...register("date")}
            />
            {errors.date && <p className="text-[10px] text-red-500">{errors.date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ad_spend" className="text-zinc-400 text-xs font-sans uppercase tracking-tighter italic font-extrabold flex items-center justify-between underline leading-[1em] decoration-2 underline-offset-4 decoration-zinc-800 decoration-dotted transform rotate-0 scale-x-100 origin-left transition-all duration-300 ease-in-out hover:tracking-normal hover:translate-x-1 hover:rotate-1 hover:scale-x-110 h-6">Ad Spend (Amount)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-600 text-sm">$</span>
              <Input 
                id="ad_spend" 
                type="number" 
                step="0.01"
                placeholder="0.00"
                className="bg-zinc-900 border-zinc-800 text-white pl-8 text-sm h-10 focus:ring-emerald-500"
                {...register("ad_spend", { valueAsNumber: true })}
              />
            </div>
            {errors.ad_spend && <p className="text-[10px] text-red-500">{errors.ad_spend.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-400 text-xs">Campaign Notes / Campaign ID</Label>
            <Input 
              id="notes" 
              placeholder="e.g. IG-ADS-01-AQUA"
              className="bg-zinc-900 border-zinc-800 text-white text-xs h-9"
              {...register("notes")}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-zinc-200 mt-4 h-10 font-bold uppercase tracking-tight text-[11px]"
            disabled={isSubmitting || mutation.isPending}
          >
            {isSubmitting || mutation.isPending ? "TRANSMITTING DATA..." : "COMMIT AD SPEND"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

