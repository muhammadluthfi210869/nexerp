import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Code, 
  Check, 
  Copy,
  Radio
} from 'lucide-react';
import { MetaAccountConfig } from '../../types';
import { api } from '@/lib/api';

interface MetaApiHubViewProps {
  metaAccount: MetaAccountConfig;
  setMetaAccount: React.Dispatch<React.SetStateAction<MetaAccountConfig>>;
  onSyncMeta: () => void;
  isSyncing: boolean;
}

export const MetaApiHubView: React.FC<MetaApiHubViewProps> = ({
  metaAccount,
  setMetaAccount,
  onSyncMeta,
  isSyncing,
}) => {
  const [tokenInput, setTokenInput] = useState(metaAccount.accessToken);
  const [pageIdInput, setPageIdInput] = useState(metaAccount.pageId);
  const [igIdInput, setIgIdInput] = useState(metaAccount.igAccountId);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.post('/marketing/social/meta/test-connection', {
          accessToken: tokenInput,
          pageId: pageIdInput,
          igAccountId: igIdInput,
      });
      const data = res.data;
      if (data.success) {
        setTestResult({
          success: true,
          message: `Koneksi Berhasil! Terhubung ke Meta User: ${data.user?.name || 'Authorized Account'}`,
          data: data,
        });

        // Update active account config
        setMetaAccount((prev) => ({
          ...prev,
          accessToken: tokenInput,
          pageId: pageIdInput,
          igAccountId: igIdInput,
          isConnected: true,
          isLiveApi: true,
        }));
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal menyambung ke Meta Graph API. Periksa kembali token Anda.',
          data: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error saat menghubungi Meta Graph API endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copySamplePayload = () => {
    navigator.clipboard.writeText(JSON.stringify({ ...metaAccount, accessToken: '' }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl pb-16 pt-2 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl p-6 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e9e8e4] dark:border-[#2f2f2f]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl shadow-md">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#37352f] dark:text-white">
                  Meta Business Suite API Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {metaAccount.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Konektor resmi Meta Graph API v19.0 untuk sinkronisasi otomatis Instagram Insights & Facebook Page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncMeta}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sinkronisasi Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Live Account Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block">Instagram Business Account:</span>
            <span className="text-sm font-bold text-pink-600 dark:text-pink-400 mt-0.5 block">
              {metaAccount.igUsername}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">ID: {metaAccount.igAccountId}</span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block">Facebook Page:</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
              {metaAccount.pageName}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">ID: {metaAccount.pageId}</span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block">Mode Koneksi:</span>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setMetaAccount((prev) => ({ ...prev, isLiveApi: !prev.isLiveApi }))}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  metaAccount.isLiveApi
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {metaAccount.isLiveApi ? '🟢 Live Meta Graph API' : '🟡 Simulated Sandbox'}
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-1">
              {metaAccount.isLiveApi ? 'Mengambil data langsung dari server Meta' : 'Menggunakan dataset benchmark Meta Suite'}
            </span>
          </div>
        </div>
      </div>

      {/* Meta API Configuration Form */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl p-6 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <span>Kredensial Meta Graph API</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Masukkan Meta User Access Token atau Page Token dari Meta for Developers Dashboard.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Access Token Input */}
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Meta Graph Access Token (User / Page Token)
            </label>
            <div className="relative">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="EAAQ..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-xs text-[#37352f] dark:text-white outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Token dapat digenerate dari <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Meta Graph API Explorer</a>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={pageIdInput}
                onChange={(e) => setPageIdInput(e.target.value)}
                placeholder="109283746592019"
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-xs text-[#37352f] dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                value={igIdInput}
                onChange={(e) => setIgIdInput(e.target.value)}
                placeholder="17841405829103948"
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-xs text-[#37352f] dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Test connection action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{isTesting ? 'Menguji Token ke Meta...' : 'Uji Koneksi Meta Graph API'}</span>
            </button>
          </div>

          {/* Test Connection Alert Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Audit Checklist */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl p-6 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
        <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Izin & Scope Meta Graph API</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Status otorisasi izin yang dibutuhkan untuk tracker dan penerbitan konten
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {metaAccount.permissions.map((perm) => (
            <div key={perm} className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">{perm}</span>
                <span className="text-[10px] text-zinc-400 block">Granted & Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Debug Inspector */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl p-6 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600"
          >
            <Code className="w-4 h-4" />
            <span>{showJson ? 'Sembunyikan Raw Meta JSON Payload' : 'Lihat Raw Meta JSON Payload'}</span>
          </button>

          {showJson && (
            <button
              onClick={copySamplePayload}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Salin JSON'}</span>
            </button>
          )}
        </div>

        {showJson && (
          <pre className="p-4 bg-zinc-900 text-zinc-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72">
            {JSON.stringify({ ...metaAccount, accessToken: '' }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
