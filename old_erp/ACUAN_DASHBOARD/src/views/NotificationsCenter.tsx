import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const AlertGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
    {children}
  </div>
);

interface AlertCardProps {
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  items: Array<{ label: string; value: string | number; color: string }>;
  action: string;
}

const AlertCard: React.FC<AlertCardProps> = ({ title, subtitle, icon, iconColor, items, action }) => (
  <div style={{ 
    background: 'white', 
    borderRadius: '32px', 
    border: '1px solid #F1F5F9', 
    padding: '2rem',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* 🧬 Decorative BG Icon */}
    <div style={{ position: 'absolute', right: '-10px', top: '20px', opacity: 0.03, transform: 'scale(4)' }}>
      <Icon name={icon} size={40} color={iconColor} />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
      <div style={{ 
        width: '56px', 
        height: '56px', 
        background: `${iconColor}08`, 
        borderRadius: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: `inset 0 0 0 1px ${iconColor}15`
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'white', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Icon name={icon} color={iconColor} size={18} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: iconColor }}></div>
          <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#DC2626', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</h3>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{subtitle}</p>
      </div>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }}></div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, opacity: 0.3 }}></div>
             <span style={{ fontSize: '15px', fontWeight: 950, color: item.color }}>{item.value}</span>
          </div>
        </div>
      ))}
    </div>

    <div style={{ 
      background: '#F8FAFC', 
      padding: '1.25rem', 
      borderRadius: '20px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      border: '1px solid #F1F5F9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
          <Icon name="Zap" size={14} color={iconColor} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Command Center Action:</p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>{action}</p>
        </div>
      </div>
      <Icon name="ChevronRight" size={16} color="#CBD5E1" />
    </div>
  </div>
);

const NotificationsCenter: React.FC = () => {
  return (
    <div style={{ padding: '3rem', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 🚀 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em' }}>DASHBOARD ALERT</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 950, letterSpacing: '0.05em' }}>SYSTEM ANOMALY DETECTED</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>6 Node Kritis</span> Teridentifikasi • Status: <span style={{ color: '#10B981', fontWeight: 900 }}>SYNCED</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button style={{ 
             background: 'white', 
             border: '1px solid #E2E8F0', 
             padding: '10px 20px', 
             borderRadius: '12px', 
             fontSize: '11px', 
             fontWeight: 900, 
             color: '#64748B',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             cursor: 'pointer'
           }}>
             <Icon name="RefreshCw" size={14} /> REFRESH PARAMS
           </button>
           <button style={{ 
             background: '#0F172A', 
             border: 'none', 
             padding: '10px 24px', 
             borderRadius: '12px', 
             fontSize: '11px', 
             fontWeight: 900, 
             color: 'white',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             cursor: 'pointer'
           }}>
             <Icon name="CheckCircle" size={14} /> AUDIT ALL NODES
           </button>
        </div>
      </div>

      <AlertGrid>
        {/* Card 1: SALES ALERT (BD) */}
        <AlertCard 
          title="SALES ALERT (BD)"
          subtitle="Peluang uang yang hampir hilang"
          icon="TrendingUp"
          iconColor="#EF4444"
          items={[
            { label: 'Leads belum di follow up > 24 jam', value: '15', color: '#EF4444' },
            { label: 'Deal stuck > 7 hari (Sample/Nego)', value: '8', color: '#F59E0B' },
            { label: 'Client high value belum closing', value: '2', color: '#DC2626' }
          ]}
          action="Paksa BD follow up hari ini"
        />

        {/* Card 2: SAMPLE & R&D ALERT */}
        <AlertCard 
          title="SAMPLE & R&D ALERT"
          subtitle="Bottleneck tersembunyi di operasional"
          icon="FlaskConical"
          iconColor="#F59E0B"
          items={[
            { label: 'Sample overdue > SLA (3-5 hari)', value: '6', color: '#EF4444' },
            { label: 'Sample revisi berkali-kali', value: '4', color: '#F59E0B' },
            { label: 'Sample belum approval / dikirim', value: '10', color: '#F59E0B' }
          ]}
          action="Dorong R&D / lab percepat proses internal"
        />

        {/* Card 3: REPEAT ORDER ALERT */}
        <AlertCard 
          title="REPEAT ORDER ALERT"
          subtitle="Retensi & Kesetiaan Pelanggan"
          icon="RefreshCw"
          iconColor="#8B5CF6"
          items={[
            { label: 'Client siap repeat minggu ini', value: '20', color: '#F59E0B' },
            { label: 'Client telat reorder (Churn Risk)', value: '8', color: '#EF4444' },
            { label: 'High value client belum di follow up', value: '3', color: '#F59E0B' }
          ]}
          action="BD wajib kontak client hari ini"
        />

        {/* Card 4: LOST RISK ALERT (ADVANCED) */}
        <AlertCard 
          title="LOST RISK ALERT (ADVANCED)"
          subtitle="Ketajaman Owner & Pencegahan Churn"
          icon="ShieldAlert"
          iconColor="#475569"
          items={[
            { label: 'Client risiko churn (Trend Turun)', value: '5', color: '#EF4444' },
            { label: 'Deal hampir batal (Prospect Lost)', value: '3', color: '#EF4444' },
            { label: 'Komplain tinggi dalam 30 hari', value: 'HIGH', color: '#DC2626' }
          ]}
          action="Intervensi Owner / Head of BD segera"
        />

        {/* Card 5: PRODUCTION ALERT */}
        <AlertCard 
          title="PRODUCTION ALERT"
          subtitle="Reputasi bisnis & Ketepatan waktu"
          icon="Factory"
          iconColor="#F59E0B"
          items={[
            { label: 'Order overdue produksi (Telat)', value: '5', color: '#EF4444' },
            { label: 'Order hampir telat deadline', value: '12', color: '#F59E0B' },
            { label: 'Bottleneck di QC / packing', value: 'STUCK', color: '#F59E0B' }
          ]}
          action="Prioritas produksi (Bukan FIFO, tapi Urgency)"
        />

        {/* Card 6: CASHFLOW ALERT (KRITIS) */}
        <AlertCard 
          title="CASHFLOW ALERT (KRITIS)"
          subtitle="Hidup mati bisnis & Kesehatan Finansial"
          icon="Wallet"
          iconColor="#3B82F6"
          items={[
            { label: 'Invoice belum dibayar (Overdue)', value: 'Rp 800 Jt', color: '#EF4444' },
            { label: 'Client besar belum bayar > 30 hari', value: '10', color: '#EF4444' }
          ]}
          action="Tim finance + BD follow up payment segera"
        />
      </AlertGrid>

    </div>
  );
};

export default NotificationsCenter;
