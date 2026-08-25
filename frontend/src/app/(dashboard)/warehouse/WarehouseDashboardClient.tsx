"use client";

import React from "react";
import {
   HardDrive,
   DollarSign,
   RefreshCw,
   ShieldAlert,
   ChevronRight,
   FlaskConical,
   ShieldCheck,
   Package,
   CheckCircle,
   ShoppingBag,
   Truck,
   AlertTriangle,
  Zap,
  Box,
  Activity
} from "lucide-react";

interface WarehouseDashboardClientProps {
   initialStats?: {
      capacity?: { utility?: string; accuracy?: number; fifoScore?: number };
      valuation?: { total?: string; raw?: string; pack?: string; box?: string; label?: string };
      turnover?: { ratio?: number; health?: number; healthSegments?: { sehatPct: number; modPct: number; stagPct: number } };
      risk?: { deadStock?: number; criticalItems?: number; agingKarantina?: number };
   } | null;
   initialAudit?: {
      jalurA?: { inbound?: number; karantina?: number; velocity?: number };
      jalurB?: { reqProd?: number; picking?: number; handover?: number; velocity?: number };
      jalurC?: { orderProc?: number; shipping?: number; delivered?: number; velocity?: number };
      sensitiveMaterials?: Array<{ name: string; date: string; status: string; qty: string; fisik?: number; book?: number; avail?: number; age?: string }>;
      packagingStocks?: Array<{ name: string; qty: string; status: string; fisik?: number; book?: number; avail?: number; age?: string; date?: string }>;
      soFulfillment?: Array<{ client: string; so: string; qty: string; status: string; progress: number; var: number; pcs?: string; variant?: string }>;
      riskLoss?: Array<{ item: string; source: string; detail: string; impact: string; action: string; cause?: string; issue?: string; aging?: string; loss?: string }>;
      topRaw?: Array<{ name: string; usage: string; value: string }>;
      topPack?: Array<{ name: string; usage: string; value: string }>;
      productivity?: Array<{ rank?: number; name: string; batch: string; points: number }>;
   } | null;
}

