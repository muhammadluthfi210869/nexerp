import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  FileJson,
  Sparkles,
  RotateCcw,
  Zap,
  Activity,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { CRMState, EngineLog } from '../types';

interface EngineConsoleProps {
  state: CRMState;
  onExecuteTool: (toolName: string, params: Record<string, any>) => void;
  onClearLogs: () => void;
}

type AvailableTool =
  | 'intake_guestbook'
  | 'toggle_busdev_status'
  | 'move_lead_stage'
  | 'sync_whatsapp_message'
  | 'execute_broadcast';

export const EngineConsole: React.FC<EngineConsoleProps> = ({
  state,
  onExecuteTool,
  onClearLogs,
}) => {
  const [selectedTool, setSelectedTool] = useState<AvailableTool>('intake_guestbook');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Preset payload templates for each tool
  const defaultPayloads: Record<AvailableTool, string> = {
    intake_guestbook: JSON.stringify(
      {
        name: 'Brand Kosmetik Glow',
        phone: '6281399887766',
        source: 'Meta Ads',
        notes: 'Tertarik maklon serum retinol & moisturizer jar',
      },
      null,
      2
    ),
    toggle_busdev_status: JSON.stringify(
      {
        user_id: 'user_anisa',
        is_active: true,
      },
      null,
      2
    ),
    move_lead_stage: JSON.stringify(
      {
        lead_id: state.leads[0]?.id || '',
        target_pipeline_id: 'pipe_round_robin',
        target_stage_id: 'stage_hot',
      },
      null,
      2
    ),
    sync_whatsapp_message: JSON.stringify(
      {
        lead_id: state.leads[0]?.id || '',
        message: 'Kapan tester sampel formula lab bisa dikirimkan ke kantor kami?',
        direction: 'INBOUND',
        channel: 'WHATSAPP_CLIENT',
      },
      null,
      2
    ),
    execute_broadcast: JSON.stringify(
      {
        source_filter: 'Meta Ads',
        template_text: 'Halo Kak {{name}}, terima kasih telah menghubungi Dreamlab Maklon Kosmetik! ✨',
      },
      null,
      2
    ),
  };

  const [payloadInput, setPayloadInput] = useState<string>(defaultPayloads[selectedTool]);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleToolChange = (tool: AvailableTool) => {
    setSelectedTool(tool);
    setPayloadInput(defaultPayloads[tool]);
    setJsonError(null);
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(payloadInput);
      setJsonError(null);
      onExecuteTool(selectedTool, parsed);
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const recentLogs = [...(state.logs || [])].reverse();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Developer Engine RPC Console
            </h2>
            <p className="text-[12px] text-slate-500 font-normal">
              Eksekusi langsung event engine CRM & sinkronisasi mutasi state secara realtime.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearLogs}
          className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          Bersihkan Log
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* RPC Executor Form */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">
                Eksekusi RPC Command
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">POST /api/rpc</span>
          </div>

          <form onSubmit={handleExecute} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Pilih RPC Tool:
              </label>
              <select
                value={selectedTool}
                onChange={(e) => handleToolChange(e.target.value as AvailableTool)}
                className="h-9 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 text-[12px] text-slate-800 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
              >
                <option value="intake_guestbook">intake_guestbook (Simulasi Lead Baru)</option>
                <option value="sync_whatsapp_message">sync_whatsapp_message (Kirim/Terima WA)</option>
                <option value="move_lead_stage">move_lead_stage (Pindah Tahap Funnel)</option>
                <option value="toggle_busdev_status">toggle_busdev_status (Aktif/Cuti Sales)</option>
                <option value="execute_broadcast">execute_broadcast (Jalankan Broadcast)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                JSON Payload Parameters:
              </label>
              <textarea
                rows={7}
                value={payloadInput}
                onChange={(e) => setPayloadInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none"
              />
              {jsonError && (
                <p className="text-xs text-rose-600 font-bold mt-1">{jsonError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Eksekusi RPC Sekarang</span>
            </button>
          </form>
        </div>

        {/* Live Engine Logs Feed */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live State & Audit Logs
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {recentLogs.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada log aktivitas engine.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-800 text-[11px]">{log.details}</p>

                  {log.metadata && (
                    <pre className="text-[10px] bg-white p-2 rounded-lg border border-slate-200 font-mono overflow-x-auto text-slate-600">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
