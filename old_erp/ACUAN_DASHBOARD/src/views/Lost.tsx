import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const Lost: React.FC = () => {
  // 📉 Section A: Prospects Gagal (Lost Before Deal)
  const prospectGagal = [
    { id: 1, brand: 'SKIN GLOW+', product: 'Whitening Lotion', value: 'Rp 450 Jt', pic: 'Andi', stage: 'Negotiation', reason: 'Harga terlalu mahal' },
    { id: 2, brand: 'NATURE HUB', product: 'Herbal Serum', value: 'Rp 220 Jt', pic: 'Budi', stage: 'Sample', reason: 'Sample tidak cocok' },
    { id: 3, brand: 'DERMA V', product: 'Acne Cream', value: 'Rp 1.2M', pic: 'Citra', stage: 'Negotiation', reason: 'Kompetitor lebih cepat' },
    { id: 4, brand: 'LISA BEAUTY', product: 'Lip Tint', value: 'Rp 85 Jt', pic: 'Andi', stage: 'Konsultasi', reason: 'Tidak ada respon (ghosting)' },
    { id: 5, brand: 'PURE LIFE', product: 'Body Wash', value: 'Rp 500 Jt', pic: 'Citra', stage: 'Sample', reason: 'Lama di sample / produksi' }
  ];

  // 📉 Section B: Churn Customers (Lost After Delivery)
  const churnCustomers = [
    { id: 1, brand: 'GLAM COSMO', last_prod: 'Face Mist', last_qty: '5,000 Pcs', last_date: '02-12-2025', est_next: '02-02-2026', status: 'Lost', reason: 'Produk kurang laku' },
    { id: 2, brand: 'ZEN SKIN', last_prod: 'Clay Mask', last_qty: '2,000 Pcs', last_date: '10-01-2026', est_next: '10-03-2026', status: 'At risk', reason: 'Harga kalah kompetitor' },
    { id: 3, brand: 'ROYAL GLOW', last_prod: 'Cleanser', last_qty: '10,000 Pcs', last_date: '20-11-2025', est_next: '20-01-2026', status: 'Lost', reason: 'Pindah vendor' },
    { id: 4, brand: 'MIRA CARE', last_prod: 'Day Cream', last_qty: '3,000 Pcs', last_date: '05-02-2026', est_next: '05-04-2026', status: 'At risk', reason: 'Cashflow client macet' },
    { id: 5, brand: 'BEAUTY PRO', last_prod: 'Sunscreen', last_qty: '1,500 Pcs', last_date: '15-10-2025', est_next: '15-12-2025', status: 'Lost', reason: 'Kualitas kurang' }
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '5rem' }}>
      <h2 className="dashboard-title">
        LOST ANALYSIS <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Audit Kegagalan & Churn Prevention)</span>
      </h2>

      {/* 🧬 1. HIGH-DENSITY LOST AUDIT GRID (4x2 Structure) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        
        {/* A. FUNNEL CONVERSION (CORE KPI) */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>A. FUNNEL CONVERSION</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>RETENTION CORE</h3>
            </div>
            <div style={{ padding: '8px', background: '#F0F9FF', borderRadius: '10px' }}>
              <Icon name="Filter" size={16} color="#0EA5E9" />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ padding: '6px', background: '#F8FAFC', borderRadius: '8px' }}>
                <p style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', margin: 0 }}>LEAD→SMPL</p>
                <p style={{ fontSize: '12px', fontWeight: 900, color: '#0F172A', margin: 0 }}>42.5%</p>
             </div>
             <div style={{ padding: '6px', background: '#F8FAFC', borderRadius: '8px' }}>
                <p style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', margin: 0 }}>SMPL→PROD</p>
                <p style={{ fontSize: '12px', fontWeight: 900, color: '#0F172A', margin: 0 }}>18.2%</p>
             </div>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', marginTop: '8px' }}>PROD→RO: <span style={{ fontWeight: 900 }}>65.4%</span></p>
        </div>

        {/* B. LEAKAGE RATE (INTI LOST) */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>B. LEAKAGE RATE</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>BOCOR RATE</h3>
            </div>
            <div style={{ padding: '8px', background: '#FEF2F2', borderRadius: '10px' }}>
              <Icon name="Droplets" size={16} color="#EF4444" />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
             <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '58%', background: '#EF4444' }}></div>
             </div>
             <p style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', marginTop: '6px' }}>LEAD DROP: <span style={{ color: '#EF4444', fontWeight: 900 }}>58.5%</span></p>
             <p style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8' }}>SMPL DROP: <span style={{ color: '#EF4444', fontWeight: 900 }}>81.8%</span></p>
          </div>
        </div>

        {/* C. LOST COUNT (VOLUME) */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>C. LOST COUNT</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>TOTAL 189</h3>
            </div>
            <div style={{ padding: '8px', background: '#F1F5F9', borderRadius: '10px' }}>
              <Icon name="Users" size={16} color="#475569" />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
            <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px' }}>LEAD: 124</span>
            <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px' }}>SMPL: 45</span>
            <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px' }}>PROD: 12</span>
            <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px' }}>RO: 8</span>
          </div>
        </div>

        {/* D. LOST VALUE (CRITICAL) */}
        <div style={{ background: '#0F172A', borderRadius: '16px', border: '1px solid #1E293B', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.15em', margin: 0 }}>D. LOST VALUE</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B', margin: '4px 0' }}>Rp 2.05M</h3>
            </div>
            <div style={{ padding: '8px', background: '#F59E0B20', borderRadius: '10px' }}>
              <Icon name="TrendingDown" size={16} color="#F59E0B" />
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', marginTop: '8px' }}>
             <p style={{ fontSize: '8px', fontWeight: 700, color: '#64748B', margin: '2px 0' }}>SMPL→PROD: <span style={{ color: '#E2E8F0' }}>Rp 1.2B</span></p>
             <p style={{ fontSize: '8px', fontWeight: 700, color: '#64748B', margin: '2px 0' }}>PROD→RO: <span style={{ color: '#E2E8F0' }}>Rp 850M</span></p>
          </div>
        </div>

        {/* E. SPEED FAILURE */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>E. SPEED FAILURE</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>BOTTLENECK</h3>
            </div>
            <div style={{ padding: '8px', background: '#FDF2F8', borderRadius: '10px' }}>
              <Icon name="Timer" size={16} color="#DB2777" />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#0F172A', margin: 0 }}>4.2 Hrs <span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '8px' }}>AVG RESPONSE</span></p>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>12 Days <span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '8px' }}>SAMPLE TAT</span></p>
          </div>
        </div>

        {/* F. REASON ANALYSIS */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>F. REASON ANALYSIS</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>TOP: PRICE</h3>
            </div>
            <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '10px' }}>
              <Icon name="BarChart" size={16} color="#6366F1" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', overflow: 'hidden', marginTop: '12px' }}>
             <div style={{ height: '12px', width: '40%', background: '#6366F1', borderRadius: '2px' }} title="Price"></div>
             <div style={{ height: '12px', width: '25%', background: '#818CF8', borderRadius: '2px' }} title="Product"></div>
             <div style={{ height: '12px', width: '20%', background: '#A5B4FC', borderRadius: '2px' }} title="Comp"></div>
             <div style={{ height: '12px', width: '15%', background: '#C7D2FE', borderRadius: '2px' }} title="Ghost"></div>
          </div>
          <p style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', marginTop: '4px' }}>PRICE ISSUE: 40% | PROD: 25%</p>
        </div>

        {/* G. RECOVERY PERFORMANCE */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', margin: 0 }}>G. RECOVERY PERF.</p>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', margin: '4px 0' }}>14 SAVED</h3>
            </div>
            <div style={{ padding: '8px', background: '#ECFDF5', borderRadius: '10px' }}>
              <Icon name="RefreshCw" size={16} color="#10B981" />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
             <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', margin: 0 }}>RECOVERY RATE: <span style={{ color: '#10B981', fontWeight: 900 }}>12.5%</span></p>
             <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', margin: '2px 0 0 0' }}>VALUE: <span style={{ color: '#0F172A', fontWeight: 900 }}>Rp 450M</span></p>
          </div>
        </div>

        {/* H. SCORING PERFORMA BD (LOST CONTROL) */}
        <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', borderRadius: '16px', border: 'none', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#C7D2FE', letterSpacing: '0.15em', margin: 0 }}>LOST CONTROL SCORE</p>
              <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', margin: '4px 0' }}>78.4 <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.8 }}>/100</span></h3>
            </div>
            <div style={{ padding: '8px', background: '#FFFFFF20', borderRadius: '10px' }}>
              <Icon name="Award" size={18} color="#FFFFFF" />
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#C7D2FE' }}>GRADE: B+</span>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#C7D2FE' }}>TOP 15%</span>
             </div>
             <div style={{ height: '4px', background: '#FFFFFF20', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '78%', background: '#FFFFFF' }}></div>
             </div>
          </div>
        </div>

      </div>

      {/* 📊 SECTION A: LOST SEBELUM DEAL (PROSPECT GAGAL) */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>SECTION A: LOST SEBELUM DEAL (PROSPECT GAGAL)</h2>
        </div>
        
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B' }}>BRAND & PRODUK</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B' }}>PIC BD</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'right' }}>EST. VALUE DEAL</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'center' }}>STAGE TERAKHIR</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#DC2626' }}>ALASAN LOST (CRITICAL)</th>
              </tr>
            </thead>
            <tbody>
              {prospectGagal.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.2rem' }}>
                    <p style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{row.brand}</p>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', margin: '2px 0 0 0' }}>{row.product}</p>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ width: '20px', height: '20px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>👤</div>
                       <p style={{ fontSize: '12px', fontWeight: 800, color: '#111827', margin: 0 }}>{row.pic}</p>
                    </div>
                  </td>
                  <td className="tabular-nums" style={{ padding: '1.2rem', textAlign: 'right', fontSize: '13px', fontWeight: 900, color: '#EF4444' }}>{row.value}</td>
                  <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, padding: '4px 10px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '100px', color: '#64748B' }}>{row.stage}</span>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px' }}>
                       <Icon name="XCircle" size={12} color="#DC2626" />
                       <span style={{ fontSize: '11px', fontWeight: 900, color: '#DC2626' }}>{row.reason.toUpperCase()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📊 SECTION B: LOST SETELAH DELIVERY (CHURN CUSTOMER) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#7C3AED', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>SECTION B: LOST SETELAH DELIVERY (CHURN CUSTOMER)</h2>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B' }}>BRAND & PRODUK TERAKHIR</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B' }}>QTY TERAKHIR</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B' }}>TGL TERAKHIR ORDER</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '1.2rem', fontSize: '10px', fontWeight: 900, color: '#DC2626' }}>ALASAN CHURN</th>
              </tr>
            </thead>
            <tbody>
              {churnCustomers.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.2rem' }}>
                    <p style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{row.brand}</p>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', margin: '2px 0 0 0' }}>{row.last_prod}</p>
                  </td>
                  <td className="tabular-nums" style={{ padding: '1.2rem', fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>{row.last_qty}</td>
                  <td style={{ padding: '1.2rem' }}>
                    <p className="tabular-nums" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', margin: 0 }}>{row.last_date}</p>
                    <p style={{ fontSize: '8px', color: '#94A3B8' }}>EST. REPEAT: {row.est_next}</p>
                  </td>
                  <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '100px',
                      background: row.status === 'Lost' ? '#FEF2F2' : '#FFF7ED',
                      color: row.status === 'Lost' ? '#DC2626' : '#B45309',
                      border: `1px solid ${row.status === 'Lost' ? '#FEE2E2' : '#FFEDD5'}`
                    }}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                       <Icon name="Info" size={12} color="#64748B" />
                       <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B' }}>{row.reason.toUpperCase()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔮 INSIGHT POWERFUL (OWNER VIEW) */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: '#0F172A', borderRadius: '32px', color: 'white' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <Icon name="Zap" size={24} color="#F59E0B" style={{ fill: '#F59E0B' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em' }}>POWERFUL INSIGHT FOR OWNER</h3>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ borderLeft: '3px solid #EF4444', paddingLeft: '1.5rem' }}>
               <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>MASALAH UTAMA SISTEM</p>
               <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#E2E8F0' }}>
                  Hambatan terbesar saat ini adalah <span style={{ color: '#FB7185', fontWeight: 800 }}>PRICING (Harga Terlalu Mahal)</span> yang menggagalkan 40% deal di stage Negotiation. Segera audit struktur HPP atau tambahkan value point unik agar Nego tidak terpaku pada harga.
               </p>
            </div>
            <div style={{ borderLeft: '3px solid #7C3AED', paddingLeft: '1.5rem' }}>
               <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>DIAGNOSIS KEGAGALAN REPEAT</p>
               <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#E2E8F0' }}>
                  Client churn sering terjadi karena <span style={{ color: '#A78BFA', fontWeight: 800 }}>PRODUK KURANG LAKU</span> di market client. Ini indikasi BD kurang tajam dalam memfilter client yang memiliki channel distribusi kuat. Bukan masalah kualitas produk kita, tapi masalah *Market Matching*.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Lost;