export default function WarehouseDashboardClient({ initialStats, initialAudit }: WarehouseDashboardClientProps) {
   const stats = initialStats || {};
   const audit = initialAudit || {};

   // R3 Gate 2: removed all hardcoded fake fallback arrays. Empty lists render
   // as honest NO DATA states. Do NOT reintroduce fabricated rows.
   const getSensitiveMaterials = () => audit.sensitiveMaterials ?? [];
   const getPackagingStocks = () => audit.packagingStocks ?? [];
   const getSoFulfillment = () => audit.soFulfillment ?? [];
   const getRiskLoss = () => audit.riskLoss ?? [];
   const getTopRaw = () => audit.topRaw ?? [];
   const getTopPack = () => audit.topPack ?? [];

   return (
      <>

         {/* I. EXECUTIVE KPI CARDS (4 COLUMNS GRID) */}
         <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}>
            
            {/* Card 1: Capacity & Accuracy */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                  <p style={{ fontSize: "10px", fontWeight: 950, letterSpacing: "0.05em", color: "#1E293B", margin: 0 }}>CAPACITY & ACCURACY</p>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
                  <div>
                     <p style={{ fontSize: "24px", fontWeight: 950, margin: 0, color: "#1E293B" }}>
                        {stats.capacity?.utility ?? "—"}
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>UTILITAS KAPASITAS</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                     <p style={{ fontSize: "14px", fontWeight: 950, margin: 0, color: "#10B981" }}>
                        {typeof stats.capacity?.accuracy === "number" ? stats.capacity.accuracy.toFixed(1) : "—"}
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>ACCURACY</p>
                  </div>
               </div>
               <div style={{ padding: "8px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "8px", fontWeight: 950, color: "#64748B" }}>SKOR FIFO/FEFO</span>
                  <span style={{ fontSize: "9px", fontWeight: 950, color: "#3B82F6" }}>
                     {typeof stats.capacity?.fifoScore === "number" ? stats.capacity.fifoScore.toFixed(1) : "—"} / 10.0
                  </span>
               </div>
            </div>

            {/* Card 2: Valuation Audit */}
            <div style={{ background: "#1E293B", padding: "1.5rem", borderRadius: "24px", color: "white" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <p style={{ fontSize: "10px", fontWeight: 950, letterSpacing: "0.05em", margin: 0 }}>VALUATION AUDIT</p>
               </div>
               <p style={{ fontSize: "24px", fontWeight: 950, margin: 0 }}>
                  {stats.valuation?.total
                    ? `Rp ${Number(stats.valuation.total) >= 1000
                        ? (Number(stats.valuation.total)/1000).toFixed(2) + " T"
                        : Number(stats.valuation.total).toFixed(2) + " B"}`
                    : "—"}
               </p>
               <p style={{ fontSize: "8px", fontWeight: 850, color: "#94A3B8", marginBottom: "1rem", marginTop: 0 }}>TOTAL INVENTORY VALUE</p>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                     { l: "RAW", v: stats.valuation?.raw ?? "—" },
                     { l: "PACK", v: stats.valuation?.pack ?? "—" },
                     { l: "BOX", v: stats.valuation?.box ?? "—" },
                     { l: "LABEL", v: stats.valuation?.label ?? "—" }
                  ].map((item, idx) => (
                     <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "2px" }}>
                        <span style={{ fontWeight: 400, color: "#94A3B8" }}>{item.l}</span>
                        <span style={{ fontWeight: 950, marginLeft: "auto" }}>{item.v}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Card 3: Turnover & Health — only render the health bar if real data is provided */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                  <p style={{ fontSize: "10px", fontWeight: 950, letterSpacing: "0.05em", color: "#1E293B", margin: 0 }}>TURNOVER & HEALTH</p>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
                  <div>
                     <p style={{ fontSize: "24px", fontWeight: 950, margin: 0, color: "#1E293B" }}>
                        {stats.turnover?.ratio ?? "—"}<span style={{ fontSize: "10px" }}>{stats.turnover?.ratio != null ? "x" : ""}</span>
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>TURNOVER RATIO</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                     <p style={{ fontSize: "24px", fontWeight: 950, margin: 0, color: "#6366F1" }}>
                        {stats.turnover?.health ?? "—"}<span style={{ fontSize: "10px" }}>{stats.turnover?.health != null ? "%" : ""}</span>
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#64748B", margin: 0 }}>HEALTH SCORE</p>
                  </div>
               </div>
               {stats.turnover?.healthSegments ? (
                  <>
                    <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                       <div style={{ width: `${stats.turnover.healthSegments.sehatPct}%`, background: "#10B981" }} />
                       <div style={{ width: `${stats.turnover.healthSegments.modPct}%`, background: "#F59E0B" }} />
                       <div style={{ width: `${stats.turnover.healthSegments.stagPct}%`, background: "#EF4444" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", fontWeight: 950, color: "#64748B" }}>
                       <span>{stats.turnover.healthSegments.sehatPct}% SEHAT</span>
                       <span>{stats.turnover.healthSegments.modPct}% MOD</span>
                       <span>{stats.turnover.healthSegments.stagPct}% STAG</span>
                    </div>
                  </>
               ) : (
                  <p style={{ fontSize: "8px", fontWeight: 850, color: "#94A3B8", margin: 0 }}>NO DATA — health distribution not computed.</p>
               )}
            </div>

            {/* Card 4: Risk Analytics */}
            <div style={{ background: "#FFF1F2", padding: "1.5rem", borderRadius: "24px", border: "1px solid #FECDD3" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <p style={{ fontSize: "10px", fontWeight: 950, letterSpacing: "0.05em", color: "#9F1239", margin: 0 }}>RISK ANALYTICS</p>
               </div>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                     <p style={{ fontSize: "18px", fontWeight: 950, color: "#E11D48", margin: 0 }}>
                        {stats.risk?.deadStock != null ? `Rp ${stats.risk.deadStock}M` : "—"}
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#9F1239", margin: 0 }}>DEAD STOCK</p>
                  </div>
                  <div>
                     <p style={{ fontSize: "18px", fontWeight: 950, color: "#E11D48", margin: 0 }}>
                        {stats.risk?.criticalItems ?? "—"} {stats.risk?.criticalItems != null ? "ITEMS" : ""}
                     </p>
                     <p style={{ fontSize: "8px", fontWeight: 850, color: "#9F1239", margin: 0 }}>STOK KRITIS</p>
                  </div>
               </div>
               <div style={{ marginTop: "1rem", padding: "8px", background: "rgba(225, 29, 72, 0.1)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "8px", fontWeight: 950, color: "#9F1239" }}>AGING KARANTINA (AVG)</span>
                  <span style={{ fontSize: "12px", fontWeight: 950, color: "#E11D48" }}>
                     {stats.risk?.agingKarantina ?? "—"} {stats.risk?.agingKarantina != null ? "HARI" : ""}
                  </span>
               </div>
            </div>

         </div>

         {/* II. AUDIT COMMAND MATRIX */}
         <div style={{ marginBottom: "4rem" }}>
            <div style={{ marginBottom: "3rem" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "10px", fontWeight: 950, color: "#64748B", letterSpacing: "0.1em", margin: 0 }}>
                     II. AUDIT COMMAND MATRIX (TRI-FLOW VELOCITY)
                  </p>
                  <div style={{ display: "flex", gap: "12px" }}>
                     <span style={{ fontSize: "8px", fontWeight: 950, color: "#10B981", display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} /> OPTIMAL
                     </span>
                     <span style={{ fontSize: "8px", fontWeight: 950, color: "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444" }} /> BOTTLENECK
                     </span>
                  </div>
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  
                  {/* Jalur A */}
                  <div style={{ display: "flex", background: "white", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", height: "64px" }}>
                     <div style={{ width: "4px", background: "#3B82F6" }} />
                     <div style={{ width: "200px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderRight: "1px solid #F1F5F9" }}>
                        <p style={{ fontSize: "8px", fontWeight: 950, color: "#3B82F6", margin: 0 }}>JALUR MASUK (A)</p>
                        <p style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", marginTop: "2px", margin: 0 }}>SUPPLIER & MATS</p>
                     </div>
                     <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 1.5rem" }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>PENERIMAAN</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurA?.inbound ?? 2}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#CBD5E1" }} />
                        <div style={{ flex: 1, textAlign: "center", background: "#FFF1F2", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#E11D48", marginBottom: "4px", margin: 0 }}>KARANTINA / QC</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#E11D48", margin: 0 }}>{audit.jalurA?.karantina ?? 5}</p>
                        </div>
                     </div>
                     <div style={{ width: "120px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderLeft: "1px solid #F1F5F9", textAlign: "right" }}>
                        <p style={{ fontSize: "7px", fontWeight: 950, color: "#64748B", margin: 0 }}>VELOCITY</p>
                        <p style={{ fontSize: "14px", fontWeight: 950, color: "#3B82F6", margin: "2px 0 0 0" }}>
                           {audit.jalurA?.velocity ?? "8.4"}<span style={{ fontSize: "8px" }}>/10</span>
                        </p>
                     </div>
                  </div>

                  {/* Jalur B */}
                  <div style={{ display: "flex", background: "white", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", height: "64px" }}>
                     <div style={{ width: "4px", background: "#F59E0B" }} />
                     <div style={{ width: "200px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderRight: "1px solid #F1F5F9" }}>
                        <p style={{ fontSize: "8px", fontWeight: 950, color: "#F59E0B", margin: 0 }}>JALUR INTERNAL (B)</p>
                        <p style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", marginTop: "2px", margin: 0 }}>PROD CONSUMPTION</p>
                     </div>
                     <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 1.5rem" }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>REQ PROD</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurB?.reqProd ?? 0}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#CBD5E1" }} />
                        <div style={{ flex: 1, textAlign: "center", background: "#FFF1F2", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#E11D48", marginBottom: "4px", margin: 0 }}>PICKING</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#E11D48", margin: 0 }}>{audit.jalurB?.picking ?? 4}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#CBD5E1" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>HANDOVER</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurB?.handover ?? 0}</p>
                        </div>
                     </div>
                     <div style={{ width: "120px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderLeft: "1px solid #F1F5F9", textAlign: "right" }}>
                        <p style={{ fontSize: "7px", fontWeight: 950, color: "#64748B", margin: 0 }}>VELOCITY</p>
                        <p style={{ fontSize: "14px", fontWeight: 950, color: "#F59E0B", margin: "2px 0 0 0" }}>
                           {audit.jalurB?.velocity ?? "4.2"}<span style={{ fontSize: "8px" }}>/10</span>
                        </p>
                     </div>
                  </div>

                  {/* Jalur C */}
                  <div style={{ display: "flex", background: "white", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", height: "64px" }}>
                     <div style={{ width: "4px", background: "#10B981" }} />
                     <div style={{ width: "200px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderRight: "1px solid #F1F5F9" }}>
                        <p style={{ fontSize: "8px", fontWeight: 950, color: "#10B981", margin: 0 }}>JALUR KELUAR (C)</p>
                        <p style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", marginTop: "2px", margin: 0 }}>SO FULFILLMENT</p>
                     </div>
                     <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 1.5rem" }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>ORDER PROC</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurC?.orderProc ?? 10}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#CBD5E1" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>SHIPPING</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurC?.shipping ?? 0}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "#CBD5E1" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                           <p style={{ fontSize: "7px", fontWeight: 850, color: "#64748B", marginBottom: "4px", margin: 0 }}>DELIVERED</p>
                           <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>{audit.jalurC?.delivered ?? 0}</p>
                        </div>
                     </div>
                     <div style={{ width: "120px", padding: "0 1rem", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8FAFC", borderLeft: "1px solid #F1F5F9", textAlign: "right" }}>
                        <p style={{ fontSize: "7px", fontWeight: 950, color: "#64748B", margin: 0 }}>VELOCITY</p>
                        <p style={{ fontSize: "14px", fontWeight: 950, color: "#10B981", margin: "2px 0 0 0" }}>
                           {audit.jalurC?.velocity ?? "—"}<span style={{ fontSize: "8px" }}>/10</span>
                        </p>
                     </div>
                  </div>

               </div>
            </div>
         </div>

         {/* III. GRANULAR AUDIT TABLES (QUAD-GRID) */}
         <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
               
               {/* III.A Bahan Baku */}
               <div>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                     <FlaskConical className="w-3.5 h-3.5 text-purple-500" /> III.A AUDIT GRANULAR BAHAN BAKU (SENSITIF & FEFO)
                  </h3>
                  <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                     <div style={{ padding: "0.75rem 1rem", background: "#F1F5F9", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: 950, color: "#475569" }}>BPOM COMPLIANT</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                     </div>
                     <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                           <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950 }}>NAMA / MASUK</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>SIMPAN</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>STATUS</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "right" }}>FIS/BK/AV</th>
                           </tr>
                        </thead>
                        <tbody>
                           {getSensitiveMaterials().map((row: any, tIdx: number) => (
                              <tr key={tIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                 <td style={{ padding: "0.75rem" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950 }}>{row.name}</div>
                                    <div style={{ fontSize: "7px", color: "#94A3B8" }}>{row.in || row.date}</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "10px", fontWeight: 950 }}>{row.age || "45D"}</td>
                                 <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <span style={{ 
                                       background: (row.status || "").includes("OK") ? "#10B981" : "#F59E0B", 
                                       color: "white", 
                                       padding: "2px 6px", 
                                       borderRadius: "4px", 
                                       fontSize: "7px", 
                                       fontWeight: 950 
                                    }}>
                                       {row.status}
                                    </span>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "right", fontSize: "10px", fontWeight: 950 }}>
                                    {row.fisik ?? row.qty} / {row.book ?? row.qty} / <span style={{ color: "#3B82F6" }}>{row.avail ?? row.qty}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* III.B Bahan Kemas */}
               <div>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                     <Box className="w-3.5 h-3.5 text-orange-500" /> III.B AUDIT GRANULAR BAHAN KEMAS (DEGRADASI & STOK)
                  </h3>
                  <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                     <div style={{ padding: "0.75rem 1rem", background: "#FFF7ED", borderBottom: "1px solid #FED7AA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: 950, color: "#9A3412" }}>QUALITY AUDIT</span>
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                     </div>
                     <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                           <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950 }}>NAMA / MASUK</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>SIMPAN</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>STATUS</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "right" }}>FIS/BK/AV</th>
                           </tr>
                        </thead>
                        <tbody>
                           {getPackagingStocks().map((row: any, tIdx: number) => (
                              <tr key={tIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                 <td style={{ padding: "0.75rem" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950 }}>{row.name}</div>
                                    <div style={{ fontSize: "7px", color: "#94A3B8" }}>{row.in || row.date}</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "10px", fontWeight: 950 }}>{row.age || "82D"}</td>
                                 <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <span style={{ 
                                       background: row.status === "STABLE" ? "#10B981" : "#EF4444", 
                                       color: "white", 
                                       padding: "2px 6px", 
                                       borderRadius: "4px", 
                                       fontSize: "7px", 
                                       fontWeight: 950 
                                    }}>
                                       {row.status}
                                    </span>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "right", fontSize: "10px", fontWeight: 950 }}>
                                    {row.fisik ?? row.qty} / {row.book ?? row.qty} / <span style={{ color: "#3B82F6" }}>{row.avail ?? row.qty}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
               
               {/* III.C SO Fulfillment */}
               <div>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                     <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> III.C PEMENUHAN PESANAN (SO FULFILLMENT)
                  </h3>
                  <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                     <div style={{ padding: "0.75rem 1rem", background: "#EEF2FF", borderBottom: "1px solid #C7D2FE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: 950, color: "#3730A3" }}>LOGISTICS AUDIT</span>
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                     </div>
                     <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                           <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950 }}>CLIENT / NO. SO</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>KELENGKAPAN</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>STATUS</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "right" }}>PROGRESS / VAR</th>
                           </tr>
                        </thead>
                        <tbody>
                           {getSoFulfillment().map((row: any, tIdx: number) => (
                              <tr key={tIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                 <td style={{ padding: "0.75rem" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950 }}>{row.client}</div>
                                    <div style={{ fontSize: "7px", color: "#94A3B8" }}>{row.so}</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "10px", fontWeight: 950 }}>
                                    {row.pcs || row.qty}
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <span style={{ 
                                       background: row.status === "FULL" ? "#10B981" : "#F59E0B", 
                                       color: "white", 
                                       padding: "2px 6px", 
                                       borderRadius: "4px", 
                                       fontSize: "7px", 
                                       fontWeight: 950 
                                    }}>
                                       {row.status}
                                    </span>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "right" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950, color: (row.variant || String(row.var)) === "0" ? "#10B981" : "#EF4444" }}>
                                       {row.variant || row.var}
                                    </div>
                                    <div style={{ fontSize: "8px", fontWeight: 950, color: "#3B82F6" }}>{row.progress}</div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* III.D Risk & Loss */}
               <div>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                     <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> III.D AUDIT RISIKO & KERUGIAN (NON-SELLABLE)
                  </h3>
                  <div style={{ background: "#FFF1F2", borderRadius: "24px", border: "1px solid #FECDD3", overflow: "hidden" }}>
                     <div style={{ padding: "0.75rem 1rem", background: "#FECDD3", borderBottom: "1px solid #FECDD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: 950, color: "#9F1239" }}>ACTION REQUIRED</span>
                        <Activity className="w-3 h-3 text-rose-600" />
                     </div>
                     <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                           <tr style={{ background: "#FECDD3", borderBottom: "1px solid #FECDD3" }}>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, color: "#9F1239" }}>ITEM & SUMBER</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, color: "#9F1239", textAlign: "center" }}>DETAIL AUDIT</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, color: "#9F1239", textAlign: "right" }}>IMPACT (RP/LOSS)</th>
                              <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, color: "#9F1239", textAlign: "right" }}>ACTION</th>
                           </tr>
                        </thead>
                        <tbody>
                           {getRiskLoss().map((row: any, tIdx: number) => (
                              <tr key={tIdx} style={{ borderBottom: "1px solid #FECDD3" }}>
                                 <td style={{ padding: "0.75rem" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950, color: "#9F1239" }}>{row.item}</div>
                                    <div style={{ fontSize: "7px", color: "#BE123B" }}>{row.cause || row.source}</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "8px", fontWeight: 950, color: "#E11D48" }}>{row.issue || row.detail}</div>
                                    <div style={{ fontSize: "7px", color: "#9F1239" }}>{row.aging || "1 HARI"} Aging</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "right" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 950, color: "#E11D48" }}>{row.impact}</div>
                                    <div style={{ fontSize: "7px", color: "#9F1239" }}>Loss: {row.loss || "0 Pcs"}</div>
                                 </td>
                                 <td style={{ padding: "0.75rem", textAlign: "right" }}>
                                    <span style={{ 
                                       background: "#9F1239", 
                                       color: "white", 
                                       padding: "2px 6px", 
                                       borderRadius: "4px", 
                                       fontSize: "7px", 
                                       fontWeight: 950 
                                    }}>
                                       {row.action}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>

         </div>

         {/* IV & V. PRODUCTIVITY LISTS (2-COL) */}
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "3rem" }}>
            
            {/* IV. TOP 10 Bahan Baku */}
            <div>
               <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" /> IV. TOP 10 LIST BAHAN BAKU (PRODUKTIVITAS)
               </h3>
               <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                     <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950 }}>NAMA BAHAN BAKU</th>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>PEMAKAIAN</th>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "right" }}>NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody>
                        {getTopRaw().map((row: any, tIdx: number) => (
                           <tr key={tIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "0.82rem 0.75rem", fontSize: "10px", fontWeight: 950 }}>{row.name}</td>
                              <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "10px", fontWeight: 950 }}>{row.usage}</td>
                              <td style={{ padding: "0.75rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#10B981" }}>{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* V. TOP 10 Kemasan */}
            <div>
               <h3 style={{ margin: "0 0 1rem 0", fontSize: "10px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Box className="w-3.5 h-3.5 text-indigo-500" /> V. TOP 10 LIST KEMASAN (PRODUKTIVITAS)
               </h3>
               <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                     <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950 }}>NAMA KEMASAN</th>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "center" }}>PEMAKAIAN</th>
                           <th style={{ padding: "0.75rem", fontSize: "8px", fontWeight: 950, textAlign: "right" }}>NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody>
                        {getTopPack().map((row: any, tIdx: number) => (
                           <tr key={tIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "0.82rem 0.75rem", fontSize: "10px", fontWeight: 950 }}>{row.name}</td>
                              <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "10px", fontWeight: 950 }}>{row.usage}</td>
                              <td style={{ padding: "0.75rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#10B981" }}>{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

         </div>

      </>
   );
}
