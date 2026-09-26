"use client";

import React from 'react';
import * as Lucide from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
   const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
   return <LucideIcon size={size} color={color} style={style} />;
};

const LineChart: React.FC<{ data: number[], color: string, color2?: string, data2?: number[] }> = ({ data, color, color2, data2 }) => {
   if (data.length === 0) return null;
   const width = 500;
   const height = 150;
   // ponytail: one scale per series. The two lines carry different units (lead
   // count vs rupiah CPL), so a shared axis flattens whichever is smaller.
   const peak = (s: number[]) => Math.max(...s, 1);
   const step = width / Math.max(data.length - 1, 1);
   const points = data.map((d, i) => `${i * step},${height - (d / peak(data)) * height}`).join(' ');
   const points2 = data2 && data2.length ? data2.map((d, i) => `${i * step},${height - (d / peak(data2)) * height}`).join(' ') : null;
   const dataPeak = peak(data);

   return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
         <defs>
            <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
               <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
            {color2 && (
               <linearGradient id={`grad-${color2}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: color2, stopOpacity: 0 }} />
               </linearGradient>
            )}
         </defs>
         {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1="0" y1={height * p} x2={width} y2={height * p} stroke="#F1F5F9" strokeWidth="1" />
         ))}
         <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
         <path d={`M ${points} L ${width},${height} L 0,${height} Z`} fill={`url(#grad-${color})`} />
         {points2 && (
            <>
               <path d={`M ${points2}`} fill="none" stroke={color2} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
               <path d={`M ${points2} L ${width},${height} L 0,${height} Z`} fill={`url(#grad-${color2})`} />
            </>
         )}
         {data.map((d, i) => (
            <circle key={i} cx={i * step} cy={height - (d / dataPeak) * height} r="4" fill="white" stroke={color} strokeWidth="2" />
         ))}
      </svg>
   );
};

export interface PlatformRow {
   id: string;
   name: string;
   category: string;
   icon: string;
   color: string;
   bg: string;
   views: number;
   clicks: number;
   leads: number;
   sample: number | null;
   deal: number | null;
   signalText: string;
   signalType: 'healthy' | 'lead-issue' | 'close-issue' | 'critical' | 'strong';
   signalIcon: string;
}

// Presentation only: the tile label, icon and colour for each TrafficSource.
// Every number in the matrix comes from GET /marketing/platform-performance.
const CHANNEL_META: Record<string, { label: string; category: string; icon: string; color: string; bg: string }> = {
   FB_ADS: { label: 'Meta Ads', category: 'Paid Social', icon: 'Zap', color: '#2563EB', bg: '#EFF6FF' },
   IG_ADS: { label: 'Instagram Ads', category: 'Paid Social', icon: 'Instagram', color: '#EC4899', bg: '#FDF2F8' },
   TIKTOK_ADS: { label: 'TikTok Ads', category: 'Paid Social', icon: 'Share2', color: '#0F172A', bg: '#F1F5F9' },
   GOOGLE_ADS: { label: 'Google Ads', category: 'Paid Search', icon: 'Filter', color: '#D97706', bg: '#FEF3C7' },
   IG_ORGANIC: { label: 'Instagram Organic', category: 'Organic Social', icon: 'Instagram', color: '#EC4899', bg: '#FDF2F8' },
   FB_ORGANIC: { label: 'Facebook Organic', category: 'Organic Social', icon: 'ThumbsUp', color: '#2563EB', bg: '#EFF6FF' },
   TIKTOK_ORGANIC: { label: 'TikTok Organic', category: 'Organic Social', icon: 'Music2', color: '#0F172A', bg: '#F1F5F9' },
   LINKTREE: { label: 'Linktree', category: 'Link in Bio', icon: 'Link2', color: '#10B981', bg: '#ECFDF5' },
   OTHER: { label: 'Lain-lain', category: 'Other', icon: 'Globe', color: '#8B5CF6', bg: '#F5F3FF' },
};

// The audit signal is derived from the ad numbers that actually exist (ROAS, CPL,
// spend), not from a hand-written label. Per-channel sample and deal are not
// modelled in the backend, so those two columns render "—" rather than a guess.
function signalFor(roas: number, spend: number, cpl: number): Pick<PlatformRow, 'signalText' | 'signalType' | 'signalIcon'> {
   if (spend <= 0) return { signalText: 'Tanpa Belanja', signalType: 'close-issue', signalIcon: 'AlertTriangle' };
   if (roas >= 4) return { signalText: 'Strong', signalType: 'strong', signalIcon: 'Star' };
   if (roas >= 2) return { signalText: 'Healthy', signalType: 'healthy', signalIcon: 'CheckCircle2' };
   if (roas < 1) return { signalText: 'Critical', signalType: 'critical', signalIcon: 'AlertCircle' };
   if (cpl <= 0) return { signalText: 'Lead Issue', signalType: 'lead-issue', signalIcon: 'AlertCircle' };
   return { signalText: 'Perlu Audit', signalType: 'close-issue', signalIcon: 'AlertTriangle' };
}

// Rupiah in the compact form the legacy dashboard used: Rp 3,24 M / Rp 342,5 Jt / Rp 28 Rb.
function rupiah(value: number): string {
   const n = Number(value) || 0;
   if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
   if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
   if (Math.abs(n) >= 1_000) return `Rp ${Math.round(n / 1_000).toLocaleString('id-ID')} Rb`;
   return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function pct(numerator: number, denominator: number): string {
   if (!denominator) return '0,0';
   return ((numerator / denominator) * 100).toFixed(1).replace('.', ',');
}

const DigitalMarketing: React.FC = () => {
   const { data } = useQuery({
      queryKey: ['marketing-dashboard-analytics'],
      queryFn: async () => (await api.get('/marketing/analytics')).data,
      refetchInterval: 60000,
   });
   const { data: platformPerf } = useQuery({
      queryKey: ['marketing-platform-performance'],
      queryFn: async () => {
         const res = await api.get('/marketing/platform-performance');
         return Array.isArray(res.data) ? res.data : [];
      },
      refetchInterval: 60000,
   });

   const acquisition = data?.acquisition ?? {};
   const funnel = data?.funnel ?? {};
   const budget = data?.budget ?? {};
   const trends: any[] = Array.isArray(data?.trends) ? data.trends : [];

   const platforms: PlatformRow[] = (platformPerf ?? []).map((raw: any) => {
      const key = String(raw?.name ?? 'OTHER').toUpperCase().replace(/[^A-Z_]/g, '');
      const meta = CHANNEL_META[key] ?? CHANNEL_META.OTHER;
      return {
         id: key,
         name: meta.label,
         category: meta.category,
         icon: meta.icon,
         color: meta.color,
         bg: meta.bg,
         views: Number(raw?.impressions ?? 0),
         clicks: Number(raw?.clicks ?? 0),
         leads: Number(raw?.leads ?? 0),
         sample: null,
         deal: null,
         ...signalFor(Number(raw?.roas ?? 0), Number(raw?.spend ?? 0), Number(raw?.cpl ?? 0)),
      };
   });

   const totViews = platforms.reduce((acc: number, p: PlatformRow) => acc + p.views, 0);
   const totClicks = platforms.reduce((acc: number, p: PlatformRow) => acc + p.clicks, 0);
   const totLeads = Number(funnel.leadsQualified ?? platforms.reduce((acc: number, p: PlatformRow) => acc + p.leads, 0));
   const totSample = Number(funnel.samples ?? 0);
   const totDeal = Number(funnel.deals ?? 0);

   const revenue = Number(acquisition.revenue ?? 0);
   const revenueTarget = Number(acquisition.revenueTarget ?? acquisition.target ?? 0);
   const spend = Number(budget.totalSpend ?? 0);
   const spendTarget = Number(budget.budgetTarget ?? 0);
   const periodLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();

   const overallCtr = ((totClicks / totViews) * 100).toFixed(1);
   const overallLeadRate = ((totLeads / totClicks) * 100).toFixed(1);
   const overallSampleRate = ((totSample / totLeads) * 100).toFixed(1);
   const overallWinRate = ((totDeal / totSample) * 100).toFixed(1);

   return (
      <div className="view-section active" style={{ paddingBottom: '6rem', background: '#F8FAFC', minHeight: '100vh', padding: '2rem' }}>

         {/* 🚀 HEADER & TITLE */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
               <h2 className="dashboard-title" style={{ margin: 0, fontSize: '24px', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em' }}>MARKETING COMMAND CENTER</h2>
               <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Aureon Matrix v2.0: Funnel Ribbon Summary & Channel Audit Matrix</p>
            </div>
            <div style={{ background: 'white', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Icon name="Calendar" size={14} color="#64748B" />
               <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>{periodLabel}</span>
            </div>
         </div>

         {/* 🟠 I. EXECUTIVE KPI PILLARS */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 950, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '8px' }}>ACQUISITION HUB</span>
                  <Icon name="TrendingUp" color="#2563EB" size={16} />
               </div>
               <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>REVENUE SALES (MTD)</p>
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>{rupiah(revenue)}</h3>
                  <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', position: 'relative', overflow: 'hidden', marginTop: '8px' }}>
                     <div style={{ width: `${Math.min(100, revenueTarget > 0 ? (revenue / revenueTarget) * 100 : 0)}%`, height: '100%', background: '#2563EB' }}></div>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Target: {rupiah(revenueTarget)} <span style={{ color: '#2563EB' }}>({pct(revenue, revenueTarget)}%)</span></p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>CLIENT ACQ.</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{Number(acquisition.clientAcq ?? 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>AVG CPA</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{rupiah(acquisition.avgCPA)}</p>
                  </div>
               </div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 950, color: '#8B5CF6', background: '#F5F3FF', padding: '4px 10px', borderRadius: '8px' }}>FUNNEL EFFICIENCY</span>
                  <Icon name="Filter" color="#8B5CF6" size={16} />
               </div>
               <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>LEADS QUALIFIED</p>
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>{Number(funnel.leadsQualified ?? 0).toLocaleString('id-ID')}</h3>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#8B5CF6' }}>Conversion Lead-to-Sample: {Number(funnel.leadToSampleRate ?? 0).toFixed(1).replace('.', ',')}%</p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>PROSPECT</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{Number(funnel.prospects ?? 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>CLOSING RATE</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{Number(funnel.closingRate ?? 0).toFixed(1).replace('.', ',')}%</p>
                  </div>
               </div>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 950, color: '#EF4444', background: '#FEF2F2', padding: '4px 10px', borderRadius: '8px' }}>BUDGET AUDIT</span>
                  <Icon name="Wallet" color="#EF4444" size={16} />
               </div>
               <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>TOTAL AD SPEND</p>
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>{rupiah(spend)}</h3>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>Used: {Number(budget.budgetUsagePercent ?? pct(spend, spendTarget)).toFixed(0)}% of Monthly Budget</p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>COST PER LEAD</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{rupiah(budget.costPerLead)}</p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>COST / SAMPLE</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>{rupiah(budget.costPerSample)}</p>
                  </div>
               </div>
            </div>
         </div>

         {/* 📈 II & III. ANALISA TREN TAHUNAN */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>II. ANALISA TREN TAHUNAN (LEADS & CPL)</h3>
                  <div style={{ display: 'flex', gap: '15px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></div>
                        <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748B' }}>LEADS</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06B6D4' }}></div>
                        <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CPL</span>
                     </div>
                  </div>
               </div>
               <LineChart data={trends.map((t: any) => Number(t.leads ?? 0))} color="#2563EB" data2={trends.map((t: any) => Number(t.cpl ?? 0))} color2="#06B6D4" />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  {trends.map((t: any, i: number) => (
                     <span key={i} style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{t.date}</span>
                  ))}
               </div>
            </div>
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>III. TREN SAMPLES & AKUISISI (CPA)</h3>
                  <div style={{ display: 'flex', gap: '15px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
                        <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CLOSING</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                        <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CPA</span>
                     </div>
                  </div>
               </div>
               <LineChart data={trends.map((t: any) => Number(t.closing ?? 0))} color="#F59E0B" data2={trends.map((t: any) => Number(t.cpa ?? 0))} color2="#EF4444" />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  {trends.map((t: any, i: number) => (
                     <span key={i} style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{t.date}</span>
                  ))}
               </div>
            </div>
         </div>

         {/* 🎯 IV. VISUAL FUNNEL SUMMARY & CHANNEL AUDIT MATRIX */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Overall Funnel Summary (Continuous Connected Chevron Ribbon) */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '15px', fontWeight: 950, color: '#1E293B' }}>Overall Funnel Summary</h3>
               
               <div style={{ background: 'white', borderRadius: '24px', padding: '6px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', height: '90px', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
                     
                     {/* Stage 1: Reach */}
                     <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', 
                        color: 'white', 
                        padding: '1.25rem 2.2rem 1.25rem 1.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        clipPath: 'polygon(0% 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 0% 100%)',
                        position: 'relative',
                        zIndex: 5
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="Eye" color="white" size={20} />
                           </div>
                           <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, display: 'block' }}>Reach</span>
                              <span style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em' }}>{totViews.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '1px' }}>Impressions</span>
                           </div>
                        </div>
                     </div>
                     {/* Floating Badge 1 */}
                     <div style={{ position: 'absolute', left: 'calc(20% - 16px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 950, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        <span>{overallCtr}%</span>
                        <span style={{ fontSize: '8px', lineHeight: 0.8 }}>➔</span>
                     </div>

                     {/* Stage 2: Traffic */}
                     <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', 
                        color: 'white', 
                        padding: '1.25rem 2.2rem 1.25rem 2rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        clipPath: 'polygon(0% 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 0% 100%, 22px 50%)',
                        marginLeft: '-18px',
                        position: 'relative',
                        zIndex: 4
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="MousePointer" color="white" size={20} />
                           </div>
                           <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, display: 'block' }}>Traffic</span>
                              <span style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em' }}>{totClicks.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '1px' }}>Visits</span>
                           </div>
                        </div>
                     </div>
                     {/* Floating Badge 2 */}
                     <div style={{ position: 'absolute', left: 'calc(40% - 16px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 950, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        <span>{overallLeadRate}%</span>
                        <span style={{ fontSize: '8px', lineHeight: 0.8 }}>➔</span>
                     </div>

                     {/* Stage 3: Leads */}
                     <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', 
                        color: 'white', 
                        padding: '1.25rem 2.2rem 1.25rem 2rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        clipPath: 'polygon(0% 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 0% 100%, 22px 50%)',
                        marginLeft: '-18px',
                        position: 'relative',
                        zIndex: 3
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="Users" color="white" size={20} />
                           </div>
                           <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, display: 'block' }}>Leads</span>
                              <span style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em' }}>{totLeads.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '1px' }}>Qualified Leads</span>
                           </div>
                        </div>
                     </div>
                     {/* Floating Badge 3 */}
                     <div style={{ position: 'absolute', left: 'calc(60% - 16px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 950, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        <span>{overallSampleRate}%</span>
                        <span style={{ fontSize: '8px', lineHeight: 0.8 }}>➔</span>
                     </div>

                     {/* Stage 4: Sample */}
                     <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', 
                        color: 'white', 
                        padding: '1.25rem 2.2rem 1.25rem 2rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        clipPath: 'polygon(0% 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 0% 100%, 22px 50%)',
                        marginLeft: '-18px',
                        position: 'relative',
                        zIndex: 2
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="Package" color="white" size={20} />
                           </div>
                           <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, display: 'block' }}>Sample</span>
                              <span style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em' }}>{totSample.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '1px' }}>Samples Pitched</span>
                           </div>
                        </div>
                     </div>
                     {/* Floating Badge 4 */}
                     <div style={{ position: 'absolute', left: 'calc(80% - 16px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 950, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        <span>{overallWinRate}%</span>
                        <span style={{ fontSize: '8px', lineHeight: 0.8 }}>➔</span>
                     </div>

                     {/* Stage 5: Deal */}
                     <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        color: 'white', 
                        padding: '1.25rem 1.5rem 1.25rem 2rem', 
                        display: 'flex', 
                        alignItems: 'center',
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 22px 50%)',
                        marginLeft: '-18px',
                        position: 'relative',
                        zIndex: 1
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="CheckCircle2" color="white" size={20} />
                           </div>
                           <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9, display: 'block' }}>Deal</span>
                              <span style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em' }}>{totDeal}</span>
                              <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '1px' }}>Orders</span>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>

            {/* 2. Channel Audit Matrix Table */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
               
               <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '15px', fontWeight: 950, color: '#1E293B' }}>Channel Audit Matrix</h3>

               <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'separate', borderSpacing: '0 10px', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ color: '#64748B', fontSize: '11px', fontWeight: 800 }}>
                           <th style={{ padding: '8px 16px', width: '220px', letterSpacing: '0.05em' }}>CHANNEL</th>
                           <th style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 <Icon name="Eye" size={14} color="#2563EB" />
                                 <span>REACH</span>
                              </div>
                           </th>
                           <th style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 <Icon name="MousePointer" size={14} color="#4F46E5" />
                                 <div>
                                    <span>TRAFFIC</span>
                                    <span style={{ fontSize: '8px', color: '#94A3B8', display: 'block', fontWeight: 600 }}>CONV. RATE</span>
                                 </div>
                              </div>
                           </th>
                           <th style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 <Icon name="Users" size={14} color="#7C3AED" />
                                 <div>
                                    <span>LEADS</span>
                                    <span style={{ fontSize: '8px', color: '#94A3B8', display: 'block', fontWeight: 600 }}>CONV. RATE</span>
                                 </div>
                              </div>
                           </th>
                           <th style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 <Icon name="Package" size={14} color="#0D9488" />
                                 <div>
                                    <span>SAMPLE</span>
                                    <span style={{ fontSize: '8px', color: '#94A3B8', display: 'block', fontWeight: 600 }}>CONV. RATE</span>
                                 </div>
                              </div>
                           </th>
                           <th style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 <Icon name="CheckCircle2" size={14} color="#059669" />
                                 <div>
                                    <span>DEAL</span>
                                    <span style={{ fontSize: '8px', color: '#94A3B8', display: 'block', fontWeight: 600 }}>CONV. RATE</span>
                                 </div>
                              </div>
                           </th>
                           <th style={{ padding: '8px 16px', textAlign: 'center', width: '130px', letterSpacing: '0.05em' }}>AUDIT SIGNAL</th>
                        </tr>
                     </thead>
                     <tbody>
                        {platforms.map((p) => {
                           const ctr = ((p.clicks / p.views) * 100).toFixed(1);
                           const clickToLead = ((p.leads / p.clicks) * 100).toFixed(1);
                           const hasSampleData = p.sample !== null && p.deal !== null;
                           const leadToSample = hasSampleData ? ((p.sample! / p.leads) * 100).toFixed(1) : '—';
                           const sampleToDeal = hasSampleData ? ((p.deal! / p.sample!) * 100).toFixed(1) : '—';

                           // Audit Signal styles
                           let sigBg = '#F0FDF4';
                           let sigColor = '#166534';
                           let sigBorder = '#DCFCE7';

                           if (p.signalType === 'lead-issue') {
                              sigBg = '#FFFBEB';
                              sigColor = '#B45309';
                              sigBorder = '#FDE68A';
                           } else if (p.signalType === 'close-issue') {
                              sigBg = '#FEFCE8';
                              sigColor = '#A16207';
                              sigBorder = '#FEF08A';
                           } else if (p.signalType === 'critical') {
                              sigBg = '#FEF2F2';
                              sigColor = '#9F1239';
                              sigBorder = '#FECDD3';
                           } else if (p.signalType === 'strong' || p.signalType === 'healthy') {
                              sigBg = '#F0FDF4';
                              sigColor = '#166534';
                              sigBorder = '#DCFCE7';
                           }

                           return (
                              <tr key={p.id}>
                                 
                                 {/* Col 1: Channel Info */}
                                 <td style={{ padding: '10px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                       <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <Icon name={p.icon} color={p.color} size={18} />
                                       </div>
                                       <div>
                                          <span style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A', display: 'block' }}>{p.name}</span>
                                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{p.category}</span>
                                       </div>
                                    </div>
                                 </td>

                                 {/* Col 2: Reach */}
                                 <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                       <div style={{ background: '#F8FAFC', padding: '10px 20px', borderRadius: '14px', border: '1px solid #F1F5F9', minWidth: '100px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A' }}>{p.views.toLocaleString('id-ID')}</span>
                                       </div>
                                       <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                                    </div>
                                 </td>

                                 {/* Col 3: Traffic */}
                                 <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                       <div style={{ background: '#F8FAFC', padding: '8px 20px', borderRadius: '14px', border: '1px solid #F1F5F9', minWidth: '100px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A', display: 'block' }}>{p.clicks.toLocaleString('id-ID')}</span>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB' }}>{ctr}%</span>
                                       </div>
                                       <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                                    </div>
                                 </td>

                                 {/* Col 4: Leads */}
                                 <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                       <div style={{ background: '#F8FAFC', padding: '8px 20px', borderRadius: '14px', border: '1px solid #F1F5F9', minWidth: '100px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A', display: 'block' }}>{p.leads.toLocaleString('id-ID')}</span>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED' }}>{clickToLead}%</span>
                                       </div>
                                       <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                                    </div>
                                 </td>

                                 {/* Col 5: Sample */}
                                 <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                       <div style={{ background: '#F8FAFC', padding: '8px 20px', borderRadius: '14px', border: '1px solid #F1F5F9', minWidth: '100px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A', display: 'block' }}>{p.sample === null ? '—' : p.sample.toLocaleString('id-ID')}</span>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0D9488' }}>{leadToSample}%</span>
                                       </div>
                                       <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                                    </div>
                                 </td>

                                 {/* Col 6: Deal */}
                                 <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ background: '#F8FAFC', padding: '8px 20px', borderRadius: '14px', border: '1px solid #F1F5F9', minWidth: '100px', display: 'inline-block' }}>
                                       <span style={{ fontSize: '13px', fontWeight: 950, color: p.signalType === 'critical' ? '#EF4444' : '#10B981', display: 'block' }}>{p.deal === null ? '—' : `${p.deal} Orders`}</span>
                                       <span style={{ fontSize: '11px', fontWeight: 800, color: p.signalType === 'critical' ? '#EF4444' : '#10B981' }}>{sampleToDeal}%</span>
                                    </div>
                                 </td>

                                 {/* Col 7: Audit Signal */}
                                 <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                    <div style={{ background: sigBg, color: sigColor, border: `1px solid ${sigBorder}`, padding: '6px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800 }}>
                                       <Icon name={p.signalIcon} size={13} color={sigColor} />
                                       <span>{p.signalText}</span>
                                    </div>
                                 </td>

                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>

               {/* Footnote Note */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.5rem', color: '#94A3B8', fontSize: '11px', fontWeight: 600 }}>
                  <Icon name="Info" size={13} color="#94A3B8" />
                  <span>Conversion rates represent the % of users who advance to the next stage.</span>
               </div>

            </div>

         </div>
      </div>
   );
};

export default DigitalMarketing;
