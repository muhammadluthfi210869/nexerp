import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const ClientSample: React.FC = () => {
  // 📋 Sample Tracking Data (Shared with Executive Dashboard)
  const sampleProjects = [
    { 
      name: 'AUREON BEAUTY', code: 'NPF-2024-001', date: '2024-05-15', days: '45 DAYS RUNN.', 
      note: '"Sampel v2 sudah disetujui, sedang menunggu konfirmasi PO final dari Owner Mandiri."', 
      moq: '10,000 Pcs', r_omset: 'Rp 250 Jt',
      revs: [
        { date: '2024-05-20', status: 'APPRO...' },
        { date: '2024-06-01', status: 'APPRO...' },
        null, null
      ],
      hki: { progress: 'PROGRESS', logo: 'NOT STARTED' },
      suggest: { kemasan: 'not started', desain: 'not started', nilai: 'not started' },
      nego: { label: 'DRAFT KONTRAK', val: 4 },
      status: 'DEAL', omset: '-'
    },
    { 
      name: 'BEAUTY STORE HUB', code: 'NPF-2024-002', date: '2024-06-10', days: '12 DAYS RUNN.', 
      note: '"Revisi sampel kedua masih belum cocok di ketebalan formula, chemist sedang ajust ulang."', 
      moq: '5,000 Pcs', r_omset: 'Rp 120 Jt',
      revs: [
        { date: '2024-06-15', status: 'PENDING' },
        null, null, null
      ],
      hki: { progress: 'NOT STARTED', logo: 'NOT STARTED' },
      suggest: { kemasan: 'done', desain: 'progress', nilai: 'not started' },
      nego: { label: 'NEGO MOQ', val: 2 },
      status: 'PROCESS', omset: '-'
    },
    { 
      name: 'GLOW SKIN LAB', code: 'NPF-2024-003', date: '2024-06-05', days: '18 DAYS RUNN.', 
      note: '"Client ingin penambahan fragrans rose, sedang pengiriman sampel revisi ke alamat kantor."', 
      moq: '20,000 Pcs', r_omset: 'Rp 450 Jt',
      revs: [
        { date: '2024-06-12', status: 'APPRO...' },
        { date: '2024-06-25', status: 'PENDING' },
        null, null
      ],
      hki: { progress: 'DONE', logo: 'NOT STARTED' },
      suggest: { kemasan: 'not started', desain: 'not started', nilai: 'not started' },
      nego: { label: 'NEGO HARGA', val: 3 },
      status: 'DEAL', omset: 'Rp 450 Jt'
    },
    { 
      name: 'NATURE BLISS', code: 'NPF-2024-004', date: '2024-06-20', days: '5 DAYS RUNN.', 
      note: '"Masih tahap diskusi awal mengenai budget produksi, client minta MOQ diturunkan ke 1.000..."', 
      moq: '2,000 Pcs', r_omset: 'Rp 50 Jt',
      revs: [
        { date: '2024-06-25', status: 'PENDING' },
        null, null, null
      ],
      hki: { progress: 'NOT STARTED', logo: 'NOT STARTED' },
      suggest: { kemasan: 'not started', desain: 'not started', nilai: 'not started' },
      nego: { label: 'PENAWARAN', val: 1 },
      status: 'PROCESS', omset: '-'
    },
    { 
      name: 'DERMA PRO ID', code: 'NPF-2024-005', date: '2024-05-30', days: '25 DAYS RUNN.', 
      note: '"Permintaan tekstur lebih ringan (watery). RnD sedang trial ulang untuk stabilitas formula."', 
      moq: '15,000 Pcs', r_omset: 'Rp 320 Jt',
      revs: [
        { date: '2024-06-05', status: 'APPRO...' },
        { date: '2024-06-15', status: 'APPRO...' },
        { date: '2024-06-22', status: 'PENDING' },
        null
      ],
      hki: { progress: 'PROGRESS', logo: 'NOT STARTED' },
      suggest: { kemasan: 'not started', desain: 'not started', nilai: 'not started' },
      nego: { label: 'NEGO HARGA', val: 3 },
      status: 'PROCESS', omset: '-'
    }
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '5rem' }}>
      <h2 className="dashboard-title">
        CLIENT SAMPLE <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Proses Pengembangan Formula & Pilot Project)</span>
      </h2>

      {/* 🧬 1. METRIC GRID (TRACK EVERYTHING) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { label: 'SAMPLE DALAM PROSES', val: '42', meta: 'SEDANG DI R&D', color: '#F59E0B', icon: 'FlaskConical' },
          { label: 'RENCANA OMSET', val: 'Rp 1.19M', meta: 'PIPELINE AKTIF', color: '#2563EB', icon: 'TrendingUp' },
          { label: 'SAMPLE APPROVED', val: '12', meta: 'APP. RATE: 64%', color: '#059669', icon: 'CheckCircle' },
          { label: 'DEAL RATE', val: '28.5%', meta: 'SAMPLE → DEAL', color: '#10B981', icon: 'Target' },
          { label: 'TOTAL OMSET', val: 'Rp 450 Jt', meta: 'DARI DEAL PILOT', color: '#1D4ED8', icon: 'DollarSign' },
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
              <p className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>{card.val}</p>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>{card.meta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📊 2. AUDIT DETIL PROSES (PELACAKAN PROYEK PILOT) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#2563EB', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>AUDIT DETIL PROSES (PELACAKAN PROYEK PILOT)</h2>
          </div>
          <div className="tabular" style={{ fontSize: '10px', fontWeight: 900, color: '#64748B', background: '#F1F5F9', padding: '6px 14px', borderRadius: '8px' }}>
            TOTAL AKTIF: {sampleProjects.length} PROYEK
          </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '2400px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th rowSpan={2} style={{ width: '60px', textAlign: 'center', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>NO</th>
              <th rowSpan={2} style={{ width: '250px', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>PELANGGAN / NPF</th>
              <th rowSpan={2} style={{ width: '160px', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>INFO LEADS</th>
              <th rowSpan={2} style={{ width: '300px', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>CATATAN PROGRESS</th>
              <th colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0', padding: '10px', fontSize: '10px', color: '#64748B', letterSpacing: '0.1em' }}>RENCANA DEAL</th>
              <th colSpan={4} style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', padding: '10px', fontSize: '10px', color: '#C2410C', letterSpacing: '0.1em' }}>PELACAKAN SAMPEL (STATUS & REVISI)</th>
              <th colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0', background: '#EFF6FF', padding: '10px', fontSize: '10px', color: '#1D4ED8', letterSpacing: '0.1em' }}>PELACAKAN HKI</th>
              <th colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0', background: '#F5F3FF', padding: '10px', fontSize: '10px', color: '#6D28D9', letterSpacing: '0.1em' }}>SUGGEST</th>
              <th rowSpan={2} style={{ width: '180px', textAlign: 'center', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>NEGOSIASI DEAL</th>
              <th rowSpan={2} style={{ width: '140px', textAlign: 'center', borderRight: '1px solid #E2E8F0', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>STATUS AKHIR</th>
              <th rowSpan={2} style={{ width: '150px', textAlign: 'right', padding: '1rem', fontSize: '10px', fontWeight: 800 }}>TOTAL OMSET</th>
            </tr>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ width: '120px', fontSize: '9px', borderRight: '1px solid #E2E8F0', padding: '0.5rem' }}>MOQ</th>
              <th style={{ width: '140px', fontSize: '9px', borderRight: '1px solid #E2E8F0', padding: '0.5rem' }}>RENCANA OMSET</th>
              <th style={{ width: '110px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', padding: '0.5rem' }}>REV 1</th>
              <th style={{ width: '110px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', padding: '0.5rem' }}>REV 2</th>
              <th style={{ width: '110px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', padding: '0.5rem' }}>REV 3</th>
              <th style={{ width: '110px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#FFF7ED', padding: '0.5rem' }}>EXTRA</th>
              <th style={{ width: '120px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#EFF6FF', padding: '0.5rem' }}>PROGRESS HKI</th>
              <th style={{ width: '120px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#EFF6FF', padding: '0.5rem' }}>REVISI LOGO</th>
              <th style={{ width: '100px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#F5F3FF', padding: '0.5rem' }}>KEMASAN</th>
              <th style={{ width: '100px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#F5F3FF', padding: '0.5rem' }}>DESAIN</th>
              <th style={{ width: '100px', fontSize: '9px', borderRight: '1px solid #E2E8F0', background: '#F5F3FF', padding: '0.5rem' }}>NILAI</th>
            </tr>
          </thead>
          <tbody>
            {sampleProjects.map((row, i) => (
              <tr key={i} style={{ height: '110px', borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#94A3B8', borderRight: '1px solid #F1F5F9' }}>{i+1}</td>
                <td style={{ borderRight: '1px solid #E2E8F0', padding: '0 1rem' }}>
                  <div style={{ fontWeight: 900, color: '#111827', fontSize: '13px' }}>{row.name}</div>
                  <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700, marginTop: '2px' }}>{row.code}</div>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', padding: '0 1rem' }}>
                  <div className="tabular" style={{ fontWeight: 800, color: '#111827', fontSize: '11px' }}>{row.date}</div>
                  <div style={{ fontSize: '9px', color: '#DC2626', fontWeight: 900, marginTop: '4px' }}>{row.days}</div>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', padding: '0 1rem' }}>
                  <p style={{ fontSize: '10px', lineHeight: '1.4', color: '#64748B', fontStyle: 'italic', margin: 0 }}>{row.note}</p>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                   <p className="tabular" style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>{row.moq}</p>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                   <p className="tabular" style={{ fontSize: '11px', fontWeight: 900, color: '#64748B' }}>{row.r_omset}</p>
                </td>
                {row.revs.map((rev, ri) => (
                  <td key={ri} style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                    {rev ? (
                      <div style={{ 
                        background: rev.status === 'APPRO...' ? '#EFF6FF' : '#FFFBEB',
                        border: `1px solid ${rev.status === 'APPRO...' ? '#3B82F640' : '#F59E0B40'}`,
                        padding: '6px 8px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        width: '75px'
                      }}>
                        <p className="tabular" style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>{rev.date}</p>
                        <p style={{ fontSize: '9px', fontWeight: 900, color: rev.status === 'APPRO...' ? '#2563EB' : '#B45309', margin: '2px 0 0 0' }}>{rev.status}</p>
                      </div>
                    ) : (
                      <span style={{ color: '#E2E8F0' }}>-</span>
                    )}
                  </td>
                ))}
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ 
                    background: row.hki.progress === 'DONE' ? '#ECFDF5' : (row.hki.progress === 'PROGRESS' ? '#EFF6FF' : '#F9FAFB'),
                    color: row.hki.progress === 'DONE' ? '#059669' : (row.hki.progress === 'PROGRESS' ? '#2563EB' : '#94A3B8'),
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '8.5px',
                    fontWeight: 900,
                    display: 'inline-block'
                  }}>
                    {row.hki.progress}
                  </div>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                   <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '4px 12px', borderRadius: '20px', fontSize: '9px', fontWeight: 900, color: '#94A3B8' }}>{row.hki.logo}</div>
                </td>
                {['kemasan', 'desain', 'nilai'].map(key => (
                  <td key={key} style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto',
                      background: (row.suggest as any)[key] === 'done' ? '#6366F1' : '#F9FAFB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: (row.suggest as any)[key] === 'done' ? 'white' : '#CBD5E1'
                    }}>
                      <Icon name={key === 'kemasan' ? 'Box' : (key === 'desain' ? 'Palette' : 'Zap')} size={16} />
                    </div>
                  </td>
                ))}
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(step => (
                      <div key={step} style={{ width: '12px', height: '4px', borderRadius: '2px', background: step <= row.nego.val ? '#F59E0B' : '#F1F5F9' }}></div>
                    ))}
                  </div>
                </td>
                <td style={{ borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ 
                    background: row.status === 'DEAL' ? '#059669' : 'white',
                    border: `1.5px solid ${row.status === 'DEAL' ? '#059669' : '#E2E8F0'}`,
                    color: row.status === 'DEAL' ? 'white' : '#64748B',
                    padding: '6px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: 900
                  }}>
                    {row.status}
                  </div>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                  <p className="tabular" style={{ fontSize: '12px', fontWeight: 900, color: row.omset !== '-' ? '#059669' : '#CBD5E1' }}>{row.omset}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientSample;
