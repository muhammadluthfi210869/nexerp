import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  MousePointerClick, 
  Eye, 
  Layers, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  FlaskConical,
  BarChart3,
  Search,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Brand, MetaAdsReportData, GoogleAdsReportData } from '../types';
import { formatNumber } from '../utils/helpers';

interface PaidAdsSectionProps {
  brand?: Brand;
  brandName?: string;
  metaAds?: MetaAdsReportData;
  metaData?: MetaAdsReportData;
  googleAds?: GoogleAdsReportData;
  googleData?: GoogleAdsReportData;
  period?: string;
}

export const PaidAdsSection: React.FC<PaidAdsSectionProps> = ({
  brand,
  brandName,
  metaAds,
  metaData: propMetaData,
  googleAds,
  googleData: propGoogleData,
  period
}) => {
  const currentBrandName = brand?.name || brandName || 'Brand';

  const [activeTab, setActiveTab] = useState<'meta' | 'google'>('meta');
  const [creativeStatusFilter, setCreativeStatusFilter] = useState<string>('All');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Default Meta Ads Data
  const metaData: MetaAdsReportData = metaAds || propMetaData || {
    spend: 10750000,
    impressions: 384000,
    clicks: 14200,
    cpc: 757,
    ctr: 3.7,
    leadsContributed: 312,
    cpl: 34455,
    sampleRequests: 68,
    roas: 4.8,
    creatives: [
      {
        id: 'c-1',
        creativeName: 'Video Hook: 3 Biang Kerok Formula Serum Rusak & Pisah',
        hook: 'Kenapa serum buatan kamu sering pecah atau oksidasi setelah sebulan?',
        format: 'Video / Reel',
        visualAngle: 'Lab R&D Testing Demo & Ahli Formulasi',
        spend: 3850000,
        impressions: 142000,
        clicks: 5840,
        ctr: 4.11,
        hookRate: 42.8,
        leadsContributed: 134,
        cpl: 28731,
        sampleRequests: 32,
        status: 'Top Performer',
        actionRecommendation: 'Winner Creative! Tingkatkan budget harian +35% dan perluas lookalike audience.'
      },
      {
        id: 'c-2',
        creativeName: 'Carousel: Panduan Step-by-Step Maklon Skincare BPOM',
        hook: 'Mau punya brand skincare sendiri? Ini alur lengkap dari formulasi sampai izin edar BPOM keluar.',
        format: 'Carousel',
        visualAngle: 'Infografis Roadmap B2B Beautypreneur',
        spend: 2950000,
        impressions: 98000,
        clicks: 3450,
        ctr: 3.52,
        hookRate: 31.4,
        leadsContributed: 86,
        cpl: 34302,
        sampleRequests: 19,
        status: 'Active',
        actionRecommendation: 'CPL stabil, pertahankan pacing budget dan refresh slide penutup dengan penawaran sample kit.'
      },
      {
        id: 'c-3',
        creativeName: 'UGC Video: Unboxing Sample Kit Maklon & First Impression Tekstur',
        hook: 'Paket sample formula serum dari Dreamlab akhirnya sampai! Yuk kita tes bareng di kulit...',
        format: 'Video / Reel',
        visualAngle: 'Authentic Creator Review & Texture Shot',
        spend: 2450000,
        impressions: 89000,
        clicks: 3100,
        ctr: 3.48,
        hookRate: 38.6,
        leadsContributed: 68,
        cpl: 36029,
        sampleRequests: 17,
        status: 'Active',
        actionRecommendation: 'Engagement tinggi di kolom komentar; optimasi fast response DM untuk meningkatkan closing.'
      },
      {
        id: 'c-4',
        creativeName: 'Single Image: Mockup Desain Botol Serum & Logo Brand Kamu',
        hook: 'Bikin brand skincare dengan nama dan formula eksklusif milikmu sendiri.',
        format: 'Single Image',
        visualAngle: 'Estetik Visual Produk 3D & Brand Identity',
        spend: 1500000,
        impressions: 55000,
        clicks: 1810,
        ctr: 3.29,
        hookRate: 24.5,
        leadsContributed: 24,
        cpl: 62500,
        sampleRequests: 0,
        status: 'Fatigue',
        actionRecommendation: 'CPL membengkak karena ad fatigue; ganti visual gambar dan perbarui angle teks penawaran.'
      }
    ]
  };

  // Default Google Ads Data
  const googleData: GoogleAdsReportData = googleAds || propGoogleData || {
    spend: 9320000,
    impressions: 89400,
    clicks: 7850,
    avgCpc: 1187,
    ctr: 8.78,
    leadsContributed: 194,
    costPerLead: 48041,
    conversionRate: 2.47,
    campaigns: [
      {
        name: 'GS - Maklon Skincare BPOM High Intent (Exact & Phrase)',
        type: 'Search',
        spend: 5200000,
        impressions: 48500,
        clicks: 4450,
        leads: 122,
        cpl: 42622
      },
      {
        name: 'PMax - Omni Channel B2B Beautypreneurs Lead Gen',
        type: 'Performance Max',
        spend: 2620000,
        impressions: 28400,
        clicks: 2280,
        leads: 52,
        cpl: 50384
      },
      {
        name: 'GDN & YT - Retargeting Website Visitors & Sample Viewers',
        type: 'Display / Retargeting',
        spend: 1500000,
        impressions: 12500,
        clicks: 1120,
        leads: 20,
        cpl: 75000
      }
    ],
    topQueries: [
      {
        keyword: 'jasa maklon kosmetik bpom terpercaya',
        matchType: 'Exact',
        impressions: 18400,
        clicks: 2150,
        cpc: 1240,
        leadsContributed: 64,
        conversionRate: 2.98,
        cpl: 41656
      },
      {
        keyword: 'biaya maklon skincare murah jogja',
        matchType: 'Phrase',
        impressions: 14200,
        clicks: 1480,
        cpc: 1120,
        leadsContributed: 42,
        conversionRate: 2.84,
        cpl: 39466
      },
      {
        keyword: 'pabrik maklon serum dan moisturizer r&d',
        matchType: 'Phrase',
        impressions: 11200,
        clicks: 1040,
        cpc: 1350,
        leadsContributed: 35,
        conversionRate: 3.36,
        cpl: 40114
      },
      {
        keyword: 'sample formula maklon kosmetik gratis',
        matchType: 'Phrase',
        impressions: 9800,
        clicks: 1120,
        cpc: 980,
        leadsContributed: 38,
        conversionRate: 3.39,
        cpl: 28884
      }
    ]
  };

  const filteredCreatives = creativeStatusFilter === 'All'
    ? metaData.creatives
    : metaData.creatives.filter(c => c.status === creativeStatusFilter);

  const totalPaidLeads = metaData.leadsContributed + googleData.leadsContributed;
  const totalPaidSpend = metaData.spend + googleData.spend;
  const blendedCpl = totalPaidLeads > 0 ? totalPaidSpend / totalPaidLeads : 0;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Paid Acquisition & Ads Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentBrandName}</span>
              <span className="text-indigo-400">Meta Ads & Google Ads Performance</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Overview menyeluruh performa iklan berbayar, analisis mendalam <strong className="text-white">Creative Ads Performance</strong> (Meta), dan konversi kata kunci Google Search.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 self-start lg:self-auto">
            <button
              onClick={() => setActiveTab('meta')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'meta'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Meta Ads Overview</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-700/80 text-white">
                {metaData.creatives.length} Creatives
              </span>
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'google'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Google Ads Overview</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-700/80 text-white">
                {googleData.campaigns.length} Kampanye
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY COMPARISON METRICS (META VS GOOGLE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total Paid Spend</span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(activeTab === 'meta' ? metaData.spend : googleData.spend)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeTab === 'meta' ? 'Instagram & Facebook Ads' : 'Google Search & PMax Ads'}
          </div>
        </div>

        {/* Impressions & Clicks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Impressions & Clicks</span>
            <MousePointerClick className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatNumber(activeTab === 'meta' ? metaData.impressions : googleData.impressions)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Clicks:</span>
            <strong className="text-slate-800">{formatNumber(activeTab === 'meta' ? metaData.clicks : googleData.clicks)}</strong>
            <span>({activeTab === 'meta' ? metaData.ctr : googleData.ctr}% CTR)</span>
          </div>
        </div>

        {/* Leads Contributed */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800">
            <span>Leads Contributed</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {formatNumber(activeTab === 'meta' ? metaData.leadsContributed : googleData.leadsContributed)} <span className="text-xs font-semibold text-blue-600">Leads</span>
          </div>
          <div className="text-[11px] text-blue-800 mt-1 font-semibold">
            {activeTab === 'meta' ? `ROAS ${metaData.roas}x` : `${googleData.conversionRate}% Conversion Rate`}
          </div>
        </div>

        {/* Cost Per Lead (CPL) */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span>Cost Per Lead (CPL)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatRupiah(activeTab === 'meta' ? metaData.cpl : googleData.costPerLead)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-semibold">
            {activeTab === 'meta' ? `${metaData.sampleRequests} Sample Orders Generated` : 'Biaya per kontak inquiry'}
          </div>
        </div>
      </div>

      {activeTab === 'meta' ? (
        /* META ADS: CREATIVE ADS PERFORMANCE OVERVIEW (The user's explicit request) */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Overview Creative Ads Performance</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Breakdown Kinerja Materi Iklan (Creative Hook, Visual Angle & CPL)
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluasi efektivitas hook 3-detik video, visual angle audiens, kuantitas leads yang dihasilkan, dan rekomendasi scaling.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
                <select
                  value={creativeStatusFilter}
                  onChange={e => setCreativeStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="All">Semua Status</option>
                  <option value="Top Performer">Top Performer</option>
                  <option value="Active">Active</option>
                  <option value="Fatigue">Fatigue</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>
            </div>

            {/* CREATIVE PERFORMANCE TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Creative Name & Hook</th>
                    <th className="py-3 px-3">Format & Angle</th>
                    <th className="py-3 px-3 text-right">Spend</th>
                    <th className="py-3 px-3 text-center">Hook Rate (3s)</th>
                    <th className="py-3 px-3 text-center">CTR</th>
                    <th className="py-3 px-3 text-right text-blue-700">Leads</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Cost / Lead (CPL)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Action Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreatives.map(creative => (
                    <tr key={creative.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="font-bold text-slate-900">{creative.creativeName}</div>
                        <div className="text-[11px] text-indigo-700 font-medium italic mt-0.5">
                          &ldquo;{creative.hook}&rdquo;
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{creative.format}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{creative.visualAngle}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(creative.spend)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          creative.hookRate >= 40
                            ? 'bg-emerald-100 text-emerald-800'
                            : creative.hookRate >= 30
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {creative.hookRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {creative.ctr}%
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1 font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          +{creative.leadsContributed}
                        </div>
                        {creative.sampleRequests > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            +{creative.sampleRequests} samples
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(creative.cpl)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          creative.status === 'Top Performer'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : creative.status === 'Active'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : creative.status === 'Fatigue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {creative.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                        {creative.actionRecommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* GOOGLE ADS: SEARCH & PMAX PERFORMANCE */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Kampanye Google Ads Aktif & Distribusi Biaya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {googleData.campaigns.map((camp, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      {camp.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatRupiah(camp.spend)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {camp.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">{formatNumber(camp.clicks)} Clicks</span>
                    <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      +{camp.leads} Leads
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold text-right">
                    CPL: {formatRupiah(camp.cpl)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Top Converting Search Queries & Keywords (Kata Kunci Pembeli Maklon)
            </h3>
            <p className="text-xs text-slate-500">
              Kata kunci penelusuran dengan intensi pembelian tertinggi yang langsung berkontribusi pada formulir leads.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Keyword Query</th>
                    <th className="py-3 px-3 text-center">Match Type</th>
                    <th className="py-3 px-3 text-right">Impressions</th>
                    <th className="py-3 px-3 text-right">Clicks</th>
                    <th className="py-3 px-3 text-right">CPC</th>
                    <th className="py-3 px-3 text-right text-blue-700">Leads Contributed</th>
                    <th className="py-3 px-3 text-center">Conv. Rate</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Cost / Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {googleData.topQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {q.keyword}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {q.matchType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatNumber(q.impressions)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatNumber(q.clicks)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatRupiah(q.cpc)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          +{q.leadsContributed} Leads
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {q.conversionRate}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800">
                        {formatRupiah(q.cpl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
