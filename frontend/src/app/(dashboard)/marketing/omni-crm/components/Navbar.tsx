import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  GitBranch,
  MessageSquare,
  Radio,
  Terminal,
  RotateCcw,
  UserPlus,
  Zap,
  LayoutGrid,
  Layers,
  Sparkles,
  Settings,
  Flame,
  ShieldCheck,
  FlaskConical,
  ChevronDown,
  Lock,
  Unlock,
  Shield,
  Smartphone,
  Check,
} from 'lucide-react';
import { CRMState, AppAccount, BusDevUser } from '../types';

interface NavbarProps {
  activeTab: 'bento' | 'kanban' | 'whatsapp' | 'busdev' | 'broadcast' | 'console';
  setActiveTab: (tab: 'bento' | 'kanban' | 'whatsapp' | 'busdev' | 'broadcast' | 'console') => void;
  state: CRMState;
  currentUser: AppAccount;
  onChangeCurrentUser: (userId: string) => void;
  onOpenIntake: () => void;
  onResetState: () => void;
  onOpenSettings?: () => void;
  onOpenSalesbotFlow?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  state,
  currentUser,
  onChangeCurrentUser,
  onOpenIntake,
  onResetState,
  onOpenSettings,
  onOpenSalesbotFlow,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const activeBusDevCount = (state.busDevs || []).filter((b) => b.status === 'AKTIF').length;
  const totalLeads = (state.leads || []).length;

  // Filter leads count for current user if BusDev
  const currentUserLeadsCount = currentUser.isSuperAdmin
    ? totalLeads
    : (state.leads || []).filter((l) => l.assignedTo === currentUser.id).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Dreamlab Brand Logo */}
          <div
            onClick={() => setActiveTab('bento')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold tracking-wider group-hover:scale-105 transition-transform border border-orange-400/30">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Dreamlab
                </span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase">
                  Maklon Kosmetik
                </span>
                <span className="hidden xl:inline text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CPKB Grade A • BPOM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                CRM Core & Multi-Account WhatsApp Hub
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              id="tab-bento"
              onClick={() => setActiveTab('bento')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bento'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bento</span>
            </button>

            <button
              id="tab-kanban"
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pipelines</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 font-mono rounded-full font-bold ${
                  activeTab === 'kanban'
                    ? 'bg-blue-700 text-white'
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}
              >
                {currentUserLeadsCount}
              </span>
            </button>

            <button
              id="tab-whatsapp"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">WA Studio</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            </button>

            <button
              id="tab-busdev"
              onClick={() => setActiveTab('busdev')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'busdev'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">BusDev</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'busdev'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {activeBusDevCount}
              </span>
            </button>

            <button
              id="tab-broadcast"
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Broadcast</span>
            </button>

            <button
              id="tab-console"
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'console'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Console</span>
            </button>
          </nav>

          {/* Account Role Switcher & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Account Switcher Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              <button
                id="btn-account-switcher"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm cursor-pointer ${
                  currentUser.isSuperAdmin
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-950 hover:border-blue-300'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950 hover:border-emerald-300'
                }`}
                title="Ganti Akun & Nomor WhatsApp"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0 ${
                    currentUser.isSuperAdmin ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {currentUser.isSuperAdmin ? '👑' : currentUser.name.charAt(0)}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs truncate max-w-[130px] leading-tight">
                      {currentUser.name}
                    </span>
                    {currentUser.isSuperAdmin ? (
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                        BUSDEV
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block leading-tight">
                    {currentUser.phone}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-orange-500" />
                        Akses Akun & Isolasi Nomor WA
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                        Multi-Account
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Pilih profil untuk menguji sistem isolasi privasi. Setiap BusDev hanya dapat melihat pesan WhatsApp dan data lead pada nomornya sendiri.
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {/* Super Admin Option */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeCurrentUser('admin');
                        setIsAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        currentUser.isSuperAdmin
                          ? 'bg-blue-50 border border-blue-300 text-blue-950 font-bold'
                          : 'hover:bg-slate-50 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          👑
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Super Admin Dreamlab</span>
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded">
                              All Access
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Bisa melihat seluruh chat & {(state.busDevs || []).length} BusDev
                          </span>
                        </div>
                      </div>
                      {currentUser.isSuperAdmin && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>

                    <div className="pt-2 pb-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Akun BusDev (1 Nomor WhatsApp Khusus):
                    </div>

                    {/* BusDev List */}
                    {(state.busDevs || []).map((busdev) => {
                      const isSelected = currentUser.id === busdev.id;
                      const busdevLeadsCount = (state.leads || []).filter(
                        (l) =>
                          l.assignedTo === busdev.id ||
                          (l.assignedName &&
                            (l.assignedName.toLowerCase().includes(busdev.name.toLowerCase()) ||
                              busdev.name.toLowerCase().includes(l.assignedName.toLowerCase())))
                      ).length;

                      return (
                        <button
                          key={busdev.id}
                          type="button"
                          onClick={() => {
                            onChangeCurrentUser(busdev.id);
                            setIsAccountMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50 border border-transparent text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {busdev.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                <span className="truncate">{busdev.name}</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono font-medium">
                                📱 {busdev.formattedPhone || busdev.phone}
                              </div>
                              <div className="text-[9px] text-slate-400 truncate">
                                {busdev.specialty || busdev.role}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                              {busdevLeadsCount} Leads
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 ml-auto mt-0.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Intake Button */}
            <button
              id="btn-quick-intake"
              onClick={onOpenIntake}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 border border-orange-400/30 transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Lead Baru</span>
              <span className="sm:hidden">+</span>
            </button>

            {/* Salesbot Flow Trigger */}
            {onOpenSalesbotFlow && currentUser.isSuperAdmin && (
              <button
                id="btn-salesbot-flow-nav"
                onClick={onOpenSalesbotFlow}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                title="Salesbot Automation & Auto-Switching Flow"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden xl:inline">Salesbot</span>
              </button>
            )}

            {/* Settings */}
            {onOpenSettings && currentUser.isSuperAdmin && (
              <button
                id="btn-settings-nav"
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 cursor-pointer"
                title="Pengaturan Pipeline & Admin"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Reset State */}
            <button
              id="btn-reset-state"
              onClick={onResetState}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors border border-slate-300 cursor-pointer"
              title="Reset Mock Database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
