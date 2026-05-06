"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Edit2, Trash2, Search, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function MarketingLogManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ads" | "organic">("ads");
  const [search, setSearch] = useState("");

  // Queries
  const { data: adsLogs, isLoading: loadingAds } = useQuery({
    queryKey: ["marketing-logs-ads"],
    queryFn: async () => {
      const res = await api.get("/marketing/logs/ads");
      return res.data;
    }
  });

  const { data: organicLogs, isLoading: loadingOrganic } = useQuery({
    queryKey: ["marketing-logs-organic"],
    queryFn: async () => {
      const res = await api.get("/marketing/logs/organic");
      return res.data;
    }
  });

  // Mutations
  const deleteAds = useMutation({
    mutationFn: (id: string) => api.delete(`/marketing/ads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-logs-ads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-analytics"] });
      toast.success("Ads entry deleted successfully");
    }
  });

  const deleteOrganic = useMutation({
    mutationFn: (id: string) => api.delete(`/marketing/organic/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-logs-organic"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-analytics"] });
      toast.success("Organic entry deleted successfully");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("ads")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "ads" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Ads Metrics
          </button>
          <button 
            onClick={() => setActiveTab("organic")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "organic" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Organic Logs
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search campaign or platform..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-2xl text-xs font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {activeTab === "ads" ? (
        <AdsTable 
          data={(adsLogs || [])?.filter((item: any) => 
            (item.platform?.toLowerCase() || "").includes(search.toLowerCase()) || 
            (item.campaignName?.toLowerCase() || "").includes(search.toLowerCase())
          )} 
          isLoading={loadingAds}
          onDelete={(id) => deleteAds.mutate(id)}
        />
      ) : (
        <OrganicTable 
          data={(organicLogs || [])?.filter((item: any) => 
            (item.platform?.toLowerCase() || "").includes(search.toLowerCase())
          )} 
          isLoading={loadingOrganic}
          onDelete={(id) => deleteOrganic.mutate(id)}
        />
      )}
    </div>
  );
}

