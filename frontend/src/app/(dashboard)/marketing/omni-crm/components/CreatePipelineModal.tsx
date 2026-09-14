import React, { useState } from 'react';
import { X, GitBranch, User, Plus, Check, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { CRMState, BusDevUser } from '../types';

interface CreatePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: CRMState;
  busDevs?: BusDevUser[];
  onCreate: (
    name: string,
    roundRobin: boolean,
    stages?: string[],
    assignedBusDevId?: string
  ) => void;
}

export const CreatePipelineModal: React.FC<CreatePipelineModalProps> = ({
  isOpen,
  onClose,
  state,
  busDevs = [],
  onCreate,
}) => {
  const [pipelineName, setPipelineName] = useState('');
  const [selectedBusDevId, setSelectedBusDevId] = useState<string>('');
  const [isRoundRobin, setIsRoundRobin] = useState<boolean>(false);
  const [stageTemplate, setStageTemplate] = useState<'standard' | 'simple' | 'custom'>('standard');
  const [customStagesText, setCustomStagesText] = useState(
    'LEAD MASUK\nCOLD LEADS\nWARM LEADS\nHOT LEADS\nKIRIM SAMPLE TESTER\nCLIENT DEAL'
  );

  const availableBusDevs = busDevs.length > 0 ? busDevs : state?.busDevs || [];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineName.trim()) return;

    let stages: string[] | undefined = undefined;
    if (stageTemplate === 'simple') {
      stages = [
        'LEAD MASUK',
        'PROSES FOLLOW UP',
        'KIRIM SAMPLE',
        'CLIENT DEAL',
      ];
    } else if (stageTemplate === 'custom') {
      stages = customStagesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    onCreate(
      pipelineName.trim(),
      isRoundRobin,
      stages,
      selectedBusDevId ? selectedBusDevId : undefined
    );

    // Reset & close
    setPipelineName('');
    setSelectedBusDevId('');
    setIsRoundRobin(false);
    onClose();
  };

  const handleSelectBusDevPreset = (busDevName: string, busDevId: string) => {
    setSelectedBusDevId(busDevId);
    setPipelineName(`${busDevName.split(' ')[0]}_Pipeline Busdev`);
  };

  return (
    <div
      id="create-pipeline-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Buat Pipeline Baru</h3>
              <p className="text-xs text-slate-500 font-medium">
                1 Pipeline khusus untuk setiap BusDev atau Channel Sales Dreamlab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Quick Presets for BusDev */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Pilih Pemilik Pipeline (BusDev Dedicated):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {availableBusDevs.map((bd) => {
                const isSelected = selectedBusDevId === bd.id;
                return (
                  <button
                    type="button"
                    key={bd.id}
                    onClick={() => handleSelectBusDevPreset(bd.name, bd.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">{bd.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-600 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pipeline Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Nama Pipeline: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="Contoh: Diaz_Pipeline Busdev atau Pipeline TikTok Live"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Round Robin Setting */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Auto Round-Robin Distribution</div>
              <div className="text-[11px] text-slate-500">
                Otomatis putar pembagian lead masuk ke BusDev di pipeline ini
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRoundRobin(!isRoundRobin)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                isRoundRobin
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isRoundRobin ? 'AKTIF' : 'OFF'}
            </button>
          </div>

          {/* Stage Template Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Template Tahapan (Workflow Stages):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStageTemplate('standard')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  stageTemplate === 'standard'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">Maklon Standar</div>
                <div className="text-[10px] text-blue-600 mt-0.5 font-mono">6 Tahap Funnel</div>
              </button>

              <button
                type="button"
                onClick={() => setStageTemplate('simple')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  stageTemplate === 'simple'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">Ringkas</div>
                <div className="text-[10px] text-blue-600 mt-0.5 font-mono">4 Tahap Cepat</div>
              </button>

              <button
                type="button"
                onClick={() => setStageTemplate('custom')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  stageTemplate === 'custom'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">Kustom</div>
                <div className="text-[10px] text-blue-600 mt-0.5 font-mono">Ketik Sendiri</div>
              </button>
            </div>

            {stageTemplate === 'custom' && (
              <div className="mt-2">
                <textarea
                  rows={4}
                  value={customStagesText}
                  onChange={(e) => setCustomStagesText(e.target.value)}
                  placeholder="Ketik 1 baris per nama tahapan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pipeline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
