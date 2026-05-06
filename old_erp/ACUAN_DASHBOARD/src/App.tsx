import React, { useState, Suspense, lazy } from 'react';
import * as Lucide from 'lucide-react';
import DigitalMarketing from './views/DigitalMarketing.js';
import BusinessDevelopment from './views/BusinessDevelopment.js';
import RnD from './views/RnD.js';
import SCM from './views/SCM.js';
import Legalitas from './views/Legalitas.js';
import Produksi from './views/Produksi.js';
import Gudang from './views/Gudang.js';
import HR from './views/HR.js';
import Finance from './views/Finance.js';
import ExecutiveDashboard from './views/ExecutiveDashboard.js';
import NotificationsCenter from './views/NotificationsCenter.js';
import BukuTamu from './views/BukuTamu.js';
import ClientSample from './views/ClientSample.js';
import ClientProduksi from './views/ClientProduksi.js';
import ClientRO from './views/ClientRO.js';
import Lost from './views/Lost.js';

// Type-safe icon picker with fallback
const Icon = ({ name, size = 18, color }: { name: string; size?: number; color?: string }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} />;
};

const ComingSoon: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
    <Icon name="LayoutDashboard" size={48} color="#D1D5DB" />
    <h1 style={{ fontWeight: 900, color: 'var(--gray-900)', marginTop: '1rem' }}>{name}</h1>
    <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.5rem' }}>Sinkronisasi Protokol Departemen...</p>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('marketing');

  const navItems = [
    { id: 'executive', label: 'Dashboard Eksekutif', icon: 'LayoutDashboard', category: 'EKSEKUTIF' },
    { id: 'alert', label: 'Dashboard Notifikasi', icon: 'AlertTriangle', category: 'EKSEKUTIF' },

    { id: 'marketing', label: 'Digital Marketing', icon: 'TrendingUp', category: 'DEPARTEMEN' },
    { id: 'bd', label: 'Business Development', icon: 'Briefcase', category: 'DEPARTEMEN' },
    { id: 'rd', label: 'Research & Development', icon: 'FlaskConical', category: 'DEPARTEMEN' },
    { id: 'scm', label: 'Supply Chain Management', icon: 'Truck', category: 'DEPARTEMEN' },
    { id: 'legal', label: 'Legalitas', icon: 'ShieldCheck', category: 'DEPARTEMEN' },
    { id: 'produksi', label: 'Produksi', icon: 'Factory', category: 'DEPARTEMEN' },
    { id: 'gudang', label: 'Gudang', icon: 'Warehouse', category: 'DEPARTEMEN' },
    { id: 'hr', label: 'HR (SDM)', icon: 'Users', category: 'DEPARTEMEN' },
    { id: 'finance', label: 'Keuangan', icon: 'Wallet', category: 'DEPARTEMEN' },

    { id: 'bd-buku-tamu', label: 'Buku tamu', icon: 'Users', category: 'Business Development' },
    { id: 'bd-sample', label: 'Client Sample', icon: 'Package', category: 'Business Development' },
    { id: 'bd-produksi', label: 'Client Produksi', icon: 'ClipboardCheck', category: 'Business Development' },
    { id: 'bd-ro', label: 'Client RO', icon: 'RefreshCw', category: 'Business Development' },
    { id: 'bd-lost', label: 'Lost', icon: 'UserX', category: 'Business Development' },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-app)', overflow: 'hidden' }}>

      {/* 🧬 Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div style={{ width: '32px', height: '32px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Zap" color="white" size={20} />
          </div>
          <span className="logo-text">AUREON ERP</span>
        </div>

        <nav style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }} className="custom-scrollbar">
          {['EKSEKUTIF', 'DEPARTEMEN', 'Business Development'].map((category) => (
            <React.Fragment key={category}>
              <p className="nav-label" style={{ marginTop: category !== 'EKSEKUTIF' ? '1.5rem' : '0' }}>{category}</p>
              {navItems.filter(i => i.category === category).map(item => (
                <a
                  key={item.id}
                  href="#"
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
                >
                  <Icon name={item.icon} /> {item.label}
                </a>
              ))}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      {/* 🧬 Main Dashboard Panel */}
      <main className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input type="text" className="search-bar" placeholder="Cari parameter, node, atau log audit..." style={{ paddingLeft: '2.5rem' }} />
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="Search" color="#94A3B8" size={14} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 12px', background: '#F0F9FF', borderRadius: '6px', fontSize: '10px', fontWeight: 900, color: '#0369A1' }}>STABIL v2.0</div>
              <div style={{ padding: '6px 12px', background: '#FDF2F8', borderRadius: '6px', fontSize: '10px', fontWeight: 900, color: '#DC2626' }}>SINGKRONISASI LANGSUNG</div>
            </div>
            <Icon name="Bell" color="#64748B" size={20} />
          </div>
        </header>

        <div className="view-body">
          {activeView === 'executive' && <ExecutiveDashboard />}
          {activeView === 'marketing' && <DigitalMarketing />}
          {activeView === 'bd' && <BusinessDevelopment />}
          {activeView === 'bd-buku-tamu' && <BukuTamu />}
          {activeView === 'bd-sample' && <ClientSample />}
          {activeView === 'bd-produksi' && <ClientProduksi />}
          {activeView === 'bd-ro' && <ClientRO />}
          {activeView === 'bd-lost' && <Lost />}
          {activeView === 'rd' && <RnD />}
          {activeView === 'scm' && <SCM />}
          {activeView === 'legal' && <Legalitas />}
          {activeView === 'produksi' && <Produksi />}
          {activeView === 'gudang' && <Gudang />}
          {activeView === 'hr' && <HR />}
          {activeView === 'finance' && <Finance />}
          {activeView === 'alert' && <NotificationsCenter />}
          {![
            'marketing', 'bd', 'rd', 'scm', 'legal', 'produksi', 'gudang', 'finance', 'executive', 'alert', 'hr',
            'bd-buku-tamu', 'bd-sample', 'bd-produksi', 'bd-ro', 'bd-lost'
          ].includes(activeView) && (
              <ComingSoon name={navItems.find(i => i.id === activeView)?.label || 'Dashboard'} />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;