function AdsTable({ data, isLoading, onDelete }: { data: any[], isLoading: boolean, onDelete: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);

  const updateAds = useMutation({
    mutationFn: (payload: any) => api.patch(`/marketing/ads/${editingItem.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-logs-ads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-analytics"] });
      toast.success("Ads entry updated");
      setEditingItem(null);
    }
  });

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const isAuditor = user.role === "FINANCE" || user.role === "SUPER_ADMIN";

  const auditAds = useMutation({
    mutationFn: (payload: { id: string, isAudited: boolean }) => 
      api.post(`/marketing/audit-ads?userId=${user.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-logs-ads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-analytics"] });
      toast.success("Audit status updated");
    }
  });

  if (isLoading) return <div className="h-64 flex items-center justify-center text-slate-400 font-black uppercase tracking-tight text-xs">Synchronizing Matrix...</div>;

  return (
    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-none">
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 pl-8">Date</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Platform</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Spend</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-center">Leads</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-center">Audit</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-right pr-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
              <TableCell className="text-xs font-bold text-slate-600 py-4 pl-8">
                {item.date ? format(new Date(item.date), "dd MMM yyyy") : "No Date"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.platform}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{item.campaignName || "General"}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs font-black text-slate-900">{formatCurrency(Number(item.spend))}</TableCell>
              <TableCell className="text-xs font-black text-blue-600 text-center">{item.leadsGenerated}</TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${item.isAudited ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                     {item.isAudited ? "Verified" : "Pending"}
                   </span>
                   {isAuditor && !item.isAudited && (
                      <button 
                        onClick={() => auditAds.mutate({ id: item.id, isAudited: true })}
                        className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                      >
                        Verify Now
                      </button>
                   )}
                </div>
              </TableCell>
              <TableCell className="text-right pr-8">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this log? This will affect your MTD Analytics.")) {
                        onDelete(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[40px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white">
          <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
               <Edit2 size={160} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                    <Edit2 className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Campaign Modification</span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none">
                EDIT <span className="text-blue-500">ADS LOG</span>
              </DialogTitle>
              <p className="text-xs font-medium text-slate-400 italic">Modify performance metrics for precision intelligence.</p>
            </div>
          </div>

          {editingItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateAds.mutate({
                spend: formData.get("spend"),
                leadsGenerated: formData.get("leads"),
                campaignName: formData.get("campaign"),
                impressions: formData.get("impressions"),
                clicks: formData.get("clicks"),
                reach: formData.get("reach")
              });
            }} className="p-10 space-y-8">
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Campaign Identity</Label>
                <Input 
                  name="campaign" 
                  defaultValue={editingItem.campaignName} 
                  placeholder="e.g. Nex Serum Launch"
                  className="h-16 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-xl px-8 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 placeholder:text-slate-300" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 text-blue-600">Daily Spend</Label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                    <Input 
                      name="spend" 
                      type="number" 
                      defaultValue={Number(editingItem.spend)} 
                      className="h-16 pl-14 bg-blue-50 border-2 border-blue-100 rounded-[24px] font-black text-2xl text-blue-900 focus:ring-4 focus:ring-blue-100 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 text-emerald-600">Leads Generated</Label>
                  <Input 
                    name="leads" 
                    type="number" 
                    defaultValue={editingItem.leadsGenerated} 
                    className="h-16 bg-emerald-50 border-2 border-emerald-100 rounded-[24px] font-black text-center text-3xl text-emerald-900 focus:ring-4 focus:ring-emerald-100 transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Impressions</Label>
                   <Input name="impressions" type="number" defaultValue={editingItem.impressions} className="h-12 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-slate-900" />
                </div>
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Clicks</Label>
                   <Input name="clicks" type="number" defaultValue={editingItem.clicks} className="h-12 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-slate-900" />
                </div>
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Reach</Label>
                   <Input name="reach" type="number" defaultValue={editingItem.reach} className="h-12 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-slate-900" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditingItem(null)} 
                  className="flex-1 h-16 rounded-[24px] font-black uppercase text-xs tracking-tight hover:bg-slate-100"
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="flex-[2] h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black uppercase text-xs tracking-tight shadow-2xl shadow-blue-200"
                >
                  Commit Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrganicTable({ data, isLoading, onDelete }: { data: any[], isLoading: boolean, onDelete: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);

  const updateOrganic = useMutation({
    mutationFn: (payload: any) => api.patch(`/marketing/organic/${editingItem.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-logs-organic"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-analytics"] });
      toast.success("Organic log updated");
      setEditingItem(null);
    }
  });

  if (isLoading) return <div className="h-64 flex items-center justify-center text-slate-400 font-black uppercase tracking-tight text-xs">Analyzing Vitality Matrix...</div>;

  return (
    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-none">
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 pl-8">Period</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Platform</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-center">Followers</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-center">Posts</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-right pr-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
              <TableCell className="text-xs font-bold text-slate-600 py-4 pl-8">
                W{item.weekNumber}, {item.year}
              </TableCell>
              <TableCell className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.platform}</TableCell>
              <TableCell className="text-xs font-black text-slate-900 text-center">{formatNumber(item.totalFollowers)}</TableCell>
              <TableCell className="text-xs font-black text-blue-600 text-center">{item.postsCount}</TableCell>
              <TableCell className="text-right pr-8">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this organic log?")) {
                        onDelete(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[40px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white">
          <div className="bg-[#0D2E24] p-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
               <TrendingUp size={160} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
                    <Edit2 className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Vitality Correction</span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none">
                EDIT <span className="text-emerald-500">ORGANIC LOG</span>
              </DialogTitle>
              <p className="text-xs font-medium text-slate-400 italic">Adjust social growth metrics to maintain data integrity.</p>
            </div>
          </div>

          {editingItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateOrganic.mutate({
                totalFollowers: formData.get("followers"),
                postsCount: formData.get("posts"),
                totalReach: formData.get("reach"),
                followerGrowth: formData.get("growth"),
                unfollows: formData.get("unfollows"),
              });
            }} className="p-10 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 text-emerald-600">Total Followers</Label>
                  <Input 
                    name="followers" 
                    type="number" 
                    defaultValue={editingItem.totalFollowers} 
                    className="h-16 bg-emerald-50 border-2 border-emerald-100 rounded-[24px] font-black text-center text-3xl text-emerald-900" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1 text-blue-600">Total Reach</Label>
                  <Input 
                    name="reach" 
                    type="number" 
                    defaultValue={editingItem.totalReach} 
                    className="h-16 bg-blue-50 border-2 border-blue-100 rounded-[24px] font-black text-center text-3xl text-blue-900" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Posts</Label>
                   <Input name="posts" type="number" defaultValue={editingItem.postsCount} className="h-12 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center text-slate-900" />
                </div>
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Growth (+)</Label>
                   <Input name="growth" type="number" defaultValue={editingItem.followerGrowth} className="h-12 bg-emerald-50 text-emerald-900 border-2 border-emerald-100 rounded-xl font-black text-center" />
                </div>
                <div className="space-y-3">
                   <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tight text-center block">Unfollows (-)</Label>
                   <Input name="unfollows" type="number" defaultValue={editingItem.unfollows} className="h-12 bg-rose-50 text-rose-900 border-2 border-rose-100 rounded-xl font-black text-center" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditingItem(null)} 
                  className="flex-1 h-16 rounded-[24px] font-black uppercase text-xs tracking-tight hover:bg-slate-100"
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black uppercase text-xs tracking-tight shadow-2xl shadow-emerald-200"
                >
                  Update Vitality
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

