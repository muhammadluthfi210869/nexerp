import React, { useState } from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
   const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
   return <LucideIcon size={size} color={color} style={style} />;
};

const LineChart: React.FC<{ data: number[], color: string, color2?: string, data2?: number[] }> = ({ data, color, color2, data2 }) => {
   const max = 150;
   const width = 500;
   const height = 150;
   const step = width / (data.length - 1);

   const points = data.map((d, i) => `${i * step},${height - (d / max) * height}`).join(' ');
   const points2 = data2 ? data2.map((d, i) => `${i * step},${height - (d / max) * height}`).join(' ') : null;

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
            <circle key={i} cx={i * step} cy={height - (d / max) * height} r="4" fill="white" stroke={color} strokeWidth="2" />
         ))}
      </svg>
   );
};

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
   const total = data.reduce((acc, curr) => acc + curr.value, 0);
   let cumulativeValue = 0;

   return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
         {data.map((slice, i) => {
            const startPercentage = cumulativeValue / total;
            cumulativeValue += slice.value;
            const endPercentage = cumulativeValue / total;

            const x1 = 50 + 40 * Math.cos(2 * Math.PI * startPercentage - Math.PI / 2);
            const y1 = 50 + 40 * Math.sin(2 * Math.PI * startPercentage - Math.PI / 2);
            const x2 = 50 + 40 * Math.cos(2 * Math.PI * endPercentage - Math.PI / 2);
            const y2 = 50 + 40 * Math.sin(2 * Math.PI * endPercentage - Math.PI / 2);

            const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
            const d = `M ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`;

            return (
               <path key={i} d={d} fill="none" stroke={slice.color} strokeWidth="15" />
            );
         })}
         <circle cx="50" cy="50" r="32.5" fill="white" />
      </svg>
   );
};

