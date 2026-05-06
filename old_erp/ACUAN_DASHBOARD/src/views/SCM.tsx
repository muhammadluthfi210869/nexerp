import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const SCM: React.FC = () => {
  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        SUPPLY CHAIN MANAGEMENT (SCM) <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Command Center & Performance Audit)</span>
      </h2>

      {/* 🚀 I. SCM STRATEGIC OVERVIEW (Executive Command) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* 🔴 A. STOCK HEALTH */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Activity" size={16} color="#EF4444" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>A. STOCK HEALTH</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>TOTAL STOCK VALUE</p>
             <p style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>Rp 6.8 M</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>EXCESS STOCK</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#EF4444' }}>Rp 450 Jt</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>DEAD STOCK</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>Rp 120 Jt</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #F1F5F9', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#2563EB' }}>TURNOVER AVG</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>18 DAYS</span>
             </div>
          </div>
        </div>

        {/* 🟠 B. MATERIAL READINESS */}
        <div style={{ background: '#F0FDF4', padding: '1.5rem', borderRadius: '24px', border: '1px solid #DCFCE7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="CheckCircle" size={16} color="#10B981" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#166534', letterSpacing: '0.05em' }}>B. MATERIAL READINESS</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
             <p style={{ fontSize: '32px', fontWeight: 950, color: '#1E293B', margin: 0 }}>92%</p>
             <p style={{ fontSize: '9px', fontWeight: 850, color: '#166534', margin: 0 }}>READY TO PRODUCE</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>SHORTAGE</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#EF4444', margin: 0 }}>5</p>
             </div>
             <div style={{ background: '#FFF1F2', padding: '10px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#9F1239', margin: 0 }}>MUST BUY</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#E11D48', margin: 0 }}>12</p>
             </div>
          </div>
        </div>

        {/* 🟡 C. COST EFFICIENCY */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="DollarSign" size={16} color="#EAB308" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>C. COST EFFICIENCY</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>AVG VARIANCE</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#EAB308' }}>+2.4%</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>COST SAVING</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#10B981' }}>Rp 85 Jt</span>
             </div>
             <div style={{ background: '#FFF1F2', padding: '10px', borderRadius: '12px' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#9F1239', margin: 0 }}>OVERPAYING MATERIALS</p>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B', margin: '2px 0' }}>8 <span style={{ fontSize: '9px' }}>ITEMS</span></p>
             </div>
          </div>
        </div>

        {/* 🔵 D. PURCHASE PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Zap" size={16} color="#3B82F6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>D. PURCHASE PERFORMANCE</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>ON-TIME PURCHASE</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1D4ED8' }}>88.5%</span>
             </div>
             <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '88.5%', height: '100%', background: '#3B82F6' }}></div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>AVG LEAD TIME</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>8.2d</span>
             </div>
          </div>
        </div>

        {/* 🟣 E. COST SAVINGS */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="ShieldCheck" size={16} color="#8B5CF6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>E. COST SAVINGS</p>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>TOTAL SAVINGS (MTD)</p>
             <p style={{ fontSize: '24px', fontWeight: 950, color: '#8B5CF6', margin: '4px 0' }}>Rp 215 Jt</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>NEGOTIATION WIN</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#10B981' }}>12.4%</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>LOSS AVOIDED</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>Rp 340 Jt</span>
             </div>
          </div>
        </div>

        {/* ✨ F. PERFORMANCE SCORECARD */}
        <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="Trophy" size={16} color="#1E293B" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>F. PERFORMANCE SCORECARD</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'SCM GENERAL', val: '94%', color: '#1E293B' },
              { label: 'BAHAN BAKU (RAW)', val: '90%', color: '#EF4444' },
              { label: 'BAHAN KEMAS (PACK)', val: '96%', color: '#10B981' },
              { label: 'BOX AUDIT', val: '98%', color: '#78350F' },
              { label: 'LABEL ACCURACY', val: '88%', color: '#8B5CF6' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <span style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>{item.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 🤝 II. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL) */}
      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🤝 II. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL)</h3>
        
        {/* ⚡ 2A. EXECUTIVE CATEGORY VELOCITY CLOUD (High-Speed Tracking) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { 
              label: '1. BAHAN BAKU (RAW)', score: '92', status: 'STABLE', pulse: '#10B981',
              stats: { fast: 3, ontime: 12, late: 1, pending: 4 },
              arrival: '85% READY', theme: '#EF4444' 
            },
            { 
              label: '2. BAHAN KEMAS (PACK)', score: '78', status: 'DELAYED', pulse: '#EF4444',
              stats: { fast: 0, ontime: 8, late: 5, pending: 2 },
              arrival: '62% READY', theme: '#F59E0B' 
            },
            { 
              label: '3. LABEL AUDIT', score: '88', status: 'STABLE', pulse: '#10B981',
              stats: { fast: 2, ontime: 18, late: 2, pending: 5 },
              arrival: '92% READY', theme: '#8B5CF6' 
            },
            { 
              label: '4. BOX & CARDBOARD', score: '98', status: 'FAST', pulse: '#10B981',
              stats: { fast: 8, ontime: 15, late: 0, pending: 1 },
              arrival: '98% READY', theme: '#78350F' 
            }
          ].map((cat, i) => (
            <div key={i} style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: cat.theme }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 950, color: '#64748B', margin: 0, textTransform: 'uppercase' }}>{cat.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <div style={{ 
                      width: '7px', height: '7px', borderRadius: '50%', 
                      background: cat.pulse, 
                      boxShadow: `0 0 10px ${cat.pulse}`,
                      animation: 'pulse 2s infinite' 
                    }}></div>
                    <span style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>{cat.status}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#94A3B8', margin: 0 }}>SCORE</p>
                  <p style={{ fontSize: '18px', fontWeight: 950, color: cat.pulse === '#EF4444' ? '#EF4444' : '#10B981', margin: 0 }}>{cat.score}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px', marginBottom: '1rem' }}>
                {[
                  { l: 'FAST', v: cat.stats.fast, c: '#10B981' },
                  { l: 'REG', v: cat.stats.ontime, c: '#3B82F6' },
                  { l: 'LATE', v: cat.stats.late, c: '#EF4444' },
                  { l: 'OUT', v: cat.stats.pending, c: '#94A3B8' }
                ].map((s, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: '5px 2px', borderRadius: '8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: '6px', fontWeight: 950, color: '#64748B', margin: 0 }}>{s.l}</p>
                    <p style={{ fontSize: '11px', fontWeight: 950, color: s.c, margin: 0 }}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="Database" size={9} color="#64748B" />
                    <span style={{ fontSize: '9px', fontWeight: 950, color: '#1E293B' }}>{cat.arrival}</span>
                 </div>
                 <div style={{ width: '50px', height: '3px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                   <div style={{ width: cat.arrival.split('%')[0] + '%', height: '100%', background: cat.theme }}></div>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1400px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>WORK ORDER / PRODUCT</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>TARGET QTY</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>BO STATUS (NEEDS / WH / GAP)</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>PO TRACKING (QTY / STATUS)</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>EST. ARRIVAL</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>IMPACT / ANOMALY</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>SUPPLIER SCORE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { wo: 'WO-2024-001', prod: 'Serum Brightening X', target: '50,000 Pcs', needs: '500 Kg', wh: '320 Kg', gap: '180 Kg', poQty: '200 Kg', poStatus: 'IN TRANSIT', eta: '2024-04-05', impact: 'READY', score: '4.8/5' },
                  { wo: 'WO-2024-005', prod: 'Acne Cream Night', target: '25,000 Pcs', needs: '125 Kg', wh: '20 Kg', gap: '105 Kg', poQty: '105 Kg', poStatus: 'WAITING DP', eta: '2024-04-12', impact: 'DELAYED', reason: 'Nego Pending', score: '4.2/5' },
                  { wo: 'WO-2024-008', prod: 'Body Lotion Ultra', target: '10,000 Pcs', needs: '400 Kg', wh: '450 Kg', gap: '0', poQty: '-', poStatus: 'COMPLETE', eta: '-', impact: 'READY', score: '5.0/5' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.wo}</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>{row.prod}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.target}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.needs} / {row.wh} / <span style={{ color: row.gap !== '0' ? '#EF4444' : '#10B981' }}>{row.gap}</span></div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 950, color: '#2563EB' }}>{row.poQty}</div>
                      <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{row.poStatus}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 800 }}>{row.eta}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                       <span style={{ 
                         background: row.impact === 'READY' ? '#10B981' : '#EF4444',
                         color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '8px', fontWeight: 950
                       }}>{row.impact}</span>
                       {row.reason && <div style={{ fontSize: '8px', color: '#EF4444', marginTop: '4px', fontWeight: 700 }}>{row.reason}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔴 III. MATERIAL MASTER + STOCK TABLE */}
      <div style={{ marginBottom: '5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 III. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY)</h3>
        <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>MATERIAL NAME / TYPE</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>STOCK (CURR / RES / AVAIL)</th>
                  <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>UNIT PRICE / TOTAL</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>LEVELS (MIN / MAX / ROP)</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>USAGE / LEAD TIME</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>STATUS AUDIT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Niacinamide Alpha', type: 'RAW', cat: 'Chemical', u: 'Kg', curr: '120', res: '80', avail: '40', price: '12.5k', total: '1.5M', levels: '50 / 500 / 100', usage: '5 Kg/d', lt: '14d', status: 'SHORTAGE' },
                  { name: 'Retinol Kapsul', type: 'RAW', cat: 'Active', u: 'Kg', curr: '450', res: '50', avail: '400', price: '110k', total: '49.5M', levels: '50 / 800 / 150', usage: '2 Kg/d', lt: '30d', status: 'HEALTHY' },
                  { name: 'Botol Serum 30ml', type: 'PACKAGING', cat: 'Glass', u: 'Pcs', curr: '15k', res: '12k', avail: '3k', price: '2.5k', total: '37.5M', levels: '5k / 50k / 10k', usage: '500 Pcs/d', lt: '7d', status: 'SHORTAGE' },
                  { name: 'Box Acne Serum', type: 'BOX', cat: 'Printing', u: 'Pcs', curr: '45k', res: '5k', avail: '40k', price: '1.2k', total: '54M', levels: '5k / 40k / 10k', usage: '500 Pcs/d', lt: '5d', status: 'EXCESS' },
                  { name: 'Dead Sample Kemasan', type: 'PACKAGING', cat: 'N/A', u: 'Pcs', curr: '120', res: '0', avail: '120', price: '5k', total: '0.6M', levels: '0 / 0 / 0', usage: '0', lt: '-', status: 'DEAD STOCK' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: row.status === 'SHORTAGE' ? '#FFF1F2' : 'transparent' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                       <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>{row.type} | {row.cat}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.curr} / {row.res} / <span style={{ color: row.status === 'SHORTAGE' ? '#EF4444' : '#10B981' }}>{row.avail}</span></div>
                       <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 700 }}>UNIT: {row.u}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                       <div style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>Rp {row.total}</div>
                       <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>@{row.price} / {row.u}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <div style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>{row.levels}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>{row.usage}</div>
                       <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>Lead: {row.lt}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                       <span style={{ 
                         background: row.status === 'SHORTAGE' ? '#EF4444' : (row.status === 'EXCESS' ? '#F59E0B' : (row.status === 'HEALTHY' ? '#10B981' : '#64748B')),
                         color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950
                       }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '5rem 0 2rem 0', fontSize: '16px', fontWeight: 950, color: '#1E293B', borderBottom: '2px solid #1E293B', display: 'inline-block', paddingBottom: '8px' }}>
        CATEGORY-SPECIFIC PERFORMANCE AUDIT
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
         
         {/* 🔴 A. performance_raw_material */}
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
               <div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '2px' }}></div>
               <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>A. RAW MATERIAL PERFORMANCE (QUALITY & CONTINUITY)</h4>
            </div>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SUPPLIER / MATERIAL</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>PERIOD</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>VOLUME (QTY/CNT)</th>
                          <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>COST (PRICE/VAR/TOTAL)</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TIMELINESS (OTD/DELY)</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>QUALITY (REJ/SCR)</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>BATCH REJ RATE</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>RISK AUDIT</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'PT Surya Kimia', mat: 'Niacinamide Alpha', p: 'Monthly', qty: '500 Kg', cnt: '5', price: '12.5k', var: '+2.1%', spend: '125M', otd: '85%', dly: '1', rej: '5Kg', score: '90', brr: '0.5%', risk: 'LOW', critical: true },
                         { name: 'Indo Chemical', mat: 'Retinol Kapsul', p: 'Monthly', qty: '100 Kg', cnt: '2', price: '110k', var: '+5.4%', spend: '11M', otd: '72%', dly: '1', rej: '2Kg', score: '78', brr: '2.0%', risk: 'MEDIUM', critical: true },
                       ].map((row, i) => (
                         <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1.25rem' }}>
                               <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                               <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{row.mat} {row.critical && <span style={{ color: '#EF4444' }}>(CRITICAL)</span>}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '11px', fontWeight: 800 }}>{row.p}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                               <div style={{ fontSize: '12px', fontWeight: 950 }}>{row.qty}</div>
                               <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B' }}>{row.cnt} ORDERS</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                               <div style={{ fontSize: '12px', fontWeight: 950 }}>Rp {row.spend}</div>
                               <div style={{ fontSize: '9px', fontWeight: 700, color: row.var.includes('+') ? '#EF4444' : '#10B981' }}>{row.var} @{row.price}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                               <div style={{ fontSize: '12px', fontWeight: 950 }}>{row.otd}</div>
                               <div style={{ fontSize: '9px', color: '#EF4444', fontWeight: 800 }}>{row.dly} DELAYED</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                               <div style={{ fontSize: '12px', fontWeight: 950 }}>{row.score}</div>
                               <div style={{ fontSize: '9px', color: '#64748B' }}>REJ: {row.rej}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#EAB308' }}>{row.brr}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                               <span style={{ background: row.risk === 'LOW' ? '#10B981' : '#F59E0B', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950 }}>{row.risk}</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
         </div>

         {/* 🟡 B. performance_packaging */}
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
               <div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '2px' }}></div>
               <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>B. PACKAGING PERFORMANCE (MOQ & OVERSTOCK FOCUS)</h4>
            </div>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SUPPLIER / MATERIAL</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>VOLUME</th>
                          <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>COST AUDIT</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>OTD %</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>MOQ EXCESS</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>USAGE MISMATCH</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>RISK</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Global Kemasindo', mat: 'Botol Serum 30ml', qty: '10,000 Pcs', spend: '25M', otd: '100%', excess: '1,000', mismatch: '1.2%', risk: 'LOW' },
                         { name: 'Putra Pack', mat: 'Cap Pump White', qty: '15,000 Pcs', spend: '15M', otd: '92%', excess: '2,500', mismatch: '4.8%', risk: 'MEDIUM' },
                       ].map((row, i) => (
                         <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1.25rem' }}>
                               <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                               <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{row.mat}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950 }}>{row.qty}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'right', fontSize: '12px', fontWeight: 950 }}>Rp {row.spend}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#10B981' }}>{row.otd}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#EF4444' }}>{row.excess}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#F59E0B' }}>{row.mismatch}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                               <span style={{ background: row.risk === 'LOW' ? '#10B981' : '#F59E0B', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950 }}>{row.risk}</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
         </div>

         {/* 🟤 C. performance_box */}
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
               <div style={{ width: '12px', height: '12px', background: '#78350F', borderRadius: '2px' }}></div>
               <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>C. BOX PERFORMANCE (VOLUME & COST EFFICIENCY)</h4>
            </div>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SUPPLIER / MATERIAL</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>VOLUME</th>
                          <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>COST PER UNIT</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SPEND (TOTAL)</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>VOL UTIL %</th>
                          <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>RISK FLAG</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Sinar Printing', mat: 'Box Acne Serum', qty: '5,000 Pcs', unit: '1.2k', spend: '6M', util: '98%', risk: 'LOW' },
                         { name: 'Berkat Alam', mat: 'Box Master Carton', qty: '1,000 Pcs', unit: '8.5k', spend: '8.5M', util: '95%', risk: 'LOW' },
                       ].map((row, i) => (
                         <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1.25rem' }}>
                               <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                               <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{row.mat}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950 }}>{row.qty}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'right', fontSize: '12px', fontWeight: 950 }}>Rp {row.unit}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950 }}>Rp {row.spend}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#3B82F6' }}>{row.util}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                               <span style={{ background: '#10B981', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950 }}>{row.risk}</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
         </div>

         {/* 🟣 D. performance_label */}
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
               <div style={{ width: '12px', height: '12px', background: '#8B5CF6', borderRadius: '2px' }}></div>
               <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>D. LABEL PERFORMANCE (ACCURACY & REVISION FOCUS)</h4>
            </div>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SUPPLIER / MATERIAL</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>REVISIONS</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>MISPRINT RATE</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>OTD RATE</th>
                          <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>SCORE</th>
                          <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>RISK</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Sinar Print', mat: 'Label Glow-Up', rev: '2', mis: '2.5%', otd: '80%', score: '75', risk: 'MEDIUM' },
                         { name: 'Labelindo', mat: 'Label Aqua Pure', rev: '0', mis: '0.1%', otd: '100%', score: '98', risk: 'LOW' },
                       ].map((row, i) => (
                         <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1.25rem' }}>
                               <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                               <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{row.mat}</div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '14px', fontWeight: 950, color: row.rev !== '0' ? '#EF4444' : '#10B981' }}>{row.rev}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950, color: '#F59E0B' }}>{row.mis}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950 }}>{row.otd}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontSize: '12px', fontWeight: 950 }}>{row.score}</td>
                            <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                               <span style={{ background: row.risk === 'LOW' ? '#10B981' : '#F59E0B', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950 }}>{row.risk}</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
         </div>

      </div>

      <h3 style={{ margin: '5rem 0 2rem 0', fontSize: '16px', fontWeight: 950, color: '#1E293B', borderBottom: '2px solid #1E293B', display: 'inline-block', paddingBottom: '8px' }}>
        VELOCITY & DEMAND AUDIT (TOP 10 HIGH-FREQUENCY)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
         
         {/* 🔴 TOP 10 RAW MATERIAL */}
         <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
               <Icon name="TrendingUp" size={16} color="#EF4444" />
               <p style={{ margin: 0, fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>TOP 10 HIGH-FREQUENCY: RAW MATERIAL</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                     <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>MATERIAL NAME</th>
                     <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>PURCHASE FREQ</th>
                     <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>AVG CONSUMPTION</th>
                     <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>TURNOVER</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                    { name: 'Niacinamide Alpha', f: '12x/yr', c: '150kg/mo', t: '14d', s: 'HIGH' },
                    { name: 'Hyaluronic Acid 1%', f: '10x/yr', c: '80kg/mo', t: '18d', s: 'HIGH' },
                    { name: 'Retinol K5', f: '8x/yr', c: '12kg/mo', t: '22d', s: 'CRITICAL' },
                    { name: 'Salicylic Acid', f: '8x/yr', c: '45kg/mo', t: '20d', s: 'STABLE' },
                    { name: 'Glycerin 99%', f: '24x/yr', c: '800kg/mo', t: '7d', s: 'BULK' },
                    { name: 'Vitamin C Pure', f: '6x/yr', c: '5kg/mo', t: '30d', s: 'STABLE' },
                    { name: 'Ceramide NP', f: '4x/yr', c: '2kg/mo', t: '45d', s: 'CRITICAL' },
                    { name: 'Centella Asiatica', f: '10x/yr', c: '200kg/mo', t: '12d', s: 'HIGH' },
                    { name: 'Squalane Olive', f: '4x/yr', c: '50kg/mo', t: '28d', s: 'STABLE' },
                    { name: 'Panthenol B5', f: '6x/yr', c: '30kg/mo', t: '25d', s: 'STABLE' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                       <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 850, color: '#1E293B' }}>{row.name}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>{row.f}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.c}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', fontWeight: 850, color: '#64748B' }}>{row.t}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* 🟡 TOP 10 PACKAGING */}
         <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
               <Icon name="Package" size={16} color="#F59E0B" />
               <p style={{ margin: 0, fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>TOP 10 HIGH-FREQUENCY: PACKAGING</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                     <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>MATERIAL NAME</th>
                     <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>PURCHASE FREQ</th>
                     <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>AVG CONSUMPTION</th>
                     <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>TURNOVER</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                    { name: 'Botol Serum 30ml', f: '12x/yr', c: '15,000 Pcs/mo', t: '15d' },
                    { name: 'Pump Black 20/410', f: '12x/yr', c: '15,000 Pcs/mo', t: '15d' },
                    { name: 'Cap Silver 30ml', f: '6x/yr', c: '10,000 Pcs/mo', t: '30d' },
                    { name: 'Bottle Airless 15ml', f: '4x/yr', c: '5,000 Pcs/mo', t: '45d' },
                    { name: 'Tube 50ml Glossy', f: '8x/yr', c: '8,000 Pcs/mo', t: '25d' },
                    { name: 'Jar 30g Blue Glass', f: '4x/yr', c: '3,000 Pcs/mo', t: '60d' },
                    { name: 'Dropper Glass 30ml', f: '6x/yr', c: '5,000 Pcs/mo', t: '30d' },
                    { name: 'Spray Cap 100ml', f: '10x/yr', c: '12,000 Pcs/mo', t: '20d' },
                    { name: 'Bottle PET 100ml', f: '10x/yr', c: '12,000 Pcs/mo', t: '20d' },
                    { name: 'Seal Induction 20mm', f: '12x/yr', c: '50,000 Pcs/mo', t: '10d' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                       <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 850, color: '#1E293B' }}>{row.name}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>{row.f}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.c}</td>
                       <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', fontWeight: 850, color: '#64748B' }}>{row.t}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

      </div>
    </div>
  );
};

export default SCM;
