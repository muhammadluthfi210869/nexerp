import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Tag,
  Building,
  Calendar,
  MessageSquare,
  Send,
  GitBranch,
  ShieldCheck,
  CheckCheck,
  Clock,
  Briefcase,
  Smartphone,
} from 'lucide-react';
import { CRMState, Lead, MessageChannel, MessageDirection } from '../types';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  state: CRMState;
  onMoveLead: (leadId: string, targetPipeId: string, targetStageId: string) => void;
  onSendMessage: (
    leadId: string,
    message: string,
    direction: MessageDirection,
    channel: MessageChannel
  ) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  state,
  onMoveLead,
  onSendMessage,
}) => {
  const [replyText, setReplyText] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('CRM_WEB');

  if (!isOpen || !lead) return null;

  const pipelinesList = state.pipelines || [];
  const currentPipeline =
    pipelinesList.find((p) => p.id === lead.pipelineId) || pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [],
    };
  const currentStage =
    (currentPipeline.stages || []).find((s) => s.id === lead.stageId) || (currentPipeline.stages || [])[0] || {
      id: 'stage_cold',
      name: 'COLD LEADS',
      order: 1,
    };

  const assignedBusDev = (state.busDevs || []).find((b) => b.id === lead.assignedTo);
  const leadMessages = (state.messages || []).filter((m) => m.leadId === lead.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendMessage(lead.id, replyText.trim(), 'OUTBOUND', channel);
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700">
                {lead.id}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {lead.source}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">{lead.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                +{lead.phone}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(lead.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Status & Pipeline Assignment Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium block mb-1">Tahapan Pipeline:</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{currentStage.name}</span>
                <select
                  value={lead.stageId}
                  onChange={(e) => onMoveLead(lead.id, currentPipeline.id, e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  {(currentPipeline.stages || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium block mb-1">Sales Ditugaskan (1 BusDev 1 No):</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {assignedBusDev ? assignedBusDev.name.charAt(0) : 'U'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {assignedBusDev ? assignedBusDev.name : 'Unassigned'}
                  </span>
                  {assignedBusDev && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      📱 {assignedBusDev.formattedPhone || assignedBusDev.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">
              Catatan Spesifikasi Maklon / Formulasi:
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {lead.notes || 'Belum ada catatan formulasi.'}
            </p>
          </div>

          {/* Messages History Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Chat Coexistence ({leadMessages.length} Pesan):</span>
            </span>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2">
              {leadMessages.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Belum ada pesan chat dengan prospek ini.
                </div>
              ) : (
                leadMessages.map((m) => {
                  const isOutbound = m.direction === 'OUTBOUND';
                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        isOutbound
                          ? 'ml-auto bg-blue-600 text-white shadow-2xs'
                          : 'mr-auto bg-white border border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <div className="text-[10px] opacity-80 mb-0.5 flex items-center justify-between gap-4 font-mono">
                        <span>{m.senderName}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Quick Reply */}
        <form onSubmit={handleSend} className="pt-3 border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Balas chat prospek via CRM Coexistence..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