const DigitalMarketing: React.FC = () => {
   const [activePlatform, setActivePlatform] = useState('INSTAGRAM');

   return (
      <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>

         {/* 🚀 HEADER & TITLE */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
               <h2 className="dashboard-title" style={{ margin: 0 }}>MARKETING COMMAND CENTER</h2>
               <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Aureon Matrix v2.0: Funnel Audit & Content Vitality</p>
            </div>
            <div style={{ background: 'white', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Icon name="Calendar" size={14} color="#64748B" />
               <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>MARCH 2024</span>
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
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>Rp 3.24 M</h3>
                  <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', position: 'relative', overflow: 'hidden', marginTop: '8px' }}>
                     <div style={{ width: '72%', height: '100%', background: '#2563EB' }}></div>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Target: Rp 4.5M <span style={{ color: '#2563EB' }}>(72%)</span></p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>CLIENT ACQ.</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>42 <span style={{ fontSize: '10px', color: '#10B981' }}>+12%</span></p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>AVG CPA</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>Rp 1.4M</p>
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
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>1,240</h3>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#8B5CF6' }}>Conversion Lead-to-Sample: 45%</p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>PROSPECT</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>84</p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>CLOSING RATE</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>64.2%</p>
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
                  <h3 style={{ margin: '4px 0', fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>Rp 342.5 Jt</h3>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>Used: 68% of Monthly Budget</p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>COST PER LEAD</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>Rp 28k</p>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
                     <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>COST / SAMPLE</p>
                     <p style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>Rp 145k</p>
                  </div>
               </div>
            </div>
         </div>

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
               <LineChart data={[40, 55, 45, 78, 85, 60, 95, 110, 90, 120, 130, 140]} color="#2563EB" data2={[120, 110, 105, 95, 80, 85, 70, 65, 75, 70, 60, 55]} color2="#06B6D4" />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                     <span key={m} style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{m}</span>
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
               <LineChart data={[60, 65, 82, 75, 95, 88, 70, 95, 110, 85, 120, 135]} color="#F59E0B" data2={[140, 130, 125, 115, 100, 105, 90, 85, 95, 90, 80, 75]} color2="#EF4444" />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                     <span key={m} style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{m}</span>
                  ))}
               </div>
            </div>
         </div>

         {/* 📊 ROW 1: TOP LEADERS & VITALITAS */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* VII. TOP 5 CONTENT LEADERS (Top List Product) */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Icon name="Trophy" color="#F59E0B" />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>IV. TOP LIST CONTENT LEADERS</h3>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: 'Day in Life: Formula R&D Perfection', eng: '12.4%', views: '240K', cat: 'SKINCARE' },
                    { name: 'Serum Brightening: Before vs After', eng: '10.2%', views: '185K', cat: 'BODYCARE' },
                    { name: 'Founder Insights: Brand Scalability', eng: '15.6%', views: '412K', cat: 'COSMETIC' },
                    { name: 'Formula Secret: SPF 50+ Testing', eng: '9.8%', views: '95K', cat: 'SKINCARE' },
                  ].map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                       <div>
                          <span style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', display: 'block' }}>{c.cat}</span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>{c.name}</span>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', fontWeight: 950, color: '#10B981', display: 'block' }}>{c.eng} ER</span>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>{c.views} Views</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* V. VITALITAS KONTEN */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                  <Icon name="Activity" color="#EC4899" />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>V. VITALITAS KONTEN</h3>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#FDF2F8', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FCE7F3' }}>
                     <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#BE185D' }}>DISIPLIN PRODUKSI</p>
                     <h4 style={{ margin: '14px 0', fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>24 <span style={{ fontSize: '12px', color: '#64748B' }}>/ 30 Konten</span></h4>
                     <div style={{ height: '6px', background: 'white', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '80%', height: '100%', background: '#EC4899' }}></div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>ER RATE</span>
                        <span style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B' }}>4.2%</span>
                     </div>
                     <div style={{ background: '#F0F9FF', padding: '12px', borderRadius: '16px', border: '1px solid #E0F2FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#0369A1' }}>FOLLOWERS</span>
                        <span style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B' }}>18.4K</span>
                     </div>
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Heart', 'MessageCircle', 'Share2', 'Bookmark'].map((i, idx) => (
                     <div key={idx} style={{ textAlign: 'center', background: '#F8FAFC', padding: '12px 5px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                        <Icon name={i} size={12} color="#94A3B8" />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* 📊 ROW 2: PLATFORM AUDIT (CONTENT VITALITY AUDIT) - FULL WIDTH */}
         <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', marginBottom: '2.5rem' }}>
            <div style={{ width: '180px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
               <p style={{ margin: '0 1.5rem 1rem', fontSize: '10px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em' }}>AUDIT SOURCES</p>
               {[{ id: 'INSTAGRAM', icon: 'Instagram', color: '#E1306C' }, { id: 'FACEBOOK', icon: 'Facebook', color: '#1877F2' }, { id: 'YOUTUBE', icon: 'Youtube', color: '#FF0000' }, { id: 'TIKTOK', icon: 'Music', color: '#000000' }].map((p) => (
                  <button key={p.id} onClick={() => setActivePlatform(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 1.5rem', border: 'none', background: activePlatform === p.id ? '#0F172A' : 'transparent', color: activePlatform === p.id ? 'white' : '#94A3B8', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                     <Icon name={p.icon} size={16} color={activePlatform === p.id ? 'white' : '#94A3B8'} />
                     <span style={{ fontSize: '10px', fontWeight: 950 }}>{p.id}</span>
                  </button>
               ))}

               <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
                  <p style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', marginBottom: '8px' }}>LIVE STATUS</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '10px', fontWeight: 950, color: '#0F172A' }}>TRACKING</span>
                     <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></div>
                     <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981' }}>ONLINE</span>
                  </div>
               </div>
            </div>
            <div style={{ flex: 1, padding: '2.5rem', overflow: 'hidden' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div>
                     <h4 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>VI. {activePlatform} AUDIT</h4>
                     <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Content Vitality Audit • Period: March 2024</p>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748B', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '100px' }}>VERIFIED DATA</span>
               </div>

               {/* Platform Summary Table */}
               <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '1.5rem', marginBottom: '2.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ textAlign: 'left' }}>
                           <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>PERIOD</th>
                           <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>CREATED POST</th>
                           <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: '#10B981', textAlign: 'center' }}>ENG. RATE</th>
                           <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: '#2563EB', textAlign: 'center' }}>FOLLOWERS</th>
                           <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: '#EF4444', textAlign: 'center' }}>UNFOLLOW</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr style={{ borderTop: '1px solid #F8FAFC' }}>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 800, color: '#64748B' }}>DESEMBER</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 900, textAlign: 'center' }}>12</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#10B981', textAlign: 'center' }}>46.63%</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#2563EB', textAlign: 'center' }}>705</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#EF4444', textAlign: 'center' }}>10</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #F8FAFC' }}>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 800, color: '#64748B' }}>JANUARI</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 900, textAlign: 'center' }}>7</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#10B981', textAlign: 'center' }}>16.94%</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#2563EB', textAlign: 'center' }}>901</td>
                           <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 950, color: '#EF4444', textAlign: 'center' }}>47</td>
                        </tr>
                        <tr style={{ background: '#4F46E5', borderRadius: '12px' }}>
                           <td style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 900, color: 'white', borderRadius: '12px 0 0 12px' }}>GROWTH</td>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 950, color: 'white', textAlign: 'center' }}>- 70.8%</td>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 950, color: 'white', textAlign: 'center' }}>+63.6%</td>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 950, color: 'white', textAlign: 'center' }}>+27.8%</td>
                           <td style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 950, color: 'white', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>+370%</td>
                        </tr>
                     </tbody>
                  </table>
               </div>

               <p style={{ fontSize: '10px', fontWeight: 950, color: '#94A3B8', marginBottom: '1.25rem', letterSpacing: '0.1em' }}>GRANULAR ENGAGEMENT METRICS</p>
               <div style={{ background: '#F8FAFC', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead style={{ background: '#FFFFFF' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>MONTH</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textAlign: 'center' }}>POSTS</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textAlign: 'center' }}>REACH</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textAlign: 'center' }}>LIKES</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textAlign: 'center' }}>COMMENT</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textAlign: 'center' }}>SAVE</th>
                           <th style={{ padding: '14px 18px', fontSize: '10px', fontWeight: 800, color: '#2563EB', textAlign: 'center' }}>VISIT</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr style={{ background: 'white' }}>
                           <td style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>DESEMBER</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 900, textAlign: 'center' }}>12</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>5,258</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>126</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>6</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>6</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 950, textAlign: 'center', color: '#2563EB' }}>210</td>
                        </tr>
                        <tr style={{ background: 'white', borderTop: '1px solid #F8FAFC' }}>
                           <td style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>JANUARI</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 900, textAlign: 'center' }}>7</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 950, textAlign: 'center', color: '#10B981' }}>2.5M+</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>1,191</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>171</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>63</td>
                           <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 950, textAlign: 'center', color: '#2563EB' }}>2,920</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* 📊 ROW 3&4: ADS PERFORMANCE & LEADS RANKING */}
         <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ background: '#F5F3FF', padding: '1.5rem', borderRadius: '32px', border: '1px solid #DDD6FE' }}>
               <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '12px', fontWeight: 950, color: '#5B21B6' }}>VII. RANKING SUMBER LEADS</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[{ p: 'Linktree', c: '450' }, { p: 'Instagram', c: '320' }, { p: 'TikTok', c: '280' }].map((src, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '16px', border: '1px solid #E9D5FF' }}>
                        <span style={{ fontSize: '11px', fontWeight: 950 }}>{src.p}</span>
                        <span style={{ fontSize: '12px', fontWeight: 950, color: '#5B21B6' }}>{src.c} Leads</span>
                     </div>
                  ))}
               </div>
            </div>
            <div>
               {/* Space reserved for other visual audit components */}
            </div>
         </div>

         {/* 📊 VIII. ADS PERFORMANCE DASHBOARD (ROAS FOCUS) */}
         <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '2.5rem', marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'center' }}>
            <div>
               <h3 style={{ margin: '0 0 2rem 0', fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>VIII. ADS PERFORMANCE DASHBOARD (ROAS FOCUS)</h3>
               <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B', textAlign: 'left' }}>PLATFORM</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SPEND</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#8B5CF6' }}>LEADS</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#10B981' }}>CPL</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>REACH</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>IMP</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>CPM</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#8B5CF6' }}>CLICK</th>
                           <th style={{ padding: '14px', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>CPC</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { p: 'META (IG/FB)', color: '#EC4899', spend: 'Rp 43.0M', leads: '852', cpl: 'Rp 49.883', reach: '1.2M', imp: '1.9M', cpm: 'Rp 22.973', click: '24.500', cpc: 'Rp 1.735' },
                           { p: 'GOOGLE SEARCH', color: '#2563EB', spend: 'Rp 31.0M', leads: '518', cpl: 'Rp 60.232', reach: '0.8M', imp: '1.1M', cpm: 'Rp 27.857', click: '18.200', cpc: 'Rp 1.714' },
                           { p: 'TIKTOK ADS', color: '#0F172A', spend: 'Rp 15.0M', leads: '315', cpl: 'Rp 48.889', reach: '4.5M', imp: '6.8M', cpm: 'Rp 2.265', click: '58.400', cpc: 'Rp 264' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.color }}></div>
                                 <span style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.p}</span>
                              </td>
                              <td style={{ padding: '16px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 900, color: '#1E293B' }}>{row.spend}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#8B5CF6' }}>{row.leads}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 950, color: '#10B981' }}>{row.cpl}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>{row.reach}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>{row.imp}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>{row.cpm}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#8B5CF6' }}>{row.click}</td>
                              <td style={{ padding: '16px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>{row.cpc}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
            <div style={{ textAlign: 'center' }}>
               <p style={{ margin: '0 0 1.5rem 0', fontSize: '11px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em' }}>SHARE OF ADS SPEND</p>
               <div style={{ width: '220px', height: '220px', margin: '0 auto 2rem' }}>
                  <DonutChart data={[{ label: 'META', value: 47, color: '#EC4899' }, { label: 'GOOGLE', value: 35, color: '#2563EB' }, { label: 'TIKTOK', value: 18, color: '#0F172A' }]} />
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EC4899' }}></div>
                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#1E293B' }}>META: 47%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></div>
                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#1E293B' }}>GOOGLE: 35%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F172A' }}></div>
                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#1E293B' }}>TIKTOK: 18%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
                     <span style={{ fontSize: '10px', fontWeight: 950, color: '#10B981' }}>AVG ROAS: 3.4x</span>
                  </div>
               </div>
            </div>
         </div>

         {/* 📊 IX. SEARCH VISIBILITY AUDIT (Bottom Overview) */}
         <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: '2.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '12px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em' }}>IX. SEARCH VISIBILITY AUDIT (SEO/ADS OVERVIEW)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
               {[
                  { label: 'TOTAL IMPRESSIONS', val: '2.4M', sub: '+18.4% vs Prev', icon: 'Eye', color: '#6366F1', bg: '#EEF2FF' },
                  { label: 'TOTAL CLICKS', val: '185.3K', sub: '+4.2% Growth', icon: 'MousePointer2', color: '#10B981', bg: '#ECFDF5' },
                  { label: 'AVG. CTR', val: '7.7%', sub: 'Target 5.5%', icon: 'CursorClick', color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'AVG. POSITION', val: '4.2', sub: 'Top 10 Benchmark', icon: 'BarChart', color: '#8B5CF6', bg: '#F5F3FF' },
               ].map((card, i) => (
                  <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', background: card.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Icon name={card.icon} color={card.color} size={18} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 950, color: card.color }}>{card.sub}</span>
                     </div>
                     <div>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{card.label}</p>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>{card.val}</h3>
                     </div>
                  </div>
               ))}
            </div>
         </div>

      </div>
   );
};

export default DigitalMarketing;
