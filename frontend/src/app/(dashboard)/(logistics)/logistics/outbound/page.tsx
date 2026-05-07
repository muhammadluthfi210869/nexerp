"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Truck, 
  PackageCheck, 
  Search, 
  ArrowRight,
  ClipboardList,
  MapPin,
  ExternalLink,
  Zap,
  Box as BoxIcon,
  CheckCircle2,
  Filter,
  ShieldCheck,
  History,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LogisticsOutboundPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shippingData, setShippingData] = useState({
    courierName: "",
    trackingNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3002/logistics/deliverable", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to fetch deliverable orders");
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async () => {
    if (!shippingData.courierName || !shippingData.trackingNumber) {
      toast.error("Please fill all shipping details");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:3002/logistics/deliver/${selectedOrder.id}`, 
        shippingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order shipped successfully!");
      setIsModalOpen(false);
      setSelectedOrder(null);
      setShippingData({ courierName: "", trackingNumber: "" });
      fetchOrders();
    } catch (err) {
      toast.error("Failed to process shipment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.woNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.lead?.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 🚀 I. OUTBOUND COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">DISTRIBUTION SYNC ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">OUTBOUND <span className="text-slate-300">LOGISTICS HUB</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">FINAL FULFILLMENT & CARRIER INTEGRITY TERMINAL</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
              <Input 
                placeholder="SEARCH WO OR CLIENT..."
                className="h-14 w-64 pl-12 bg-slate-50 border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest italic"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Button variant="outline" className="h-14 px-6 border border-slate-100 bg-white text-brand-black rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-sm italic hover:bg-slate-50 transition-all">
              <History className="mr-2 h-4 w-4 text-orange-500" /> LOGS
           </Button>
        </div>
      </div>

      {/* 📊 II. FULFILLMENT METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <OutboundStatCard label="READY TO SHIP" value={orders.length.toString()} color="text-orange-600" icon={PackageCheck} />
         <OutboundStatCard label="TRANSIT INBOUND" value="24" color="text-blue-600" icon={Truck} />
         <OutboundStatCard label="VERIFIED (MTD)" value="142" color="text-brand-black" icon={CheckCircle2} />
      </div>

      {/* 📦 III. SHIPMENT REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. OUTBOUND SHIPMENT REGISTRY</h3>
        </div>
        
        {loading ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">SCANNING TERMINAL...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="bento-card overflow-hidden bg-white group hover:translate-y-[-5px] transition-all">
                <div className="bg-brand-black p-6 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
                      <span className="text-white text-[9px] font-black tracking-widest uppercase italic">FINISHED GOODS</span>
                   </div>
                   <span className="text-white/30 text-[9px] font-black uppercase italic">{order.woNumber}</span>
                </div>
                
                <div className="p-8 space-y-8">
                   <div>
                      <h3 className="text-2xl font-black text-brand-black uppercase italic leading-none tracking-tighter group-hover:text-orange-600 transition-colors">
                        {order.lead?.clientName}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">DOMESTIC FULFILLMENT HUB</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-brand-black transition-all">
                        <span className="text-slate-400 font-black uppercase text-[8px] tracking-widest group-hover:text-orange-500">TARGET VOL</span>
                        <span className="text-brand-black font-black text-lg italic group-hover:text-white tabular">
                          {order.targetQty} <span className="text-[9px] opacity-40 ml-1 uppercase">UNITS</span>
                        </span>
                      </div>
                   </div>

                   <Button 
                    className="w-full h-16 bg-brand-black hover:bg-orange-600 text-white rounded-2xl shadow-xl shadow-slate-100 transition-all font-black uppercase tracking-widest text-[10px] border-none italic"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsModalOpen(true);
                    }}
                  >
                    <Truck className="mr-2 h-4 w-4" /> VERIFY & SHIP
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
             <ClipboardList className="h-16 w-16 text-slate-200 mx-auto mb-6" />
             <h3 className="text-brand-black font-black uppercase text-sm tracking-widest italic">NO OUTBOUND TRAFFIC</h3>
             <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest mt-2">MONITOR PRODUCTION TERMINAL FOR PENDING CYCLES.</p>
          </div>
        )}
      </div>

      {/* 🛡️ IV. INTEGRITY PROTOCOL */}
      <Card className="bento-card bg-brand-black text-white p-12 relative overflow-hidden group rounded-[3rem]">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 flex items-center justify-center group-hover:rotate-6 transition-transform duration-700">
               <ShieldCheck className="h-16 w-16 text-orange-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter">DISTRIBUTION <span className="text-slate-500">INTEGRITY HUB</span></h4>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                  ENSURING 100% CARRIER COMPLIANCE AND PACKAGING QUALITY PRIOR TO FINAL DISPATCH AUTHORIZATION.
               </p>
               <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest">COURIER API SYNC</span>
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest">QC VERIFIED</span>
               </div>
            </div>
         </div>
         <Truck className="h-64 w-64 text-white/[0.02] absolute -right-16 -bottom-16 group-hover:scale-110 transition-transform duration-1000" />
      </Card>

      {/* Shipment Verification Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="bg-brand-black p-10 text-white relative">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">SHIPMENT <span className="text-slate-500">VERIFICATION</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">RECORDING DATA FOR {selectedOrder?.woNumber}</p>
            <Truck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
          </div>

          <div className="p-10 space-y-8">
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">COURIER SERVICE PROVIDER</label>
               <Input 
                 placeholder="E.G. FEDEX, DHL, JNE EXPRESS"
                 className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs"
                 value={shippingData.courierName}
                 onChange={(e) => setShippingData({...shippingData, courierName: e.target.value})}
               />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AWB / TRACKING PROTOCOL ID</label>
               <Input 
                 placeholder="REFERENCE REGISTRY ID..."
                 className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs"
                 value={shippingData.trackingNumber}
                 onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})}
               />
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-6 items-center">
              <div className="h-14 w-14 bg-brand-black rounded-xl flex items-center justify-center shadow-lg">
                <BoxIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CONSIGNEE TARGET</p>
                <p className="text-lg font-black text-brand-black uppercase italic leading-none">{selectedOrder?.lead?.clientName}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
               <Button variant="ghost" className="h-14 px-8 font-black uppercase tracking-widest text-[9px]" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
               <Button 
                className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                disabled={submitting}
                onClick={handleShip}
              >
                {submitting ? "PROCESSING..." : "CONFIRM SHIPMENT PROTOCOL"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutboundStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-orange-500 transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}



