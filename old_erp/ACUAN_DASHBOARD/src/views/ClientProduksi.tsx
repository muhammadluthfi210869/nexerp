import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const ClientProduksi: React.FC = () => {
  // 📋 Production Pipeline Data (Sales & Lead Funnel)
  const pipelineData = [
    { 
      id: 1, brand: 'GLOW SKIN', product: 'Sunscreen Gel SPF 50', sku: 2, price: 'Rp 45,000', 
      est_qty: '5,000 Pcs', est_value: 'Rp 225 Jt', margin: '35%', pic: 'Citra',
      sample_req: '10-03-2026', sample_done: '15-03-2026', rev: 1, 
      status: 'Deal (SPK/Invoice)', days: 25, stageNum: 6
    },
    { 
      id: 2, brand: 'PURE ESSENCE', product: 'Hydrating Serum', sku: 1, price: 'Rp 65,000', 
      est_qty: '10,000 Pcs', est_value: 'Rp 650 Jt', margin: '40%', pic: 'Andi',
      sample_req: '15-03-2026', sample_done: '25-03-2026', rev: 3, 
      status: 'Sample Development', days: 17, stageNum: 3
    },
    { 
      id: 3, brand: 'DERMA PRO', product: 'Retinol Cream', sku: 3, price: 'Rp 85,000', 
      est_qty: '3,000 Pcs', est_value: 'Rp 255 Jt', margin: '30%', pic: 'Citra',
      sample_req: '01-03-2026', sample_done: '08-03-2026', rev: 2, 
      status: 'Negotiation', days: 32, stageNum: 5
    },
    { 
      id: 4, brand: 'BEAUTY HUB', product: 'Cleansing Oil', sku: 1, price: 'Rp 55,000', 
      est_qty: '2,000 Pcs', est_value: 'Rp 110 Jt', margin: '38%', pic: 'Budi',
      sample_req: '20-03-2026', sample_done: '-', rev: 0, 
      status: 'Konsultasi', days: 5, stageNum: 1
    },
    { 
      id: 5, brand: 'LUMINA SKIN', product: 'Brightening Toner', sku: 1, price: 'Rp 35,000', 
      est_qty: '15,000 Pcs', est_value: 'Rp 525 Jt', margin: '42%', pic: 'Andi',
      sample_req: '05-02-2026', sample_done: '12-02-2026', rev: 4, 
      status: 'Sample Approval', days: 55, stageNum: 4
    }
  ];

  const stages = [
    'Konsultasi', 'Kirim Penawaran', 'Sample Development (R&D)', 
    'Sample Approval', 'Negotiation', 'Deal (SPK/Invoice)'
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '5rem' }}>
      <h2 className="dashboard-title">
        CLIENT PRODUKSI <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Pipeline Penjualan & Konversi Produksi)</span>
      </h2>

      {/* 🧬 1. KPI GRID (LEADS TO DEAL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { label: 'CONVERSION RATE', val: '18.4%', meta: 'LEADS → DEAL TOTAL', color: '#10B981', icon: 'Target' },
          { label: 'AVG. CLOSING TIME', val: '28 HARI', meta: 'DARI KONSULTASI KE SPK', color: '#6366F1', icon: 'Clock' },
          { label: 'AVG. DEAL VALUE', val: 'Rp 353 Jt', meta: 'PER BD OFFICER', color: '#F59E0B', icon: 'DollarSign' },
        ].map((card, i) => (
          <div key={i} style={{ 
            background: '#FFFFFF', 
            borderRadius: '20px', 
            border: '1px solid #E2E8F0', 
            padding: '1.5rem', 
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.15em', margin: 0 }}>{card.label}</p>
              <div style={{ padding: '8px', background: card.color + '15', borderRadius: '12px' }}>
                <Icon name={card.icon} size={18} color={card.color} />
              </div>
            </div>
            <div>
              <p className="tabular-nums" style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>{card.val}</p>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>{card.meta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📊 2. PIPELINE RADAR (AUDIT DETIL PROSES) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>PELACAKAN PROSES DEAL PRODUKSI</h2>
          </div>
          <div style={{ padding: '6px 14px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', fontSize: '10px', fontWeight: 900, color: '#DC2626' }}>
             ANOMALI DETECTED: {pipelineData.filter(d => d.days > 30).length} STAGNANT LEADS
          </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
               <th rowSpan={2} style={{ padding: '1.5rem 1rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>NO</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1rem', fontSize: '10px', fontWeight: 900, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>BRAND & PRODUK</th>
               <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontSize: '9px', color: '#64748B', borderRight: '1px solid #E2E8F0', background: '#F1F5F9' }}>DATA PENTING PRODUKSI</th>
               <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontSize: '9px', color: '#B45309', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>TRACKING SAMPLE (R&D)</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1.5rem', fontSize: '10px', fontWeight: 900, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>PIC BD</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1.5rem', fontSize: '10px', fontWeight: 900, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>TAHAPAN STATUS</th>
               <th rowSpan={2} style={{ padding: '1.5rem 1.5rem', fontSize: '10px', fontWeight: 900, color: '#64748B', textAlign: 'right' }}>DURASI (HARI)</th>
            </tr>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>SKU / HARGA</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>EST. ORDER</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>EST. NILAI</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>MARGIN</th>
               
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>REQ DATE</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>DONE DATE</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>REVISI</th>
               <th style={{ padding: '10px', fontSize: '9px', color: '#94A3B8', borderRight: '1px solid #E2E8F0', background: '#FFF7ED' }}>SAMPLE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {pipelineData.map((row, i) => (
              <tr key={row.id} style={{ 
                borderBottom: '1px solid #F1F5F9',
                background: row.days > 30 ? '#FEF2F2' : 'transparent'
              }}>
                <td className="tabular-nums" style={{ padding: '1.5rem 1rem', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>{i + 1}</td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0' }}>
                   <p style={{ fontSize: '13px', fontWeight: 900, color: row.days > 30 ? '#DC2626' : '#111827', margin: 0 }}>{row.brand}</p>
                   <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', margin: '2px 0 0 0' }}>{row.product}</p>
                </td>
                
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0' }}>
                   <p style={{ fontSize: '11px', fontWeight: 800, color: '#111827' }}>{row.sku} SKU</p>
                   <p className="tabular-nums" style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>@{row.price}</p>
                </td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 800, color: '#111827' }}>{row.est_qty}</td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>{row.est_value}</td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 900, color: '#059669' }}>{row.margin}</td>
                
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, color: '#64748B', background: '#FFF7ED' }}>{row.sample_req}</td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, color: '#64748B', background: '#FFF7ED' }}>{row.sample_done}</td>
                <td className="tabular-nums" style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 900, color: row.rev > 2 ? '#DC2626' : '#111827', textAlign: 'center', background: '#FFF7ED' }}>{row.rev}</td>
                <td style={{ padding: '1rem', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', textAlign: 'center' }}>
                   <p style={{ 
                     fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '100px', 
                     background: row.rev > 2 ? '#FEE2E2' : '#ECFDF5', 
                     color: row.rev > 2 ? '#DC2626' : '#059669',
                     display: 'inline-block'
                   }}>
                     {row.rev > 2 ? 'REVISI TINGGI' : (row.sample_done === '-' ? 'ON PROGRESS' : 'APPROVED')}
                   </p>
                </td>

                <td style={{ padding: '1rem 1.5rem', borderRight: '1px solid #E2E8F0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</div>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#111827', margin: 0 }}>{row.pic}</p>
                   </div>
                </td>

                <td style={{ padding: '1rem 1.5rem', borderRight: '1px solid #E2E8F0' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                         {stages.map((_, idx) => (
                           <div key={idx} style={{ 
                             width: '18px', height: '6px', borderRadius: '2px', 
                             background: (idx + 1) <= row.stageNum ? (row.status.includes('Deal') ? '#10B981' : '#2563EB') : '#E2E8F0' 
                           }}></div>
                         ))}
                      </div>
                      <p style={{ 
                        fontSize: '9px', fontWeight: 900, 
                        color: row.status.includes('Deal') ? '#059669' : '#2563EB',
                        textTransform: 'uppercase'
                      }}>{row.status}</p>
                   </div>
                </td>

                <td className="tabular-nums" style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '14px', fontWeight: 900, color: row.days > 30 ? '#DC2626' : '#111827' }}>
                   {row.days} <span style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8' }}>HARI</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔮 KPI EXPLANATION */}
      <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem' }}>
         <div style={{ flex: 1, padding: '1.5rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, color: '#64748B', letterSpacing: '0.05em', marginBottom: '1rem' }}>DIAGNOSTIK KONVERSI</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>LEADS MACET (&gt;30 HARI):</span>
                  <span style={{ color: '#DC2626', fontWeight: 900 }}>40% DARI PIPELINE</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>HAMBATAN UTAMA:</span>
                  <span style={{ color: '#B45309', fontWeight: 900 }}>DURASI R&D (AVG 12 HARI)</span>
               </div>
            </div>
         </div>
         <div style={{ flex: 1, padding: '1.5rem', background: '#EFF6FF', borderRadius: '20px', border: '1px solid #DBEAFE' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, color: '#1D4ED8', letterSpacing: '0.05em', marginBottom: '1rem' }}>SOLUSI STRATEGIS</p>
            <p style={{ fontSize: '11px', color: '#1E40AF', lineHeight: '1.5', fontWeight: 600 }}>
               Percepat approval sample pada H+3 request untuk meningkatkan conversion rate sebesar 5.4%. Prioritaskan brand dengan estimasi omset &gt; Rp 200 Jt.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ClientProduksi;
