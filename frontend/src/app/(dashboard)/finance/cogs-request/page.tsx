"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Calculator, 
  History, 
  Eye, 
  Search, 
  Boxes,
  ShieldAlert,
  CheckCircle2,
  X,
  ChevronLeft,
  Save,
  FileText,
  PieChart,
  TrendingUp,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  TableWrapper,
  StatCard,
  DataCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/dna";

// Static Data from Plan
export default function COGSRequestPrototype() {
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [moqList, setMoqList] = useState<number[]>([]);
  const [currentMoq, setCurrentMoq] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientName, setClientName] = useState("PT Maju Jaya");
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const addMoq = () => {
    if (!currentMoq) return;
    setMoqList([...moqList, Number(currentMoq)]);
    setCurrentMoq("");
  };

  const { data: hppRequests = [], isLoading: hppLoading, refetch } = useQuery<any[]>({
    queryKey: ["cogs-hpp-requests"],
    queryFn: async () => {
      try {
        const resp = await api.get("/finance/cogs-requests");
        const body = resp.data;
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: samples = {}, isLoading: samplesLoading } = useQuery<Record<string, any>>({
    queryKey: ["rnd-samples-for-cogs"],
    queryFn: async () => {
      try {
        const resp = await api.get("/rnd/samples");
        return resp.data || {};
      } catch {
        return {};
      }
    },
  });

  const handleFinalize = async () => {
    try {
      const joNum = `JO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const payload = {
        jobOrderNumber: joNum,
        description: `HPP Request ${clientName} - ${selectedSample || "Formula Standard"} - ${notes || "Valuation"}`,
        totalCost: moqList[0] ? moqList[0] * 12500 : 5000000,
        totalRevenue: moqList[0] ? moqList[0] * 25000 : 10000000,
      };
      await api.post("/finance/cogs-requests", payload);
      toast.success("Request HPP berhasil difinalisasi!");
      refetch();
      setView("list");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal memfinalisasi HPP request");
    }
  };

  const filteredRequests = hppRequests.filter((req: any) => {
    const term = searchTerm.toLowerCase();
    const pelanggan = String(req.pelanggan || req.customer || req.description || "").toLowerCase();
    const produk = String(req.produk || req.product || req.jobOrderNumber || "").toLowerCase();
    const kode = String(req.kode || req.code || req.jobOrderNumber || req.id || "").toLowerCase();
    const formula = String(req.formula || req.formulaCode || "").toLowerCase();
    return (
      pelanggan.includes(term) ||
      produk.includes(term) ||
      kode.includes(term) ||
      formula.includes(term)
    );
  });

  const activeCount = hppRequests.filter((r) => !r.closedAt).length;
  const closedCount = hppRequests.filter((r) => !!r.closedAt).length;

  return (
    <DashboardShell
      title="Permintaan"
      titleAccent="HPP"
      subtitle="Cost of Goods Sold Analysis & Multi-MOQ Margin Projection"
      actions={
        view === "list" ? (
          <div className="flex gap-4">
            <DnaButton 
              variant="outline" 
              icon={<History className="text-amber-500" />}
            >
              Valuation History
            </DnaButton>
            <DnaButton 
              variant="primary"
              onClick={() => setView("form")}
              icon={<Calculator />}
            >
              Request Costing
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {view === "list" ? (
        <div className="space-y-6 animate-fade-slide-in">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="ACTIVE REQUESTS"
              value={String(activeCount)}
              icon={<FileText className="text-blue-500" />}
            />
            <StatCard
              label="CLOSED REQUESTS"
              value={String(closedCount)}
              icon={<PieChart className="text-emerald-500" />}
            />
            <StatCard
              label="TOTAL RECORDS"
              value={String(hppRequests.length)}
              icon={<TrendingUp className="text-blue-500" />}
            />
            <StatCard
              label="FILTERED"
              value={String(filteredRequests.length)}
              icon={<ShieldAlert className="text-rose-500" />}
            />
          </div>

          {/* List Table */}
          <TableWrapper
            filters={
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="status-dot bg-blue-500 animate-pulse" />
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                      VALUATION INDEX
                    </h3>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                      Daftar Permintaan Penentuan Cost of Goods Sold • {filteredRequests.length} Records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <DnaInput
                      icon={<Search className="h-4 w-4" />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="CARI VALUATION ID..."
                      className="bg-slate-50 border-none rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            }
          >
            <DnaTable>
              <DnaTableHead className="bg-slate-50/50">
                <DnaTableRow className="hover:bg-transparent border-slate-100">
                  <DnaTh className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">REQUEST IDENTITY</DnaTh>
                  <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CLIENT / DESC</DnaTh>
                  <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PRODUCT</DnaTh>
                  <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">FORMULA REF</DnaTh>
                  <DnaTh className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">COST / REVENUE</DnaTh>
                  <DnaTh className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</DnaTh>
                  <DnaTh className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTION</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {hppLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                    </DnaTd>
                  </DnaTableRow>
                ) : filteredRequests.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={7} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Tidak ada data yang cocok dengan pencarian Anda
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredRequests.map((req, idx) => {
                    const reqKode = req.kode || req.jobOrderNumber || req.id || `JO-${idx + 1}`;
                    const reqDate = req.tanggal || (req.recordedAt ? new Date(req.recordedAt).toISOString().split('T')[0] : "-");
                    const reqPelanggan = req.pelanggan || req.customer || req.description || "Job Order Costing";
                    const reqProduk = req.produk || req.product || req.jobOrderNumber || "-";
                    const reqFormula = req.formula || req.formulaCode || "FML-STD";
                    const reqCost = Number(req.totalCost || req.cost || 0);
                    const reqStatus = req.status || (req.closedAt ? "Selesai" : "Draft");

                    return (
                      <DnaTableRow key={req.id || reqKode} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                        <DnaTd className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                              <Calculator className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 tracking-tight text-sm uppercase italic leading-none">{reqKode}</p>
                              <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-1">{reqDate}</p>
                            </div>
                          </div>
                        </DnaTd>
                        <DnaTd className="py-3">
                          <p className="font-black text-slate-900 text-xs uppercase leading-none">{reqPelanggan}</p>
                        </DnaTd>
                        <DnaTd className="py-3">
                          <p className="text-[11px] font-medium text-slate-600 uppercase leading-none">{reqProduk}</p>
                        </DnaTd>
                        <DnaTd className="py-3">
                          <DnaBadge variant="info">
                            {reqFormula}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="py-3 text-right tabular-nums text-xs font-black">
                          Rp {reqCost.toLocaleString()}
                        </DnaTd>
                        <DnaTd className="py-3 text-center">
                          <DnaBadge variant={reqStatus === "Selesai" ? "success" : reqStatus === "Draft" ? "default" : "warning"}>
                            {reqStatus}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="py-3 pr-6 text-center">
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedSample(reqProduk);
                              setView("form");
                            }}
                          >
                            DETAIL
                          </DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </TableWrapper>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-slide-in">
          {/* Form Header / Actions */}
          <div className="flex justify-between items-center bg-white border border-[var(--border-color)] p-4 rounded-2xl shadow-sm">
            <DnaButton
              variant="outline"
              onClick={() => setView("list")}
              icon={<ChevronLeft />}
              className="text-rose-600 hover:bg-rose-50"
            >
              ABORT VALUATION
            </DnaButton>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Drafting Phase</span>
                <span className="text-[10px] font-black uppercase text-blue-600">Protocol 06-HPP</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-100" />
              <DnaButton
                variant="primary"
                icon={<Save />}
                onClick={handleFinalize}
              >
                FINALIZE REQUEST
              </DnaButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side form fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Entity Identification Card */}
              <DataCard
                dotColor="bg-blue-600"
                title="ENTITY IDENTIFICATION"
                titleColor="text-slate-400"
                className="!p-5 rounded-2xl animate-fade-slide-in"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Target Client</label>
                    <div className="relative">
                      <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                        <option value="">— SELECT CLIENT —</option>
                        <option value="1" selected>PT Maju Jaya</option>
                        <option value="2">Beauty Hub Indonesia</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Valuation Date</label>
                    <div className="relative">
                      <DnaInput 
                        type="date" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="bg-slate-50 border-none rounded-xl text-xs h-11" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Source Sample (R&D)</label>
                  <select 
                    onChange={(e) => setSelectedSample(e.target.value)}
                    value={selectedSample || ""}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">— SELECT APPROVED SAMPLE —</option>
                    {samplesLoading ? (
                      <option disabled>Loading...</option>
                    ) : (
                      Object.entries(samples as Record<string, any>).map(([key, s]: [string, any]) => (
                        <option key={key} value={key}>{s.name || key}</option>
                      ))
                    )}
                  </select>
                </div>

                {selectedSample && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Product Name</p>
                      <p className="font-black text-slate-900 text-[11px] uppercase italic">
                        {(samples as Record<string, any>)[selectedSample]?.name || selectedSample}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-left md:text-center">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Netto / Size</p>
                      <p className="font-black text-slate-900 text-[11px] uppercase">
                        {(samples as Record<string, any>)[selectedSample]?.netto || "-"}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-left md:text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Current Formula</p>
                      <DnaBadge variant="purple">
                        {`${(samples as Record<string, any>)[selectedSample]?.formula || "FML"} ${(samples as Record<string, any>)[selectedSample]?.revision || "Rev 1"}`}
                      </DnaBadge>
                    </div>
                  </div>
                )}
              </DataCard>

              {/* Packaging & Scale Card */}
              <DataCard
                dotColor="bg-blue-600"
                title="PACKAGING & SCALE"
                titleColor="text-slate-400"
                className="!p-5 rounded-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Primary Packaging</label>
                    <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                      <option>Bottle Airless 30ml Gold</option>
                      <option>Jar Acrylic 50g White</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Secondary Packaging</label>
                    <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                      <option>Inner Box Ivory 350gsm + Doff</option>
                      <option>Inner Box Silver Foil Gloss</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">MOQ Points for Analysis</label>
                    <DnaBadge variant="info">Comparative Costing</DnaBadge>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <DnaInput 
                        type="text" 
                        value={currentMoq}
                        onChange={(e) => setCurrentMoq(e.target.value)}
                        placeholder="E.g., 1000, 5000, 10000" 
                        icon={<Boxes className="w-4 h-4 text-slate-400" />}
                        className="bg-slate-50 border-none rounded-xl text-xs h-11" 
                      />
                    </div>
                    <DnaButton 
                      variant="primary"
                      onClick={addMoq}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      ADD POINT
                    </DnaButton>
                  </div>

                  {moqList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {moqList.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg px-3 py-1 shadow-sm">
                          {m.toLocaleString()} PCS
                          <button onClick={() => setMoqList(moqList.filter((_, idx) => idx !== i))}>
                            <X className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100 mt-4">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Commercial Notes / Context</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all" 
                    rows={3} 
                    placeholder="Provide context for valuation (e.g., promotional bundle or high-volume export order)..."
                  />
                </div>
              </DataCard>
            </div>

            {/* Right side summary cards */}
            <div className="space-y-6">
              <DataCard
                dotColor="bg-blue-600"
                title="COST INTEGRITY"
                titleColor="text-slate-400"
                className="relative overflow-hidden !p-5 rounded-2xl"
              >
                <div className="relative z-10 space-y-4">
                  <div>
                    <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Valuation Ledger</p>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase mt-1 leading-tight text-slate-900">COST INTEGRITY INDEX</h2>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8.5px] font-black uppercase text-slate-800 leading-tight">Material Cost</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">Auto-fetched from Formula BOM</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8.5px] font-black uppercase text-slate-800 leading-tight">Overhead Allocation</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">Based on Production Complexity</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-1 mt-4">
                    <p className="text-[8px] font-black uppercase tracking-wider text-blue-600">Protocol 06-HPP</p>
                    <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">
                      HPP analysis includes direct labor, variable overhead, and packaging loss buffers (3-5%).
                    </p>
                  </div>
                </div>
              </DataCard>

              <div className="p-5 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Valuation Policy</span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase italic">
                  "Every valuation must reflect current raw material market prices. Adjustments are valid for 14 working days."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
