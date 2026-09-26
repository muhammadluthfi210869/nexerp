import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
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

  // Default Meta Ads Data (Zero default, API-driven)
  const metaData: MetaAdsReportData = metaAds || propMetaData || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    cpc: 0,
    ctr: 0,
    leadsContributed: 0,
    cpl: 0,
    sampleRequests: 0,
    roas: 0,
    creatives: []
  };

  // Default Google Ads Data (Zero default, API-driven)
  const googleData: GoogleAdsReportData = googleAds || propGoogleData || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    avgCpc: 0,
    ctr: 0,
    leadsContributed: 0,
    costPerLead: 0,
    conversionRate: 0,
    campaigns: [],
    topQueries: []
  };


  const filteredCreatives = creativeStatusFilter === 'All'
    ? metaData.creatives
    : metaData.creatives.filter(c => c.status === creativeStatusFilter);

  const totalPaidLeads = metaData.leadsContributed + googleData.leadsContributed;
  const totalPaidSpend = metaData.spend + googleData.spend;
  const blendedCpl = totalPaidLeads > 0 ? totalPaidSpend / totalPaidLeads : 0;

  return (
    <div className="space-y-6">
      {/* PAID ADS SUB-BAR */}
      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-700">
          Paid Acquisition
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'meta'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Meta Ads</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
              activeTab === 'meta' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {metaData.creatives.length} Creatives
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'google'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Google Ads</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
              activeTab === 'google' ? 'bg-amber-700/80 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {googleData.campaigns.length} Kampanye
            </span>
          </button>
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
                <h3 className="font-extrabold text-slate-900 text-base">
                  Breakdown Kinerja Materi Iklan
                </h3>
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
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <DnaTh className="py-3 px-3">Creative Name & Hook</DnaTh>
                    <DnaTh className="py-3 px-3">Format & Angle</DnaTh>
                    <DnaTh className="py-3 px-3 text-right">Spend</DnaTh>
                    <DnaTh className="py-3 px-3 text-center">Hook Rate (3s)</DnaTh>
                    <DnaTh className="py-3 px-3 text-center">CTR</DnaTh>
                    <DnaTh className="py-3 px-3 text-right text-blue-700">Leads</DnaTh>
                    <DnaTh className="py-3 px-3 text-right text-emerald-700">Cost / Lead (CPL)</DnaTh>
                    <DnaTh className="py-3 px-3 text-center">Status</DnaTh>
                    <DnaTh className="py-3 px-3">Action Recommendation</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {filteredCreatives.map(creative => (
                    <DnaTableRow key={creative.id} className="hover:bg-slate-50/70 transition">
                      <DnaTd className="py-3.5 px-3 max-w-xs">
                        <div className="font-bold text-slate-900">{creative.creativeName}</div>
                        <div className="text-[11px] text-indigo-700 font-medium italic mt-0.5">
                          &ldquo;{creative.hook}&rdquo;
                        </div>
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{creative.format}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{creative.visualAngle}</div>
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(creative.spend)}
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          creative.hookRate >= 40
                            ? 'bg-emerald-100 text-emerald-800'
                            : creative.hookRate >= 30
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {creative.hookRate}%
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {creative.ctr}%
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1 font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          +{creative.leadsContributed}
                        </div>
                        {creative.sampleRequests > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            +{creative.sampleRequests} samples
                          </div>
                        )}
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(creative.cpl)}
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-center">
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
                      </DnaTd>
                      <DnaTd className="py-3.5 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                        {creative.actionRecommendation}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
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
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <DnaTh className="py-3 px-3">Keyword Query</DnaTh>
                    <DnaTh className="py-3 px-3 text-center">Match Type</DnaTh>
                    <DnaTh className="py-3 px-3 text-right">Impressions</DnaTh>
                    <DnaTh className="py-3 px-3 text-right">Clicks</DnaTh>
                    <DnaTh className="py-3 px-3 text-right">CPC</DnaTh>
                    <DnaTh className="py-3 px-3 text-right text-blue-700">Leads Contributed</DnaTh>
                    <DnaTh className="py-3 px-3 text-center">Conv. Rate</DnaTh>
                    <DnaTh className="py-3 px-3 text-right text-emerald-700">Cost / Lead</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {googleData.topQueries.map((q, idx) => (
                    <DnaTableRow key={idx} className="hover:bg-slate-50/70 transition">
                      <DnaTd className="py-3 px-3 font-bold text-slate-900">
                        {q.keyword}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {q.matchType}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatNumber(q.impressions)}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatNumber(q.clicks)}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right text-slate-600">
                        {formatRupiah(q.cpc)}
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right">
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          +{q.leadsContributed} Leads
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center font-bold text-slate-800">
                        {q.conversionRate}%
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right font-bold text-emerald-800">
                        {formatRupiah(q.cpl)}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
