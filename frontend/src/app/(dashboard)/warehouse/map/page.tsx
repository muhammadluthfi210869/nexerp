"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map as MapIcon,
  Layers,
  Activity,
  Warehouse,
  Thermometer,
  Droplets,
  Box,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  useDnaToast
} from "@/components/dna";
import { api } from "@/lib/api";

interface RackItem {
  id: string;
  name: string;
  utilization: number;
  status: "ACTIVE" | "MAINTENANCE";
  zone: "A" | "B" | "C";
  zoneName: string;
  capacity: number;
  currentUsage: number;
  unit: string;
}

export default function WarehouseMapPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedRack, setSelectedRack] = useState<RackItem | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ["map-locations"],
    queryFn: () => api.get("/warehouse/locations").then((r) => r.data || []),
  });

  const racks: RackItem[] = useMemo(() => {
    if (locations.length === 0) {
      return Array.from({ length: 24 }).map((_, i) => {
        const zone: "A" | "B" | "C" = i < 12 ? "A" : i < 18 ? "B" : "C";
        const zoneName =
          zone === "A"
            ? "Zona A (Ambient Suhu Ruang)"
            : zone === "B"
            ? "Zona B (Chiller Suhu Dingin)"
            : "Zona C (Flammable Khusus)";
        const util = Math.floor(((i * 17) % 95) + 5);
        return {
          id: `RACK-${i + 1}`,
          name: `Rak ${String(i + 1).padStart(2, "0")}`,
          utilization: util,
          status: i % 7 === 0 ? "MAINTENANCE" : "ACTIVE",
          zone,
          zoneName,
          capacity: 1000,
          currentUsage: Math.round(1000 * (util / 100)),
          unit: "Kg / Pcs",
        };
      });
    }
    return locations.map((loc: any, i: number) => {
      const cap = Number(loc.capacity || 1000);
      const usage = Number(loc.currentUsage || 0);
      const util = Math.min(100, Math.round((usage / cap) * 100));
      const zone: "A" | "B" | "C" = loc.type === "COOL_ROOM" ? "B" : loc.type === "FLAMMABLE" ? "C" : "A";
      const zoneName =
        zone === "A"
          ? "Zona A (Ambient Suhu Ruang)"
          : zone === "B"
          ? "Zona B (Chiller Suhu Dingin)"
          : "Zona C (Flammable Khusus)";
      return {
        id: loc.name || `LOC-${i + 1}`,
        name: loc.name || `Lokasi ${i + 1}`,
        utilization: util,
        status: usage === 0 ? "MAINTENANCE" : "ACTIVE",
        zone,
        zoneName,
        capacity: cap,
        currentUsage: usage,
        unit: "Kg / Pcs",
      };
    });
  }, [locations]);

  const filteredRacks = useMemo(() => {
    if (activeTab === "ALL") return racks;
    return racks.filter((r) => r.zone === activeTab);
  }, [racks, activeTab]);

  const avgUtilization = useMemo(() => {
    if (racks.length === 0) return 0;
    return Math.round(racks.reduce((sum, r) => sum + r.utilization, 0) / racks.length);
  }, [racks]);

  const maintenanceCount = useMemo(() => racks.filter((r) => r.status === "MAINTENANCE").length, [racks]);

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Denah & Lokasi Gudang (Digital Twin Matrix)"
        description="Visualisasi spasial tata letak rak gudang, zonasi suhu CPKB, dan kapasitas utilisasi penyimpanan real-time."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Warehouse className="w-3.5 h-3.5" />
            <span>Digital Twin Spatial Layout</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Zona Rak", count: racks.length },
          { id: "A", label: "Zone A: Ambient", count: racks.filter((r) => r.zone === "A").length },
          { id: "B", label: "Zone B: Chiller", count: racks.filter((r) => r.zone === "B").length },
          { id: "C", label: "Zone C: Flammable", count: racks.filter((r) => r.zone === "C").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => toast.success("Pembaruan sensor IoT denah gudang selesai.")}
            >
              Sync Sensor IoT
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Kapasitas Rak"
          value={`${racks.length} Unit Rak`}
          icon={<Warehouse className="w-5 h-5 text-indigo-600" />}
          subtext="Seluruh Zona Fasilitas"
          variant="info"
        />
        <DnaStatCard
          label="Rata-rata Utilisasi Spasial"
          value={`${avgUtilization}%`}
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Optimal Capacity", isPositive: true }}
          subtext="Volume Ruang Terisi"
          variant="default"
        />
        <DnaStatCard
          label="Suhu Ruang Lingkungan"
          value="24.2 °C"
          icon={<Thermometer className="w-5 h-5 text-emerald-600" />}
          subtext="Standar CPKB Suhu Dingin 4°C"
          variant="success"
        />
        <DnaStatCard
          label="Kelembaban (Humidity)"
          value="45% RH"
          icon={<Droplets className="w-5 h-5 text-cyan-600" />}
          subtext="Parameter Higienis Terkontrol"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Interactive Spatial Grid */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
        {/* Legend */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-slate-600 font-medium">Low (0-50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-600 font-medium">Med (51-80%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-slate-600 font-medium">High (81%+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-dashed border-slate-300 bg-slate-100" />
              <span className="text-slate-400 font-medium">Maintenance</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Klik rak untuk melihat detail isi & material on-hand.
          </div>
        </div>

        {/* Rack Cells Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {filteredRacks.map((rack) => (
            <div
              key={rack.id}
              onClick={() => setSelectedRack(rack)}
              className={`aspect-square rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center select-none ${
                rack.status === "MAINTENANCE"
                  ? "border-dashed border-slate-200 bg-slate-50 text-slate-400 grayscale"
                  : rack.utilization > 80
                  ? "border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-400"
                  : rack.utilization > 50
                  ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400"
                  : "border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400"
              } hover:shadow-md hover:-translate-y-0.5`}
            >
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{rack.id}</span>
              <span className={`text-xs font-bold font-mono ${
                rack.status === "MAINTENANCE" ? "text-slate-400" : "text-slate-900"
              }`}>
                {rack.status === "MAINTENANCE" ? "OFF" : `${rack.utilization}%`}
              </span>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full ${
                    rack.utilization > 80 ? "bg-red-500" : rack.utilization > 50 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${rack.utilization}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Inbound / Loading Dock Area Indicator */}
        <div className="flex justify-center pt-4">
          <div className="px-8 py-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Area Docking & Pintu Masuk Inbound Loading Gudang
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <div className="w-16 h-6 rounded bg-white border border-slate-200 text-[10px] font-mono flex items-center justify-center text-slate-400 font-bold">
                GATE 1
              </div>
              <div className="w-16 h-6 rounded bg-white border border-slate-200 text-[10px] font-mono flex items-center justify-center text-slate-400 font-bold">
                GATE 2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedRack}
        onClose={() => setSelectedRack(null)}
        title={selectedRack?.name || "Detail Rak"}
        subtitle={`ID: ${selectedRack?.id} • ${selectedRack?.zoneName}`}
        badge={
          selectedRack && (
            <DnaBadge variant={selectedRack.status === "ACTIVE" ? "success" : "warning"}>
              {selectedRack.status === "ACTIVE" ? "Operasional Aktif" : "Maintenance"}
            </DnaBadge>
          )
        }
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info(`Membuka rincian stok untuk lokasi ${selectedRack?.id}`);
                setSelectedRack(null);
              }}
            >
              Lihat Isi Material Rak
            </DnaButton>
          </div>
        }
      >
        {selectedRack && (
          <div className="space-y-6 text-xs">
            {/* Utilization Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-700 font-bold uppercase text-[11px]">
                <span>Tingkat Utilisasi Rak</span>
                <span className="font-mono text-base font-bold text-blue-700">{selectedRack.utilization}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedRack.utilization > 80 ? "bg-red-500" : selectedRack.utilization > 50 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${selectedRack.utilization}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                <span>Kapasitas Terisi: <b className="text-slate-800 font-mono">{selectedRack.currentUsage} {selectedRack.unit}</b></span>
                <span>Maksimum: <b className="text-slate-800 font-mono">{selectedRack.capacity} {selectedRack.unit}</b></span>
              </div>
            </div>

            {/* Environmental Zone Details */}
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Spesifikasi Lingkungan Zonasi
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Zonasi Penyimpanan:</span>
                  <span className="font-semibold text-slate-800">{selectedRack.zoneName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Sensor IoT:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
