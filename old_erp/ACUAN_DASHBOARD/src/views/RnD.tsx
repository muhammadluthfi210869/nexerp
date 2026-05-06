import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const PipelineFlow: React.FC<{ stage: string }> = ({ stage }) => {
  const steps = ['NOT START', 'REV 1', 'REV 2', 'EXTRA', 'DEAL'];
  const stageMap: Record<string, number> = {
    'REQUEST': 0,
    'DEVELOPMENT': 1,
    'TESTING': 2,
    'REVISION': 3,
    'SAMPLE': 3,
    'APPROVED': 4,
  };
  const current = stageMap[stage] ?? 0;

  return (
    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', alignItems: 'center' }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '32px', 
            height: '6px', 
            borderRadius: '3px', 
            background: i <= current ? (i === current ? '#2563EB' : '#93C5FD') : '#F1F5F9',
            border: i === current ? '1px solid #1D4ED8' : 'none'
          }}></div>
          <span style={{ fontSize: '7px', fontWeight: 950, color: i === current ? '#1E293B' : '#94A3B8' }}>{step}</span>
        </div>
      ))}
    </div>
  );
};

const RnD: React.FC = () => {
  return (
    <div className="view-section active" style={{ paddingBottom: '5rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        DIVISI R&D (Product Innovation Lab) <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Pusat Kendali Formula & Sampel)</span>
      </h2>

      {/* 🚀 OVERVIEW GRID: R&D VITALITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* 🔴 A. TIMELINESS (Ketepatan Waktu) */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 A. TIMELINESS</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px' }}>
               <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', margin: 0 }}>ON-TIME SAMPLE RATE</p>
               <p style={{ fontSize: '20px', fontWeight: 950, color: '#10B981', margin: '4px 0' }}>85.4%</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
               <div>
                  <p style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>AVG CYCLE</p>
                  <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: 0 }}>4.2 <span style={{ fontSize: '9px' }}>DAYS</span></p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>OVERDUE</p>
                  <p style={{ fontSize: '14px', fontWeight: 950, color: '#EF4444', margin: 0 }}>3 <span style={{ fontSize: '9px' }}>SAMPLES</span></p>
               </div>
            </div>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            Insight: <span style={{ color: '#1E293B' }}>Cepat atau lambat?</span>
          </p>
        </div>

        {/* 🟠 B. ACCURACY (Kualitas Hasil R&D) */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <div style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%' }}></div>
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟠 B. ACCURACY</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px' }}>
                <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', margin: 0 }}>FIRST-TIME APPROVAL</p>
                <p style={{ fontSize: '20px', fontWeight: 950, color: '#2563EB', margin: '4px 0' }}>72.1%</p>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                <div>
                   <p style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>AVG REVISION</p>
                   <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: 0 }}>1.4 <span style={{ fontSize: '9px' }}>X</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>FAILED</p>
                   <p style={{ fontSize: '14px', fontWeight: 950, color: '#EF4444', margin: 0 }}>5 <span style={{ fontSize: '9px' }}>ITEMS</span></p>
                </div>
             </div>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            Insight: <span style={{ color: '#1E293B' }}>Banyak revisi atau tidak?</span>
          </p>
        </div>

        {/* 🟡 C. APPROVAL PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <div style={{ width: '8px', height: '8px', background: '#EAB308', borderRadius: '50%' }}></div>
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟡 C. APPROVAL PERFORMANCE</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>84.4%</p>
             <p style={{ fontSize: '9px', fontWeight: 850, color: '#64748B', margin: 0 }}>OVERALL APPROVAL RATE</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#FFFBEB', padding: '10px', borderRadius: '12px' }}>
             <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '8px', fontWeight: 800, color: '#B45309', margin: 0 }}>SUBMITTED</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: 0 }}>45</p>
             </div>
             <div style={{ width: '1px', background: '#FEF3C7' }}></div>
             <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '8px', fontWeight: 800, color: '#B45309', margin: 0 }}>APPROVED</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: 0 }}>38</p>
             </div>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            Insight: <span style={{ color: '#1E293B' }}>Diterima market atau tidak?</span>
          </p>
        </div>

        {/* 🔵 D. R&D PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <div style={{ width: '8px', height: '8px', background: '#3B82F6', borderRadius: '50%' }}></div>
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔵 D. R&D PERFORMANCE</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '12px' }}>
                <p style={{ fontSize: '8px', fontWeight: 800, color: '#1D4ED8', margin: 0 }}>ACTIVE PJKT</p>
                <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>12</p>
             </div>
             <div style={{ background: '#F0FDF4', padding: '10px', borderRadius: '12px' }}>
                <p style={{ fontSize: '8px', fontWeight: 800, color: '#166534', margin: 0 }}>COMPLETED</p>
                <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>28</p>
             </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>UTILIZATION RATE</span>
                <span style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>92%</span>
             </div>
             <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: '#3B82F6' }}></div>
             </div>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
             Insight: <span style={{ color: '#1E293B' }}>Tim produktif atau tidak?</span>
          </p>
        </div>

      </div>

      {/* 🔴 1. RND PIPELINE TABLE */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 1. R&D PIPELINE MASTER (FLOW VELOCITY)</h3>
        <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>RND ID / BRAND</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>PRODUCT NAME</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TEAM (BD / PIC)</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>CURRENT STAGE</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TIME AUDIT</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>QUALITY (REV)</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>STATUS</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TIMELINESS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'RD-24-041', brand: 'DERMA GLOW', prod: 'Brightening Serum V3', bd: 'Andi P.', pic: 'Dr. Sarah', stage: 'DEVELOPMENT', start: '2024-03-20', target: '2024-03-25', days: '2 Days', total: '2 Days', rev: '0', first: true, status: 'ONGOING', onTime: true, delay: 0 },
                  { id: 'RD-24-038', brand: 'PURE SKIN', prod: 'Moisturizer Gel', bd: 'Citra K.', pic: 'Irfan J.', stage: 'TESTING', start: '2024-03-10', target: '2024-03-18', days: '12 Days', total: '12 Days', rev: '2', first: false, status: 'ONGOING', onTime: false, delay: 4 },
                  { id: 'RD-24-035', brand: 'AUREON BEAUTY', prod: 'Sunscreen SPF 50', bd: 'Andi P.', pic: 'Dr. Sarah', stage: 'APPROVED', start: '2024-02-15', target: '2024-02-25', days: '-', total: '10 Days', rev: '1', first: false, status: 'APPROVED', onTime: true, delay: 0 },
                  { id: 'RD-24-032', brand: 'ZEN LABS', prod: 'Acne Toner', bd: 'Budi S.', pic: 'Maya T.', stage: 'REVISION', start: '2024-03-01', target: '2024-03-10', days: '22 Days', total: '22 Days', rev: '3', first: false, status: 'ONGOING', onTime: false, delay: 12 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: !row.onTime ? '#FFF1F2' : 'transparent' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748B' }}>#{row.id}</div>
                       <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.brand}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '13px', fontWeight: 900, color: '#1E293B' }}>{row.prod}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>{row.pic}</div>
                       <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>BD: {row.bd}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <PipelineFlow stage={row.stage} />
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <div style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B' }}>In Stage: {row.days}</div>
                       <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>Total: {row.total}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <div style={{ fontSize: '14px', fontWeight: 950, color: row.rev === '0' ? '#10B981' : '#F59E0B' }}>{row.rev} <span style={{ fontSize: '9px' }}>X</span></div>
                       {row.first && <div style={{ fontSize: '8px', fontWeight: 900, color: '#10B981' }}>FIRST-TIME</div>}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <span style={{ 
                         background: row.status === 'APPROVED' ? '#10B981' : (row.status === 'REJECTED' ? '#EF4444' : '#64748B'),
                         color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950
                       }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       {row.onTime ? (
                         <span style={{ color: '#10B981', fontWeight: 950, fontSize: '10px' }}>ON-TIME</span>
                       ) : (
                         <div style={{ color: '#E11D48' }}>
                            <span style={{ fontWeight: 950, fontSize: '10px' }}>DELAY</span>
                            <div style={{ fontSize: '9px', fontWeight: 800 }}>+{row.delay} DAYS</div>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem' }}>
         
         {/* 🟠 2. RND PERFORMANCE TABLE */}
         <div>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟠 2. R&D PERFORMANCE EVALUATION (PER PERSON)</h3>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>PIC NAME / PERIOD</th>
                    <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>OUTPUT (COMP/APP)</th>
                    <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>EFFICIENCY</th>
                    <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>QUALITY</th>
                    <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>UTILIZATION</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Dr. Sarah', comp: '12 / 10', speed: '3.5d', ot: '92%', first: '85%', util: '95%' },
                    { name: 'Irfan J.', comp: '8 / 6', speed: '5.2d', ot: '75%', first: '68%', util: '88%' },
                    { name: 'Maya T.', comp: '10 / 9', speed: '4.1d', ot: '88%', first: '75%', util: '92%' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>{row.comp}</td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                         <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>{row.ot} OT</div>
                         <div style={{ fontSize: '9px', color: '#64748B' }}>Avg: {row.speed}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                         <div style={{ fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>{row.first}</div>
                         <div style={{ fontSize: '8px', color: '#64748B' }}>FIRST-TIME</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.util}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>

         {/* 🟡 3. RND FAILURE / REJECT TABLE */}
         <div>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟡 3. FAILURE / REJECT LOG</h3>
            <div style={{ background: '#FFF1F2', borderRadius: '32px', border: '1px solid #FECDD3', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>PRODUCT / STAGE</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>REASON</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { prod: 'Aqua Serum', stage: 'TESTING', reason: 'Instability', pic: 'Irfan' },
                    { prod: 'Cleanser Gel', stage: 'APPROVAL', reason: 'Color Change', pic: 'Maya' },
                    { prod: 'Lip Balm V2', stage: 'DEVELOPMENT', reason: 'Odor Issue', pic: 'Irfan' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(225, 29, 72, 0.1)' }}>
                       <td style={{ padding: '1rem' }}>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.prod}</p>
                          <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, color: '#64748B' }}>STAGE: {row.stage}</p>
                       </td>
                       <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#E11D48' }}>{row.reason}</p>
                          <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, color: '#94A3B8' }}>PIC: {row.pic}</p>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>

      </div>
    </div>
  );
};

export default RnD;
