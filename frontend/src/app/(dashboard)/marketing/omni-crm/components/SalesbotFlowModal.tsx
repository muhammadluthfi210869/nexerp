import React, { useState } from 'react';
import {
  X,
  Bot,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  GitBranch,
  Tag,
  FolderKanban,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { CRMState, AutomationFlow, AutomationRuleCondition } from '../types';

interface SalesbotFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CRMState;
  onSaveFlow: (flow: AutomationFlow) => void;
}

export const SalesbotFlowModal: React.FC<SalesbotFlowModalProps> = ({
  isOpen,
  onClose,
  state,
  onSaveFlow,
}) => {
  const flows = state.automationFlows || [];
  const activeFlow =
    flows.find((f) => f.id === state.activeFlowId) || flows[0] || null;

  const [flowName, setFlowName] = useState(activeFlow?.name || 'DREAMLAB SALESBOT INCOMING LEADS');
  const [isActive, setIsActive] = useState(activeFlow?.active ?? true);
  const [conditions, setConditions] = useState<AutomationRuleCondition[]>(
    activeFlow?.conditions || []
  );

  React.useEffect(() => {
    if (activeFlow) {
      setFlowName(activeFlow.name);
      setIsActive(activeFlow.active);
      setConditions(activeFlow.conditions || []);
    }
  }, [activeFlow]);

  if (!isOpen) return null;

  const handleUpdateCondition = (
    id: string,
    field: keyof AutomationRuleCondition,
    val: any
  ) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleAddCondition = () => {
    const newCond: AutomationRuleCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nodeIndex: Math.floor(Math.random() * 80) + 10,
      keywordMatch: 'Halo Dreamlab, saya tertarik konsultasi...',
      targetPipelineId: state.pipelines[0]?.id || 'pipe_round_robin',
      targetStageId: 'stage_cold',
      autoTag: 'Meta Ads Maklon',
      stopBot: true,
      greetingReply: 'Halo! Terima kasih atas pesan Anda. Tim BusDev kami akan segera membantu konsultasi formula lab.',
    };
    // insert before fallback
    const fallbackIdx = conditions.findIndex((c) => c.isFallback);
    if (fallbackIdx >= 0) {
      const next = [...conditions];
      next.splice(fallbackIdx, 0, newCond);
      setConditions(next);
    } else {
      setConditions([...conditions, newCond]);
    }
  };

  const handleDeleteCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    const updatedFlow: AutomationFlow = {
      id: activeFlow?.id || `flow_${Date.now()}`,
      name: flowName,
      active: isActive,
      triggerType: 'WHATSAPP_INBOUND',
      conditions,
      createdAt: activeFlow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveFlow(updatedFlow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Salesbot Flow Visual Editor
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold border border-indigo-200">
                  Auto-Routing AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pohon logika otomatis: Mendeteksi pesan masuk dari Meta Ads / Google Ads & meneruskan ke nomor WhatsApp BusDev terkait.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Aturan Flow</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Flow Meta Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Salesbot Flow:</label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 self-end">
              <div>
                <span className="font-bold text-slate-900 block">Status Salesbot</span>
                <span className="text-[11px] text-slate-500">
                  {isActive ? 'Aktif merespons pesan WhatsApp masuk' : 'Non-aktif (Pesan manual)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isActive ? 'AKTIF' : 'NON-AKTIF'}
              </button>
            </div>
          </div>

          {/* Logic Tree Nodes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Aturan Kondisi & Routing Funnel Maklon ({conditions.length} Nodes)</span>
              </span>
              <button
                onClick={handleAddCondition}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Node Kondisi</span>
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => {
                return (
                  <div
                    key={cond.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">
                          {cond.isFallback ? 'Fallback (Semua Pesan Lainnya)' : `Node #${cond.nodeIndex || idx + 1}`}
                        </span>
                      </div>

                      {!cond.isFallback && (
                        <button
                          onClick={() => handleDeleteCondition(cond.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Hapus Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Keyword Match */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Kata Kunci Pesan WhatsApp:
                        </label>
                        {cond.isFallback ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-2 text-slate-500 font-mono text-[11px]">
                            * (Tangkap semua teks lainnya)
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={cond.keywordMatch}
                            onChange={(e) => handleUpdateCondition(cond.id, 'keywordMatch', e.target.value)}
                            placeholder="Contoh: meta ads, sample, formula"
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>

                      {/* Auto Tag */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Sematkan Tag Kontak:
                        </label>
                        <input
                          type="text"
                          value={cond.autoTag || ''}
                          onChange={(e) => handleUpdateCondition(cond.id, 'autoTag', e.target.value)}
                          placeholder="Contoh: Meta Ads, Sample Tester"
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Target Stage */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Pindahkan ke Tahap:
                        </label>
                        <select
                          value={cond.targetStageId}
                          onChange={(e) => handleUpdateCondition(cond.id, 'targetStageId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="stage_cold">COLD LEADS</option>
                          <option value="stage_warm">WARM LEADS</option>
                          <option value="stage_hot">HOT LEADS</option>
                          <option value="stage_sample">KIRIM SAMPLE TESTER</option>
                          <option value="stage_client_deal">CLIENT DEAL</option>
                        </select>
                      </div>
                    </div>

                    {/* Greeting Reply */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Balasan Otomatis WhatsApp:
                      </label>
                      <input
                        type="text"
                        value={cond.greetingReply || ''}
                        onChange={(e) => handleUpdateCondition(cond.id, 'greetingReply', e.target.value)}
                        placeholder="Pesan sapaan otomatis..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
