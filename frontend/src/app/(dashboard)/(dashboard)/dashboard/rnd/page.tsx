"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Plus, 
  Beaker, 
  TestTube, 
  ChevronRight, 
  ClipboardCheck, 
  Dna,
  Binary
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormulaBuilder } from "@/components/rnd/formula-builder";

export default function RndPage() {
  const queryClient = useQueryClient();
  const [activeFormula, setActiveFormula] = useState<{ id: string, name: string } | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Queries
  const { data: npfs, isLoading: loadingNpfs } = useQuery({
    queryKey: ["rnd-npfs"],
    queryFn: () => api.get("/rnd/npf").then(res => res.data)
  });

  const { data: samples, isLoading: loadingSamples } = useQuery({
    queryKey: ["rnd-samples"],
    queryFn: () => api.get("/rnd/samples").then(res => res.data)
  });

  // Mutation: Create Sample from NPF
  const createSample = useMutation({
    mutationFn: (npfId: string) => {
      // Get current user ID (mock for now or from storage)
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return api.post("/rnd/samples", {
        npf_id: npfId,
        rnd_id: user.id || "00000000-0000-0000-0000-000000000000", // Fallback for testing
        status: "DRAFT"
      });
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
       toast.success("Formulation track initialized for this product.");
    },
    onError: () => toast.error("Track collision. Failed to initiate formulation sample.")
  });

  const handleOpenBuilder = (sample: { id: string; version: number; npf?: { product_name: string } }) => {
    setActiveFormula({ id: sample.id, name: sample.npf?.product_name || `Sample V${sample.version}` });
    setIsBuilderOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-white flex items-center">
            <Beaker className="mr-3 h-8 w-8 text-emerald-500" />
            R&D OPERATIONS CENTER
          </h2>
          <p className="text-zinc-500 font-medium">Advanced formulation mapping & molecular-level product design.</p>
        </div>
        <div className="flex gap-2">
           <Card className="bg-zinc-950 border-zinc-900 px-4 py-2 flex items-center gap-3">
              <Dna className="h-5 w-5 text-emerald-500 blur-[0.5px] animate-pulse" />
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight leading-none">Active Samples</p>
                <p className="text-xl font-bold text-white leading-none mt-1">{samples?.length || 0}</p>
              </div>
           </Card>
        </div>
      </header>

      <Tabs defaultValue="npf" className="w-full">
        <TabsList className="bg-zinc-950 border-zinc-900 mb-6">
          <TabsTrigger value="npf" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            NPF Inbox
            {npfs?.length > 0 && <Badge className="ml-1 bg-emerald-500/20 text-emerald-400">{npfs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="samples" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Active Formulation Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="npf">
          <Card className="border-zinc-800 bg-zinc-950/50 shadow-2xl">
            <CardHeader className="border-b border-zinc-900 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white">NEW PRODUCT FORMULATION (NPF) REQUESTS</CardTitle>
                <CardDescription className="text-xs text-zinc-500">Incoming mission-parameters from Commercial - Business Development.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-900/30">
                  <TableRow className="border-zinc-900">
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Product Name</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Client</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Target Price</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingNpfs ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-zinc-900"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-zinc-900" /></TableCell></TableRow>
                    ))
                  ) : npfs?.map((npf: { id: string; product_name: string; target_usage?: string; client_name?: string; target_price: number }) => (
                    <TableRow key={npf.id} className="border-zinc-900 group hover:bg-zinc-900/40 transition-colors">
                      <TableCell className="font-bold text-white">
                         <p>{npf.product_name}</p>
                         <p className="text-[10px] text-zinc-500 font-sans italic">{npf.target_usage || 'Daily Cosmetics'}</p>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{npf.client_name || 'N/A'}</TableCell>
                      <TableCell className="text-emerald-500 font-sans font-bold">${npf.target_price}</TableCell>
                      <TableCell className="text-right">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all h-8 text-[10px] font-bold uppercase"
                            onClick={() => createSample.mutate(npf.id)}
                            disabled={createSample.isPending}
                         >
                            <Plus className="mr-1 h-3 w-3" /> Initialize Track
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples">
           <div className="grid grid-cols-1 gap-6">
              <Card className="border-zinc-800 bg-zinc-950/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -mr-16 -mt-16" />
                <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                      <CardTitle className="text-lg font-bold text-white">ACTIVE SAMPLES LAB</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Live development cycle of product prototypes.</CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-900/30">
                      <TableRow className="border-zinc-900">
                        <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Sample Tracker</TableHead>
                        <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Origin NPF</TableHead>
                        <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10">Status</TableHead>
                        <TableHead className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight h-10 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingSamples ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <TableRow key={i} className="border-zinc-900"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-zinc-900" /></TableCell></TableRow>
                        ))
                      ) : samples?.map((sample: { id: string; version: number; created_at: string; status: string; npf?: { product_name: string } }) => (
                        <TableRow key={sample.id} className="border-zinc-900 hover:bg-zinc-900/30">
                          <TableCell>
                             <div className="flex items-center gap-3">
                                <span className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-emerald-500 font-sans text-[10px] border border-zinc-800 font-bold">V{sample.version}</span>
                                <div>
                                   <p className="text-xs text-zinc-300 font-bold uppercase tracking-tighter">SAMP-ID-{(sample.id.split('-')[0]).toUpperCase()}</p>
                                   <p className="text-[10px] text-zinc-600 font-sans">{new Date(sample.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-white font-bold text-xs uppercase">{sample.npf?.product_name || 'Generic Sample'}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className={`text-[9px] font-bold ${sample.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                               {sample.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-zinc-500 hover:text-white hover:bg-zinc-900 h-8"
                                onClick={() => handleOpenBuilder(sample)}
                             >
                                <Binary className="mr-2 h-4 w-4" /> Build Formula
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* R&D FORMULA BUILDER MODAL */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
         <DialogContent className="max-w-[70vw] bg-black border-zinc-900 text-white p-0 overflow-hidden">
             {activeFormula && (
               <FormulaBuilder 
                 sampleId={activeFormula.id} 
                 sampleName={activeFormula.name} 
                 onSuccess={() => {
                   setIsBuilderOpen(false);
                   queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
                 }}
               />
             )}
         </DialogContent>
      </Dialog>
    </div>
  );
}

