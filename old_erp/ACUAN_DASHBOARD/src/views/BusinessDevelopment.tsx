import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const BusinessDevelopment: React.FC = () => {
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
    <div className="view-section active" style={{ paddingBottom: '5rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        DIVISI PENGEMBANGAN BISNIS <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Pusat Komando Pertumbuhan)</span>
      </h2>

      {/* 🚀 OVERVIEW GRID: THE HEART OF BD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>

        {/* 🔴 A. FUNNEL OVERVIEW */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 A. FUNNEL OVERVIEW</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Total Leads', val: '1,245', sub: 'Inflow' },
              { label: 'Leads Contacted', val: '850', sub: '68%', highlight: true },
              { label: 'Sample Process', val: '220', sub: '25%' },
              { label: 'DP Received', val: '110', sub: '50%' },
              { label: 'Deal Confirmed', val: '85', sub: '77%' },
              { label: 'Repeat Order', val: '42', sub: '49%' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>{item.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{item.val}</span>
                  {item.sub && <span style={{ fontSize: '9px', fontWeight: 900, color: '#10B981', marginLeft: '6px' }}>({item.sub})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🟠 B. REVENUE PIPELINE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟠 B. REVENUE PIPELINE</p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', margin: 0 }}>TOTAL PIPELINE VALUE</p>
            <p style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>Rp 12.5 M</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Potential Sample', val: 'Rp 4.2M' },
              { label: 'Potential Deal', val: 'Rp 2.8M' },
              { label: 'Confirmed Deal', val: 'Rp 3.5M', color: '#2563EB' },
              { label: 'Repeat Order Value', val: 'Rp 1.5M', color: '#10B981' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: item.color || '#1E293B' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🟡 C. ACTIVITY PERFORMANCE */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#EAB308', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟡 C. ACTIVITY PERFORMANCE</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#FEFCE8', padding: '1rem', borderRadius: '16px', border: '1px solid #FEF9C3' }}>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#854D0E', margin: 0 }}>FOLLOW-UP TODAY</p>
              <p style={{ fontSize: '20px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>45</p>
            </div>
            <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '16px', border: '1px solid #DCFCE7' }}>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#166534', margin: 0 }}>AVG RESPONSE</p>
              <p style={{ fontSize: '20px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>1.2<span style={{ fontSize: '10px' }}>h</span></p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>Active Leads</span>
              <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>320</span>
            </div>
            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '74%', height: '100%', background: '#EAB308' }}></div>
            </div>
          </div>
        </div>

        {/* 🔵 D. CRITICAL ALERT */}
        <div style={{ background: '#FFF1F2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FECDD3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: '8px', height: '8px', background: '#E11D48', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '11px', fontWeight: 950, color: '#9F1239', letterSpacing: '0.05em' }}>🔵 D. CRITICAL ALERT</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Unfollowed Leads', val: '12', color: '#E11D48' },
              { label: 'Stuck Samples (>14d)', val: '8', color: '#E11D48' },
              { label: 'Stuck Negotiation', val: '5', color: '#B45309' },
              { label: 'At Risk Clients', val: '3', color: '#9F1239' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(225, 29, 72, 0.1)' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>{item.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 950, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem', marginBottom: '3.5rem' }}>

        {/* 🟠 2. BD PERFORMANCE TABLE */}
        <div>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟠 2. BD PERFORMANCE EVALUATION</h3>
          <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>BD NAME</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>LEADS</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>FOLLOW UP</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CR SAMPLE</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CR DEAL</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CLS SAMPLE</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CLS NEW CLIENT</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>CLS RO</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>ACTUAL REVENUE</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950, color: '#64748B' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Andi Pratama', leads: 450, fu: 1240, crs: '26%', crd: '18%', cs: 117, cd: '81 JT', cp: '42 JT', rev: 'Rp 3.24M', status: 'MELAMPAUI TARGET', tagColor: '#10B981' },
                  { name: 'Citra Kirana', leads: 320, fu: 980, crs: '29%', crd: '15%', cs: 92, cd: '48 JT', cp: '28 JT', rev: 'Rp 2.15M', status: 'SESUAI TARGET', tagColor: '#2563EB' },
                  { name: 'Budi Santoso', leads: 180, fu: 420, crs: '12%', crd: '8%', cs: 22, cd: '14 JT', cp: '5 JT', rev: 'Rp 0.85M', status: 'BAWAH TARGET', tagColor: '#EF4444' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.name}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.leads}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.fu}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>{row.crs}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#2563EB' }}>{row.crd}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.cs}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.cd}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '11px', fontWeight: 900 }}>{row.cp}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>{row.rev}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '8px', fontWeight: 950, background: row.tagColor, color: 'white', padding: '3px 8px', borderRadius: '4px' }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🟡 3. LOST & CHURN TABLE */}
        <div>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🟡 3. LOST & CHURN TABLE</h3>
          <div style={{ background: '#FFF1F2', borderRadius: '32px', border: '1px solid #FECDD3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>BRAND / BD</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>LOST VALUE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { brand: 'Nature Glow', bd: 'Andi P.', reason: 'Price', val: 'Rp 250Jt' },
                  { brand: 'Zen Skin', bd: 'Budi S.', reason: 'Sample', val: 'Rp 120Jt' },
                  { brand: 'Aqua Pure', bd: 'Andi P.', reason: 'Ghosting', val: 'Rp 450Jt' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(225, 29, 72, 0.1)' }}>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>{row.brand}</p>
                      <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#64748B' }}>{row.reason} ({row.bd})</p>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '12px', fontWeight: 950, color: '#E11D48' }}>{row.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 📊 1. PELACAKAN PROSES DEAL PRODUKSI (GRANULAR) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%' }}></div>
            <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>🔴 1. PELACAKAN PROSES DEAL PRODUKSI (GRANULAR)</h2>
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
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#94A3B8', borderRight: '1px solid #F1F5F9' }}>{i + 1}</td>
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
                    {[1, 2, 3, 4, 5].map(step => (
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

export default BusinessDevelopment;
