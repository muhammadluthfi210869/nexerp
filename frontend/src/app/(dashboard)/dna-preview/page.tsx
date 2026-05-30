"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Factory, DollarSign, Star, TrendingUp, Settings, Trash2, UploadCloud, Check, Palette, Landmark, ChevronDown, AlertCircle, FolderOpen, ChevronRight, ChevronLeft, X, Info, Sliders } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataCard, MetricRow, StatCard, PageSection, SectionLabel, TableWrapper, DnaInput } from "@/components/dna";

const mockLeads = [
  { name: "PT. MAJU SEJAHTERA", brand: "Natura", status: "CONTACTED", value: "Rp 420 Jt" },
  { name: "CV. KARYA MANDIRI", brand: "Prime", status: "SAMPLE", value: "Rp 180 Jt" },
  { name: "UD. BERSAMA", brand: "Eco", status: "DP", value: "Rp 750 Jt" },
  { name: "PT. SINAR ABADI", brand: "Lux", status: "DEAL", value: "Rp 1.2 M" },
  { name: "CV. GLOBAL UTAMA", brand: "Alpha", status: "LOST", value: "Rp 95 Jt" },
];

const STATUS_STYLES: Record<string, string> = {
  CONTACTED: "bg-blue-50 text-blue-600 border border-blue-100",
  SAMPLE: "bg-amber-50 text-amber-600 border border-amber-100",
  DP: "bg-purple-50 text-purple-600 border border-purple-100",
  DEAL: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  LOST: "bg-rose-50 text-rose-600 border border-rose-100",
};

