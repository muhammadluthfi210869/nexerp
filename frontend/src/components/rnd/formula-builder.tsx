"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Save, AlertCircle, Search, Beaker, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const formulaSchema = z.object({
  sample_id: z.string().uuid(),
  total_weight_gr: z.number().min(1, "Weight must be at least 1g"),
  items: z.array(z.object({
    material_id: z.string().uuid("Material selection required"),
    material_name: z.string(),
    dosage_percentage: z.number().min(0, "Dosis cannot be negative").max(100),
    cost_snapshot: z.number()
  })).min(1, "At least one ingredient required")
});

type FormulaValues = z.infer<typeof formulaSchema>;

interface FormulaBuilderProps {
  sampleId: string;
  sampleName: string;
  onSuccess?: () => void;
}

export function FormulaBuilder({ sampleId, sampleName, onSuccess }: FormulaBuilderProps) {
  const [materials, setMaterials] = useState<{ id: string, name: string, code: string, price_per_unit?: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { control, register, handleSubmit, watch, formState: { isValid } } = useForm<FormulaValues>({
    resolver: zodResolver(formulaSchema) as import("react-hook-form").Resolver<FormulaValues>,
    defaultValues: {
      sample_id: sampleId,
      total_weight_gr: 100,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Watch total percentage
  const watchedItems = useWatch({ control, name: "items" });
  const totalPercentage = watchedItems?.reduce((sum, item) => sum + (Number(item.dosage_percentage) || 0), 0) || 0;
  const isPerfect = totalPercentage === 100;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get("/scm/materials");
        setMaterials(res.data);
      } catch {
        toast.error("Failed to fetch material global vault.");
      }
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addMaterial = (material: { id: string, name: string, price_per_unit?: number }) => {
    append({
       material_id: material.id,
       material_name: material.name,
       dosage_percentage: 0,
       cost_snapshot: material.price_per_unit || 0
    });
    setIsPickerOpen(false);
  };

  const onSubmit = async (data: FormulaValues) => {
    if (!isPerfect) return;
    try {
      await api.post("/rnd/formulas", {
        ...data,
        items: data.items.map(it => ({
          material_id: it.material_id,
          dosage_percentage: it.dosage_percentage,
          cost_snapshot: it.cost_snapshot
        }))
      });
      toast.success("Binary-Precision Formula locked into vault.");
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Vulnerability detected. Formula rejected.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Beaker className="h-24 w-24 text-emerald-500" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start">
             <div>
                <CardTitle className="text-2xl font-bold tracking-tighter text-white">FORMULA BUILDER v1.0</CardTitle>
                <CardDescription className="font-sans text-xs uppercase text-zinc-500 flex items-center">
                  <span className="text-emerald-500 mr-2">●</span>
                  Target: {sampleName}
                </CardDescription>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mb-1">Precision Balance</p>
                <Badge variant={isPerfect ? "default" : "outline"} className={`text-lg px-4 py-1 font-sans ${isPerfect ? 'bg-emerald-600 text-white border-none animate-pulse' : 'text-zinc-400 border-zinc-800'}`}>
                  {totalPercentage.toFixed(2)}%
                </Badge>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Batch Weight (Grams)</Label>
                  <Input 
                    type="number" 
                    className="bg-zinc-900 border-zinc-800 text-white font-sans h-10" 
                    {...register("total_weight_gr", { valueAsNumber: true })}
                  />
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <Label className="text-sm font-bold text-zinc-400 flex items-center">
                   <Plus className="mr-2 h-4 w-4 text-emerald-500" /> 
                   Ingredients Matrix
                 </Label>
                 
                 <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                   <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white hover:border-emerald-500 transition-colors h-8 text-[10px] uppercase font-bold tracking-tight" />}>
                        Inject Raw Material
                   </DialogTrigger>
                   <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-2xl">
                     <DialogHeader>
                       <DialogTitle className="flex items-center">
                         <Search className="mr-2 h-5 w-5 text-emerald-500" />
                         Material Global Directory
                       </DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4 py-4">
                        <Input 
                           placeholder="Search by name or code..." 
                           className="bg-zinc-900 border-zinc-800"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-1 bg-black/40 rounded-lg p-2 border border-zinc-900">
                           {filteredMaterials.map(m => (
                             <button
                               key={m.id}
                               type="button"
                               onClick={() => addMaterial(m)}
                               className="w-full text-left px-4 py-3 rounded-md hover:bg-zinc-900 group transition-all flex items-center justify-between border border-transparent hover:border-zinc-800"
                             >
                               <div>
                                 <p className="text-sm font-bold group-hover:text-emerald-400">{m.name}</p>
                                 <p className="text-[10px] text-zinc-500 font-sans italic">{m.code}</p>
                               </div>
                               <Plus className="h-4 w-4 text-zinc-700 group-hover:text-emerald-500" />
                             </button>
                           ))}
                        </div>
                     </div>
                   </DialogContent>
                 </Dialog>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 group animate-in slide-in-from-left-2 duration-300">
                    <div className="col-span-5 px-2">
                       <p className="text-xs font-bold text-white truncate">{field.material_name}</p>
                       <p className="text-[9px] text-zinc-600 font-sans">ID: {field.material_id.split('-')[0]}...</p>
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                       <Input 
                         type="number" 
                         step="0.0001"
                         placeholder="Percentage"
                         className="bg-black border-zinc-800 text-white text-xs h-8 font-sans text-right"
                         {...register(`items.${index}.dosage_percentage` as const, { valueAsNumber: true })}
                       />
                       <span className="text-zinc-600 text-xs font-sans">%</span>
                    </div>
                    <div className="col-span-2 text-right">
                       <p className="text-[10px] text-zinc-500">Vol:</p>
                       <p className="text-xs font-sans font-bold text-emerald-500">
                         {((Number(watch(`items.${index}.dosage_percentage`)) || 0) / 100 * (Number(watch("total_weight_gr")) || 0)).toFixed(4)}g
                       </p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-zinc-700 hover:text-red-500 h-8 w-8">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                ))}
                
                {fields.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center opacity-40">
                     <Plus className="h-8 w-8 mb-2 text-zinc-800" />
                     <p className="text-xs text-zinc-700 uppercase font-bold tracking-tight italic">No materials injected in this formulation matrix</p>
                  </div>
                )}
              </div>
            </div>

            {!isPerfect && totalPercentage > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                 <AlertCircle className="h-5 w-5 text-red-500" />
                 <p className="text-xs text-red-500 font-bold uppercase tracking-tight">
                    Critical Deviation: {totalPercentage.toFixed(2)}%. Matrix must reach exactly 100.00% to initialize production logic.
                 </p>
              </div>
            )}

            {isPerfect && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 animate-in zoom-in-95 duration-500">
                 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                 <p className="text-xs text-emerald-500 font-bold uppercase tracking-tight">
                    Equilibrium Reached. Balanced matrix ready for manufacturing execution.
                 </p>
              </div>
            )}

            <Button 
               type="submit" 
               disabled={!isPerfect || !isValid}
               className={`w-full h-12 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 ${isPerfect ? 'bg-white text-black hover:bg-emerald-500 hover:text-white' : 'bg-zinc-900 text-zinc-700'}`}
            >
               <Save className="mr-2 h-5 w-5" />
               Lock Formula Environment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

