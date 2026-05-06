import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

const Finance: React.FC = () => {
  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        FINANCIAL COMMAND CENTER <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Cash Health & Profit Audit)</span>
      </h2>

      {/* 🚀 I. EXECUTIVE OVERVIEW (Finance Command) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
        
        {/* 💰 1. REVENUE & COLLECTION */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="TrendingUp" size={16} color="#3B82F6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>A. REVENUE & COLLECTION</p>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', margin: 0 }}>TOTAL REVENUE</p>
             <p style={{ fontSize: '22px', fontWeight: 950, color: '#1E293B', margin: '4px 0' }}>Rp 12.8 M</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>COLLECTION RATE</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#10B981' }}>82.5%</span>
             </div>
             <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '82.5%', height: '100%', background: '#3B82F6' }}></div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>UNCOLLECTED</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#EF4444' }}>Rp 2.2 M</span>
             </div>
          </div>
        </div>

        {/* 💸 2. EXPENSE CONTROL */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="CreditCard" size={16} color="#EAB308" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>B. EXPENSE CONTROL</p>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', margin: 0 }}>TOTAL EXPENSE (MTD)</p>
             <p style={{ fontSize: '22px', fontWeight: 950, color: '#EAB308', margin: '4px 0' }}>Rp 8.4 M</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>COGS</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>Rp 5.2 M</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 850, color: '#64748B' }}>OPERATIONAL</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>Rp 3.2 M</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748B' }}>EXPENSE RATIO</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: '#EAB308' }}>65.6%</span>
             </div>
          </div>
        </div>

        {/* 🏦 3. CASH HEALTH */}
        <div style={{ background: '#F0FDF4', padding: '1.5rem', borderRadius: '24px', border: '1px solid #DCFCE7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="ShieldCheck" size={16} color="#10B981" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#166534', letterSpacing: '0.05em' }}>C. CASH FLOW HEALTH</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
             <p style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B', margin: 0 }}>Rp 1.8 M</p>
             <p style={{ fontSize: '9px', fontWeight: 850, color: '#166534', margin: 0 }}>NET CASH FLOW (MTD)</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>CASH IN</p>
                <p style={{ fontSize: '12px', fontWeight: 950, color: '#10B981', margin: 0 }}>Rp 10.2M</p>
             </div>
             <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                <p style={{ fontSize: '8px', fontWeight: 850, color: '#64748B', margin: 0 }}>CASH OUT</p>
                <p style={{ fontSize: '12px', fontWeight: 950, color: '#EF4444', margin: 0 }}>Rp 8.4M</p>
             </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p style={{ fontSize: '9px', fontWeight: 850, color: '#64748B', margin: 0 }}>CURRENT BALANCE: <span style={{ color: '#1E293B' }}>Rp 4.5 M</span></p>
          </div>
        </div>

        {/* 📊 4. PROFITABILITY */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="BarChart" size={16} color="#8B5CF6" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>D. PROFITABILITY</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
             <div>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', margin: 0 }}>NET PROFIT</p>
                <p style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', margin: 0 }}>Rp 4.4 M</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', margin: 0 }}>MARGIN</p>
                <p style={{ fontSize: '18px', fontWeight: 950, color: '#8B5CF6', margin: 0 }}>34.3%</p>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>GROSS PROFIT</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>Rp 7.6 M</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>GP MARGIN</span>
                <span style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>59.4%</span>
             </div>
          </div>
        </div>

        {/* ⚠️ 5. FINANCIAL RISK */}
        <div style={{ background: '#FFF1F2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #FECDD3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
             <Icon name="ShieldAlert" size={16} color="#E11D48" />
             <p style={{ fontSize: '11px', fontWeight: 950, color: '#9F1239', letterSpacing: '0.05em' }}>E. FINANCIAL RISK</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#EF4444' }}>OVERDUE A/R</span>
                <span style={{ fontSize: '12px', fontWeight: 950 }}>Rp 850 Jt</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#EA580C' }}>OVERDUE A/P</span>
                <span style={{ fontSize: '12px', fontWeight: 950 }}>Rp 420 Jt</span>
             </div>
             <div style={{ background: '#9F1239', padding: '10px', borderRadius: '12px', marginTop: '2px' }}>
                <p style={{ fontSize: '9px', fontWeight: 950, color: '#ffffff', margin: 0, opacity: 0.9 }}>RISK ALERT</p>
                <p style={{ fontSize: '11px', fontWeight: 950, color: '#ffffff', margin: 0 }}>CASH RUNWAY &lt; 3 MONTHS</p>
             </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
         
         {/* 1️⃣ TABLE: financial_transaction */}
         <div>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '12px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>🔴 1. FINANCIAL TRANSACTION LOG (CENTRAL LEDGER)</h3>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TRANS ID / DATE</th>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>TYPE / CATEGORY</th>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>REFERENCE (REF ID)</th>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>AMOUNT</th>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>METHOD</th>
                          <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 950, color: '#64748B' }}>STATUS</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                          { id: 'TX-5001', date: '2024-04-02', type: 'IN', cat: 'REVENUE', ref: 'SALES (INV-2041)', amount: '125,000,000', method: 'BANK TRANSFER', status: 'PAID' },
                          { id: 'TX-5002', date: '2024-04-02', type: 'OUT', cat: 'COGS', ref: 'PURCHASE (PO-882)', amount: '45,000,000', method: 'BANK TRANSFER', status: 'PAID' },
                          { id: 'TX-5003', date: '2024-04-01', type: 'OUT', cat: 'EXPENSE', ref: 'PAYROLL (APRIL)', amount: '180,000,000', method: 'VIRTUAL ACCOUNT', status: 'PENDING' },
                          { id: 'TX-5004', date: '2024-04-01', type: 'IN', cat: 'OTHER', ref: 'MANUAL (INVESTMENT)', amount: '500,000,000', method: 'DIRECT DEP', status: 'PAID' },
                       ].map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                             <td style={{ padding: '1.25rem 1.5rem' }}>
                                <div style={{ fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>{row.id}</div>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>{row.date}</div>
                             </td>
                             <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 950, color: row.type === 'IN' ? '#10B981' : '#EF4444' }}>{row.type} / {row.cat}</div>
                             </td>
                             <td style={{ padding: '1.25rem 1.5rem' }}>
                                <div style={{ fontSize: '12px', fontWeight: 950, color: '#1E293B' }}>{row.ref}</div>
                             </td>
                             <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '14px', fontWeight: 950, color: row.type === 'IN' ? '#10B981' : '#1E293B' }}>
                                Rp {row.amount}
                             </td>
                             <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '10px', fontWeight: 850 }}>{row.method}</td>
                             <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                <span style={{ 
                                   background: row.status === 'PAID' ? '#10B981' : '#F59E0B', 
                                   color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 950 
                                }}>{row.status}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* 2️⃣ TABLE: accounts_receivable */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#3B82F6', letterSpacing: '0.05em' }}>🔵 2. ACCOUNTS RECEIVABLE (PIUTANG)</h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>INVOICE / CUSTOMER</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>OUTSTANDING</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950 }}>STATUS</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { id: 'INV-2045', name: 'Brand Aesthetic X', total: '150M', out: '50M', due: '2024-04-10', status: 'PARTIAL' },
                           { id: 'INV-2041', name: 'Glow Up Clinic', total: '125M', out: '125M', due: '2024-03-25', status: 'OVERDUE' },
                           { id: 'INV-2050', name: 'Sun & Skin Co.', total: '80M', out: '80M', due: '2024-04-15', status: 'PARTIAL' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.id}</div>
                                 <div style={{ fontSize: '8px', color: '#64748B' }}>{row.name}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '12px', fontWeight: 950, color: row.status === 'OVERDUE' ? '#EF4444' : '#1E293B' }}>Rp {row.out}</div>
                                 <div style={{ fontSize: '8px', color: row.status === 'OVERDUE' ? '#EF4444' : '#64748B' }}>DUE: {row.due}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.status === 'OVERDUE' ? '#EF4444' : '#F59E0B', 
                                    color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 950 
                                 }}>{row.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 3️⃣ TABLE: accounts_payable */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#EA580C', letterSpacing: '0.05em' }}>🟠 3. ACCOUNTS PAYABLE (HUTANG)</h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>BILL / SUPPLIER</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>OUTSTANDING</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950 }}>STATUS</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { id: 'BILL-401', name: 'PT Surya Kimia', total: '250M', out: '250M', due: '2024-04-05', status: 'PENDING' },
                           { id: 'BILL-405', name: 'Global Kemasindo', total: '120M', out: '40M', due: '2024-04-12', status: 'PARTIAL' },
                           { id: 'BILL-398', name: 'PLN Persero', total: '45M', out: '45M', due: '2024-03-28', status: 'OVERDUE' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.id}</div>
                                 <div style={{ fontSize: '8px', color: '#64748B' }}>{row.name}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '12px', fontWeight: 950, color: row.status === 'OVERDUE' ? '#EF4444' : '#1E293B' }}>Rp {row.out}</div>
                                 <div style={{ fontSize: '8px', color: row.status === 'OVERDUE' ? '#EF4444' : '#64748B' }}>DUE: {row.due}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.status === 'OVERDUE' ? '#EF4444' : (row.status === 'PARTIAL' ? '#F59E0B' : '#64748B'), 
                                    color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 950 
                                 }}>{row.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* 4️⃣ TABLE: expense_detail */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>💸 4. EXPENSE BREAKDOWN (DEPT AUDIT)</h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>CATEGORY / DEPT</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>AMOUNT</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { cat: 'Raw Material', dept: 'SCM', amount: '2.4M', ref: 'PO-882' },
                           { cat: 'Machine Parts', dept: 'PRODUKSI', amount: '120Jt', ref: 'REQ-M-01' },
                           { cat: 'Ads Spend', dept: 'BD', amount: '450Jt', ref: 'FB-ADS-MAR' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.cat}</div>
                                 <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 800 }}>{row.dept} | {row.ref}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', fontSize: '13px', fontWeight: 950 }}>Rp {row.amount}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 5️⃣ TABLE: revenue_detail */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>💰 5. REVENUE BREAKDOWN (GROWTH AUDIT)</h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>CUSTOMER / PRODUCT</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950 }}>SOURCE</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>AMOUNT</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { name: 'Glow Up Clinic', prod: 'Serum Glow 30ml', type: 'REPEAT ORDER', amount: '450Jt' },
                           { name: 'Brand Aesthetic X', prod: 'Service R&D', type: 'NEW DEAL', amount: '150Jt' },
                           { name: 'Indo Care', prod: 'Moisturizer Gel', type: 'REPEAT ORDER', amount: '1.2M' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.name}</div>
                                 <div style={{ fontSize: '8px', color: '#64748B' }}>{row.prod}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <span style={{ 
                                    background: row.type === 'NEW DEAL' ? '#8B5CF6' : '#3B82F6', 
                                    color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 950 
                                 }}>{row.type}</span>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', fontSize: '13px', fontWeight: 950, color: '#10B981' }}>Rp {row.amount}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* 6️⃣ TABLE: cash_balance */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B' }}>🏦 6. DAILY CASH POSITION</h3>
               <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>DATE</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950 }}>IN / OUT</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>CLOSING</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { date: '2024-04-02', in: '1.2M', out: '450Jt', balance: '4.5M' },
                           { date: '2024-04-01', in: '850Jt', out: '1.8M', balance: '3.75M' },
                           { date: '2024-03-31', in: '2.5M', out: '1.2M', balance: '4.7M' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1rem', fontSize: '11px', fontWeight: 950 }}>{row.date}</td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950, color: '#10B981' }}>+{row.in}</div>
                                 <div style={{ fontSize: '11px', fontWeight: 950, color: '#EF4444' }}>-{row.out}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', fontSize: '13px', fontWeight: 950, color: '#1E293B' }}>Rp {row.balance}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* 7️⃣ TABLE: financial_performance */}
            <div>
               <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: 950, color: '#111827' }}>🧠 7. KPI PERFORMANCE (FINANCIAL SCORE)</h3>
               <div style={{ background: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                           <th style={{ padding: '1rem', textAlign: 'left', fontSize: '9px', fontWeight: 950 }}>PERIOD</th>
                           <th style={{ padding: '1rem', textAlign: 'center', fontSize: '9px', fontWeight: 950 }}>MARGIN / COLL</th>
                           <th style={{ padding: '1rem', textAlign: 'right', fontSize: '9px', fontWeight: 950 }}>HEALTH SCORE</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[
                           { p: 'April-24', mrgn: '34.3%', coll: '82.5%', score: 88, status: 'STABLE' },
                           { p: 'March-24', mrgn: '31.2%', coll: '78.4%', score: 82, status: 'STABLE' },
                           { p: 'Feb-24', mrgn: '28.5%', coll: '65.2%', score: 74, status: 'ALERT' },
                        ].map((row, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '1rem' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.p}</div>
                                 <div style={{ fontSize: '8px', fontWeight: 900, color: row.status === 'ALERT' ? '#EF4444' : '#3B82F6' }}>{row.status}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.mrgn} / {row.coll}</div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                 <div style={{ fontSize: '14px', fontWeight: 950, color: row.score > 85 ? '#10B981' : (row.score > 75 ? '#EAB308' : '#EF4444') }}>{row.score}</div>
                              </td>
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

export default Finance;
