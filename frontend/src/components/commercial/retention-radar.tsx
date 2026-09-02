"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Radar, 
  MessageCircle, 
  AlertCircle, 
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface RetentionItem {
  id: string;
  lead_id: string;
  est_depletion_date: string;
  lead: {
    client_name: string;
    phone_number: string;
  };
}

export function RetentionRadar() {
  const { data: radarItems, isLoading } = useQuery<RetentionItem[]>({
    queryKey: ["retention-radar"],
    queryFn: async () => {
      const res = await api.get("/commercial/retention/radar");
      return res.data;
    }
  });

  return (
    <Card className="border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden group">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
        <CardTitle className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center">
          <Radar className="mr-3 h-5 w-5 text-blue-500 group-hover:animate-ping" />
          RETENTION RADAR
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Predictive Repeat Order Feed</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {radarItems?.map(item => {
           const depletionDate = new Date(item.est_depletion_date);
           const today = new Date();
           const diffDays = Math.ceil((depletionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
           
           return (
             <div key={item.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm hover:border-blue-500 transition-all">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-black text-white italic uppercase tracking-tighter">{item.lead.client_name}</p>
                   <Badge className={`text-[8px] font-black uppercase rounded-none px-1 h-4 ${
                      diffDays <= 7 ? "bg-red-500 text-black border-none" : "bg-blue-500 text-black border-none"
                   }`}>
                      {diffDays <= 0 ? "EXPIRED" : `H-${diffDays}`}
                   </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-sans mb-3">
                   <Calendar className="h-3 w-3" />
                   {depletionDate.toLocaleDateString()}
                </div>
                <Button 
                   size="sm" 
                   className="w-full bg-emerald-500 text-black hover:bg-white text-[10px] font-black uppercase h-8 transition-colors flex items-center justify-center gap-2"
                   onClick={() => window.open(`https://wa.me/${item.lead.phone_number}`, "_blank")}
                >
                   <MessageCircle className="h-4 w-4" /> FOLLOW UP WA
                </Button>
             </div>
           );
        })}
        
        {(!radarItems || radarItems.length === 0) && !isLoading && (
           <div className="py-10 flex flex-col items-center justify-center opacity-20 bg-zinc-900/10 border-2 border-dashed border-zinc-900 rounded-none h-[150px]">
              <AlertCircle className="h-10 w-10 text-zinc-800 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-tight text-zinc-800 italic">No Depletion Threats</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}

