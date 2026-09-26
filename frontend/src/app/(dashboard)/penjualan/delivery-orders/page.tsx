"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Boxes,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dna";
import { 
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton, 
  DnaInput, 
  DnaBadge,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaCell,
  useDnaToast
} from "@/components/dna";
import { FinalDocumentPdfButton } from "@/components/documents/FinalDocumentPdfButton";

export default function DeliveryOrdersPage() {
  const queryClient = useQueryClient();
  const toast = useDnaToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shippingDate, setShippingDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSoId, setSelectedSoId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [carrier, setCarrier] = useState("INTERNAL");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data: deliveryOrders = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["fulfillment-shipments"],
    queryFn: async () => {
      const resp = await api.get("/fulfillment/shipments");
      return (resp.data || []).map((s: any) => ({
        id: s.id,
        trackingNo: s.trackingNo || s.id.slice(0, 8),
        client: s.salesOrder?.lead?.clientName || s.client || "CUSTOMER",
        origin: s.origin || "MAIN WAREHOUSE",
        destination: s.destination || "DESTINATION",
        date: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: s.status || "AWAITING_FLEET",
        priority: s.priority || "NORMAL",
        carrier: s.carrier || "INTERNAL",
        salesOrderId: s.salesOrderId,
      }));
    }
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders-dropdown"],
    queryFn: async () => {
      try {
        const resp = await api.get("/commercial/sales-orders");
        return resp.data || [];
      } catch {
        return [];
      }
    }
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/fulfillment/shipments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      toast.success("Delivery Order Dibuat", "Manifest pengiriman berhasil diotorisasi.");
      setIsCreateOpen(false);
      setRecipientName("");
      setShippingAddress("");
      setTrackingNumber("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal membuat Delivery Order";
      toast.error("Validasi Gagal", msg);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/fulfillment/shipments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-shipments"] });
      toast.success("Status Diperbarui", "Status pengiriman berhasil diubah.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mengubah status pengiriman";
      toast.error("Operasi Gagal", msg);
    }
  });

  const handleCreateDO = () => {
    const soId = selectedSoId || (salesOrders[0]?.id ?? "00000000-0000-0000-0000-000000000001");
    createShipmentMutation.mutate({
      salesOrderId: soId,
      origin: "MAIN WAREHOUSE",
      destination: shippingAddress || "Customer Warehouse",
      carrier,
      trackingNo: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      notes: `Consignee: ${recipientName}`,
    });
  };

  const awaitingFleetCount = deliveryOrders.filter((d: any) => d.status === "AWAITING_FLEET" || d.status === "DRAFT").length;
  const inPreparationCount = deliveryOrders.filter((d: any) => d.status === "IN_PREPARATION").length;
  const readyLoadingCount = deliveryOrders.filter((d: any) => d.status === "CONFIRMED" || d.status === "READY").length;
  const shippedCount = deliveryOrders.filter((d: any) => d.status === "SHIPPED" || d.status === "DELIVERED" || d.status === "DISPATCHED").length;

  const filteredOrders = deliveryOrders.filter((d: any) => 
    d.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Surat Jalan & Delivery Orders (DO)"
        subtitle="Shipment Planning & Dispatch Authorization Hub"
        badgeText="Penjualan & Logistik"
        actionButtons={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <DnaButton variant="primary" className="h-9 px-4 text-xs font-semibold">
                <Plus className="mr-1.5 h-4 w-4" /> Buat DO Baru
              </DnaButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-white rounded-2xl border border-slate-200 shadow-xl p-0 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white relative">
                <h2 className="text-xl font-bold uppercase tracking-tight">Otorisasi Manifest Pengiriman</h2>
                <p className="text-slate-400 text-xs mt-1">Logistics Dispatch Protocol</p>
                <Truck className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 text-white/10" />
              </div>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Tanggal Kirim</label>
                    <DnaInput type="date" value={shippingDate} onChange={(e) => setShippingDate(e.target.value)} className="h-10 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Sumber Sales Order (SO)</label>
                    <Select value={selectedSoId} onValueChange={(val) => setSelectedSoId(val || "")}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Pilih SO..." />
                      </SelectTrigger>
                      <SelectContent>
                        {salesOrders.map((so: any) => (
                          <SelectItem key={so.id} value={so.id}>
                            {so.orderNumber} ({so.lead?.clientName || "Customer"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Penerima / Klien</label>
                  <DnaInput value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nama Penerima..." className="h-10 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Alamat Pengiriman</label>
                  <DnaInput value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Alamat Lengkap Pengiriman..." className="h-10 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Ekspedisi / Armada</label>
                    <Select value={carrier} onValueChange={(val) => setCarrier(val || "")}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Pilih Armada..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JNE">JNE EXPRESS</SelectItem>
                        <SelectItem value="JNT">J&T CARGO</SelectItem>
                        <SelectItem value="SICEPAT">SICEPAT</SelectItem>
                        <SelectItem value="INTERNAL">INTERNAL FLEET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Nomor Resi / Tracking</label>
                    <DnaInput value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Nomor Resi..." className="h-10 text-xs" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <DnaButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Batal</DnaButton>
                  <DnaButton variant="primary" onClick={handleCreateDO} disabled={createShipmentMutation.isPending}>
                    {createShipmentMutation.isPending ? "Menyimpan..." : "Otorisasi Kirim"}
                  </DnaButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard label="Awaiting Fleet" value={String(awaitingFleetCount)} icon={<Truck className="text-amber-500" />} />
        <DnaStatCard label="In Preparation" value={String(inPreparationCount)} icon={<Clock className="text-blue-500" />} />
        <DnaStatCard label="Ready for Loading" value={String(readyLoadingCount)} icon={<Boxes className="text-purple-500" />} />
        <DnaStatCard label="Total Shipped (MTD)" value={String(shippedCount)} icon={<CheckCircle2 className="text-emerald-500" />} />
      </DnaKpiGrid>

      {/* Table */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Delivery Orders"
          message={(error as any)?.message || "Terjadi kesalahan saat memuat data pengiriman."}
          onRetry={() => refetch()}
        />
      ) : filteredOrders.length === 0 ? (
        <DnaEmptyState
          title="Belum Ada Delivery Order"
          description="Tidak ada catatan pengiriman (Surat Jalan/DO) aktif saat ini."
          actionButton={
            <DnaButton variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Buat DO Baru
            </DnaButton>
          }
        />
      ) : (
        <DnaDataTableCard
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari nomor DO, klien, tujuan..."
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[160px]">No. Surat Jalan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Klien / Penerima</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Asal Gudang</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[200px]">Tujuan Pengiriman</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px]">Armada</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-center">Status</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[180px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredOrders.map((doOrder: any) => (
                  <DnaTableRow key={doOrder.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                    <DnaTd className="px-4 py-2.5">
                      <DnaCell.Code code={doOrder.trackingNo || doOrder.id} />
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <DnaCell.Text text={doOrder.date} />
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{doOrder.client}</span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[12px] font-medium text-slate-700">{doOrder.origin}</span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{doOrder.destination}</span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {doOrder.carrier}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5 text-center">
                      <DnaBadge variant={doOrder.status === 'SHIPPED' || doOrder.status === 'DELIVERED' ? "success" : doOrder.status === 'AWAITING_FLEET' ? "warning" : "default"}>
                        {doOrder.status.replace(/_/g, ' ')}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="pr-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <FinalDocumentPdfButton
                          documentType="DELIVERY_ORDER"
                          documentNumber={doOrder.trackingNo || doOrder.id}
                          data={{
                            clientName: doOrder.client,
                            shippingAddress: doOrder.destination,
                            shipDate: doOrder.date,
                            items: doOrder.items || [],
                            notes: `Delivery Order ${doOrder.trackingNo || doOrder.id}`,
                          }}
                          label="PDF"
                        />
                        {doOrder.status === 'AWAITING_FLEET' && (
                          <DnaButton
                            variant="secondary"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => updateStatusMutation.mutate({ id: doOrder.id, status: "DISPATCHED" })}
                          >
                            Assign Fleet
                          </DnaButton>
                        )}
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}
    </DnaPageContainer>
  );
}
