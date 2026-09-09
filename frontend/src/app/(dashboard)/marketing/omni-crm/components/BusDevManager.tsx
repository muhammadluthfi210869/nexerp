import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Info,
  Smartphone,
  Check,
  Lock,
  Phone,
  Flame,
} from 'lucide-react';
import { CRMState, BusDevUser, AppAccount } from '../types';
import { getNextRoundRobinBusDev } from '../services/crmEngine';

interface BusDevManagerProps {
  state: CRMState;
  currentUser?: AppAccount;
  onToggleBusdev: (userId: string, isActive: boolean) => void;
  onSimulateIntake: (count: number) => void;
}

export const BusDevManager: React.FC<BusDevManagerProps> = ({
  state,
  currentUser,
  onToggleBusdev,
  onSimulateIntake,
}) => {
  const busDevsList = state.busDevs || [];
  const nextEligible = getNextRoundRobinBusDev(busDevsList);
  const activeCount = busDevsList.filter((b) => b.status === 'AKTIF').length;
  const totalAssignedLeads = busDevsList.reduce((acc, b) => acc + b.leadCount, 0);

  const formatLastAssigned = (isoString: string | null) => {
    if (!isoString) return 'Belum pernah dialokasikan (Priority 1)';
    const date = new Date(isoString);
    return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  };

  const getRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'null (Siap Terima Lead)';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} jam lalu`;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Round-Robin Algorithm State & Live Next Queue (DNA White Theme) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                BusDev Pool & Dedicated WhatsApp Assignment
              </h2>
            </div>
            <p className="text-[12px] text-slate-500 max-w-2xl leading-relaxed">
              Sistem CRM Dreamlab mengalokasikan lead baru secara otomatis menggunakan algoritma Round Robin ke sales yang berstatus{' '}
              <strong className="text-emerald-700 font-bold">AKTIF</strong>. Setiap BusDev memegang <strong className="text-blue-700 font-bold">1 nomor WhatsApp khusus</strong> dan tidak dapat mengintip percakapan sales lain.
            </p>
          </div>

          {/* Next in Line Callout */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 min-w-[280px] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              🎯 Antrean Round Robin Berikutnya:
            </span>
            {nextEligible ? (
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                  {nextEligible.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {nextEligible.name}
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-mono font-medium">
                    📱 {nextEligible.formattedPhone || nextEligible.phone}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Last: {getRelativeTime(nextEligible.lastAssigned)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                Semua BusDev NON-AKTIF / Cuti
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Intake Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-[12px] font-semibold text-slate-800">
            Simulasi Lead Masuk ke Round Robin Pool:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSimulateIntake(1)}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl shadow-2xs cursor-pointer transition-colors"
          >
            +1 Lead Baru
          </button>
          <button
            type="button"
            onClick={() => onSimulateIntake(5)}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition-colors"
          >
            +5 Batch Leads
          </button>
        </div>
      </div>

      {/* 10 BusDev Cards Grid (DNA White Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {busDevsList.map((busdev) => {
          const isCurrentUser = currentUser?.id === busdev.id;
          const isNext = nextEligible?.id === busdev.id;
          const assignedCount = (state.leads || []).filter(
            (l) =>
              l.assignedTo === busdev.id ||
              (l.assignedName &&
                (l.assignedName.toLowerCase().includes(busdev.name.toLowerCase()) ||
                  busdev.name.toLowerCase().includes(l.assignedName.toLowerCase())))
          ).length;

          return (
            <div
              key={busdev.id}
              className={`bg-white border rounded-xl p-4 shadow-2xs transition-all space-y-3 relative ${
                isCurrentUser
                  ? 'border-emerald-400 ring-2 ring-emerald-100'
                  : isNext
                  ? 'border-blue-400 ring-2 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                      busdev.status === 'AKTIF' ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                  >
                    {busdev.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{busdev.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                          Akun Anda
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {busdev.specialty || busdev.role || 'BusDev Specialist'}
                    </p>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => onToggleBusdev(busdev.id, busdev.status !== 'AKTIF')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                    busdev.status === 'AKTIF'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {busdev.status === 'AKTIF' ? '● AKTIF' : '○ CUTI'}
                </button>
              </div>

              {/* Designated Phone & Device Info */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp Khusus:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {busdev.formattedPhone || busdev.phone}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-blue-600" />
                    <span>Device Model:</span>
                  </span>
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">
                    {busdev.deviceModel || 'WhatsApp Bisnis'}
                  </span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Leads Aktif:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {assignedCount} Leads
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
