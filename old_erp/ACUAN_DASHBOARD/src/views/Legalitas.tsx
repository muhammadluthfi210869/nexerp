import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const Legalitas: React.FC = () => {
  // 📋 Comprehensive Legal Database
  const hkiData = [
    { id: 'HKI-9001', brand: 'AUREON BEAUTY', type: 'BRAND NAME', client: 'AUREON CORP', apply: '2024-01-10', pic: 'SARAH', stage: 'GOV PROCESS', status: 'IN_PROGRESS', risk: 'NORMAL', time: 75 },
    { id: 'HKI-9004', brand: 'GLOW SERUM X', type: 'FORMULA', client: 'CLIENT_A', apply: '2024-02-15', pic: 'DODI', stage: 'APPROVED', status: 'DONE', risk: 'NORMAL', time: 42 },
    { id: 'HKI-8992', brand: 'SUN DEFENSE', type: 'LOGO', client: 'AUREON CORP', apply: '2023-11-20', pic: 'SARAH', stage: 'REJECTED', status: 'REJECT', risk: 'DELAY', time: 120 },
  ];

  const bpomData = [
    { id: 'BP-5001', name: 'NIGHT CREAM V2', cat: 'COSMETIC', client: 'AUREON CORP', apply: '2024-03-01', pic: 'SARAH', stage: 'LAB TEST', status: 'IN_PROGRESS', risk: 'NORMAL', time: 25 },
    { id: 'BP-5005', name: 'SPF 50 SPRAY', cat: 'COSMETIC', client: 'AUREON CORP', apply: '2024-02-10', pic: 'DODI', stage: 'EVALUATION', status: 'IN_PROGRESS', risk: 'DELAY', time: 52 },
    { id: 'BP-4990', name: 'LIP MATTE 01', cat: 'COSMETIC', client: 'CLIENT_B', apply: '2024-01-15', pic: 'SARAH', stage: 'APPROVED', status: 'DONE', risk: 'NORMAL', time: 45 },
  ];

  const expiryData = [
    { id: 'E-101', type: 'BPOM', name: 'FACIAL WASH PRO', client: 'AUREON CORP', cert: 'NA18200100234', issue: '2020-05-10', expiry: '2025-05-10', days: 405, pic: 'SARAH', status: 'ACTIVE' },
    { id: 'E-105', type: 'HKI', name: 'AUREON LOGO', client: 'AUREON CORP', cert: 'IDM000123456', issue: '2014-04-02', expiry: '2024-04-02', days: 0, pic: 'DODI', status: 'EXPIRED' },
    { id: 'E-108', type: 'BPOM', name: 'ACNE SPOT GEL', client: 'AUREON CORP', cert: 'NA18190100567', issue: '2021-07-20', expiry: '2024-07-20', days: 109, pic: 'SARAH', status: 'EXPIRING' },
  ];

  const staffData = [
    { name: 'SARAH', case: 45, done: 38, progress: 5, avg: '42d', delay: 2, rate: '84%' },
    { name: 'DODI', case: 32, done: 28, progress: 3, avg: '38d', delay: 1, rate: '87%' },
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        LEGAL & COMPLIANCE COMMAND <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(HKI & BPOM Audit)</span>
      </h2>

      {/* 🚀 I. EXECUTIVE OVERVIEW (Legal Pillars) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        
        {/* OVERALL STATUS */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="ShieldCheck" size={14} color="#3B82F6" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>OVERALL REGISTRATION</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
             <div><p style={{ fontSize: '18px', fontWeight: 950, margin: 0 }}>142</p><p style={{ fontSize: '8px', color: '#64748B', fontWeight: 800, margin: 0 }}>ACTIVE TOTAL</p></div>
             <div style={{ textAlign: 'right' }}><p style={{ fontSize: '18px', fontWeight: 950, margin: 0, color: '#10B981' }}>12</p><p style={{ fontSize: '8px', color: '#64748B', fontWeight: 800, margin: 0 }}>THIS MONTH</p></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
             <div style={{ flex: 1, background: '#F1F5F9', padding: '8px', borderRadius: '10px' }}><p style={{ fontSize: '11px', fontWeight: 950, margin: 0 }}>24</p><p style={{ fontSize: '7px', color: '#64748B', margin: 0 }}>ON PROGRESS</p></div>
             <div style={{ flex: 1, background: '#FFF1F2', padding: '8px', borderRadius: '10px' }}><p style={{ fontSize: '11px', fontWeight: 950, margin: 0, color: '#EF4444' }}>8</p><p style={{ fontSize: '7px', color: '#EF4444', margin: 0 }}>DELAYED</p></div>
          </div>
        </div>

        {/* BPOM PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Stethoscope" size={14} color="#10B981" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>BPOM PERFORMANCE</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>45.2<span style={{ fontSize: '12px' }}> days</span></p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>AVG PROCESSING TIME</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '9px', color: '#64748B' }}>LAB TEST</span><span style={{ fontSize: '9px', fontWeight: 950 }}>14d</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '9px', color: '#64748B' }}>GOV EVAL</span><span style={{ fontSize: '9px', fontWeight: 950 }}>31d</span></div>
          </div>
        </div>

        {/* HKI PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Bookmark" size={14} color="#8B5CF6" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>HKI PERFORMANCE</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>120<span style={{ fontSize: '12px' }}> days</span></p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>AVG PROCESSING TIME</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '9px', color: '#64748B' }}>DOC PREP</span><span style={{ fontSize: '9px', fontWeight: 950 }}>7d</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '9px', color: '#64748B' }}>GOV PROCESS</span><span style={{ fontSize: '9px', fontWeight: 950 }}>113d</span></div>
          </div>
        </div>

        {/* RISK MONITOR */}
        <div style={{ background: '#FFF1F2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FECDD3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Zap" size={14} color="#E11D48" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>RISK MONITOR</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ background: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #FECDD3' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>EXPIRED</p>
                <p style={{ fontSize: '20px', fontWeight: 950, color: '#E11D48', margin: 0 }}>2</p>
             </div>
             <div style={{ background: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #FECDD3' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>&lt; 90 DAYS</p>
                <p style={{ fontSize: '20px', fontWeight: 950, color: '#F59E0B', margin: 0 }}>5</p>
             </div>
          </div>
          <div style={{ background: '#9F1239', padding: '8px', borderRadius: '10px', marginTop: '10px', textAlign: 'center' }}>
             <p style={{ fontSize: '8px', fontWeight: 950, color: '#ffffff', margin: 0 }}>CRITICAL ACTION REQUIRED</p>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
         
         {/* 🧾 TABLE 1 — HKI TRACKING */}
         <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Icon name="Search" size={14} color="#8B5CF6" /> 1. HKI (HAK KEKAYAAN INTELEKTUAL) TRACKING HUB
            </h3>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                  <thead>
                     <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '1rem 1.5rem', width: '22%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>BRAND / PRODUCT (HKI ID)</th>
                        <th style={{ padding: '1rem 1rem', width: '15%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>TYPE / CLIENT</th>
                        <th style={{ padding: '1rem 1rem', width: '12%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>PIC/APPLY</th>
                        <th style={{ padding: '1rem 1rem', width: '18%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>FLOW STATE (DAYS)</th>
                        <th style={{ padding: '1rem 1rem', width: '10%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>STATUS</th>
                        <th style={{ padding: '1rem 1.5rem', width: '13%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'right' }}>AUDIT RISK</th>
                     </tr>
                  </thead>
                  <tbody>
                     {hkiData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.brand}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8' }}>{row.id}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.type}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{row.client}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950, color: '#6366F1' }}>{row.pic}</div>
                              <div style={{ fontSize: '8px', color: '#94A3B8' }}>{row.apply}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.stage}</div>
                              <div style={{ fontSize: '8px', color: '#1E293B' }}>{row.time} DAYS ELAPSED</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <span style={{ 
                                 background: row.status === 'DONE' ? '#10B981' : (row.status === 'REJECT' ? '#EF4444' : '#F59E0B'), 
                                 color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '8px', fontWeight: 950 
                              }}>{row.status}</span>
                           </td>
                           <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                              <span style={{ 
                                 color: row.risk === 'DELAY' ? '#EF4444' : '#10B981', 
                                 fontSize: '9px', fontWeight: 950 
                              }}>{row.risk === 'DELAY' ? '⚠️ DELAY AUDIT' : 'OK'}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* 🧾 TABLE 2 — BPOM TRACKING */}
         <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Icon name="Stethoscope" size={14} color="#10B981" /> 2. BPOM (NOTIFIKASI KOSMETIK) PROGRESS AUDIT
            </h3>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                  <thead>
                     <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '1rem 1.5rem', width: '22%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>PRODUCT NAME (BPOM ID)</th>
                        <th style={{ padding: '1rem 1rem', width: '15%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>CATEGORY / CLIENT</th>
                        <th style={{ padding: '1rem 1rem', width: '12%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>PIC/APPLY</th>
                        <th style={{ padding: '1rem 1rem', width: '18%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>STAGE (BOTTLENECK)</th>
                        <th style={{ padding: '1rem 1rem', width: '10%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>STATUS</th>
                        <th style={{ padding: '1rem 1.5rem', width: '13%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'right' }}>DAYS ELAPSED</th>
                     </tr>
                  </thead>
                  <tbody>
                     {bpomData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.name}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8' }}>{row.id}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.cat}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{row.client}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950, color: '#10B981' }}>{row.pic}</div>
                              <div style={{ fontSize: '8px', color: '#94A3B8' }}>{row.apply}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.stage}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <span style={{ 
                                 background: row.status === 'DONE' ? '#10B981' : (row.risk === 'DELAY' ? '#EF4444' : '#F59E0B'), 
                                 color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '8px', fontWeight: 950 
                              }}>{row.status}</span>
                           </td>
                           <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', fontWeight: 950, color: row.risk === 'DELAY' ? '#EF4444' : '#1E293B' }}>{row.time}d</div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* 🧾 TABLE 3 — EXPIRY TRACKING (CRITICAL) */}
         <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#E11D48', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="Calendar" size={14} color="#E11D48" /> 3. CRITICAL EXPIRY AUDIT (PROTECTION)
               </h3>
               <div style={{ background: '#FFF1F2', borderRadius: '24px', border: '1px solid #FECDD3', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#FECDD3', borderBottom: '1px solid #FECDD3' }}>
                           <th style={{ padding: '1rem', width: '40%', fontSize: '8px', fontWeight: 950, color: '#9F1239' }}>TYPE / REGISTRATION (BRAND)</th>
                           <th style={{ padding: '1rem', width: '30%', fontSize: '8px', fontWeight: 950, color: '#9F1239', textAlign: 'center' }}>CERT NUMBER / EXPIRY</th>
                           <th style={{ padding: '1rem', width: '30%', fontSize: '8px', fontWeight: 950, color: '#9F1239', textAlign: 'right' }}>DAYS LEFT</th>
                        </tr>
                     </thead>
                     <tbody>
                        {expiryData.map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #FECDD3' }}>
                              <td style={{ padding: '1.25rem 1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.name}</div>
                                 <div style={{ fontSize: '8px', fontWeight: 900, color: '#9F1239' }}>[{row.type}] | CLIENT: {row.client}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <div style={{ fontSize: '9px', fontWeight: 950 }}>{row.cert}</div>
                                 <div style={{ fontSize: '9px', fontWeight: 950, color: '#E11D48' }}>{row.expiry}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                 <span style={{ 
                                    background: row.status === 'EXPIRED' ? '#E11D48' : (row.status === 'EXPIRING' ? '#F59E0B' : '#10B981'), 
                                    color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '9px', fontWeight: 950 
                                 }}>{row.days}D</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 🧾 TABLE 4 — PERFORMANCE STAFF */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="Users" size={14} color="#0369A1" /> 4. LEGAL STAFF PERFORMANCE
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '8px', fontWeight: 950 }}>STAFF NAME</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '8px', fontWeight: 950 }}>DONE/TOTAL</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '8px', fontWeight: 950 }}>WIN RATE</th>
                        </tr>
                     </thead>
                     <tbody>
                        {staffData.map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.name}</div>
                                 <div style={{ fontSize: '8px', color: '#64748B' }}>AVG: {row.avg}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.done} / {row.case}</div>
                                 <div style={{ fontSize: '8px', color: '#EF4444' }}>{row.delay} DELAYED</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '14px', fontWeight: 950, color: '#10B981' }}>{row.rate}</div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default Legalitas;
