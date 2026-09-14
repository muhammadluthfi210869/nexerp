import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Sparkles,
  Send,
  ShieldAlert,
  Play,
  Pause,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Zap,
  Users,
  Target,
  Sliders,
  Check,
  X,
  UserCheck,
  Calendar,
  DollarSign,
  Layers,
  Flame,
  Lock,
} from 'lucide-react';
import { CRMState, Lead, BroadcastLogItem, AppAccount } from '../types';
import {
  prepareBroadcastRecipients,
  renderBroadcastMessage,
  parseSpintax,
  filterLeadsByKlaviyoSegment,
} from '../services/crmEngine';

interface BroadcastEngineProps {
  state: CRMState;
  currentUser?: AppAccount;
  onExecuteBroadcastInstant: (sourceFilter: string, templateText: string) => void;
  onAppendMessage: (
    leadId: string,
    message: string,
    direction: 'OUTBOUND',
    channel: 'CRM_WEB'
  ) => void;
}

export const BroadcastEngine: React.FC<BroadcastEngineProps> = ({
  state,
  currentUser,
  onExecuteBroadcastInstant,
  onAppendMessage,
}) => {
  const isBusDev = currentUser && !currentUser.isSuperAdmin;

  // Klaviyo-style Multi-Dimensional Filters
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [productCategory, setProductCategory] = useState<string>('ALL');
  const [minValue, setMinValue] = useState<number>(0);
  const [interactionRecency, setInteractionRecency] = useState<string>('ALL');
  const [excludeJunk, setExcludeJunk] = useState<boolean>(true);
  const [busDevFilter, setBusDevFilter] = useState<string>(isBusDev ? currentUser.id : 'ALL');
  const [tagKeyword, setTagKeyword] = useState<string>('');

  const [templateText, setTemplateText] = useState(
    '{Halo|Hai|Selamat Pagi} Kak {{name}},\n\nTerima kasih telah berkonsultasi dengan Dreamlab Maklon Kosmetik via {{source}}! ✨\n\nKami ada penawaran eksklusif khusus formulasi produk kecantikan & sample tester lab brand Anda. Boleh kami kirimkan katalog formulasi dan estimasi MOQ?'
  );

  const [previewSample, setPreviewSample] = useState<string[]>([]);
  const [speedMode, setSpeedMode] = useState<'SAFE' | 'FAST' | 'INSTANT'>('FAST');

  // Live Broadcast Runner State
  const [isRunning, setIsRunning] = useState(false);
  const [activeRecipientIndex, setActiveRecipientIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [broadcastQueue, setBroadcastQueue] = useState<BroadcastLogItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamically Filtered Audience
  const effectiveBusDevFilter = isBusDev && currentUser ? currentUser.id : busDevFilter;

  const filteredAudience = filterLeadsByKlaviyoSegment(
    state.leads || [],
    {
      sourceFilter,
      stageFilter,
      productCategory,
      minValue,
      interactionRecency,
      excludeJunk,
      busDevId: effectiveBusDevFilter,
      tagFilter: tagKeyword,
    },
    state.messages || []
  );

  const createQueueItems = (leads: Lead[], template: string): BroadcastLogItem[] => {
    return leads.map((lead) => ({
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      renderedMessage: renderBroadcastMessage(template, lead),
      delaySeconds: speedMode === 'SAFE' ? 4 : speedMode === 'FAST' ? 2 : 1,
      status: 'QUEUED',
    }));
  };

  // Generate Spintax Live Variations
  useEffect(() => {
    if (filteredAudience.length > 0) {
      const sample1 = renderBroadcastMessage(templateText, filteredAudience[0]);
      const sample2 =
        filteredAudience.length > 1
          ? renderBroadcastMessage(templateText, filteredAudience[1])
          : renderBroadcastMessage(templateText, filteredAudience[0]);
      const sample3 =
        filteredAudience.length > 2
          ? renderBroadcastMessage(templateText, filteredAudience[2])
          : renderBroadcastMessage(templateText, filteredAudience[0]);
      setPreviewSample([sample1, sample2, sample3]);
    } else {
      setPreviewSample([
        parseSpintax(
          templateText.replace('{{name}}', 'Calon Brand Owner').replace('{{source}}', 'Meta Ads')
        ),
      ]);
    }
  }, [templateText, filteredAudience]);

  // Queue initial populate
  useEffect(() => {
    if (!isRunning && broadcastQueue.length === 0) {
      const initialQueue = createQueueItems(filteredAudience, templateText);
      setBroadcastQueue(initialQueue);
    }
  }, [filteredAudience, templateText, isRunning]);

  // Broadcast Runner Execution Loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (activeRecipientIndex >= broadcastQueue.length) {
      setIsRunning(false);
      return;
    }

    const delaySeconds = speedMode === 'SAFE' ? 4 : speedMode === 'FAST' ? 2 : 0.5;
    setCountdown(delaySeconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Send active recipient
          const currentItem = broadcastQueue[activeRecipientIndex];
          if (currentItem && (currentItem.status === 'QUEUED' || currentItem.status === 'SENDING')) {
            onAppendMessage(currentItem.leadId, currentItem.renderedMessage, 'OUTBOUND', 'CRM_WEB');

            setBroadcastQueue((prevQ) =>
              prevQ.map((item, idx) =>
                idx === activeRecipientIndex
                  ? { ...item, status: 'SENT', sentAt: new Date().toISOString() }
                  : item
              )
            );
          }

          setActiveRecipientIndex((prevIdx) => prevIdx + 1);
          return delaySeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeRecipientIndex, broadcastQueue, speedMode, onAppendMessage]);

  const handleStartBroadcast = () => {
    if (filteredAudience.length === 0) return;
    const freshQueue = createQueueItems(filteredAudience, templateText);
    setBroadcastQueue(freshQueue);
    setActiveRecipientIndex(0);
    setIsRunning(true);
  };

  const handlePauseBroadcast = () => {
    setIsRunning(false);
  };

  const handleResetQueue = () => {
    setIsRunning(false);
    setActiveRecipientIndex(0);
    const initialQueue = createQueueItems(filteredAudience, templateText);
    setBroadcastQueue(initialQueue);
  };

  const sentCount = broadcastQueue.filter((i) => i.status === 'SENT').length;
  const progressPercent =
    broadcastQueue.length > 0 ? Math.round((sentCount / broadcastQueue.length) * 100) : 0;

  // Extract all unique sources
  const allSources: string[] = Array.from(
    new Set((state.leads || []).map((l) => l.source).filter(Boolean))
  );

  return (
    <div className="space-y-4">
      {/* Role Notice */}
      {isBusDev && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Broadcast Terisolasi Akun: {currentUser?.name}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                Pesan akan dikirimkan khusus ke database prospek Anda dengan nomor pengirim WhatsApp resmi Anda (📱 {currentUser?.phone})
              </span>
            </div>
          </div>

          <span className="text-xs font-bold font-mono px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-800">
            {filteredAudience.length} Prospek Terpilih
          </span>
        </div>
      )}

      {/* HEADER HERO (WHITE THEME) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 border border-orange-400/40 shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                WhatsApp Broadcast & Segmentation Studio
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                Anti-Ban Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Segmentasi prospek cerdas, rotasi Spintax unik per nomor, dan delay aman untuk follow-up massal formulasi maklon.
            </p>
          </div>
        </div>

        {/* Quick Audience Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-left shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Target Audience
            </span>
            <span className="text-base font-extrabold text-blue-700 font-mono">
              {filteredAudience.length} Leads
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-left shadow-2xs">
            <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
              Progress Terkirim
            </span>
            <span className="text-base font-extrabold text-emerald-800 font-mono">
              {sentCount} / {broadcastQueue.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================= */}
        {/* LEFT COLUMN: SEGMENTATION FILTERS & SPINTAX EDITOR (7 cols)*/}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Segment Filter Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kriteria Segmentasi Prospek
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {filteredAudience.length} Leads Terkualifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Source Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sumber Trafik Iklan:
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Sumber Iklan</option>
                  {allSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tahapan Funnel Maklon:
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Tahap Prospek</option>
                  <option value="stage_cold">Cold Leads (Belum Terhubung)</option>
                  <option value="stage_warm">Warm Leads (Konsultasi Formulasi)</option>
                  <option value="stage_hot">Hot Leads (Siap Tester Sample)</option>
                  <option value="stage_sample">Sample Dikirim</option>
                </select>
              </div>

              {/* BusDev Filter (Admin Only) */}
              {!isBusDev && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sales Penanggung Jawab:
                  </label>
                  <select
                    value={busDevFilter}
                    onChange={(e) => setBusDevFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Nomor BusDev (10 Sales)</option>
                    {(state.busDevs || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.formattedPhone || b.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Minimum Value */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Estimasi Nilai Kontrak (Min):
                </label>
                <select
                  value={minValue}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={0}>Semua Nilai Kontrak</option>
                  <option value={30000000}>≥ Rp 30 Juta (Tier Standard)</option>
                  <option value={50000000}>≥ Rp 50 Juta (Tier Premium)</option>
                  <option value={100000000}>≥ Rp 100 Juta (Tier Enterprise OEM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Spintax Message Composer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Draf Pesan Broadcast (Mendukung Format Spintax)
                </h3>
              </div>
              <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 font-bold">
                {`{Opsi A|Opsi B}`}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Gunakan tag <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono font-bold">{'{{name}}'}</code> dan <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono font-bold">{'{{source}}'}</code> untuk personalisasi nama dan sumber iklan.
            </p>

            <textarea
              rows={5}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
            />

            {/* Live Variations Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Simulasi 3 Variasi Pesan Acak yang Dihasilkan:
              </span>
              <div className="space-y-1.5">
                {previewSample.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-800 italic"
                  >
                    "{sample.substring(0, 140)}..."
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: QUEUE MONITOR & EXECUTION CONTROLS (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Execution Controls Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Panel Eksekusi Broadcast
                </h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isRunning
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isRunning ? 'Sedang Berjalan...' : 'Siap'}
              </span>
            </div>

            {/* Delay Speed Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Mode Kecepatan & Anti-Ban Delay:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSpeedMode('SAFE')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    speedMode === 'SAFE'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>Aman (4s)</div>
                  <span className="text-[9px] font-normal opacity-80">Rekomendasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpeedMode('FAST')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    speedMode === 'FAST'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>Cepat (2s)</div>
                  <span className="text-[9px] font-normal opacity-80">Standar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpeedMode('INSTANT')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    speedMode === 'INSTANT'
                      ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>Instan (0.5s)</div>
                  <span className="text-[9px] font-normal opacity-80">Testing</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Kemajuan Pengiriman:</span>
                <span className="font-mono text-blue-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {!isRunning ? (
                <button
                  onClick={handleStartBroadcast}
                  disabled={filteredAudience.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Broadcast ({filteredAudience.length} Nomor)</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseBroadcast}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Jeda Pengiriman (Sisa: {countdown}s)</span>
                </button>
              )}

              <button
                onClick={handleResetQueue}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                title="Reset Antrean"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Recipient Queue Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Antrean Penerima
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {broadcastQueue.length} Target
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {broadcastQueue.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Tidak ada nomor dalam antrean saat ini.
                </div>
              ) : (
                broadcastQueue.map((item, idx) => {
                  const isSent = item.status === 'SENT';
                  const isCurrent = idx === activeRecipientIndex && isRunning;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                        isSent
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : isCurrent
                          ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                            isSent ? 'bg-emerald-600' : isCurrent ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                        >
                          {isSent ? '✓' : idx + 1}
                        </div>
                        <div className="truncate">
                          <span className="font-bold block truncate">{item.leadName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{item.phone} • {item.source}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isSent
                            ? 'bg-emerald-200 text-emerald-900'
                            : isCurrent
                            ? 'bg-blue-200 text-blue-900 animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isSent ? 'Terkirim' : isCurrent ? 'Mengirim...' : 'Menunggu'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
