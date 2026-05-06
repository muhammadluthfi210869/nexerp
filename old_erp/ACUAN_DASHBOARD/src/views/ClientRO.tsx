import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const ClientRO: React.FC = () => {
  // 📋 Repeat Order (LTV & Loyalty) Data
  const roData = [
    { 
      id: 1, brand: 'GLOW SKIN', product: 'Night Cream v2', arrived: '10-01-2026', est_empty: '10-03-2026', 
      potensi: 'TINGGI', status: 'Repeat Order', reminder: '90 Hari', feedback: 'Tekstur sangan disukai', 
      complain: '-', ltv: 'Rp 1.2M', ro_count: 8, priority: true 
    },
    { 
      id: 2, brand: 'PURE ESSENCE', product: 'Hydrating Toner', arrived: '20-02-2026', est_empty: '20-04-2026', 
      potensi: 'SEDANG', status: 'Follow up 1', reminder: '30 Hari', feedback: 'Client minta diskon next order', 
      complain: '-', ltv: 'Rp 450 Jt', ro_count: 3, priority: false 
    },
    { 
      id: 3, brand: 'ARIF BEAUTY', product: 'Facial Wash', arrived: '01-12-2025', est_empty: '01-02-2026', 
      potensi: 'RENDAH', status: 'Lost Customer', reminder: 'LOST', feedback: 'Pindah ke kompetitor harga', 
      complain: 'Packing pecah di pengiriman 1', ltv: 'Rp 120 Jt', ro_count: 1, priority: false 
    },
    { 
      id: 4, brand: 'LISA MONIKA', product: 'Serum Gold', arrived: '15-03-2026', est_empty: '15-05-2026', 
      potensi: 'TINGGI', status: 'Belum follow up', reminder: '15 Hari', feedback: '-', 
      complain: '-', ltv: 'Rp 850 Jt', ro_count: 5, priority: true 
    },
    { 
      id: 5, brand: 'DERMA LAB', product: 'Moisturizer Gel', arrived: '05-01-2026', est_empty: '05-03-2026', 
      potensi: 'SEDANG', status: 'Follow up 2', reminder: '60 Hari', feedback: 'Produk sangat laku di Shopee', 
      complain: '-', ltv: 'Rp 620 Jt', ro_count: 4, priority: false 
    }
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '5rem' }}>
      <h2 className="dashboard-title">
        CLIENT REPEAT ORDER <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(LTV Master & Retention Audit)</span>
      </h2>

      {/* 🧬 1. EXECUTIVE KPI MASTER (Hierarchical Audit Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* A. RETENTION (WAJIB) */}
        <div style={{ background: '#F0FDF4', padding: '1.25rem', borderRadius: '24px', border: '1px solid #DCFCE7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="RotateCw" size={14} color="#166534" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#166534', letterSpacing: '0.05em' }}>A. RETENTION (CORE LOYALTY)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                   <p style={{ fontSize: '7px', fontWeight: 800, color: '#166534', margin: 0 }}>REPEAT CLIENTS</p>
                   <p style={{ fontSize: '18px', fontWeight: 950, color: '#064E3B', margin: 0 }}>24 ENTITAS</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '7px', fontWeight: 800, color: '#166534', margin: 0 }}>REPEAT RATE</p>
                   <p style={{ fontSize: '18px', fontWeight: 950, color: '#064E3B', margin: 0 }}>72.4%</p>
                </div>
             </div>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748B', margin: 0 }}>*UTAMA UNTUK MENJAGA RELASI</p>
          </div>
        </div>

        {/* B. ACTIVITY (BD ENGAGEMENT) */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Activity" size={14} color="#6366F1" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>B. ACTIVITY (BD ENGAGEMENT)</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <div>
                <p style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>ACTIVE RO CLIENTS</p>
                <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>18</p>
             </div>
             <div>
                <p style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>FOLLOW-UP RATE</p>
                <p style={{ fontSize: '16px', fontWeight: 950, color: '#10B981', margin: 0 }}>94.2%</p>
             </div>
             <div style={{ gridColumn: 'span 2', background: '#F8FAFC', padding: '6px', borderRadius: '8px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 950, color: '#64748B' }}>MAINTENANCE CONSISTENCY</span>
             </div>
          </div>
        </div>

        {/* C. FREQUENCY (KUALITAS RELASI) */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="Infinity" size={14} color="#F59E0B" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>C. FREQUENCY (RELASI)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>AVG ORDER / CLIENT</span>
                <span style={{ fontSize: '14px', fontWeight: 950, color: '#1E293B' }}>4.2x</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>REORDER INTERVAL</span>
                <span style={{ fontSize: '14px', fontWeight: 950, color: '#EF4444' }}>58 HARI</span>
             </div>
             <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#F59E0B' }}></div>
             </div>
          </div>
        </div>

        {/* D. VALUE (BUSINESS IMPACT) */}
        <div style={{ background: '#FFF7ED', padding: '1.25rem', borderRadius: '24px', border: '1px solid #FFEDD5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="DollarSign" size={14} color="#9A3412" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#9A3412', letterSpacing: '0.05em' }}>D. VALUE (BUSINESS IMPACT)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div>
                <p style={{ fontSize: '7px', fontWeight: 850, color: '#9A3412', margin: 0 }}>TOTAL RO VALUE</p>
                <p style={{ fontSize: '20px', fontWeight: 950, color: '#7C2D12', margin: 0 }}>Rp 8.42 M</p>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                   <p style={{ fontSize: '6px', fontWeight: 800, color: '#9A3412', margin: 0 }}>AVG RO / CLIENT</p>
                   <p style={{ fontSize: '11px', fontWeight: 950, color: '#7C2D12', margin: 0 }}>Rp 350 JT</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '6px', fontWeight: 800, color: '#9A3412', margin: 0 }}>GROWTH RO (%)</p>
                   <p style={{ fontSize: '11px', fontWeight: 950, color: '#059669', margin: 0 }}>+12.4%</p>
                </div>
             </div>
          </div>
        </div>

        {/* E. RISK (ANTIPASI) */}
        <div style={{ background: '#FEF2F2', padding: '1.25rem', borderRadius: '24px', border: '1px solid #FEE2E2', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="ShieldAlert" size={14} color="#B91C1C" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#B91C1C', letterSpacing: '0.05em' }}>E. RISK (ANTIPASI)</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#EF4444', margin: 0 }}>4</p>
                <p style={{ fontSize: '7px', fontWeight: 850, color: '#EF4444', margin: 0 }}>CHURN CLIENT</p>
             </div>
             <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 950, color: '#B45309', margin: 0 }}>12</p>
                <p style={{ fontSize: '7px', fontWeight: 850, color: '#B45309', margin: 0 }}>INACTIVE CLIENT</p>
             </div>
             <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '7px', fontWeight: 800, color: '#B91C1C', margin: 0 }}>*WARNING: NO ORDER {'>'} 90 DAYS</p>
             </div>
          </div>
        </div>

        {/* BD SCORING (WEIGHTED) */}
        <div style={{ background: '#1E293B', padding: '1.25rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
             <Icon name="Award" size={80} color="white" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="Trophy" size={14} color="#FBBF24" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: 'white', letterSpacing: '0.05em' }}>BD PERFORMANCE SCORE</p>
          </div>
          <div style={{ textAlign: 'center' }}>
             <p style={{ fontSize: '32px', fontWeight: 950, color: 'white', margin: 0 }}>84.5</p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8', margin: 0, textTransform: 'uppercase' }}>Weighted Retention Score</p>
          </div>
          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '10px' }}>
             <p style={{ fontSize: '7px', color: '#CBD5E1', margin: 0 }}>WEIGHT: RATE(25%) | VALUE(25%) | FREQ(20%)</p>
          </div>
        </div>

      </div>

      {/* 📊 2. AUDIT LOYALITAS (ATM BISNIS RADAR) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#7C3AED', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>DAFTAR ATM BISNIS (RETENSI & LTV)</h2>
          </div>
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '6px 14px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, color: '#7C3AED' }}>
             GOLDEN CLIENTS: {roData.filter(d => d.priority).length} ENTITAS AKTIF
          </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
               <th rowSpan={2} style={{ padding: '1.5rem 1rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>NO</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1rem', fontSize: '10px', fontWeight: 900, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>BRAND & PRODUK</th>
               <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontSize: '9px', color: '#64748B', borderRight: '1px solid #E2E8F0', background: '#F1F5F9' }}>DATA WAJIB REPLENISHMENT</th>
               <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontSize: '9px', color: '#1D4ED8', borderRight: '1px solid #E2E8F0', background: '#EFF6FF' }}>STATUS & REMINDER</th>
               <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontSize: '9px', color: '#B45309', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>ACTIVITY & FEEDBACK</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1.5rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'right' }}>LIFETIME VALUE (LTV)</th>
            </tr>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>TGL SAMPAI</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>EST. HABIS</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>POTENSI</th>
               
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#EFF6FF' }}>STATUS RO</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#EFF6FF' }}>AUTO REMINDER</th>
               
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>FEEDBACK</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>KOMPLAIN</th>
            </tr>
          </thead>
          <tbody>
            {roData.map((row, i) => (
              <tr key={row.id} style={{ 
                borderBottom: '1px solid #F1F5F9',
                background: row.priority ? '#F5F3FF' : 'transparent'
              }}>
                <td className="tabular-nums" style={{ padding: '1.5rem 1rem', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>{i + 1}</td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {row.priority && <Icon name="Star" size={14} color="#7C3AED" style={{ fill: '#7C3AED' }} />}
                      <p style={{ fontSize: '13px', fontWeight: 900, color: '#111827', margin: 0 }}>{row.brand}</p>
                   </div>
                   <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', margin: '2px 0 0 0' }}>{row.product}</p>
                </td>
                
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>{row.arrived}</td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 800, color: '#DC2626' }}>{row.est_empty}</td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                   <span style={{ 
                     fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '100px',
                     background: row.potensi === 'TINGGI' ? '#ECFDF5' : (row.potensi === 'SEDANG' ? '#EFF6FF' : '#FEE2E2'),
                     color: row.potensi === 'TINGGI' ? '#059669' : (row.potensi === 'SEDANG' ? '#2563EB' : '#DC2626'),
                     display: 'inline-block'
                   }}>
                     {row.potensi}
                   </span>
                </td>
                
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', background: '#EFF6FF', textAlign: 'center' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 900, color: row.status === 'Repeat Order' ? '#059669' : '#1E293B', margin: 0 }}>{row.status}</p>
                      <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                         <div style={{ 
                           width: row.status === 'Repeat Order' ? '100%' : (row.status === 'Follow up 2' ? '66%' : (row.status === 'Follow up 1' ? '33%' : '10%')), 
                           height: '100%', 
                           background: row.status === 'Lost Customer' ? '#F43F5E' : '#2563EB' 
                         }}></div>
                      </div>
                   </div>
                </td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', background: '#EFF6FF', textAlign: 'center' }}>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'white', border: '1px solid #DBEAFE', borderRadius: '8px' }}>
                      <Icon name="Bell" size={10} color="#2563EB" />
                      <span className="tabular-nums" style={{ fontSize: '9px', fontWeight: 900, color: '#2563EB' }}>{row.reminder}</span>
                   </div>
                </td>

                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>
                   <p style={{ fontSize: '10px', color: '#64748B', margin: 0, fontStyle: 'italic' }}>{row.feedback}</p>
                </td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>
                   <p style={{ fontSize: '10px', color: row.complain !== '-' ? '#DC2626' : '#64748B', fontWeight: row.complain !== '-' ? 800 : 400, margin: 0 }}>{row.complain}</p>
                </td>

                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <p className="tabular-nums" style={{ fontSize: '14px', fontWeight: 900, color: '#111827', margin: 0 }}>{row.ltv}</p>
                      <p style={{ fontSize: '8px', fontWeight: 800, color: '#7C3AED' }}>{row.ro_count}x TOTAL REPEAT</p>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📊 3. TOP PELANGGAN BY REVENUE (ATM BISNIS MASTER) */}
      <div style={{ marginTop: '4rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>TOP PELANGGAN BY REVENUE</h2>
         </div>

         <div style={{ 
            background: 'white', 
            borderRadius: '24px', 
            border: '1px solid #E2E8F0', 
            overflow: 'hidden',
            maxWidth: '900px', // Restrict width for better focus
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
         }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                     <th style={{ padding: '1rem', fontSize: '10px', fontWeight: 950, color: '#94A3B8', textAlign: 'center', width: '80px', letterSpacing: '0.1em' }}>RANK</th>
                     <th style={{ padding: '1rem 1.5rem', fontSize: '10px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em' }}>NAMA PELANGGAN</th>
                     <th style={{ padding: '1rem', fontSize: '10px', fontWeight: 950, color: '#94A3B8', textAlign: 'center', width: '150px', letterSpacing: '0.1em' }}>QTY SALES (RO)</th>
                     <th style={{ padding: '1rem 1.5rem', fontSize: '10px', fontWeight: 950, color: '#111827', textAlign: 'right', width: '250px', letterSpacing: '0.1em' }}>ACCUMULATED REVENUE</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                     { name: 'Tazkia Rizki (TAZZI)', sales: 7, revenue: 'Rp 2,334,240,000' },
                     { name: 'RAHMAT TUNGGAK', sales: 13, revenue: 'Rp 566,230,500' },
                     { name: 'Gyska Puteri Casytha Purba', sales: 8, revenue: 'Rp 551,349,000' },
                     { name: 'KEJAR PRODUKSI', sales: 12, revenue: 'Rp 493,681,380' },
                     { name: 'Moh Andik Irawan', sales: 9, revenue: 'Rp 406,525,000' },
                     { name: 'Emje (Sensesoul)', sales: 8, revenue: 'Rp 402,500,000' },
                     { name: 'Djafar Shodiq (Sigviolet)', sales: 14, revenue: 'Rp 378,499,500' },
                     { name: 'AGNES DWI UTAMI', sales: 4, revenue: 'Rp 370,900,000' },
                     { name: 'Alex', sales: 3, revenue: 'Rp 345,285,140' },
                     { name: 'Karmila', sales: 5, revenue: 'Rp 167,390,300' }
                  ].map((row, i) => (
                     <tr key={i} style={{ borderBottom: '1px solid #F8FAFC', background: i === 0 ? '#F0FDF4' : 'transparent' }}>
                        <td className="tabular-nums" style={{ padding: '1rem', fontSize: '11px', fontWeight: 800, color: i === 0 ? '#059669' : '#94A3B8', textAlign: 'center' }}>
                           {i === 0 ? '🏆 01' : (i + 1 < 10 ? `0${i+1}` : i + 1)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                           <p style={{ fontSize: '12px', fontWeight: 900, color: i === 0 ? '#059669' : '#1E293B', margin: 0 }}>{row.name}</p>
                        </td>
                        <td className="tabular-nums" style={{ padding: '1rem', fontSize: '12px', fontWeight: 800, color: '#64748B', textAlign: 'center' }}>{row.sales}</td>
                        <td className="tabular-nums" style={{ padding: '1rem 1.5rem', fontSize: '13px', fontWeight: 950, color: i === 0 ? '#059669' : '#111827', textAlign: 'right' }}>{row.revenue}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ClientRO;
