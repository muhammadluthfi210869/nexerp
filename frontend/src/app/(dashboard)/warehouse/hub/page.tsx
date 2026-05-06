"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Warehouse,
  Loader2,
  Package,
  AlertTriangle,
  History,
  TrendingDown,
  Info,
  Settings2,
  Box,
  BadgeDollarSign,
  ArrowRightLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MaterialCatalogItem {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  stockQty: number;
  minLevel: number;
  unitPrice: number;
  category: { name: string };
  inventories: { currentStock: number; qcStatus: string }[];
  valuations: { movingAveragePrice: number }[];
}

export default function WarehouseHubPage() {
  const [selectedItem, setSelectedItem] = useState<MaterialCatalogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["warehouse-stats"],
    queryFn: async () => {
      const res = await api.get("/warehouse/stats");
      return res.data;
    },
  });

  const { data: catalog, isLoading } = useQuery<MaterialCatalogItem[]>({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      const res = await api.get("/warehouse/catalog");
      return res.data;
    },
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["warehouse-history", selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem) return [];
      const res = await api.get(`/warehouse/history/${selectedItem.id}`);
      return res.data;
    },
    enabled: !!selectedItem,
  });

  const filteredCatalog = catalog?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValuation = catalog?.reduce((acc, item) => {
    const price = item.valuations?.[0]?.movingAveragePrice || Number(item.unitPrice);
    return acc + (Number(item.stockQty) * price);
  }, 0) || 0;

  const criticalItems = catalog?.filter(item => Number(item.stockQty) <= Number(item.minLevel)).length || 0;

  return (
    <div className="p-8 space-y-10 bg-base min-h-screen">
      {/* HEADER & INSIGHTS */}
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tight mb-2 border border-blue-100">
              <Warehouse className="h-3 w-3" />
              Strategic Inventory Command
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">Stock <span className="text-blue-600">Hub</span></h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Master-Detail Inventory & Asset Valuation</p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white rounded-xl flex items-center px-4 h-12 w-80 border border-slate-100 shadow-sm">
                   <Search className="h-4 w-4 text-slate-400 mr-2" />
                   <input 
                     type="text" 
                     placeholder="SEARCH SKU / BATCH..." 
                     className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase w-full placeholder:text-slate-300"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatMiniCard 
            label="Total SKU" 
            value={catalog?.length || 0} 
            icon={<Box className="text-blue-600" />} 
          />
          <StatMiniCard 
            label="Total Valuation" 
            value={`Rp ${(totalValuation / 1000000).toFixed(1)}M`} 
            icon={<BadgeDollarSign className="text-emerald-600" />} 
          />
          <StatMiniCard 
            label="Stok Kritis" 
            value={criticalItems} 
            icon={<AlertTriangle className="text-rose-600" />} 
            isAlert={criticalItems > 0}
          />
          <StatMiniCard 
            label="Storage Utility" 
            value={`${stats?.capacity?.utility || 0}%`} 
            icon={<TrendingDown className="text-slate-900" />} 
          />
        </div>
      </div>

      {/* MAIN GRID */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Material Identity</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Category</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Physical Stock</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Quarantine</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation (HPP)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                <TableHead className="pr-10 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-96 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredCatalog?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-96 text-center text-slate-300 font-bold uppercase text-xs italic tracking-widest">No materials found in catalog</TableCell>
                </TableRow>
              ) : (
                filteredCatalog?.map((item) => {
                  const hpp = item.valuations?.[0]?.movingAveragePrice || Number(item.unitPrice);
                  const isCritical = Number(item.stockQty) <= Number(item.minLevel);
                  const quarantineQty = item.inventories
                    .filter(inv => inv.qcStatus === 'QUARANTINE')
                    .reduce((sum, inv) => sum + Number(inv.currentStock), 0);

                  return (
                    <TableRow 
                      key={item.id} 
                      className="group hover:bg-blue-50/30 transition-all cursor-pointer border-b border-slate-50"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell className="py-6 pl-10">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm group-hover:scale-110 transition-transform",
                            isCritical ? "bg-rose-50 text-rose-600" : "bg-slate-900 text-white"
                          )}>
                            {item.code?.substring(0, 2) || 'MT'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 tracking-tight text-sm uppercase leading-tight">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-0.5">{item.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-black text-[9px] uppercase px-3 py-1 rounded-lg">
                          {item.category?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className={cn(
                             "font-black text-base tracking-tight",
                             isCritical ? "text-rose-600" : "text-slate-900"
                           )}>
                             {Number(item.stockQty).toLocaleString()}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className={cn(
                             "font-black text-sm tracking-tight",
                             quarantineQty > 0 ? "text-amber-600" : "text-slate-300"
                           )}>
                             {quarantineQty.toLocaleString()}
                           </span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">On Hold</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                           <p className="font-black text-slate-900 text-xs">Rp {hpp.toLocaleString()}</p>
                           <p className="text-[9px] font-black text-emerald-500 uppercase italic">Moving Avg</p>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              isCritical ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tight",
                              isCritical ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {isCritical ? 'RESTOCK NOW' : 'OPTIMAL'}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                         <div className="flex items-center justify-end group-hover:translate-x-1 transition-transform">
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600" />
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DETAIL SHEET */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="sm:max-w-[700px] border-none p-0 bg-white overflow-hidden flex flex-col">
          {selectedItem && (
            <>
              <div className="bg-slate-900 p-10 text-white relative">
                 <div className="flex items-start justify-between">
                    <div className="space-y-2">
                       <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase px-3 py-1 tracking-widest rounded-lg border-none mb-4">SKU PROTOCOL: {selectedItem.code}</Badge>
                       <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedItem.name}</SheetTitle>
                       <SheetDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">{selectedItem.category?.name} | {selectedItem.unit}</SheetDescription>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Asset Value</p>
                       <p className="text-3xl font-black italic tracking-tighter text-blue-500">
                          Rp {(Number(selectedItem.stockQty) * (selectedItem.valuations?.[0]?.movingAveragePrice || Number(selectedItem.unitPrice))).toLocaleString()}
                       </p>
                    </div>
                 </div>
                 <div className="absolute bottom-0 right-10 translate-y-1/2 flex gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 min-w-[150px]">
                       <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Box className="h-5 w-5 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Current Stock</p>
                          <p className="text-xl font-black text-slate-900">{Number(selectedItem.stockQty).toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-10 pt-16 overflow-y-auto">
                <Tabs defaultValue="identity" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/50 p-1 rounded-xl mb-10">
                    <TabsTrigger value="identity" className="rounded-lg font-black text-[10px] uppercase flex gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                      <Info className="h-3.5 w-3.5" /> Identity
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="rounded-lg font-black text-[10px] uppercase flex gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                      <Settings2 className="h-3.5 w-3.5" /> Logistics
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-black text-[10px] uppercase flex gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg">
                      <History className="h-3.5 w-3.5" /> Stock Card
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="identity" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <DetailSection title="Basic Attributes">
                        <div className="grid grid-cols-2 gap-8">
                           <DataField label="Material Type" value={selectedItem.type} />
                           <DataField label="Internal Code" value={selectedItem.code} />
                           <DataField label="Stock Unit" value={selectedItem.unit} />
                           <DataField label="Valuation Method" value="Moving Average" />
                        </div>
                     </DetailSection>
                     
                     <DetailSection title="Batch Distribution">
                        <div className="space-y-3">
                           {selectedItem.inventories.map((inv, idx) => (
                             <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                     "h-8 w-8 rounded-lg flex items-center justify-center",
                                     inv.qcStatus === 'GOOD' ? "bg-emerald-100" : "bg-amber-100"
                                   )}>
                                      <Box className={cn("h-4 w-4", inv.qcStatus === 'GOOD' ? "text-emerald-600" : "text-amber-600")} />
                                   </div>
                                   <p className="text-xs font-bold text-slate-700 uppercase">Internal Batch #{idx + 1}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                   <Badge className={cn("font-black text-[8px] uppercase tracking-widest", 
                                     inv.qcStatus === 'GOOD' ? "bg-emerald-500" : "bg-amber-500"
                                   )}>
                                      {inv.qcStatus}
                                   </Badge>
                                   <p className="text-sm font-black text-slate-900">{Number(inv.currentStock).toLocaleString()} {selectedItem.unit}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </DetailSection>
                  </TabsContent>

                  <TabsContent value="logistics" className="space-y-8">
                     <DetailSection title="Risk Control Parameters">
                        <div className="grid grid-cols-2 gap-8">
                           <DataField label="Safety Stock (Min)" value={`${selectedItem.minLevel} ${selectedItem.unit}`} isAlert={Number(selectedItem.stockQty) <= selectedItem.minLevel} />
                           <DataField label="Reorder Point" value={`${selectedItem.minLevel} ${selectedItem.unit}`} />
                           <DataField label="Lead Time" value="3 - 5 Days" />
                           <DataField label="Max Holding" value="72 Hours" />
                        </div>
                     </DetailSection>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-8">
                     <DetailSection title="Mutation Logs (Stock Card)">
                        <div className="space-y-4">
                           {isHistoryLoading ? (
                             <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 opacity-20" />
                           ) : history?.length === 0 ? (
                             <p className="text-center text-slate-400 text-xs font-bold uppercase italic py-10">No transaction history found</p>
                           ) : (
                             history.map((log: any) => (
                               <div key={log.id} className="flex items-center gap-6 p-4 border-b border-slate-50 group hover:bg-slate-50 transition-colors">
                                  <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                    ['INBOUND', 'ADJUSTMENT_IN'].includes(log.type) ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                  )}>
                                     {['INBOUND', 'ADJUSTMENT_IN'].includes(log.type) ? <TrendingDown className="h-5 w-5 rotate-180" /> : <TrendingDown className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-xs font-black text-slate-900 uppercase">{log.type.replace('_', ' ')}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(log.createdAt).toLocaleString()} • {log.referenceNo || 'NO_REF'}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className={cn(
                                       "text-sm font-black italic",
                                       ['INBOUND', 'ADJUSTMENT_IN'].includes(log.type) ? "text-emerald-600" : "text-rose-600"
                                     )}>
                                        {['INBOUND', 'ADJUSTMENT_IN'].includes(log.type) ? '+' : '-'}{Number(log.quantity).toLocaleString()}
                                     </p>
                                  </div>
                               </div>
                             ))
                           )}
                        </div>
                     </DetailSection>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <Button className="flex-1 h-12 bg-slate-900 hover:bg-black text-white font-black uppercase text-[11px] rounded-xl tracking-widest border-none">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Stock Adjustment
                 </Button>
                 <Button variant="outline" className="flex-1 h-12 bg-white border-slate-200 text-slate-900 font-black uppercase text-[11px] rounded-xl tracking-widest">
                    Generate Card Report
                 </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatMiniCard({ label, value, icon, isAlert = false }: { label: string; value: string | number; icon: any; isAlert?: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all duration-500 flex items-center gap-5",
      isAlert ? "bg-rose-50 border-rose-100 shadow-xl shadow-rose-100/20" : "bg-white border-slate-100 shadow-xl shadow-slate-100/50 hover:translate-y-[-4px]"
    )}>
      <div className={cn(
        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
        isAlert ? "bg-white" : "bg-slate-50"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className={cn(
          "text-2xl font-black tracking-tighter mt-0.5 italic leading-none",
          isAlert ? "text-rose-600" : "text-slate-900"
        )}>{value}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
         <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{title}</h3>
         <div className="h-px bg-slate-100 w-full" />
      </div>
      {children}
    </div>
  );
}

function DataField({ label, value, isAlert = false }: { label: string; value: string | number; isAlert?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">{label}</p>
      <p className={cn(
        "text-sm font-black uppercase italic tracking-tight",
        isAlert ? "text-rose-600" : "text-slate-900"
      )}>{value}</p>
    </div>
  );
}

