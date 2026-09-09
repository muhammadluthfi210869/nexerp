import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Building,
  Tag,
  FileText,
  DollarSign,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { CRMState } from '../types';
import { getNextRoundRobinBusDev, IntakeGuestbookParams } from '../services/crmEngine';

interface GuestbookIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CRMState;
  defaultPipelineId?: string;
  onSubmit: (params: IntakeGuestbookParams) => void;
}

export const GuestbookIntakeModal: React.FC<GuestbookIntakeModalProps> = ({
  isOpen,
  onClose,
  state,
  defaultPipelineId = 'pipe_round_robin',
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Meta Ads');
  const [customSource, setCustomSource] = useState('');
  const [isCustomSourceMode, setIsCustomSourceMode] = useState(false);
  const [pipelineId, setPipelineId] = useState(defaultPipelineId);
  const [notes, setNotes] = useState('');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  // Extract all existing unique sources in state
  const existingSources = Array.from(
    new Set([
      'Meta Ads',
      'Google Ads',
      'TikTok Ads',
      'Google Organic',
      'Link Tree',
      'WhatsApp Inbound',
      'Buku Tamu Booth A',
      'Website Form',
      'Referral Partner',
      ...(state.leads || []).map((l) => l.source).filter(Boolean),
    ])
  );

  const pipelinesList = state.pipelines || [];
  const targetPipeline =
    pipelinesList.find((p) => p.id === pipelineId) || pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [],
    };
  const nextEligibleBusDev = targetPipeline.roundRobin
    ? getNextRoundRobinBusDev(state.busDevs || [])
    : null;

  const effectiveSource = isCustomSourceMode
    ? customSource.trim() || 'Custom Source'
    : source;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Nama dan Nomor WhatsApp wajib diisi.');
      return;
    }

    if (isCustomSourceMode && !customSource.trim()) {
      alert('Silakan ketik nama Source kustom Anda.');
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      source: effectiveSource,
      pipeline_id: pipelineId,
      notes: notes.trim() || undefined,
      value: value ? parseFloat(value) : undefined,
    });

    // Reset and close
    setName('');
    setPhone('');
    setNotes('');
    setValue('');
    setCustomSource('');
    setIsCustomSourceMode(false);
    onClose();
  };

  const fillPreset = (sampleName: string, samplePhone: string, sampleSource: string, sampleNotes?: string) => {
    setName(sampleName);
    setPhone(samplePhone);
    setIsCustomSourceMode(false);
    setSource(sampleSource);
    setNotes(sampleNotes || `Lead mendaftar melalui ${sampleSource}. Minta penawaran solusi formulasi kosmetik.`);
    setValue('25000000');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Intake Lead / Buku Tamu Baru
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Registrasi lead & alokasi otomatis ke 10 BusDev Dreamlab via Round-Robin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Round-Robin Allocation Predictor Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">
                Prediksi Alokasi Sales (Round-Robin 10 BusDev):
              </span>
              <strong className="text-blue-700 font-mono font-bold">
                {targetPipeline.roundRobin
                  ? nextEligibleBusDev
                    ? `${nextEligibleBusDev.name} (${nextEligibleBusDev.formattedPhone || nextEligibleBusDev.phone})`
                    : 'Tidak ada BusDev Aktif (Unassigned)'
                  : 'Round-Robin Non-Aktif (Unassigned)'}
              </strong>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              targetPipeline.roundRobin
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            Pipeline: {targetPipeline.name}
          </span>
        </div>

        {/* Quick Fill Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-bold">Preset Cepat:</span>
          <button
            type="button"
            onClick={() =>
              fillPreset('Brand Glowing Skin', '6281299887711', 'Meta Ads', 'Tertarik maklon serum retinol & moisturizer')
            }
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] border border-slate-300 transition-colors cursor-pointer"
          >
            📱 Meta Ads Prospek
          </button>
          <button
            type="button"
            onClick={() =>
              fillPreset('CV Herbal Alam Kosmetik', '6285233445566', 'Google Ads', 'Minta sampel toner dan facial wash lab')
            }
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] border border-slate-300 transition-colors cursor-pointer"
          >
            🔍 Google Ads Prospek
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Prospek / Brand *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Brand Skincare Glow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp (628xxx) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: 628123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Source */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Asal Kedatangan (Source) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSourceMode(!isCustomSourceMode)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                >
                  {isCustomSourceMode ? '← Pilih dari List' : '+ Source Baru'}
                </button>
              </div>

              {isCustomSourceMode ? (
                <div className="relative">
                  <Tag className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Nama source (cth: Event Cosmobeaute)"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    className="w-full bg-slate-50 border border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={source}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomSourceMode(true);
                      } else {
                        setSource(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    {existingSources.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Ketik Source Kustom Baru...</option>
                  </select>
                </div>
              )}
            </div>

            {/* Target Pipeline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Pipeline
              </label>
              <select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                {state.pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.roundRobin ? '(RR: AKTIF)' : '(RR: NON-AKTIF)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Spesifikasi Produk & Formulasi
            </label>
            <textarea
              rows={2}
              placeholder="Catatan dari percakapan saat inquiry atau jenis produk yang dicari..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Estimated Value */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estimasi Nilai Kontrak (IDR)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                placeholder="Contoh: 30000000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Simpan & Alokasikan ke BusDev</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
