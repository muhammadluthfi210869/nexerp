import React from 'react';
import { 
  Target, 
  TrendingUp, 
  Users, 
  FlaskConical, 
  CheckCircle, 
  ArrowRight, 
  DollarSign, 
  HelpCircle,
  Award,
  Filter
} from 'lucide-react';
import { Brand, ChannelLeadFunnel } from '../types';
import { formatNumber } from '../utils/helpers';

interface NurturingFunnelSectionProps {
  brand?: Brand;
  brandName?: string;
  funnels: ChannelLeadFunnel[];
  period?: string;
}

export const NurturingFunnelSection: React.FC<NurturingFunnelSectionProps> = ({
  brand,
  brandName,
  funnels,
  period
}) => {
  const currentBrandName = brand?.name || brandName || 'Brand';

  // Aggregate totals across all channels
  const totalTraffic = funnels.reduce((acc, curr) => acc + curr.traffic, 0);
  const totalLeads = funnels.reduce((acc, curr) => acc + curr.prospects, 0);
  const totalSamples = funnels.reduce((acc, curr) => acc + curr.nurturingSamples, 0);
  const totalGoals = funnels.reduce((acc, curr) => acc + curr.goals, 0);
  const totalDealValue = funnels.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
  const totalSpend = funnels.reduce((acc, curr) => acc + (curr.spend || 0), 0);

  // Conversion rates based on user's 3-step funnel: Leads Traffic > Prospecting Leads > Goals Sample
  const trafficToProspectRate = totalTraffic > 0 ? ((totalLeads / totalTraffic) * 100).toFixed(2) : '0';
  const prospectToGoalsRate = totalLeads > 0 ? ((totalSamples / totalLeads) * 100).toFixed(1) : '0';
  const overallTrafficToGoalsRate = totalTraffic > 0 ? ((totalSamples / totalTraffic) * 100).toFixed(3) : '0';
  const sampleToClosingRate = totalSamples > 0 ? ((totalGoals / totalSamples) * 100).toFixed(1) : '0';
  const overallClosingRate = totalLeads > 0 ? ((totalGoals / totalLeads) * 100).toFixed(1) : '0';

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case 'Instagram':
        return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white';
      case 'TikTok':
        return 'bg-slate-900 text-cyan-300';
      case 'YouTube':
        return 'bg-rose-600 text-white';
      case 'Website':
        return 'bg-blue-600 text-white';
      case 'Meta Ads':
        return 'bg-indigo-600 text-white';
      case 'Google Ads':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Funnel Pipeline: Leads Traffic &gt; Prospecting Leads &gt; Goals Sample</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Omni-Channel Lead Generation &amp; Conversion Pipeline
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Arsitektur terpadu pelacakan konversi berjenjang: <strong className="text-blue-300">1. Leads Traffic</strong> (Audience Reach &amp; Sessions) &rarr; <strong className="text-indigo-300">2. Prospecting Leads</strong> (Inquiries &amp; Tanya Maklon) &rarr; <strong className="text-emerald-300">3. Goals Sample</strong> (Permintaan Tester Kit &amp; Formula Sample Disetujui) untuk brand <span className="font-bold text-white">{currentBrandName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 shrink-0">
            <div className="text-center px-3">
              <div className="text-xs text-slate-300 font-medium">1. Leads Traffic</div>
              <div className="text-2xl font-black text-white">{formatNumber(totalTraffic)}</div>
              <div className="text-[10px] text-blue-300 font-semibold mt-0.5">Semua Kanal</div>
            </div>
            <div className="h-9 w-px bg-white/20 hidden sm:block" />
            <div className="text-center px-3">
              <div className="text-xs text-slate-300 font-medium">2. Prospecting Leads</div>
              <div className="text-2xl font-black text-indigo-300">{formatNumber(totalLeads)}</div>
              <div className="text-[10px] text-indigo-200 font-semibold mt-0.5">{trafficToProspectRate}% Conv</div>
            </div>
            <div className="h-9 w-px bg-white/20 hidden sm:block" />
            <div className="text-center px-3">
              <div className="text-xs text-slate-300 font-medium">3. Goals Sample</div>
              <div className="text-2xl font-black text-emerald-300">{formatNumber(totalSamples)}</div>
              <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">{prospectToGoalsRate}% dari Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-STAGE CORE PIPELINE VISUAL CARDS: LEADS TRAFFIC > PROSPECTING LEADS > GOALS SAMPLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STAGE 1: LEADS TRAFFIC */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Tahap 1: Leads Traffic
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
              01
            </span>
          </div>
          <div className="my-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatNumber(totalTraffic)}
            </div>
            <div className="text-xs text-slate-500 mt-1 leading-snug">
              Akumulasi Impressions, Video Views, &amp; Web Sessions dari seluruh kanal digital
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Rasio Lanjut:</span>
            <span className="font-bold text-blue-700 flex items-center gap-1">
              {trafficToProspectRate}% ke Leads
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* STAGE 2: PROSPECTING LEADS */}
        <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Tahap 2: Prospecting Leads
            </span>
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              02
            </span>
          </div>
          <div className="my-4">
            <div className="text-3xl font-black text-indigo-950 tracking-tight">
              {formatNumber(totalLeads)} <span className="text-sm font-semibold text-indigo-700">Leads</span>
            </div>
            <div className="text-xs text-indigo-800/80 mt-1 leading-snug">
              Qualified Inquiries, Tanya MOQ, Chat WhatsApp, DM Konsultasi Maklon &amp; Form Masuk
            </div>
          </div>
          <div className="pt-3 border-t border-indigo-200/70 flex items-center justify-between text-xs">
            <span className="text-indigo-800 font-medium">Konversi ke Sample:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              {prospectToGoalsRate}% Lolos Sample
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* STAGE 3: GOALS SAMPLE (GOAL UTAMA) */}
        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-300 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-emerald-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              Tahap 3: Goals Sample (Target Utama)
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              03
            </span>
          </div>
          <div className="my-4">
            <div className="text-3xl font-black text-emerald-950 tracking-tight">
              {formatNumber(totalSamples)} <span className="text-sm font-semibold text-emerald-700">Sample Kits</span>
            </div>
            <div className="text-xs text-emerald-800 mt-1 leading-snug">
              Formula Sample &amp; Tester Kit disetujui &amp; dikirim ke calon brand owner ({totalGoals} deal kontrak produksi)
            </div>
          </div>
          <div className="pt-3 border-t border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">Potensi Nilai Deal:</span>
            <span className="font-bold text-emerald-900">
              {totalDealValue > 0 ? formatRupiah(totalDealValue) : `${totalGoals} Kontrak Produksi`}
            </span>
          </div>
        </div>
      </div>

      {/* CHANNEL LEADS CONTRIBUTION BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Rincian Leads Contributed & Funnel per Channel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan kontribusi audiens setiap touchpoint terhadap akuisisi sample dan closing goals.
            </p>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
            Periode: {period}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Channel / Touchpoint</th>
                <th className="py-3 px-4 text-right text-slate-700">1. Leads Traffic</th>
                <th className="py-3 px-4 text-right text-indigo-700">2. Prospecting Leads</th>
                <th className="py-3 px-4 text-right text-emerald-700">3. Goals Sample</th>
                <th className="py-3 px-4 text-right text-amber-700">Kontrak Closing</th>
                <th className="py-3 px-4 text-center">Leads &rarr; Sample %</th>
                <th className="py-3 px-4 text-right">Cost / Nilai Deal</th>
                <th className="py-3 px-4">Karakteristik &amp; Nurturing Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funnels.map((item, idx) => {
                const leadToSampleConv = item.prospects > 0 ? ((item.nurturingSamples / item.prospects) * 100).toFixed(1) : '0';
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getChannelBadge(item.channel)}`}>
                          {item.channel}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatNumber(item.traffic)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {formatNumber(item.prospects)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <FlaskConical className="w-3 h-3" />
                        {formatNumber(item.nurturingSamples)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <CheckCircle className="w-3 h-3 text-amber-600" />
                        {formatNumber(item.goals)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {leadToSampleConv}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      {item.cpl ? (
                        <div>
                          <div className="text-slate-900 font-bold">{formatRupiah(item.cpl)} <span className="text-[10px] text-slate-400 font-normal">/ lead</span></div>
                          {item.spend && (
                            <div className="text-[10px] text-slate-400">Spend: {formatRupiah(item.spend)}</div>
                          )}
                        </div>
                      ) : item.dealValue ? (
                        <div className="text-emerald-700 font-bold">{formatRupiah(item.dealValue)}</div>
                      ) : (
                        <span className="text-slate-400 font-normal">Organik</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate text-[11px]">
                      {item.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3.5 px-4">TOTAL SEMUA CHANNEL</td>
                <td className="py-3.5 px-4 text-right font-black">{formatNumber(totalTraffic)}</td>
                <td className="py-3.5 px-4 text-right font-black text-indigo-700">{formatNumber(totalLeads)} Leads</td>
                <td className="py-3.5 px-4 text-right font-black text-emerald-700">{formatNumber(totalSamples)} Samples</td>
                <td className="py-3.5 px-4 text-right font-black text-amber-800">{formatNumber(totalGoals)} Closing</td>
                <td className="py-3.5 px-4 text-center font-black text-emerald-800">{prospectToGoalsRate}%</td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900">
                  {totalDealValue > 0 ? formatRupiah(totalDealValue) : 'Closed Value'}
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                  Kontribusi 100% pipeline terintegrasi
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
