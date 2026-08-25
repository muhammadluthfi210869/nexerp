"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Truck,
  PackageCheck,
  Search,
  ClipboardList,
  MapPin,
  Zap,
  Box as BoxIcon,
  CheckCircle2,
  ShieldCheck,
  History
} from "lucide-react";
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalField,
  OperationalInput,
} from "@/components/operational/OperationalUI";
import { DnaButton } from "@/components/dna";

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
    <OperationalMigrationShell
      title="OUTBOUND LOGISTICS HUB"
      subtitle="Final Fulfillment & Carrier Integrity Terminal"
      actions={
         <button type="button" className="operational-button is-secondary">
            <History className="h-4 w-4" />
            <span>Logs</span>
         </button>
      }
      filters={
        <div className="w-full lg:w-[400px]">
          <OperationalInput
            icon={<Search className="h-4 w-4" />}
            placeholder="Search WO or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
    >

      {/* Fulfillment Metrics */}
      <OperationalMetricGrid>
        <OperationalMetricCard
          label="Ready to Ship"
          value={orders.length}
          icon={<PackageCheck className="h-4 w-4" />}
          tone="blue"
        />
        <OperationalMetricCard
          label="Transit Inbound"
          value="24"
          icon={<Truck className="h-4 w-4" />}
          tone="amber"
        />
        <OperationalMetricCard
          label="Verified (MTD)"
          value="142"
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="green"
        />
      </OperationalMetricGrid>

      {/* Shipment Registry (specialized workflow grid - preserved implementation) */}
      <section className="operational-panel space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-slate-900 rounded-full" />
          <h3 className="text-[13px] font-semibold text-slate-900">Outbound Shipment Registry</h3>
        </div>

        {loading ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-100">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-[11px] text-slate-400 animate-pulse">Scanning Terminal...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-900 p-6 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-white text-[10px] font-semibold tracking-widest">FINISHED GOODS</span>
                   </div>
                   <span className="text-white/30 text-[10px] font-semibold">{order.woNumber}</span>
                </div>

                <div className="p-8 space-y-8">
                   <div>
                      <h3 className="text-2xl font-semibold text-slate-900 leading-none">
                        {order.lead?.clientName}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px] font-semibold tracking-widest">DOMESTIC FULFILLMENT HUB</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-semibold text-[10px] tracking-widest">TARGET VOL</span>
                        <span className="text-slate-900 font-semibold text-lg tabular-nums">
                          {order.targetQty} <span className="text-[10px] opacity-40 ml-1">UNITS</span>
                        </span>
                      </div>
                   </div>

                   <button
                     type="button"
                     className="operational-button is-secondary w-full"
                     onClick={() => {
                       setSelectedOrder(order);
                       setIsModalOpen(true);
                     }}
                   >
                     <Truck className="h-4 w-4" />
                     <span>Verify & Ship</span>
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <ClipboardList className="h-16 w-16 text-slate-200 mx-auto mb-6" />
             <h3 className="text-slate-900 font-semibold text-sm tracking-widest">NO OUTBOUND TRAFFIC</h3>
             <p className="text-slate-400 font-semibold text-[10px] tracking-widest mt-2">Monitor production terminal for pending cycles.</p>
          </div>
        )}
      </section>

      {/* Integrity Protocol (specialized callout - preserved) */}
      <section className="operational-panel bg-slate-900 text-white p-12 relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center">
               <ShieldCheck className="h-16 w-16 text-amber-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-3xl font-semibold tracking-tight">DISTRIBUTION <span className="text-slate-500">INTEGRITY HUB</span></h4>
               <p className="text-[11px] text-slate-500 tracking-widest mt-2 leading-relaxed max-w-2xl">
                  Ensuring 100% carrier compliance and packaging quality prior to final dispatch authorization.
               </p>
               <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-semibold text-[10px] tracking-widest">COURIER API SYNC</span>
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-semibold text-[10px] tracking-widest">QC VERIFIED</span>
               </div>
            </div>
         </div>
         <Truck className="h-64 w-64 text-white/[0.02] absolute -right-16 -bottom-16" />
      </section>

      {/* Shipment Verification Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-10 text-white relative">
            <h2 className="text-3xl font-semibold tracking-tight">SHIPMENT <span className="text-slate-500">VERIFICATION</span></h2>
            <p className="text-slate-400 text-[10px] tracking-widest mt-2">Recording data for {selectedOrder?.woNumber}</p>
            <Truck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
          </div>

          <div className="p-10 space-y-8">
            <OperationalField label="Courier Service Provider">
              <input
                type="text"
                placeholder="E.G. FEDEX, DHL, JNE EXPRESS"
                className="h-14 w-full bg-slate-50 border border-slate-200 rounded-md font-semibold px-4 text-[12px]"
                value={shippingData.courierName}
                onChange={(e) => setShippingData({...shippingData, courierName: e.target.value})}
              />
            </OperationalField>
            <OperationalField label="AWB / Tracking Protocol ID">
              <input
                type="text"
                placeholder="Reference Registry ID..."
                className="h-14 w-full bg-slate-50 border border-slate-200 rounded-md font-semibold px-4 text-[12px]"
                value={shippingData.trackingNumber}
                onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})}
              />
            </OperationalField>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-6 items-center">
              <div className="h-14 w-14 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <BoxIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 tracking-widest mb-1">CONSIGNEE TARGET</p>
                <p className="text-lg font-semibold text-slate-900 leading-none">{selectedOrder?.lead?.clientName}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" className="operational-button is-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button
                 type="button"
                 className="operational-button is-primary flex-1"
                 disabled={submitting}
                 onClick={handleShip}
               >
                 {submitting ? "Processing..." : "Confirm Shipment Protocol"}
               </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
