import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const ExecutiveDashboard: React.FC = () => {
  return (
    <div className="view-section active" style={{ paddingBottom: '5rem', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* 🚀 HEADER & TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 className="dashboard-title" style={{ margin: 0 }}>DASHBOARD EKSEKUTIF</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Aureon ERP: Pusat Komando Strategis (Real-time)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'white', padding: '10px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="Calendar" size={16} color="#64748B" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>APRIL 2024</span>
          </div>
          <div style={{ background: '#1E293B', padding: '10px 22px', borderRadius: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <Icon name="Download" size={16} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>EXPORT REPORT</span>
          </div>
        </div>
      </div>

      {/* 🚨 GLOBAL ALERT SYSTEM (ATAS) */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        marginBottom: '2.5rem',
        background: '#FFF1F2', 
        padding: '1.25rem', 
        borderRadius: '20px',
        border: '1px solid #FECDD3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '2rem', borderRight: '1px solid #FDA4AF' }}>
          <div style={{ width: '32px', height: '32px', background: '#E11D48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Icon name="AlertTriangle" size={18} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 950, color: '#9F1239', letterSpacing: '0.05em' }}>SYSTEM ALERT</span>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#E11D48', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}><span style={{ color: '#E11D48' }}>5 ORDER</span> TELAT PRODUKSI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#E11D48', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}><span style={{ color: '#E11D48' }}>12 CLIENT</span> BELUM BAYAR (OVERDUE)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}><span style={{ color: '#D97706' }}>20 LEADS</span> BELUM FOLLOW UP</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        
        {/* 🟢 1. REVENUE & TARGET */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟢 REVENUE & TARGET</h3>
             <Icon name="TrendingUp" color="#10B981" />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>OMSET BULAN INI (MTD)</p>
            <h2 style={{ margin: '4px 0', fontSize: '32px', fontWeight: 950, color: '#1E293B' }}>Rp 3.240.000.000</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>+12.5%</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>vs bulan lalu</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>TARGET</p>
              <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 950, color: '#1E293B' }}>Rp 4.5 M</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>PENCAPAIAN</p>
              <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 950, color: '#10B981' }}>72.4%</p>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B' }}>PROYEKSI AKHIR BULAN</span>
              <span style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>Rp 4.15 M</span>
            </div>
            <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #DCFCE7' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#166534' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>Kita <span style={{ fontWeight: 800 }}>tertinggal Rp 350jt</span> dari proyeksi target ideal. Perlu push deal di minggu terakhir.</p>
          </div>
        </div>

        {/* 🔵 2. SALES PIPELINE (BD PERFORMANCE) */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔵 SALES PIPELINE</h3>
             <Icon name="BarChart3" color="#2563EB" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
             <div style={{ background: '#EFF6FF', padding: '1.25rem', borderRadius: '24px' }}>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 850, color: '#1D4ED8' }}>TOTAL LEADS</p>
               <h4 style={{ margin: '4px 0', fontSize: '24px', fontWeight: 950, color: '#1E293B' }}>142</h4>
             </div>
             <div style={{ background: '#F5F3FF', padding: '1.25rem', borderRadius: '24px' }}>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 850, color: '#6D28D9' }}>PIPELINE VALUE</p>
               <h4 style={{ margin: '4px 0', fontSize: '18px', fontWeight: 950, color: '#1E293B' }}>Rp 8.4 M</h4>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
            {[
              { label: 'Leads In', count: '142', val: '100%', color: '#94A3B8' },
              { label: 'Sample Process', count: '45', val: '31%', color: '#6366F1' },
              { label: 'Negotiation', count: '18', val: '12%', color: '#A855F7' },
              { label: 'Deal / SPK', count: '12', val: '8.4%', color: '#2563EB' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '100px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>{item.label}</div>
                <div style={{ flex: 1, height: '24px', background: '#F1F5F9', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ width: item.val, height: '100%', background: item.color, borderRadius: '6px', opacity: 0.8 }}></div>
                   <span style={{ position: 'absolute', right: '8px', top: '4px', fontSize: '10px', fontWeight: 950, color: item.val === '100%' ? '#64748B' : 'white' }}>{item.count}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: '#EFF6FF', borderRadius: '16px', border: '1px solid #DBEAFE' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#1E40AF' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1E40AF', lineHeight: '1.4' }}>Conversion rate <span style={{ fontWeight: 800 }}>turun ke 8.4%</span>. Bottleneck utama ada di tahap <span style={{ fontWeight: 800 }}>Sample Approval</span> (rata-rata 18 hari).</p>
          </div>
        </div>

        {/* 🟡 3. PRODUCTION & DELIVERY */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟡 PRODUCTION STATUS</h3>
             <Icon name="Factory" color="#EAB308" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>TOTAL ORDER AKTIF</p>
              <h2 style={{ margin: '4px 0', fontSize: '32px', fontWeight: 950, color: '#1E293B' }}>48</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#DC2626' }}>TELAT PRODUKSI (OVERDUE)</p>
              <h4 style={{ margin: '4px 0', fontSize: '24px', fontWeight: 950, color: '#DC2626' }}>5</h4>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '2rem' }}>
            {[
              { label: 'ON PROD', val: '32', color: '#EAB308' },
              { label: 'QC FLOW', val: '12', color: '#10B981' },
              { label: 'READY', val: '4', color: '#2563EB' },
            ].map((st, i) => (
              <div key={i} style={{ textAlign: 'center', background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{st.label}</p>
                <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 950, color: st.color }}>{st.val}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px dashed #E2E8F0' }}>
             <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Avg Prod. Time</span>
             <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>14.2 Hari</span>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: '#FEF9C3', borderRadius: '16px', border: '1px solid #FEF08A' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#854D0E' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#854D0E', lineHeight: '1.4' }}>Kapasitas produksi sisa <span style={{ fontWeight: 800 }}>15%</span>. Perlu manajemen shift tambahan untuk 5 order yang overdue.</p>
          </div>
        </div>

        {/* 🟣 4. CASHFLOW & PAYMENT */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟣 CASHFLOW & PAYMENT</h3>
             <Icon name="Wallet" color="#8B5CF6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: '#F5F3FF', padding: '1.25rem', borderRadius: '24px' }}>
               <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#7C3AED' }}>CASH IN (MTD)</p>
               <h4 style={{ margin: '4px 0', fontSize: '18px', fontWeight: 950, color: '#1E293B' }}>Rp 1.18 M</h4>
            </div>
            <div style={{ background: '#FFF1F2', padding: '1.25rem', borderRadius: '24px' }}>
               <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#E11D48' }}>PIUTANG (AR)</p>
               <h4 style={{ margin: '4px 0', fontSize: '18px', fontWeight: 950, color: '#E11D48' }}>Rp 2.45 M</h4>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '12px' }}>AGING RECEIVABLE (DRY CASH RISK)</p>
            <div style={{ display: 'flex', gap: '4px', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: '60%', background: '#10B981', position: 'relative' }} title="0-30 Hari"></div>
              <div style={{ width: '25%', background: '#F59E0B' }} title="31-60 Hari"></div>
              <div style={{ width: '15%', background: '#EF4444' }} title="&gt;60 Hari"></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', fontWeight: 800 }}>
              <span style={{ color: '#10B981' }}>0-30 Hari</span>
              <span style={{ color: '#F59E0B' }}>31-60 Hari</span>
              <span style={{ color: '#EF4444' }}>60+ Hari</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: '#F5F3FF', borderRadius: '16px', border: '1px solid #EDE9FE' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#5B21B6' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#5B21B6', lineHeight: '1.4' }}>Uang nyangkut di <span style={{ fontWeight: 800 }}>Piutang &gt;60 hari</span> sebesar <span style={{ fontWeight: 800 }}>Rp 120jt</span>. Tim Finance harus prioritaskan penagihan ke 5 klien teratas.</p>
          </div>
        </div>

        {/* 🔴 5. LOST & PROBLEM TRACKING */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 LOST & PROBLEMS</h3>
             <Icon name="ThumbsDown" color="#EF4444" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>LOST DEAL (VAL)</p>
               <h4 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 950, color: '#EF4444' }}>Rp 1.12 M</h4>
            </div>
            <div>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>CHURN RATE</p>
               <h4 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 950, color: '#B91C1C' }}>4.2%</h4>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '12px' }}>TOP REASON FOR LOST DEAL</p>
            {[
              { label: 'Harga Terlalu Mahal', val: 65, color: '#EF4444' },
              { label: 'Sample Tidak Cocok', val: 40, color: '#F87171' },
              { label: 'Produksi Lambat', val: 25, color: '#FCA5A5' },
            ].map((reason, idx) => (
              <div key={idx} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <span style={{ fontSize: '10px', fontWeight: 800, color: '#1E293B' }}>{reason.label}</span>
                   <span style={{ fontSize: '10px', fontWeight: 950, color: '#64748B' }}>{reason.val} Case</span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                   <div style={{ width: `${(reason.val/100)*100}%`, height: '100%', background: reason.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FEE2E2' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#991B1B' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#991B1B', lineHeight: '1.4' }}>Kita kalah di <span style={{ fontWeight: 800 }}>Pricing</span>. Analisa kompetitor menunjukkan harga kita lebih tinggi <span style={{ fontWeight: 800 }}>15%</span> di segmen skincare serum.</p>
          </div>
        </div>

        {/* 🟢 6. REPEAT ORDER ENGINE */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟢 REPEAT ORDER ENGINE</h3>
             <Icon name="RotateCw" color="#10B981" />
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>REPEAT RATE</p>
               <h4 style={{ margin: '4px 0', fontSize: '32px', fontWeight: 950, color: '#10B981' }}>68.5%</h4>
            </div>
            <div style={{ flex: 1 }}>
               <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>RO REVENUE</p>
               <h4 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 950, color: '#1E293B' }}>Rp 2.1 M</h4>
            </div>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '1.25rem', borderRadius: '24px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '12px', fontWeight: 950, color: '#166534' }}>CLIENT SIAP REPEAT (MTD)</span>
            </div>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#1E293B' }}>18 <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Client</span></p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#10B981' }}>+5 vs Target Follow-up</p>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #DCFCE7' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#166534' }}>💡 OWNER INSIGHT:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>Mesin RO sehat. <span style={{ fontWeight: 800 }}>65% Revenue</span> kita berasal dari client lama. Fokus di customer retention sangat berhasil.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutiveDashboard;
