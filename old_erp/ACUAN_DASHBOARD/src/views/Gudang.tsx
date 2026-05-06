import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const Gudang: React.FC = () => {
  // 📋 Comprehensive Mock Data Generators
  const genRows = (count: number, type: string) => {
    const rawMaterials = ['NIACINAMIDE 99%', 'HYALURONIC ACID', 'VITAMIN C 10%', 'ALOE VERA EXT', 'ROSE WATER', 'GLYCERIN TECH'];
    const packMaterials = ['AIRLESS BOTTLE 30ML', 'LIP GLOSS TUBE 5G', 'MIST SPRAYER 100ML', 'BOX MATTE BLACK', 'LABEL SERUM V2'];
    
    return Array.from({ length: count }).map((_, i) => {
      if (type === 'raw') return { 
        name: rawMaterials[i % rawMaterials.length], 
        in: '12/01/24', age: `${45 + i}D`, 
        status: i % 5 === 0 ? 'NEEDS_QC' : 'FEFO_OK', 
        fisik: 500 + i*50, book: 500 + i*50, avail: 480 + i*50 
      };
      if (type === 'pack') return { 
        name: packMaterials[i % packMaterials.length], 
        in: '05/12/23', age: `${82 + i}D`, 
        status: i % 4 === 0 ? 'LOW_STOCK' : 'STABLE', 
        fisik: 2500 + i*100, book: 2500 + i*100, avail: 2450 + i*100 
      };
      if (type === 'so') return { 
        client: i === 0 ? 'PT. GlowUp' : `CLIENT_${String.fromCharCode(65 + i)}`,
        so: i === 0 ? 'SO-2026-001 • Brightening Serum V1' : `SO-2026-00${i+1}`,
        pcs: i === 0 ? '5,000 / 6,000' : `${1000 * (i+1)} / ${1000 * (i+1)}`,
        status: i === 0 ? 'PARSIAL' : 'FULL',
        variant: i === 0 ? '-1,000' : '0',
        progress: i === 0 ? '83%' : '100%'
      };
      if (type === 'risk') {
         const items = [
            { item: 'Acne Serum #001', detail: 'Botol Pump 100ml', issue: 'Leak: Inbound / QC Awal', cause: 'REJECT VENDOR', aging: '3 HARI', impact: 'Rp 1.2M', action: 'RETURN', loss: '20 Pcs' },
            { item: 'Retinol 10% Encaps', detail: 'Bulk Liquid', issue: 'Leak: Warehouse Rack', cause: 'EXPIRED', aging: '210 HARI', impact: 'Rp 45.0M', action: 'DISPOSAL', loss: '100 Kg' },
            { item: 'Day Cream #05', detail: 'Jar Acrylic Gold', issue: 'Leak: Warehouse Rack', cause: 'STAGNAN', aging: '185 HARI', impact: 'Rp 12.0M', action: 'OFFER CLIENT', loss: '500 Pcs' },
            { item: 'Lip Balm #003', detail: 'Sticker Segel Gold', issue: 'Leak: Filling / Packing', cause: 'REJECT PRODUKSI', aging: '1 HARI', impact: 'Rp 0.1M', action: 'REWORK', loss: '50 Pcs' }
         ];
         return items[i % items.length];
      };
      if (type === 'top_raw') return { name: rawMaterials[i % rawMaterials.length], usage: `${800 + i*150} KG`, value: `Rp ${(12 + i*2.5).toFixed(1)} M` };
      if (type === 'top_pack') return { name: packMaterials[i % packMaterials.length], usage: `${15000 + i*2500} PCS`, value: `Rp ${(5 + i*1.2).toFixed(1)} M` };
      return {};
    });
  };

  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h2 className="dashboard-title" style={{ marginBottom: '0.25rem' }}>WHAREHOUSE AUDIT COMMAND</h2>
          <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Zero-Scroll Geometric Audit Protocol v7.0</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: '#E2E8F0', padding: '6px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 950 }}>AUTO-SYNC: ACTIVE</div>
          <div style={{ background: '#1E293B', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 950 }}>LEVEL: EXECUTIVE</div>
        </div>
      </div>

      {/* 🧬 I. EXECUTIVE OVERVIEW CARDS (Grouped) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        {/* Card 1: Capacity & Accuracy */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}><Icon name="HardDrive" size={14} color="#3B82F6" /><p style={{ fontSize: '10px', fontWeight: 950, letterSpacing: '0.05em' }}>CAPACITY & ACCURACY</p></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
             <div>
               <p style={{ fontSize: '24px', fontWeight: 950, margin: 0, color: '#1E293B' }}>88.4%</p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>UTILITAS KAPASITAS</p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '14px', fontWeight: 950, margin: 0, color: '#10B981' }}>99.8%</p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>ACCURACY</p>
             </div>
          </div>
          <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ fontSize: '8px', fontWeight: 950, color: '#64748B' }}>SKOR FIFO/FEFO</span>
             <span style={{ fontSize: '9px', fontWeight: 950, color: '#3B82F6' }}>9.8 / 10.0</span>
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div style={{ background: '#1E293B', padding: '1.5rem', borderRadius: '24px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}><Icon name="DollarSign" size={14} color="#10B981" /><p style={{ fontSize: '10px', fontWeight: 950, letterSpacing: '0.05em' }}>VALUATION AUDIT</p></div>
          <p style={{ fontSize: '24px', fontWeight: 950, margin: 0 }}>Rp 18.42 B</p>
          <p style={{ fontSize: '8px', fontWeight: 850, color: '#94A3B8', marginBottom: '1rem' }}>TOTAL INVENTORY VALUE</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             {[
               { l: 'RAW', v: '8.2B' }, { l: 'PACK', v: '6.1B' },
               { l: 'BOX', v: '2.4B' }, { l: 'LABEL', v: '1.7B' }
             ].map((v, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
                 <span style={{ fontWeight: 400, color: '#94A3B8' }}>{v.l}</span>
                 <span style={{ fontWeight: 950 }}>{v.v}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Card 3: Turnover & Health */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}><Icon name="RefreshCcw" size={14} color="#6366F1" /><p style={{ fontSize: '10px', fontWeight: 950, letterSpacing: '0.05em' }}>TURNOVER & HEALTH</p></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
             <div>
               <p style={{ fontSize: '24px', fontWeight: 950, margin: 0, color: '#1E293B' }}>14.2<span style={{ fontSize: '10px' }}>x</span></p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>TURNOVER RATIO</p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '24px', fontWeight: 950, margin: 0, color: '#6366F1' }}>95<span style={{ fontSize: '10px' }}>%</span></p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>HEALTH SCORE</p>
             </div>
          </div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
             <div style={{ width: '70%', background: '#10B981' }}></div>
             <div style={{ width: '20%', background: '#F59E0B' }}></div>
             <div style={{ width: '10%', background: '#EF4444' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', fontWeight: 950, color: '#64748B' }}>
             <span>70% SEHAT</span>
             <span>20% MOD</span>
             <span>10% STAG</span>
          </div>
        </div>

        {/* Card 4: Risks & Alerts */}
        <div style={{ background: '#FFF1F2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FECDD3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}><Icon name="ShieldAlert" size={14} color="#E11D48" /><p style={{ fontSize: '10px', fontWeight: 950, letterSpacing: '0.05em', color: '#9F1239' }}>RISK ANALYTICS</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
               <p style={{ fontSize: '18px', fontWeight: 950, color: '#E11D48', margin: 0 }}>Rp 142M</p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#9F1239', margin: 0 }}>DEAD STOCK</p>
             </div>
             <div>
               <p style={{ fontSize: '18px', fontWeight: 950, color: '#E11D48', margin: 0 }}>12 ITEMS</p>
               <p style={{ fontSize: '8px', fontWeight: 850, color: '#9F1239', margin: 0 }}>STOK KRITIS</p>
             </div>
          </div>
          <div style={{ marginTop: '1rem', padding: '8px', background: 'rgba(225, 29, 72, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '8px', fontWeight: 950, color: '#9F1239' }}>AGING KARANTINA (AVG)</span>
             <span style={{ fontSize: '12px', fontWeight: 950, color: '#E11D48' }}>4.2 HARI</span>
          </div>
        </div>
      </div>

      {/* 🚀 II. INTERNAL MICRO WORKFLOW (Visual Pipeline) */}
      <div style={{ marginBottom: '4rem' }}>
      {/* SECTION II: AUDIT COMMAND MATRIX (HIGH DENSITY) */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontSize: '10px', fontWeight: 950, color: '#64748B', letterSpacing: '0.1em' }}>II. AUDIT COMMAND MATRIX (TRI-FLOW VELOCITY)</p>
          <div style={{ display: 'flex', gap: '12px' }}>
             <span style={{ fontSize: '8px', fontWeight: 950, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div> OPTIMAL</span>
             <span style={{ fontSize: '8px', fontWeight: 950, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></div> BOTTLENECK</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* FLOW A */}
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', height: '64px' }}>
            <div style={{ width: '4px', background: '#3B82F6' }}></div>
            <div style={{ width: '200px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderRight: '1px solid #F1F5F9' }}>
               <p style={{ fontSize: '8px', fontWeight: 950, color: '#3B82F6', margin: 0 }}>JALUR MASUK (A)</p>
               <p style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', marginTop: '2px' }}>SUPPLIER & MATS</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>PENERIMAAN</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>2</p>
               </div>
               <Icon name="ChevronRight" size={12} color="#CBD5E1" />
               <div style={{ flex: 1, textAlign: 'center', background: '#FFF1F2', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#E11D48', marginBottom: '4px' }}>KARANTINA / QC</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#E11D48', margin: 0 }}>5</p>
               </div>
            </div>
            <div style={{ width: '120px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderLeft: '1px solid #F1F5F9', textAlign: 'right' }}>
               <p style={{ fontSize: '7px', fontWeight: 950, color: '#64748B', margin: 0 }}>VELOCITY</p>
               <p style={{ fontSize: '14px', fontWeight: 950, color: '#3B82F6', margin: '2px 0 0 0' }}>8.4<span style={{ fontSize: '8px' }}>/10</span></p>
            </div>
          </div>

          {/* FLOW B */}
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', height: '64px' }}>
            <div style={{ width: '4px', background: '#F59E0B' }}></div>
            <div style={{ width: '200px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderRight: '1px solid #F1F5F9' }}>
               <p style={{ fontSize: '8px', fontWeight: 950, color: '#F59E0B', margin: 0 }}>JALUR INTERNAL (B)</p>
               <p style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', marginTop: '2px' }}>PROD CONSUMPTION</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>REQ PROD</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>0</p>
               </div>
               <Icon name="ChevronRight" size={12} color="#CBD5E1" />
               <div style={{ flex: 1, textAlign: 'center', background: '#FFF1F2', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#E11D48', marginBottom: '4px' }}>PICKING</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#E11D48', margin: 0 }}>4</p>
               </div>
               <Icon name="ChevronRight" size={12} color="#CBD5E1" />
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>HANDOVER</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>0</p>
               </div>
            </div>
            <div style={{ width: '120px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderLeft: '1px solid #F1F5F9', textAlign: 'right' }}>
               <p style={{ fontSize: '7px', fontWeight: 950, color: '#64748B', margin: 0 }}>VELOCITY</p>
               <p style={{ fontSize: '14px', fontWeight: 950, color: '#F59E0B', margin: '2px 0 0 0' }}>4.2<span style={{ fontSize: '8px' }}>/10</span></p>
            </div>
          </div>

          {/* FLOW C */}
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', height: '64px' }}>
            <div style={{ width: '4px', background: '#10B981' }}></div>
            <div style={{ width: '200px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderRight: '1px solid #F1F5F9' }}>
               <p style={{ fontSize: '8px', fontWeight: 950, color: '#10B981', margin: 0 }}>JALUR KELUAR (C)</p>
               <p style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8', marginTop: '2px' }}>SO FULFILLMENT</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>ORDER PROC</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>10</p>
               </div>
               <Icon name="ChevronRight" size={12} color="#CBD5E1" />
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>SHIPPING</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>0</p>
               </div>
               <Icon name="ChevronRight" size={12} color="#CBD5E1" />
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', fontWeight: 850, color: '#64748B', marginBottom: '4px' }}>DELIVERED</p>
                  <p style={{ fontSize: '16px', fontWeight: 950, color: '#1E293B', margin: 0 }}>0</p>
               </div>
            </div>
            <div style={{ width: '120px', padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderLeft: '1px solid #F1F5F9', textAlign: 'right' }}>
               <p style={{ fontSize: '7px', fontWeight: 950, color: '#64748B', margin: 0 }}>VELOCITY</p>
               <p style={{ fontSize: '14px', fontWeight: 950, color: '#10B981', margin: '2px 0 0 0' }}>9.1<span style={{ fontSize: '8px' }}>/10</span></p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
         
         {/* 🧾 SECTION III — GRANULAR AUDITS */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* III.A Bahan Baku */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="FlaskConical" size={14} color="#8B5CF6" /> III.A AUDIT GRANULAR BAHAN BAKU (SENSITIF & FEFO)
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 950, color: '#475569' }}>BPOM COMPLIANT</span>
                    <Icon name="ShieldCheck" size={10} color="#10B981" />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950 }}>NAMA / MASUK</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>SIMPAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>STATUS</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'right' }}>FIS/BK/AV</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(6, 'raw').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.75rem' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.name}</div>
                                 <div style={{ fontSize: '7px', color: '#94A3B8' }}>{row.in}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '10px', fontWeight: 950 }}>{row.age}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.status.includes('OK') ? '#10B981' : '#F59E0B', 
                                    color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '7px', fontWeight: 950 
                                 }}>{row.status}</span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '10px', fontWeight: 950 }}>
                                 {row.fisik} / {row.book} / <span style={{ color: '#3B82F6' }}>{row.avail}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* III.B Bahan Kemas */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="Package" size={14} color="#EA580C" /> III.B AUDIT GRANULAR BAHAN KEMAS (DEGRADASI & STOK)
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#FFF7ED', borderBottom: '1px solid #FED7AA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 950, color: '#9A3412' }}>QUALITY AUDIT</span>
                    <Icon name="CheckCircle" size={10} color="#EA580C" />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950 }}>NAMA / MASUK</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>SIMPAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>STATUS</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'right' }}>FIS/BK/AV</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(6, 'pack').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.75rem' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.name}</div>
                                 <div style={{ fontSize: '7px', color: '#94A3B8' }}>{row.in}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '10px', fontWeight: 950 }}>{row.age}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.status === 'STABLE' ? '#10B981' : '#EF4444', 
                                    color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '7px', fontWeight: 950 
                                 }}>{row.status}</span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '10px', fontWeight: 950 }}>
                                 {row.fisik} / {row.book} / <span style={{ color: '#3B82F6' }}>{row.avail}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* III.C SO Fulfillment */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="ShoppingBag" size={14} color="#3B82F6" /> III.C PEMENUHAN PESANAN (SO FULFILLMENT)
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 950, color: '#3730A3' }}>LOGISTICS AUDIT</span>
                    <Icon name="Truck" size={10} color="#3B82F6" />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950 }}>CLIENT / NO. SO</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>KELENGKAPAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>STATUS</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'right' }}>PROGRESS / VAR</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(6, 'so').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.75rem' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.client}</div>
                                 <div style={{ fontSize: '7px', color: '#94A3B8' }}>{row.so}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '10px', fontWeight: 950 }}>{row.pcs} <span style={{ color: '#94A3B8', fontSize: '8px' }}>Pcs</span></td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.status === 'FULL' ? '#10B981' : '#F59E0B', 
                                    color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '7px', fontWeight: 950 
                                 }}>{row.status}</span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950, color: row.variant === '0' ? '#10B981' : '#EF4444' }}>{row.variant}</div>
                                 <div style={{ fontSize: '8px', fontWeight: 950, color: '#3B82F6' }}>{row.progress}</div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* III.D Risk Audit */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#E11D48', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="AlertTriangle" size={14} color="#E11D48" /> III.D AUDIT RISIKO & KERUGIAN (NON-SELLABLE)
               </h3>
               <div style={{ background: '#FFF1F2', borderRadius: '24px', border: '1px solid #FECDD3', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#FECDD3', borderBottom: '1px solid #FECDD3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 950, color: '#9F1239' }}>ACTION REQUIRED</span>
                    <Icon name="Activity" size={10} color="#E11D48" />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#FECDD3', borderBottom: '1px solid #FECDD3' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, color: '#9F1239' }}>ITEM & SUMBER</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, color: '#9F1239', textAlign: 'center' }}>DETAIL AUDIT</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, color: '#9F1239', textAlign: 'right' }}>IMPACT (RP/LOSS)</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, color: '#9F1239', textAlign: 'right' }}>ACTION</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(4, 'risk').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #FECDD3' }}>
                              <td style={{ padding: '0.75rem' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950, color: '#9F1239' }}>{row.item}</div>
                                 <div style={{ fontSize: '7px', color: '#BE123B' }}>{row.cause}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                 <div style={{ fontSize: '8px', fontWeight: 950, color: '#E11D48' }}>{row.issue}</div>
                                 <div style={{ fontSize: '7px', color: '#9F1239' }}>{row.aging} Aging</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 950, color: '#E11D48' }}>{row.impact}</div>
                                 <div style={{ fontSize: '7px', color: '#9F1239' }}>Loss: {row.loss}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                 <span style={{ background: '#9F1239', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '7px', fontWeight: 950 }}>{row.action}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* 🧾 SECTION IV & V — TOP LISTS */}
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* IV. Top Raw */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="Zap" size={14} color="#10B981" /> IV. TOP 10 LIST BAHAN BAKU (PRODUKTIVITAS)
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950 }}>NAMA BAHAN BAKU</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>PEMAKAIAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'right' }}>NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(6, 'top_raw').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.82rem 0.75rem', fontSize: '10px', fontWeight: 950 }}>{row.name}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '10px', fontWeight: 950 }}>{row.usage}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#10B981' }}>{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* V. Top Pack */}
            <div>
               <h3 style={{ margin: '0 0 1rem 0', fontSize: '10px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="Box" size={14} color="#6366F1" /> V. TOP 10 LIST KEMASAN (PRODUKTIVITAS)
               </h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950 }}>NAMA KEMASAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'center' }}>PEMAKAIAN</th>
                           <th style={{ padding: '0.75rem', fontSize: '8px', fontWeight: 950, textAlign: 'right' }}>NILAI / OMSET</th>
                        </tr>
                     </thead>
                     <tbody>
                        {genRows(6, 'top_pack').map((row: any, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.82rem 0.75rem', fontSize: '10px', fontWeight: 950 }}>{row.name}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '10px', fontWeight: 950 }}>{row.usage}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#10B981' }}>{row.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Gudang;
