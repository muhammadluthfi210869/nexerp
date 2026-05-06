"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  Clock, 
  AlertCircle,
  Plus
} from "lucide-react";
import { Lead, Activity } from "@/types";

export function LeadBoard() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("CHAT");

  // Fetch Leads
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get("/leads");
      return res.data;
    }
  });

  // Mutation for adding activity
  const activityMutation = useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      return api.post("/leads/activity", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Activity logged successfully.");
      setActivityNote("");
    },
    onError: () => {
      toast.error("Failed to log activity.");
    }
  });

  const handleAddActivity = () => {
    if (!activityNote || !selectedLead) return;
    activityMutation.mutate({
      lead_id: selectedLead.id,
      activity_type: activityType,
      notes: activityNote
    });
  };

  const statuses = ["NEW", "CONTACTED", "SAMPLE", "NEGO", "CLOSED_DEAL", "LOST_DEAL"];

  if (isLoading) return <div className="p-8 text-zinc-500 animate-pulse">Synchronizing Commercial Stream...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <h3 className="text-xl font-bold text-white tracking-tight italic uppercase italic">Lead Pipeline</h3>
           <Badge variant="info" className="px-3 py-1 uppercase tracking-tight text-[10px]">
             Total: {leads?.length || 0}
           </Badge>
        </div>
        <Button 
          className="bg-white text-black hover:bg-emerald-500 hover:text-white font-black uppercase text-[10px] tracking-tight h-8"
          onClick={() => {
             api.post("/leads", {
                client_name: `Automated Lead ${Date.now().toString().slice(-6)}`,
                phone_number: "081234567890",
                city: "Jakarta",
                source_id: "TIKTOK"
             }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["leads"] });
                toast.success("New Client Vector synchronized.");
             });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Quick Add Vector
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
        {statuses.map(status => (
          <div key={status} className="w-80 shrink-0 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{status}</span>
              <span className="text-[10px] font-sans text-zinc-700">
                {leads?.filter((l: Lead) => l.status === status).length || 0}
              </span>
            </div>

            <div className="min-h-[500px] rounded-lg bg-zinc-900/30 p-2 border border-zinc-800/50 space-y-3">
              {leads?.filter((l: Lead) => l.status === status).map((lead: Lead) => (
                <div 
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
                  className={`group relative rounded-md bg-zinc-950 p-4 border transition-all cursor-pointer hover:border-zinc-700 shadow-lg ${lead.is_sla_warning ? 'border-red-900/50 shadow-red-950/20' : 'border-zinc-800'}`}
                >
                  {lead.is_sla_warning && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge variant="critical" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        <AlertCircle className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-white truncate w-40">{lead.client_name}</p>
                    <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 px-1.5 py-0">
                      {lead.source_id}
                    </Badge>
                  </div>

                  <div className="flex items-center text-[10px] text-zinc-500 mb-3">
                    <Clock className="mr-1 h-3 w-3" />
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-900/50">
                    <div className="flex -space-x-1">
                       <div className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[8px] text-zinc-400">
                          {lead.bd?.full_name?.charAt(0) || "B"}
                       </div>
                    </div>
                    {lead.is_high_value && (
                      <Badge variant="success" className="text-[8px] px-1 py-0">HIGH VALUE</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {leads?.filter((l: Lead) => l.status === status).length === 0 && (
                <div className="flex flex-col items-center justify-center h-20 text-zinc-800 border-2 border-dashed border-zinc-800/30 rounded-md">
                   <Plus className="h-4 w-4 mb-1" />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">Empty Vector</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* LEAD DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center">
              {selectedLead?.client_name}
              {selectedLead?.is_sla_warning && <Badge variant="critical" className="ml-3 uppercase text-[10px]">SLA WARNING</Badge>}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Assigned to: {selectedLead?.bd?.full_name} | Channel: {selectedLead?.source_id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Contact Information</Label>
                <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800">
                  <p className="text-sm font-sans text-emerald-500 flex items-center">
                    <Phone className="mr-2 h-4 w-4" /> {selectedLead?.phone_number}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tighter">{selectedLead?.city}</p>
                </div>
              </div>

              <div>
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Add Activity Log</Label>
                <div className="mt-2 space-y-2">
                   <Select value={activityType} onValueChange={(val) => val && setActivityType(val)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                        <SelectValue placeholder="Activity Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="CHAT">CHAT / WHATSAPP</SelectItem>
                        <SelectItem value="CALL">PHONE CALL</SelectItem>
                        <SelectItem value="MEETING">MEETING</SelectItem>
                        <SelectItem value="SAMPLE_SENT">SAMPLE SENT</SelectItem>
                      </SelectContent>
                   </Select>
                   <Textarea 
                      placeholder="Enter interaction notes..." 
                      className="text-xs h-24"
                      value={activityNote}
                      onChange={(e) => setActivityNote(e.target.value)}
                   />
                   <Button 
                      className="w-full bg-white text-black hover:bg-zinc-200 h-8 text-xs font-bold"
                      onClick={handleAddActivity}
                      disabled={activityMutation.isPending}
                   >
                     {activityMutation.isPending ? "LOGGING..." : "LOG ACTIVITY"}
                   </Button>
                </div>
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-6 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Interaction History</Label>
              <div className="space-y-4">
                {selectedLead?.activities && selectedLead.activities.length > 0 ? (
                  [...selectedLead.activities].sort((a: Activity, b: Activity) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((act: Activity) => (
                    <div key={act.id} className="relative pl-4 border-l-2 border-zinc-800 py-1">
                      <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-zinc-700" />
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-zinc-400">{act.activity_type}</span>
                         <span className="text-[8px] text-zinc-600 font-sans">
                            {new Date(act.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{act.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-700 italic">No activity logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-900/50 pt-4 flex items-center justify-between">
            <Button 
               className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold uppercase text-[10px] tracking-tight h-8"
               onClick={() => {
                  if (!selectedLead) return;
                  api.post("/rnd/npf", {
                     lead_id: selectedLead.id,
                     product_name: `Automated Test Product - ${selectedLead.client_name}`,
                     target_price: 15.00
                  }).then(() => {
                     toast.success("NPF request dispatched to R&D Lab.");
                  });
               }}
            >
               Initiate R&D Vector (NPF)
            </Button>
            <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => setIsDetailOpen(false)}>
              Close Terminal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

