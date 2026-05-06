import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const BukuTamu: React.FC = () => {
  // 📋 Comprehensive Guest Database (Combined Audit)
  const guestData = [
    { no: 1, date: '01-04', time: '13:01', name: 'RICKY', phone: '+6285777111194', email: '-', city: 'JKT', product: 'PARFUM ALPHA', moq: '1,000', launching: 'MEI 26', market: 'E-COMMERCE', category: 'BRANDED', busDev: 'Diva' },
    { no: 2, date: '01-04', time: '11:06', name: 'EVI SURIANI', phone: '+6282388388851', email: 'evi@mail.com', city: 'MDN', product: 'SERUM ACNE', moq: '2,000', launching: 'JUN 26', market: 'KLINIK', category: 'PEMULA', busDev: 'Diva' },
    { no: 3, date: '01-04', time: '10:59', name: 'LISA MONIKA', phone: '+628113261888', email: '-', city: 'SBY', product: 'MOISTURIZER', moq: '500', launching: 'JUL 26', market: 'TIKTOK', category: 'PEMULA', busDev: 'Diva' },
    { no: 4, date: '02-04', time: '09:15', name: 'ARIF BUDIMAN', phone: '+6281223334445', email: 'arif@biz.id', city: 'JKT', product: 'SUNSCREEN', moq: '5,000', launching: 'APR 26', market: 'MODERN', category: 'BRANDED', busDev: 'Citra' },
    { no: 5, date: '02-04', time: '14:30', name: 'SARI INDAH', phone: '+6285666777888', email: '-', city: 'BDG', product: 'BODY LOTION', moq: '1,000', launching: 'AGU 26', market: 'RESELLER', category: 'PEMULA', busDev: 'Andi' },
    { no: 6, date: '03-04', time: '10:00', name: 'DEDY JAYA', phone: '+6281999000111', email: 'dedy@jaya.com', city: 'SMG', product: 'POMADE', moq: '1,000', launching: 'MEI 26', market: 'BARBER', category: 'BRANDED', busDev: 'Diva' },
    { no: 7, date: '03-04', time: '11:45', name: 'LINDA WATI', phone: '+6282111222333', email: '-', city: 'SBY', product: 'FACIAL WASH', moq: '3,000', launching: 'JUN 26', market: 'MARKET', category: 'BRANDED', busDev: 'Citra' },
    { no: 8, date: '04-04', time: '08:30', name: 'HADI PRABOWO', phone: '+6281888777666', email: 'hadi@prab.id', city: 'SLO', product: 'HAIR TONIC', moq: '1,000', launching: 'JUL 26', market: 'TRAD', category: 'PEMULA', busDev: 'Andi' },
    { no: 9, date: '04-04', time: '13:15', name: 'RENA PUTRI', phone: '+6285222333444', email: '-', city: 'YOG', product: 'EYE SERUM', moq: '500', launching: 'MEI 26', market: 'BOUTIQUE', category: 'PEMULA', busDev: 'Diva' },
    { no: 10, date: '05-04', time: '15:20', name: 'BUDI SETIAWAN', phone: '+6281333444555', email: 'budi@set.co', city: 'MLG', product: 'CLAY MASK', moq: '2,000', launching: 'JUN 26', market: 'COMM', category: 'BRANDED', busDev: 'Citra' },
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        MASTER DATABASE BUKU TAMU <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Comprehensive Lead Audit)</span>
      </h2>

      {/* 🧬 1. EXECUTIVE METRIC HUB (Simplified Audit Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* 1. TOTAL LEADS */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>TOTAL LEADS</p>
             <Icon name="Users" size={16} color="#6366F1" />
          </div>
          <div>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>428</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 950, color: '#10B981' }}>+12</span>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>DARI KEMARIN</span>
             </div>
          </div>
        </div>

        {/* 2. FOLLOW UP AKTIVITAS */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>FOLLOW UP AKTIVITAS</p>
             <Icon name="Activity" size={16} color="#F59E0B" />
          </div>
          <div>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>182</p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748B', margin: 0 }}>TASK SELESAI / 92% PERSENTASE</p>
          </div>
        </div>

        {/* 3. JUMLAH MEETING */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>JUMLAH MEETING</p>
             <Icon name="Calendar" size={16} color="#EC4899" />
          </div>
          <div>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>15</p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748B', margin: 0 }}>OFFLINE & ONLINE (PERIOD INI)</p>
          </div>
        </div>

        {/* 4. CONVERSION RATE */}
        <div style={{ background: '#F0F9FF', padding: '1.5rem', borderRadius: '24px', border: '1px solid #BAE6FD', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#0369A1', letterSpacing: '0.1em', margin: 0 }}>CONVERSION RATE</p>
             <Icon name="Target" size={16} color="#0369A1" />
          </div>
          <div>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#0C4A6E', margin: '4px 0' }}>14.2%</p>
             <p style={{ fontSize: '8px', fontWeight: 800, color: '#0369A1', margin: 0 }}>LEAD TO DEAL (CLOSE RATIO)</p>
          </div>
        </div>

      </div>

      {/* 📊 2. TABLE PHYSICS (ULTRA-WIDE ZERO SCROLL) */}
      <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <p style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em', margin: 0 }}>COMPREHENSIVE GUEST LOG (AUDIT-READY)</p>
           <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>
                FULL DATA VISIBILITY
              </span>
              <span style={{ background: '#10B981', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 950 }}>
                ZERO SCROLL
              </span>
           </div>
        </div>
        <div style={{ overflowX: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1rem 0.5rem 1rem 1.5rem', width: '9%', fontSize: '8px', fontWeight: 950, color: '#94A3B8' }}>TANGGAL/WKT</th>
                <th style={{ padding: '1rem 0.5rem', width: '11%', fontSize: '8px', fontWeight: 950, color: '#94A3B8' }}>NAMA CLIENT</th>
                <th style={{ padding: '1rem 0.5rem', width: '9%', fontSize: '8px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>BUSDEV</th>
                <th style={{ padding: '1rem 0.5rem', width: '12%', fontSize: '8px', fontWeight: 950, color: '#94A3B8' }}>KONTAK (WA/MAIL)</th>
                <th style={{ padding: '1rem 0.5rem', width: '5%', fontSize: '8px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>KOTA</th>
                <th style={{ padding: '1rem 0.5rem', width: '12%', fontSize: '8px', fontWeight: 950, color: '#94A3B8' }}>PRODUK</th>
                <th style={{ padding: '1rem 0.5rem', width: '6%', fontSize: '8px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>MOQ</th>
                <th style={{ padding: '1rem 0.5rem', width: '8%', fontSize: '8px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>LAUNCH</th>
                <th style={{ padding: '1rem 0.5rem', width: '13%', fontSize: '8px', fontWeight: 950, color: '#94A3B8' }}>TARGET MARKET</th>
                <th style={{ padding: '1rem 1.5rem 1rem 0.5rem', width: '15%', fontSize: '8px', fontWeight: 950, color: '#94A3B8', textAlign: 'right' }}>KATEGORISASI</th>
              </tr>
            </thead>
            <tbody>
              {guestData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem 0.5rem 1rem 1.5rem' }}>
                     <div style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.date}</div>
                     <div style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8' }}>{row.time}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                     <div style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', fontWeight: 900, color: '#6366F1' }}>{row.busDev}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                     <div style={{ fontSize: '10px', fontWeight: 850, color: '#1E293B' }}>{row.phone}</div>
                     <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.email}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748B' }}>{row.city}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                     <div style={{ fontSize: '10px', fontWeight: 950, color: '#2563EB' }}>{row.product}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                     <div style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.moq}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                     <div style={{ fontSize: '9px', fontWeight: 900, color: '#1E293B' }}>{row.launching}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                     <div style={{ fontSize: '9px', fontWeight: 850, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.market}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem 1rem 0.5rem', textAlign: 'right' }}>
                     <span style={{ 
                       background: row.category === 'PEMULA' ? '#F0FDF4' : '#F5F3FF',
                       color: row.category === 'PEMULA' ? '#166534' : '#5B21B6',
                       padding: '2px 8px', borderRadius: '10px', fontSize: '8px', fontWeight: 950,
                       border: `1px solid ${row.category === 'PEMULA' ? '#DCFCE7' : '#DDD6FE'}`
                     }}>{row.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem 2rem', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
           <p style={{ fontSize: '9px', fontWeight: 950, color: '#64748B', margin: 0 }}>TOTAL LOGGED DATA: <span style={{ color: '#111827' }}>10 RECORDS</span></p>
        </div>
      </div>
    </div>
  );
};

export default BukuTamu;
