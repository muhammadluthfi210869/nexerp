import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const Produksi: React.FC = () => {
  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        PRODUCTION COMMAND CENTER <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Shop Floor & Efficiency Audit)</span>
      </h2>

      {/* 🚀 I. EXECUTIVE OVERVIEW (Manufacturing Command) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        
        {/* 🎯 1. PRODUCTION OUTPUT */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Target" size={16} color="#3B82F6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>A. OUTPUT & ACHIEVEMENT</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>94.2%</p>
             <p style={{ fontSize: '9px', fontWeight: 850, color: '#64748B', margin: 0 }}>ACHIEVEMENT RATE</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>PLANNED</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>250k Units</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>ACTUAL</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#10B981' }}>235k Units</span>
             </div>
             <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>COMPLETED ORDERS</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: 0 }}>18 / 22</p>
             </div>
          </div>
        </div>

        {/* ⏱️ 2. TIMELINESS */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Clock" size={16} color="#EAB308" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>B. TIMELINESS AUDIT</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>ON-TIME RATE</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#EAB308' }}>86.4%</span>
             </div>
             <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '86.4%', height: '100%', background: '#EAB308' }}></div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#FFF1F2', padding: '8px', borderRadius: '10px' }}>
                   <p style={{ fontSize: '7px', fontWeight: 850, color: '#EF4444', margin: 0 }}>DELAYED</p>
                   <p style={{ fontSize: '12px', fontWeight: 950, color: '#E11D48', margin: 0 }}>4</p>
                </div>
                <div style={{ background: '#F0FDF4', padding: '8px', borderRadius: '10px' }}>
                   <p style={{ fontSize: '7px', fontWeight: 850, color: '#166534', margin: 0 }}>AVG CYCLE</p>
                   <p style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B', margin: 0 }}>24.2h</p>
                </div>
             </div>
          </div>
        </div>

        {/* ⚙️ 3. EFFICIENCY */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Cpu" size={16} color="#8B5CF6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>C. RESOURCE EFFICIENCY</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>MACHINE UTIL.</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#8B5CF6' }}>78.2%</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>LABOR PROD.</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>92.5%</span>
             </div>
             <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '12px', border: '1px solid #FFEDD5', marginTop: '4px' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#C2410C', margin: 0 }}>DOWNTIME (MTD)</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#EA580C', margin: '2px 0' }}>42.5h</p>
             </div>
          </div>
        </div>

        {/* 🧪 4. QUALITY */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Beaker" size={16} color="#10B981" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>D. QUALITY CONTROL</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <div>
                <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', margin: 0 }}>GOOD UNITS</p>
                <p style={{ fontSize: '18px', fontWeight: 950, color: '#10B981', margin: 0 }}>232k</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', margin: 0 }}>DEFECT RATE</p>
                <p style={{ fontSize: '18px', fontWeight: 950, color: '#EF4444', margin: 0 }}>1.45%</p>
             </div>
          </div>
          <div style={{ background: '#F1F5F9', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
             <div style={{ width: '98.5%', height: '100%', background: '#10B981' }}></div>
             <div style={{ width: '1.5%', height: '100%', background: '#EF4444' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
             <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>REWORK COUNT</span>
             <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>1,240 Pcs</span>
          </div>
        </div>

        {/* ⚠️ 5. RISK ALERT */}
        <div style={{ background: '#FFF1F2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FECDD3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="ShieldAlert" size={16} color="#E11D48" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#9F1239', letterSpacing: '0.05em' }}>E. CRITICAL ALERTS</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#E11D48' }}>BREAKDOWNS</span>
                <span style={{ fontSize: '12px', fontWeight: 950 }}>2</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#EF4444' }}>SHORTAGES</span>
                <span style={{ fontSize: '12px', fontWeight: 950 }}>5</span>
             </div>
             <div style={{ background: '#9F1239', padding: '8px 12px', borderRadius: '10px', marginTop: '2px' }}>
                <p style={{ fontSize: '8px', fontWeight: 950, color: '#ffffff', margin: 0, opacity: 0.9 }}>URGENT ALERT</p>
                <p style={{ fontSize: '10px', fontWeight: 950, color: '#ffffff', margin: 0 }}>4 ORDERS OVERDUE &gt; 48H</p>
             </div>
          </div>
        </div>

      </div>

      {/* 📦 II. PENYIAPAN BAHAN (FROM WAREHOUSE) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#64748B', letterSpacing: '0.05em' }}>II. PENYIAPAN BAHAN (FROM WAREHOUSE)</h3>
          <button style={{ 
            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', 
            padding: '6px 16px', borderRadius: '99px', fontSize: '11px', fontWeight: 950, 
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
          }}>
            MONITORING GUDANG
          </button>
        </div>
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>WORK ORDER / PRODUK</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>STATUS PICKING</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>KELENGKAPAN</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>ESTIMASI KIRIM</th>
              </tr>
            </thead>
            <tbody>
              {[
                { wo: 'WO-2024-088', product: 'Day Cream Gold', status: 'IN PROGRESS', progress: 65, color: '#3B82F6', time: '14:00 Today' },
                { wo: 'WO-2024-089', product: 'Night Serum', status: 'WAITING', progress: 0, color: '#94A3B8', time: '16:30 Today' },
                { wo: 'WO-2024-090', product: 'Facial Wash', status: 'READY', progress: 100, color: '#10B981', time: 'READY' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A' }}>{row.wo}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{row.product}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 950, color: row.color }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.progress}%`, height: '100%', background: row.color }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 950, color: '#0F172A', minWidth: '35px' }}>{row.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: 950, color: row.time === 'READY' ? '#10B981' : '#1E293B' }}>{row.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧪 III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK) */}
      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '13px', fontWeight: 950, color: '#64748B', letterSpacing: '0.05em' }}>III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK)</h3>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { label: 'ANTREAN WO', val: '1', sub: 'BATCHES', icon: 'ClipboardList' },
            { label: 'MIXING', val: '2', sub: 'BATCHES', icon: 'Workflow' },
            { label: 'FILLING', val: '1', sub: 'BATCHES', icon: 'Pipette' },
            { label: 'PACKING', val: '1', sub: 'BATCHES', icon: 'Package' },
            { label: 'FINISHED GOODS', val: '3,000', sub: 'PCS', icon: 'CheckCircle2' },
          ].map((item, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ 
                width: '180px', padding: '1.5rem', borderRadius: '16px', border: '1px solid #F1F5F9', 
                background: 'white', textAlign: 'center', position: 'relative',
                boxShadow: '0 4px 15px -5px rgba(0,0,0,0.05)'
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>{item.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>{item.val}</p>
                <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', margin: 0 }}>{item.sub}</p>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 950, color: i % 2 === 0 ? '#E11D48' : '#94A3B8', background: i % 2 === 0 ? '#FFF1F2' : '#F8FAFC', padding: '2px 8px', borderRadius: '4px' }}>
                    {i === 0 ? 'IDLE: 13h' : (i === 1 ? 'WAIT: 0.2d' : 'IDLE: 14h')}
                  </span>
                  <Icon name="ArrowRight" size={20} color={i % 2 === 0 ? '#EF4444' : '#E2E8F0'} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 📊 IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING) */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING)</h3>
          <span style={{ background: '#4F46E5', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: 950 }}>CHAIN OF CUSTODY</span>
        </div>
        <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#4F46E5' }}>DEADLINE (H-MINUS)</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#4F46E5' }}>PRODUCT ID / NAME</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#4F46E5' }}>CHAIN OF CUSTODY (UNIT FLOW)</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#4F46E5' }}>ANOMALY STATUS</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#4F46E5' }}>STATUS & REASON</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2026-04-05', h: 'Sisa 5 Hari', id: 'WO-2824-001', name: 'Serum Vitamin C Complex', steps: [1010, 1000, 990, 990], activeIdx: 4, anomaly: 'HILANG: 20 UNIT', anomalyColor: '#E11D48', status: 'FINISHED', sub: '100%', reason: '"Ada 10 unit hilang dipindah Filling ke Packing."', color: '#10B981' },
                { date: '2026-04-02', h: 'Sisa 2 Hari', id: 'WO-2824-002', name: 'Night Cream Retinol 2%', hColor: '#E11D48', steps: [1250, 850, 850, 850], activeIdx: 4, anomaly: 'REJECT: 400 UNIT', anomalyColor: '#F59E0B', status: 'FINISHED', sub: '100%', reason: '"Reject 400 unit di Mixing tank (kontaminasi)."', color: '#10B981' },
                { date: '2026-04-10', h: 'Sisa 10 Hari', id: 'WO-2824-003', name: 'Sunscreen SPF 50 PA+++', steps: [5200, 0, 0, 0], activeIdx: 1, anomaly: 'PROSES MIXING', anomalyColor: '#D1FAE5', anomalyTextColor: '#059669', status: 'MIXING', sub: '25%', reason: '"Stuck - Sedang menunggu kiriman Fragrance."', color: '#3B82F6' },
                { date: '2026-04-08', h: 'Sisa 8 Hari', id: 'WO-2824-004', name: 'Hydrating Rose Toner', steps: [2500, 2480, 0, 0], activeIdx: 2, anomaly: 'PROSES FILLING', anomalyColor: '#D1FAE5', anomalyTextColor: '#059669', status: 'FILLING', sub: '50%', reason: '"Sedang running di mesin Filling B."', color: '#3B82F6' },
                { date: '2026-04-07', h: 'Sisa 7 Hari', id: 'WO-2824-005', name: 'Brightening Body Lotion', steps: [3050, 3000, 2980, 0], activeIdx: 3, anomaly: 'PROSES PACKING', anomalyColor: '#D1FAE5', anomalyTextColor: '#059669', status: 'PACKING', sub: '75%', reason: '"Koding batch sedang berlangsung."', color: '#3B82F6' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '13px', fontWeight: 950, color: '#0F172A' }}>{row.date}</div>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: row.hColor || '#64748B', background: row.hColor ? '#FFF1F2' : '#F8FAFC', padding: '2px 8px', borderRadius: '4px' }}>{row.h}</span>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A' }}>{row.name}</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>{row.id}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                      {['MIXING', 'FILLING', 'PACKING', 'FINISH'].map((step, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center', width: '60px' }}>
                            <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E2E8F0', 
                              margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: (sIdx + 1) === row.activeIdx ? '#4F46E5' : ((sIdx + 1) < row.activeIdx ? '#EEF2FF' : 'white'),
                              color: (sIdx + 1) === row.activeIdx ? 'white' : ((sIdx + 1) < row.activeIdx ? '#4F46E5' : '#94A3B8')
                            }}>
                              {(sIdx + 1) < row.activeIdx ? <Icon name="Check" size={14} /> : (sIdx + 1)}
                            </div>
                            <p style={{ fontSize: '8px', fontWeight: 950, color: '#1E293B', margin: '0' }}>{step}</p>
                            <p style={{ fontSize: '9px', fontWeight: 950, color: (sIdx+1) <= row.activeIdx ? '#4F46E5' : '#94A3B8', margin: '0' }}>{row.steps[sIdx] || '-'}</p>
                          </div>
                          {sIdx < 3 && <div style={{ width: '40px', height: '2px', background: (sIdx + 1) < row.activeIdx ? '#4F46E5' : '#F1F5F9', marginTop: '-20px' }}></div>}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                    <span style={{ 
                      background: row.anomalyColor, color: row.anomalyTextColor || 'white', 
                      padding: '8px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: 950,
                      boxShadow: row.anomalyTextColor ? 'none' : '0 4px 12px -2px rgba(225,29,72,0.2)'
                    }}>{row.anomaly}</span>
                  </td>
                  <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 950, color: row.color }}>{row.status}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>{row.sub}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', maxWidth: '180px', marginLeft: 'auto' }}>{row.reason}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧪 V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI) */}
      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '13px', fontWeight: 950, color: '#64748B', letterSpacing: '0.05em' }}>V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI)</h3>
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>NO. WORK ORDER</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>NAMA KLIEN & PRODUK</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>TAHAPAN SAAT INI</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>ESTIMASI SELESAI</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#94A3B8' }}>QTY DEFECT</th>
              </tr>
            </thead>
            <tbody>
              {[
                { wo: 'WO-2026-03-01', client: 'PT. GlowUp - Brightening Serum 20ml', stage: 'FILLING', time: '2026-03-30', defect: 0 },
                { wo: 'WO-2026-03-02', client: 'CV. Beauty - Acne Toner 100ml', stage: 'PACKING & KODING', time: '2026-03-28', defect: 125, color: '#E11D48' },
                { wo: 'WO-2026-03-03', client: 'Klinik Dr. A - Sunscreen SPF 50', stage: 'MIXING', time: '2026-04-02', defect: 0 },
                { wo: 'WO-2026-03-04', client: 'PT. Naturals - Body Lotion 250ml', stage: 'ANTREAN WO', time: '2026-04-05', defect: 0, stageColor: '#E11D48' },
                { wo: 'WO-2026-03-05', client: 'Klinik Dr. B - Night Cream 15g', stage: 'FINISHED GOODS', time: '2026-03-29', defect: 10, color: '#E11D48' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.25rem 2rem', fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>{row.wo}</td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B' }}>{row.client}</div>
                  </td>
                  <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                    <span style={{ 
                      background: row.stageColor || '#F1F5F9', color: row.stageColor ? 'white' : '#1E293B', 
                      padding: '6px 14px', borderRadius: '99px', fontSize: '10px', fontWeight: 950 
                    }}>{row.stage}</span>
                  </td>
                  <td style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{row.time}</td>
                  <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 950, color: row.defect > 0 ? '#E11D48' : '#10B981' }}>{row.defect} Pcs</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Produksi;