export default function DnaPreviewPage() {
  const [progress, setProgress] = React.useState(60);
  const [inputText, setInputText] = React.useState("");
  const [selectOption, setSelectOption] = React.useState("active");
  const [isChecked, setIsChecked] = React.useState(true);
  
  // Interactive Navigation State
  const [activeNav, setActiveNav] = React.useState("keuangan");
  
  // Simulated File Upload States
  const [uploadedFile, setUploadedFile] = React.useState<any>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Overlays & Actions State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isBannerOpen, setIsBannerOpen] = React.useState(true);
  const [activeSubTab, setActiveSubTab] = React.useState("overview");

  // Grid & Spacing Designer States are statically locked to p-5, gap-6, 3 columns, and rounded-2xl.

  // Floating Progress Panel States
  const [isFloatingOpen, setIsFloatingOpen] = React.useState(false);
  const [isFloatingMinimized, setIsFloatingMinimized] = React.useState(false);
  const [floatingProgress, setFloatingProgress] = React.useState(45);
  const [floatingNotes, setFloatingNotes] = React.useState("Reviewing sample request G1 gate.");
  const [floatingStage, setFloatingStage] = React.useState("SAMPLE_REQUESTED");

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setUploadProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadedFile({ name: "surat_legalitas_aureon.pdf", size: "2.4 MB" });
        }, 150);
      }
    }, 80);
  };

  return (
    <div className="space-y-8 animate-fade-slide-in">
      {/* ── SYSTEM ALERT BANNER ── */}
      {isBannerOpen && (
        <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-2xl p-4 flex justify-between items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-[#FEF08A] text-[#854D0E] rounded-xl font-bold flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black text-[#854D0E] uppercase tracking-wider leading-none">SYSTEM ALERTS IN PROGRESS</p>
              <p className="text-[11.5px] text-[#854D0E]/80 leading-normal font-semibold mt-1">
                Attention: SCM database undergoing indexing sync. Table records might lag up to 5 seconds.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsBannerOpen(false)}
            className="p-1.5 hover:bg-amber-100/50 text-[#854D0E] rounded-lg transition-all border-none bg-transparent cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── PAGE TITLE ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="status-dot bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
              INTELLIGENCE PREVIEW
            </span>
          </div>
          <h1 className="text-dashboard-title uppercase">
            VISUAL <span className="text-status-action">DNA</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Component Library • Proof of Concept
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot bg-emerald-500" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            LIVE
          </span>
        </div>
      </div>

      {/* ── DATA CARDS with marketing font style ── */}
      <PageSection title="A. PIPELINE OVERVIEW">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DataCard dotColor="bg-rose-500" title="TOTAL LEADS">
            <MetricRow label="Leads Masuk" value="1,847" />
            <MetricRow label="Contacted" value="1,234" percentage={67} />
            <MetricRow label="Sample Process" value="456" percentage={25} />
            <MetricRow label="DP Received" value="234" percentage={13} />
            <MetricRow label="Deal Confirmed" value="189" percentage={10} />
          </DataCard>

          <DataCard dotColor="bg-orange-500" title="REVENUE">
            <MetricRow label="Total Pipeline" value="Rp 4.2 M" />
            <MetricRow label="Potential Sample" value="Rp 1.8 M" />
            <MetricRow label="Potential Deal" value="Rp 1.5 M" />
            <MetricRow label="Confirmed" value="Rp 890 Jt" />
          </DataCard>

          <DataCard dotColor="bg-yellow-400" title="ACTIVITY">
            <MetricRow label="FU Today" value="24" />
            <MetricRow label="Avg Response" value="3.2h" />
            <MetricRow label="Active Leads" value="847" percentage={68} />
          </DataCard>

          <DataCard dotColor="bg-rose-600" title="CRITICAL ALERT" className="bg-[#FFF5F5] border-rose-100">
            <MetricRow label="Unfollowed" value="23" barColor="bg-rose-400" />
            <MetricRow label="Stuck Samples" value="12" barColor="bg-rose-400" />
            <MetricRow label="At Risk" value="8" barColor="bg-rose-400" />
          </DataCard>
        </div>
      </PageSection>

      {/* ── STAT CARDS (1 card 1 metric — client-ro / client-production style) ── */}
      <PageSection title="B. STAT CARDS">
        <div className="space-y-6">
          {/* ── BARIS 1: 3 CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Active Clients"
              value="1,247"
              subValue="Clients with >= 1 Order (MTD)"
              icon={<Factory className="text-emerald-500" />}
            />
            <StatCard
              label="Production Revenue"
              value="Rp 847 Jt"
              subValue="Total Pipeline Value in Production"
              icon={<DollarSign className="text-blue-600" />}
            />
            <StatCard
              label="Retention Rate"
              value="78%"
              subValue="Repeat Order Rate (YTD)"
              icon={<Star className="text-amber-500" />}
            />
          </div>

          {/* ── BARIS 2: 4 CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              label="Conversion Rate"
              value="12.4%"
              subValue="Leads converted to Orders"
              icon={<TrendingUp className="text-rose-500" />}
            />
            <StatCard
              label="Avg Deal Value"
              value="Rp 340 Jt"
              subValue="Average value per deal"
              icon={<DollarSign className="text-blue-600" />}
            />
            <StatCard
              label="Active Batches"
              value="18 Batches"
              subValue="Batches in production"
              icon={<Factory className="text-emerald-500" />}
            />
            <StatCard
              label="CSAT Score"
              value="4.9 / 5.0"
              subValue="Client Satisfaction Rate"
              icon={<Star className="text-amber-500" />}
            />
          </div>
        </div>
      </PageSection>

      {/* ── TABLE with retur-penjualan style ── */}
      <PageSection title="C. LEAD REGISTRY (DNA TABLE GUIDELINES)">
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="status-dot bg-blue-500 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    Active Lead Pipeline
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    Real-time • {mockLeads.length} Records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex-1 md:w-56">
                  <DnaInput icon={<Search />} placeholder="Cari lead..." />
                </div>
                <Button size="sm" className="h-10 px-4 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl border-slate-200 font-black text-[9px] uppercase gap-1">
                  <Filter className="h-3 w-3" /> Filter
                </Button>
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 px-4 text-table-header text-slate-400">Client</TableHead>
                  <TableHead className="py-4 px-4 text-table-header text-slate-400">Brand</TableHead>
                  <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                  <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Pipeline Value</TableHead>
                  <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeads.map((lead, i) => (
                  <TableRow key={i} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="py-3 px-4 font-black text-slate-900 text-xs uppercase">
                      {lead.name}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-bold text-slate-500 text-[10px] uppercase italic">
                      {lead.brand}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <Badge className={cn("text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none shadow-sm", STATUS_STYLES[lead.status])}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs tabular-nums">
                      {lead.value}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" className="h-8 px-4 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white font-black text-[9px] uppercase transition-all shadow-sm">
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TableWrapper>
      </PageSection>

      {/* ── TYPOGRAPHY SHOWCASE ── */}
      <PageSection title="C. VISUAL DNA REFERENCE">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DataCard dotColor="bg-blue-500" title="CARD TYPOGRAPHY">
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  card label
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                  card title / subtitle
                </p>
                <p className="font-black text-brand-black tracking-tight tabular text-lg mt-1">
                  28px  value
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  footer label
                </p>
                <p className="font-black text-brand-black tracking-tight tabular">
                  14px value
                </p>
              </div>
            </div>
          </DataCard>

          <DataCard dotColor="bg-green-500" title="STATUS & BADGES">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="status-dot bg-blue-500" />
                <span className="text-[9px] font-black uppercase">Action</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-dot bg-emerald-500" />
                <span className="text-[9px] font-black uppercase">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-dot bg-amber-400" />
                <span className="text-[9px] font-black uppercase">Warning</span>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <span className="status-dot bg-rose-500" />
                <span className="text-[9px] font-black uppercase">Critical</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Badge className="badge-success text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none">Success</Badge>
                <Badge className="badge-warning text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none">Warning</Badge>
                <Badge className="badge-critical text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none">Critical</Badge>
              </div>
            </div>
          </DataCard>

          <DataCard dotColor="bg-purple-400" title="PROGRESS & INPUT">
            <MetricRow label="Completion Rate" value="75%" percentage={75} barColor="bg-emerald-400" />
            <MetricRow label="Conversion Rate" value="45%" percentage={45} barColor="bg-blue-500" />
            <MetricRow label="Drop-off Rate" value="20%" percentage={20} barColor="bg-rose-400" />
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Input Field</p>
              <DnaInput placeholder="dna-input" />
              <DnaInput icon={<Search />} placeholder="Search..." />
            </div>
          </DataCard>
        </div>
      </PageSection>

      {/* ── INTERACTIVE DESIGN KIT ── */}
      <PageSection title="D. INTERACTIVE DESIGN KIT">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Buttons */}
          <DataCard dotColor="bg-blue-600" title="BUTTONS & TRIGGERS (DnaButton)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aureon Standard Buttons</p>
              
              <div className="space-y-3">
                {/* Primary Button */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaButton (Primary Slate)</span>
                  <button className="w-full h-11 bg-slate-800 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-900 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none font-black">
                    <Settings className="h-3.5 w-3.5" /> Save Configuration
                  </button>
                </div>

                {/* Primary Blue Button */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaButton (Primary Accent)</span>
                  <button className="w-full h-11 bg-blue-600 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none font-black">
                    <Plus className="h-3.5 w-3.5" /> Add New Record
                  </button>
                </div>

                {/* Secondary / Outline Button */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaButton (Secondary Outline)</span>
                  <button className="w-full h-11 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-black">
                    <Filter className="h-3.5 w-3.5" /> Filter Tables
                  </button>
                </div>

                {/* Danger / Critical Button */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaButton (Danger Pill)</span>
                  <button className="w-full h-11 bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-black">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Pipeline
                  </button>
                </div>

                {/* Table Row Action (Ghost) */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaButton (Table Row Ghost)</span>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-700">Row Action Example</span>
                    <button className="h-8 px-4 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white font-black text-[9px] uppercase transition-all shadow-sm cursor-pointer">
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 2: Form Controls */}
          <DataCard dotColor="bg-emerald-500" title="INPUTS & SELECTIONS (DnaSelect & DnaInput)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strict Form DNA Inputs</p>
              
              <div className="space-y-3">
                {/* Standard input with Icon */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaInput (Standard with Icon)</span>
                  <DnaInput 
                    icon={<Search />} 
                    placeholder="Enter keywords..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  {inputText && (
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">Live Typing: "{inputText}"</p>
                  )}
                </div>

                {/* Dropdown Selector */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">DnaSelect (Dropdown Selector)</span>
                  <div className="relative">
                    <select 
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold text-brand-black focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
                      value={selectOption}
                      onChange={(e) => setSelectOption(e.target.value)}
                    >
                      <option value="active">Active Status</option>
                      <option value="hold">On Hold Status</option>
                      <option value="critical">Critical Alert</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] font-black">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Textarea field */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Description / Audit Notes Textarea</span>
                  <textarea 
                    rows={2}
                    placeholder="Write audit notes here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-brand-black placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                  />
                </div>

                {/* Checkbox and Toggle Switches */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Binary Toggles & Checkboxes</span>
                  
                  <div className="flex items-center gap-6">
                    {/* Custom Toggle Switch */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={isChecked}
                          onChange={() => setIsChecked(!isChecked)}
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-all duration-300 border",
                          isChecked ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-300"
                        )} />
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                          isChecked ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className="text-[10px] font-black text-slate-700 uppercase">
                        {isChecked ? "Sync ON" : "Sync OFF"}
                      </span>
                    </label>

                    {/* Standard DNA Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="h-4.5 w-4.5 border-slate-200 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        defaultChecked
                      />
                      <span className="text-[10px] font-black text-slate-700 uppercase">
                        Keep Logged In
                      </span>
                    </label>
                  </div>
                </div>

                {/* Document Upload Dropzone */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive File Upload / Dropzone</span>
                  
                  {!uploadedFile && !isUploading && (
                    <div 
                      onClick={handleSimulatedUpload}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl py-5 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                    >
                      <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-wide">Click to Upload Document</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">PDF, PNG, or JPG up to 10MB</p>
                    </div>
                  )}

                  {isUploading && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase">
                        <span className="animate-pulse text-blue-600">Uploading File...</span>
                        <span className="tabular">{uploadProgress}%</span>
                      </div>
                      <div className="row-progress-bg mt-0">
                        <div className="row-progress-fill bg-blue-600" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-wide truncate max-w-[150px]">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tabular">
                            {uploadedFile.size} • Upload Completed
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setUploadedFile(null)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 3: Navigation & Shell */}
          <DataCard dotColor="bg-violet-500" title="NAVIGATION & SHELL DNA">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Nav Showcase</p>
              
              {/* Mini Top Header Bar Preview */}
              <div className="space-y-2">
                <span className="text-[8px] font-black text-slate-400 uppercase block">Mini Top Header (72px Standard)</span>
                <div className="h-14 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between shadow-sm">
                  {/* Mock search */}
                  <div className="relative w-36">
                    <input 
                      type="text" 
                      placeholder="Search (Ctrl + K)..." 
                      disabled
                      className="w-full h-8 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-2 text-[10px] font-medium text-slate-700 placeholder:text-slate-300"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  </div>
                  {/* Mock status */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      Stabil v2.0
                    </span>
                    <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md animate-pulse">
                      Sync
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Navigation Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase block">Mini Navigation (State: Click to Toggle Active)</span>
                
                <div className="p-1 space-y-1.5 bg-white rounded-2xl w-full">
                  {/* Nav Item 1: SCM */}
                  <div 
                    onClick={() => setActiveNav("scm")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer select-none",
                      activeNav === "scm" 
                        ? "bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        activeNav === "scm" ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                      )}>
                        <Factory className={cn("h-4 w-4", activeNav === "scm" ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                      </div>
                      <span className="text-[13.5px] font-semibold whitespace-nowrap truncate">SCM</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeNav === "scm" ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
                  </div>

                  {/* Nav Item 2: Keuangan */}
                  <div 
                    onClick={() => setActiveNav("keuangan")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer select-none",
                      activeNav === "keuangan" 
                        ? "bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        activeNav === "keuangan" ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                      )}>
                        <Landmark className={cn("h-4 w-4", activeNav === "keuangan" ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                      </div>
                      <span className="text-[13.5px] font-semibold whitespace-nowrap truncate">Keuangan</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeNav === "keuangan" ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
                  </div>

                  {/* Nav Item 3: Produksi */}
                  <div 
                    onClick={() => setActiveNav("produksi")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer select-none",
                      activeNav === "produksi" 
                        ? "bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        activeNav === "produksi" ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                      )}>
                        <Settings className={cn("h-4 w-4", activeNav === "produksi" ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                      </div>
                      <span className="text-[13.5px] font-semibold whitespace-nowrap truncate">Produksi</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeNav === "produksi" ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
                  </div>

                  {/* Nav Item 4: Creative */}
                  <div 
                    onClick={() => setActiveNav("creative")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer select-none",
                      activeNav === "creative" 
                        ? "bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        activeNav === "creative" ? "bg-white/10" : "bg-slate-50 group-hover:bg-white shadow-sm border border-slate-100 group-hover:border-slate-200"
                      )}>
                        <Palette className={cn("h-4 w-4", activeNav === "creative" ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                      </div>
                      <span className="text-[13.5px] font-semibold whitespace-nowrap truncate">Creative</span>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeNav === "creative" ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 4: Live Progress Slider */}
          <DataCard dotColor="bg-amber-500" title="LIVE PROGRESS EDITOR">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Modifiers</p>
              
              <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lead Progress</span>
                  <div className="h-6 px-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-black text-[10px] tabular">{progress}%</span>
                  </div>
                </div>

                {/* Real-time color-coded progress bar */}
                <div className="space-y-1">
                  <div className="row-progress-bg">
                    <div 
                      className={cn(
                        "row-progress-fill",
                        progress < 30 ? "bg-rose-500" : progress < 75 ? "bg-blue-600" : "bg-emerald-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                    <span>Contacted</span>
                    <span>Sample</span>
                    <span>DP Paid</span>
                    <span>Deal</span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-2 pt-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase block">Drag Slider to Modify Progres</label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status and instruction pill */}
              <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-start gap-3">
                <span className="text-blue-600 mt-0.5 text-xs">💡</span>
                <div>
                  <p className="text-[9px] font-black text-blue-800 uppercase tracking-wide">Developer DNA Tip</p>
                  <p className="text-[10px] text-blue-700/80 leading-normal font-medium mt-0.5">
                    Modifying slider updates the context value in real-time. Use this exact design structure for any batch process, sample valuation, or pipeline progress modifiers.
                  </p>
                </div>
              </div>
            </div>
          </DataCard>
        </div>
      </PageSection>

      {/* ── CORE SYSTEM COMPONENTS ── */}
      <PageSection title="E. CORE SYSTEM COMPONENTS">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Overlays & Actions */}
          <DataCard dotColor="bg-rose-500" title="OVERLAYS & ACTIONS (DnaDialog & DnaDrawer)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DnaDialog, DnaDrawer, Dropdown</p>
              
              <div className="space-y-3 pt-2">
                {/* Dialog Trigger */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive Modal Dialog</span>
                  <button 
                    onClick={() => setIsDialogOpen(true)}
                    className="w-full h-11 bg-slate-900 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-800 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none font-black"
                  >
                    Open DnaDialog (Modal)
                  </button>
                </div>

                {/* Drawer Trigger */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive Slide-out Drawer</span>
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="w-full h-11 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-black"
                  >
                    Open DnaDrawer (Sheet)
                  </button>
                </div>

                {/* Floating Dropdown Menu */}
                <div className="space-y-1 relative">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Row Action Floating Menu</span>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-100 transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer font-black"
                  >
                    <span>Table Row Actions</span>
                    <span>{isDropdownOpen ? "▲" : "▼"}</span>
                  </button>

                  {/* Dropdown popup */}
                  {isDropdownOpen && (
                    <div className="absolute top-16 left-0 w-full bg-white border border-slate-150 rounded-2xl shadow-xl p-2 z-35 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="text-[11px] font-semibold text-slate-600 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5 text-slate-400" /> View Config
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-slate-400" /> View Analytics
                      </div>
                      <div className="border-t border-slate-100 my-1" />
                      <div className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete Record
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 2: State & Feedback */}
          <DataCard dotColor="bg-blue-500" title="STATE & FEEDBACK (EmptyState & Tooltip)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empty states & Skeletal loaders</p>
              
              <div className="space-y-4">
                {/* Tooltip & Popups */}
                <div className="space-y-1 relative">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive Hover Tooltip</span>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group/tooltip relative">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 animate-pulse" />
                    <span className="text-[10px] font-semibold text-slate-600">Hover the icon next to elements</span>
                    {/* Floating Tooltip */}
                    <div className="absolute bottom-11 left-4 w-52 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider p-2.5 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-10 leading-normal border-none">
                      🔒 Secured via SSL & AES-256
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Standard Empty State</span>
                  <div className="border border-dashed border-slate-200 rounded-2xl py-4 px-3 flex flex-col items-center justify-center text-center bg-white/50">
                    <FolderOpen className="h-5 w-5 text-slate-300 mb-1" />
                    <p className="text-[9px] font-black text-slate-700 uppercase">No Data Found</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Please add a record first</p>
                  </div>
                </div>

                {/* Loading Skeleton */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Pulsing Skeleton Loader</span>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 animate-pulse w-full">
                    <div className="h-2.5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 3: System Navigation */}
          <DataCard dotColor="bg-purple-500" title="SYSTEM NAVIGATION (Tabs & Breadcrumbs)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breadcrumbs, Tabs, Pagination</p>
              
              <div className="space-y-4 pt-1">
                {/* Breadcrumbs */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Standard Page Breadcrumb</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <span className="hover:text-slate-900 cursor-pointer">NEX ERP</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="hover:text-slate-900 cursor-pointer">BUSSDEV</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-800 font-bold">PIPELINE</span>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive Horizontal Tabs</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full border border-slate-150">
                    <button 
                      onClick={() => setActiveSubTab("overview")}
                      className={cn(
                        "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all border-none cursor-pointer",
                        activeSubTab === "overview" ? "bg-white text-slate-900 shadow-sm animate-in fade-in duration-200" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Overview
                    </button>
                    <button 
                      onClick={() => setActiveSubTab("details")}
                      className={cn(
                        "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all border-none cursor-pointer",
                        activeSubTab === "details" ? "bg-white text-slate-900 shadow-sm animate-in fade-in duration-200" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Pagination footer */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">List/Table Pagination Footer</span>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-full text-[10px] font-semibold text-slate-500">
                    <button className="h-7 w-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-slate-700">PAGE <span className="tabular">1</span> OF <span className="tabular">12</span></span>
                    <button className="h-7 w-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DataCard>

          {/* Card 4: Semantics & Insights */}
          <DataCard dotColor="bg-emerald-500" title="SEMANTICS & INSIGHTS (InsightCallout & pills)">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">InsightCallout, status dots</p>
              
              <div className="space-y-3.5">
                {/* Standard Status Pills */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Aureon Status Pills Showcase</span>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="badge-success text-[8px] font-black uppercase rounded-lg px-2 py-0.5 border border-emerald-100 shadow-sm">Success</Badge>
                    <Badge className="badge-warning text-[8px] font-black uppercase rounded-lg px-2 py-0.5 border border-amber-100 shadow-sm">Warning</Badge>
                    <Badge className="badge-critical text-[8px] font-black uppercase rounded-lg px-2 py-0.5 border border-rose-100 shadow-sm">Critical</Badge>
                  </div>
                </div>

                {/* Insight Callouts */}
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Standard Owner Insight Callouts</span>
                  
                  {/* Info Insight */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl flex gap-2.5">
                    <span className="text-[#1E40AF] text-xs shrink-0 mt-0.5">💡</span>
                    <div>
                      <p className="text-[9px] font-black text-[#1E40AF] uppercase leading-none tracking-wide">Owner Insight: Info</p>
                      <p className="text-[10px] text-[#1E40AF]/80 leading-snug font-medium mt-0.5">Review lead response averages.</p>
                    </div>
                  </div>

                  {/* Success Insight */}
                  <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex gap-2.5">
                    <span className="text-[#166534] text-xs shrink-0 mt-0.5">💡</span>
                    <div>
                      <p className="text-[9px] font-black text-[#166534] uppercase leading-none tracking-wide">Owner Insight: Growth</p>
                      <p className="text-[10px] text-[#166534]/80 leading-snug font-medium mt-0.5">MTD Revenue leads target projections.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DataCard>
        </div>
      </PageSection>

      {/* ── ADVANCED LAYOUTS & FLOATING INTERACTIVES ── */}
      <PageSection title="F. ADVANCED LAYOUTS & FLOATING PANELS">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Spacing and Grid Customizer */}
          <div className="lg:col-span-2">
            <DataCard dotColor="bg-blue-600" title="DYNAMIC GRID & SPACING DESIGNER (FULL-COLUMN INPUTS)">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">AUREON FORM GRID DNA SPECIFICATION</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Fixed standard columns, padding, gap, and grid spans for optimal UX</p>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase rounded-lg px-2.5 py-1">p-5 (20px)</Badge>
                    <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase rounded-lg px-2.5 py-1">gap-6 (24px)</Badge>
                    <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase rounded-lg px-2.5 py-1">3 Columns</Badge>
                    <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase rounded-lg px-2.5 py-1">rounded-2xl</Badge>
                  </div>
                </div>

                {/* Form Sandbox Area */}
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Interactive Form Preview Sandbox</span>
                  
                  <div className="bg-white border border-slate-200 shadow-card p-5 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Form Field 1 */}
                      <div className="space-y-1 sm:col-span-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">PT Client Name (Full Spanned)</label>
                        <DnaInput placeholder="Contoh: PT. AUREON GLOBAL UTAMA" defaultValue="PT. MAJU SEJAHTERA" />
                      </div>

                      {/* Form Field 2 */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">Brand Identity</label>
                        <DnaInput placeholder="Contoh: Natura Core" defaultValue="Natura" />
                      </div>

                      {/* Form Field 3 */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">Estimated MOQ</label>
                        <DnaInput placeholder="Contoh: 5000" defaultValue="10000" type="number" />
                      </div>

                      {/* Form Field 4 */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">Product Category</label>
                        <div className="relative">
                          <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold text-brand-black focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer">
                            <option value="SKINCARE">Skincare & Serum</option>
                            <option value="BODYCARE">Bodycare & Lotion</option>
                            <option value="HAIRCARE">Haircare & Shampoo</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                        </div>
                      </div>

                      {/* Form Field 5 */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">Transaction Stage</label>
                        <div className="relative">
                          <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold text-brand-black focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer">
                            <option value="SAMPLE">Sample Sent</option>
                            <option value="NEGOTIATION">Negotiation Gate</option>
                            <option value="SPK">SPK Contract</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                        </div>
                      </div>

                      {/* Form Field 6 (Textarea - full-width on wider grids) */}
                      <div className="space-y-1 sm:col-span-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase block">NPF Formula & Product Wangi Concept Description</label>
                        <textarea 
                          rows={2} 
                          placeholder="Tekstur gel bening, aroma melati rose premium, target HPP kompetitif..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-brand-black focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Standard Action buttons in standard layout */}
                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
                      <button className="h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer border-none">
                        Reset Spacing
                      </button>
                      <button className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer border-none shadow-md">
                        Save Spaced Layout
                      </button>
                    </div>
                  </div>
                </div>

                {/* HTML & Tailwind Class Code Generator */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block">Generated DNA Form Wrapper Markup</span>
                  <div className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-slate-300 select-all overflow-x-auto leading-relaxed border border-slate-800">
                    <span className="text-emerald-400">&lt;div</span> <span className="text-blue-400">className</span>=<span className="text-amber-300">"grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-card"</span><span className="text-emerald-400">&gt;</span>
                    <br />
                    &nbsp;&nbsp;<span className="text-slate-500">&lt;!-- Form inputs grid child elements here --&gt;</span>
                    <br />
                    <span className="text-emerald-400">&lt;/div&gt;</span>
                  </div>
                </div>
              </div>
            </DataCard>
          </div>

          {/* Card 2 & Card 3 Column Stack */}
          <div className="space-y-6">
            {/* Card 2: Floating Canvas Launcher */}
            <DataCard dotColor="bg-violet-600" title="FLOATING CONTEXT CANVAS (R&D & BUSDEV OVERLAY)">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floating quick-editor panel simulator</p>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5">
                  <p className="text-[11px] font-semibold text-slate-600 leading-normal">
                    In Aureon, complex workflows like progress updates in R&D or BusDev use quick floating panels that float at the bottom-right or overlay the context cleanly without obstructing full screen workflows.
                  </p>

                  <div className="space-y-2.5">
                    {/* Launch button */}
                    <button 
                      onClick={() => {
                        setIsFloatingOpen(true);
                        setIsFloatingMinimized(false);
                      }}
                      className="w-full h-11 bg-slate-900 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none font-black animate-pulse"
                    >
                      <span>🚀 Launch Floating Editor</span>
                    </button>

                    {/* Quick indicator of state */}
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider bg-white p-2.5 rounded-xl border border-slate-100">
                      <span>Status:</span>
                      <span className={cn(
                        "font-bold",
                        isFloatingOpen ? "text-emerald-600" : "text-rose-500"
                      )}>
                        {isFloatingOpen ? (isFloatingMinimized ? "MINIMIZED IN CAPSULE" : "FLOATING LIVE") : "CLOSED"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5 text-xs">💡</span>
                  <div>
                    <p className="text-[9px] font-black text-blue-800 uppercase tracking-wide">UX DNA Spec</p>
                    <p className="text-[10px] text-blue-700/80 leading-normal font-medium mt-0.5">
                      The floating panel must maintain a drop-shadow of `shadow-2xl` and a standard backdrop blur (`backdrop-blur-md`) when overlays are not modal-locked.
                    </p>
                  </div>
                </div>
              </div>
            </DataCard>

            {/* Card 3: Animation Easing Engine */}
            <DataCard dotColor="bg-emerald-500" title="AUREON ANIMATION & EASING ENGINE">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Micro-Animation Sandbox</p>
                
                <div className="space-y-3.5">
                  {/* Demo 1: Page Transition Simulator */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Page Transition Simulator (In Y-Slide)</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const el = document.getElementById("transition-box-demo");
                          if (el) {
                            el.classList.remove("animate-fade-slide-in");
                            void el.offsetWidth; // Trigger reflow
                            el.classList.add("animate-fade-slide-in");
                          }
                        }}
                        className="h-9 px-4 bg-slate-900 text-white font-bold text-[9px] uppercase rounded-xl hover:bg-slate-800 transition-colors border-none cursor-pointer shrink-0 font-black"
                      >
                        Trigger Transition
                      </button>
                      <div 
                        id="transition-box-demo"
                        className="flex-grow h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-700 uppercase animate-fade-slide-in"
                      >
                        ✨ Smooth Page Entry
                      </div>
                    </div>
                  </div>

                  {/* Demo 2: Elastic Micro-Press Button */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Taktil Active Press Button</span>
                    <button 
                      onClick={() => alert("Satisfying bounce clicked!")}
                      className="w-full h-11 bg-blue-600 active:scale-[0.95] text-white font-black text-[10px] uppercase rounded-xl tracking-wider hover:bg-blue-700 transition-all duration-150 active:duration-75 shadow-md flex items-center justify-center gap-2 cursor-pointer border-none font-black"
                    >
                      ⚡ Click Me to Feel Bounce
                    </button>
                  </div>

                  {/* Demo 3: Interactive Easing comparison */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Easing Speed Comparison (Hover Card)</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5 group/easings cursor-pointer">
                      {/* Expo Easing */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                          <span>Aureon Ease-Out Expo (Premium)</span>
                          <span className="text-blue-600 font-bold">180ms</span>
                        </div>
                        <div className="h-4 w-full bg-white border border-slate-150 rounded-md overflow-hidden relative">
                          <div className="absolute top-0.5 left-0.5 bottom-0.5 w-8 bg-blue-600 rounded-sm transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/easings:translate-x-[220px]" />
                        </div>
                      </div>

                      {/* Standard linear Easing */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                          <span>Standard Linear (Common)</span>
                          <span className="text-slate-500">180ms</span>
                        </div>
                        <div className="h-4 w-full bg-white border border-slate-150 rounded-md overflow-hidden relative">
                          <div className="absolute top-0.5 left-0.5 bottom-0.5 w-8 bg-slate-400 rounded-sm transition-all duration-[180ms] linear group-hover/easings:translate-x-[220px]" />
                        </div>
                      </div>
                      <span className="text-[7.5px] font-bold text-slate-400 uppercase block text-center mt-1">Hover the card to trigger moving comparison</span>
                    </div>
                  </div>
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      </PageSection>

      {/* ── LIVE INTERACTIVE OVERLAYS ── */}
      {/* 1. DnaDialog Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-[28px] shadow-2xl p-8 max-w-md w-full relative space-y-6 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="status-dot bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">SYSTEM CONFIRMATION</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Convert Lead to Customer?</h2>
              <p className="text-[11.5px] font-semibold text-slate-500 leading-relaxed">
                This action will automatically register <span className="text-slate-800 font-bold uppercase">PT. MAJU SEJAHTERA</span> into the SCM & Accounting ledger. This process cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer border-none font-black"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsDialogOpen(false);
                  alert("Successfully converted lead!");
                }}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-md cursor-pointer border-none font-black"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DnaDrawer Sheet */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300">
          {/* Overlay click close */}
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="w-full max-w-md bg-white h-full shadow-2xl relative p-8 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 border-l border-slate-100">
            {/* Header */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="status-dot bg-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">CUSTOMER SHEET DETAIL</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CLIENT DATA RECORD</p>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">PT. MAJU SEJAHTERA</h2>
                <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg inline-block mt-1">
                  Active Client
                </span>
              </div>

              {/* Document details list */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Registered Metadata</p>
                <div className="flex justify-between py-2.5 border-b border-slate-50 text-[11px] font-semibold">
                  <span className="text-slate-400 uppercase">Brand Identity</span>
                  <span className="text-slate-900 font-bold uppercase">Natura Core</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-50 text-[11px] font-semibold">
                  <span className="text-slate-400 uppercase">Valuation Pipeline</span>
                  <span className="text-slate-900 font-black tabular">Rp 420 Jt</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-50 text-[11px] font-semibold">
                  <span className="text-slate-400 uppercase">Lead Rotator Date</span>
                  <span className="text-slate-900 font-bold tabular">2026-05-25</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-2 font-black"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Quick-Editor Panel — removed for brevity */}

    </div>
  );
}
