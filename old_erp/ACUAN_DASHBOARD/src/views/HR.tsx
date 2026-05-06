import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => {
  const LucideIcon = (Lucide as any)[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} color={color} style={style} />;
};

interface EmployeeAudit {
  id: string;
  name: string;
  pos: string;
  joinDate: string;
  kpi: number;
  discipline: string;
  output: string;
  attitude: number;
  pkwtStart: string;
  pkwtEnd: string;
  type: string;
  revisions: number;
}

const PerformanceContractTable: React.FC<{ title: string; icon: string; color: string; data: EmployeeAudit[] }> = ({ title, icon, color, data }) => {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
        <Icon name={icon} size={14} color={color} /> {title}
      </h3>
      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
          <thead>
            {/* Grouped Headers */}
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th colSpan={2} style={{ padding: '0.75rem 1.5rem', fontSize: '8px', fontWeight: 950, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>I. IDENTITAS & JABATAN</th>
              <th colSpan={4} style={{ padding: '0.75rem 1rem', fontSize: '8px', fontWeight: 950, color: '#64748B', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>II. EVALUASI PERFORMA (KPI)</th>
              <th colSpan={3} style={{ padding: '0.75rem 1rem', fontSize: '8px', fontWeight: 950, color: '#64748B', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>III. AUDIT PKWT (KONTRAK)</th>
              <th colSpan={2} style={{ padding: '0.75rem 1.5rem', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'right' }}>IV. STATUS & ACTION</th>
            </tr>
            <tr style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '0.75rem 1.5rem', width: '15%', fontSize: '7px', fontWeight: 950, color: '#94A3B8' }}>NAMA & POSISI</th>
              <th style={{ padding: '0.75rem 1rem', width: '8%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', borderRight: '1px solid #F1F5F9' }}>TGL MASUK</th>
              
              <th style={{ padding: '0.75rem 0.5rem', width: '7%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>SKOR KPI</th>
              <th style={{ padding: '0.75rem 0.5rem', width: '7%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>DISIPLIN</th>
              <th style={{ padding: '0.75rem 0.5rem', width: '7%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>OUTPUT</th>
              <th style={{ padding: '0.75rem 0.5rem', width: '7%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>ATTITUDE</th>

              <th style={{ padding: '0.75rem 1rem', width: '10%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>DURASI KONTRAK</th>
              <th style={{ padding: '0.75rem 1rem', width: '8%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>TIPE</th>
              <th style={{ padding: '0.75rem 1rem', width: '4%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>REV</th>

              <th style={{ padding: '0.75rem 1rem', width: '12%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'center' }}>VISUAL PROGRESS</th>
              <th style={{ padding: '0.75rem 1.5rem', width: '15%', fontSize: '7px', fontWeight: 950, color: '#94A3B8', textAlign: 'right' }}>AUDIT STATE</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const diffMs = new Date(row.pkwtEnd).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isUrgent = diffDays < 30;
              const isLowPerf = row.kpi < 70;
              
              // Simple progress calculation (manual for mock)
              const start = new Date(row.pkwtStart).getTime();
              const end = new Date(row.pkwtEnd).getTime();
              const now = new Date().getTime();
              const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));

              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: isUrgent ? '#FFF1F2' : 'transparent' }}>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <div style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B' }}>{row.name}</div>
                    <div style={{ fontSize: '7px', fontWeight: 800, color: '#94A3B8' }}>{row.pos} | ID: {row.id}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '9px', fontWeight: 850 }}>{row.joinDate}</div>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: isLowPerf ? '#EF4444' : '#1E293B' }}>{row.kpi}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>{row.discipline}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>{row.output}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '9px', fontWeight: 850, color: '#64748B' }}>{row.attitude}/5</div>
                  </td>

                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950 }}>{row.pkwtEnd}</div>
                    <div style={{ fontSize: '7px', color: isUrgent ? '#EF4444' : '#94A3B8', fontWeight: 800 }}>SISA {diffDays} HARI</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#6366F1' }}>{row.type}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '9px', fontWeight: 850 }}>{row.revisions}</div>
                  </td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: isUrgent ? '#EF4444' : '#10B981' }}></div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                    <span style={{ 
                      background: isUrgent ? '#BE123C' : (isLowPerf ? '#B45309' : '#059669'),
                      color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '7px', fontWeight: 950
                    }}>
                      {isUrgent ? 'CRITICAL EXPIRE' : (isLowPerf ? 'PERFORMANCE REVIEW' : 'AUDIT CLEAR')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HR: React.FC = () => {
  // 📋 Recruitment Pipeline Mock
  const recruitmentData = [
    { id: '801', name: 'ADITYA PUTRA', source: 'LINKEDIN', pos: 'SENIOR FORMULATOR', dept: 'R&D', pic: 'DINA', stage: 'OFFERING', apply: '20/03', intv: '25/03', join: '15/04', status: 'SENT' },
    { id: '802', name: 'SASA AMALIA', source: 'REFERRAL', pos: 'SCM OFFICER', dept: 'SCM', pic: 'ANDI', stage: 'HIRED', apply: '22/03', intv: '28/03', join: '01/04', status: 'DONE' },
    { id: '805', name: 'RAYHAN ALI', source: 'GLINTS', pos: 'PRODUCTION TECH', dept: 'PROD', pic: 'DINA', stage: 'SCREEN', apply: '01/04', intv: '-', join: '-', status: 'PEND' },
  ];

  // 🧬 Mock Data per Division
  const generateMockData = (dept: string): EmployeeAudit[] => [
    { id: `1001-${dept[0]}`, name: `BUDI ${dept}`, pos: 'SUPERVISOR', joinDate: '10/01/22', kpi: 88, discipline: '98%', output: 'EXCEED', attitude: 4.8, pkwtStart: '2023-01-01', pkwtEnd: '2024-12-31', type: 'TETAP', revisions: 1 },
    { id: `1002-${dept[0]}`, name: `SITI ${dept}`, pos: 'STAFF', joinDate: '15/05/23', kpi: 72, discipline: '92%', output: 'NORMAL', attitude: 4.2, pkwtStart: '2024-01-01', pkwtEnd: '2024-04-15', type: 'PKWT-1', revisions: 0 },
    { id: `1003-${dept[0]}`, name: `TONI ${dept}`, pos: 'OPERATOR', joinDate: '20/02/24', kpi: 65, discipline: '85%', output: 'LOW', attitude: 3.5, pkwtStart: '2024-02-20', pkwtEnd: '2024-08-20', type: 'PROBATION', revisions: 0 },
  ];

  const divisions = [
    { name: 'PRODUCTION', icon: 'Settings', color: '#0F172A' },
    { name: 'QUALITY CONTROL (QC/QA)', icon: 'ShieldCheck', color: '#10B981' },
    { name: 'WAREHOUSE & LOGISTICS', icon: 'Box', color: '#F59E0B' },
    { name: 'SALES & BUSINESS DEVELOPMENT', icon: 'TrendingUp', color: '#6366F1' },
    { name: 'RESEARCH & DEVELOPMENT (R&D)', icon: 'FlaskConical', color: '#EC4899' },
    { name: 'SCM & PURCHASING', icon: 'Truck', color: '#3B82F6' },
    { name: 'FINANCE & ACCOUNTING', icon: 'CreditCard', color: '#0369A1' },
    { name: 'HR & GENERAL AFFAIR (GA)', icon: 'Users', color: '#EA580C' },
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: '10rem', background: '#F8FAFC', minHeight: '100vh' }}>
      <h2 className="dashboard-title">
        HR COMMAND CENTER <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '14px' }}>(Financial & Talent Audit)</span>
      </h2>

      {/* 🧬 1. EXECUTIVE PILLARS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* BUDGET */}
        <div style={{ background: '#F0F9FF', padding: '1.25rem', borderRadius: '24px', border: '1px solid #BAE6FD' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="Wallet" size={14} color="#0369A1" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#0C4A6E', letterSpacing: '0.05em' }}>BUDGET & SAVINGS</p>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 950, color: '#0C4A6E', margin: 0 }}>Rp 1.42 M</p>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', fontWeight: 950, color: '#10B981' }}>+ Rp 380 JT SAVINGS</span>
          </div>
        </div>

        {/* RECRUITMENT */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="UserPlus" size={14} color="#10B981" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>HIRING SPEED</p>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', margin: 0 }}>18 Days</p>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>AVG TIME TO FILL</span>
        </div>

        {/* STABILITY */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="ShieldAlert" size={14} color="#EF4444" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>STABILITY INDEX</p>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 950, color: '#EF4444', margin: 0 }}>2.4%</p>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>TURNOVER RATE</span>
        </div>

        {/* WORKLOAD */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="Activity" size={14} color="#F59E0B" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>WORKLOAD</p>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', margin: 0 }}>48</p>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>ACTIVE INTERVIEWS</span>
        </div>

        {/* QUALITY */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
             <Icon name="Award" size={14} color="#3B82F6" />
             <p style={{ fontSize: '10px', fontWeight: 950, color: '#1E293B', letterSpacing: '0.05em' }}>AVG KPI</p>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 950, color: '#3B82F6', margin: 0 }}>8.4/10</p>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>DEPT PERFORMANCE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
         
         {/* 1. RECRUITMENT PIPELINE */}
         <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '11px', fontWeight: 950, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Icon name="GitPullRequest" size={14} color="#6366F1" /> 1. RECRUITMENT PIPELINE (ACTIVE AUDIT)
            </h3>
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                  <thead>
                     <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '1rem 1.5rem', width: '25%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>CANDIDATE / SOURCE</th>
                        <th style={{ padding: '1rem 1rem', width: '25%', fontSize: '8px', fontWeight: 950, color: '#64748B' }}>POSITION / DEPT</th>
                        <th style={{ padding: '1rem 1rem', width: '15%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>HR PIC</th>
                        <th style={{ padding: '1rem 1rem', width: '20%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'center' }}>STAGES (DATE)</th>
                        <th style={{ padding: '1rem 1.5rem', width: '15%', fontSize: '8px', fontWeight: 950, color: '#64748B', textAlign: 'right' }}>STATUS</th>
                     </tr>
                  </thead>
                  <tbody>
                     {recruitmentData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                           <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.name}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#94A3B8' }}>{row.source} | {row.apply}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem' }}>
                              <div style={{ fontSize: '11px', fontWeight: 950 }}>{row.pos}</div>
                              <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{row.dept}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950, color: '#6366F1' }}>{row.pic}</div>
                           </td>
                           <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 950 }}>{row.stage}</div>
                              <div style={{ fontSize: '8px', color: '#94A3B8' }}>INT: {row.intv}</div>
                           </td>
                           <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                              <span style={{ 
                                 background: row.stage === 'HIRED' ? '#10B981' : (row.stage === 'REJECT' ? '#EF4444' : '#F59E0B'), 
                                 color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '8px', fontWeight: 950 
                              }}>{row.status}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* 2. DIVISIONAL PERFORMANCE & CONTRACT AUDIT (8 TABLES) */}
         <div>
            <h3 style={{ margin: '2rem 0 1.5rem 0', fontSize: '14px', fontWeight: 950, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>
               <Icon name="Activity" size={18} color="#0F172A" /> 2. DIVISIONAL PERFORMANCE & CONTRACT AUDIT
            </h3>
            
            {divisions.map((div, idx) => (
              <PerformanceContractTable 
                key={idx}
                title={`${idx + 1}. ${div.name}`}
                icon={div.icon}
                color={div.color}
                data={generateMockData(div.name)}
              />
            ))}
         </div>

      </div>
    </div>
  );
};

export default HR;
