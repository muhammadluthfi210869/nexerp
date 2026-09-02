"use client";

import React, { useEffect, useState } from "react";
import { 
  Wallet, 
  UserPlus,
  ShieldAlert,
  Activity,
  Award,
  Settings,
  ShieldCheck,
  Box,
  TrendingUp,
  FlaskConical,
  Truck,
  CreditCard,
  Users,
  GitPullRequest,
  Check
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const DIVISION_MAP: Record<string, { number: number; name: string; icon: any; divisions: string[] }> = {
  PRODUCTION: { number: 1, name: "PRODUCTION", icon: Settings, divisions: ["PRODUCTION"] },
  QC: { number: 2, name: "QUALITY CONTROL (QC/QA)", icon: ShieldCheck, divisions: ["QC"] },
  WAREHOUSE: { number: 3, name: "WAREHOUSE & LOGISTICS", icon: Box, divisions: ["WAREHOUSE"] },
  BD: { number: 4, name: "SALES & BUSINESS DEVELOPMENT", icon: TrendingUp, divisions: ["BD"] },
  RND: { number: 5, name: "RESEARCH & DEVELOPMENT (R&D)", icon: FlaskConical, divisions: ["RND"] },
  SCM: { number: 6, name: "SCM & PURCHASING", icon: Truck, divisions: ["SCM"] },
  FINANCE: { number: 7, name: "FINANCE & ACCOUNTING", icon: CreditCard, divisions: ["FINANCE"] },
  HR: { number: 8, name: "HR & GENERAL AFFAIR (GA)", icon: Users, divisions: ["MANAGEMENT"] }
};

interface Employee {
  id: string;
  name: string;
  position: string;
  joinedAt: string;
  kpi: number;
  disiplin: number;
  output: string;
  attitude: number;
  contractEnd?: string;
  type?: string;
  rev?: number;
  daysLeft?: number;
  pkwtStart?: string;
  pkwtEnd?: string;
}

const PersonnelTable = ({ title, icon: Icon, number, data }: { title: string; icon: any; number: number; data: Employee[] }) => {
  const getDummyPersonnel = (namePrefix: string): Employee[] => [
    { id: `1001-${namePrefix[0]}`, name: `BUDI ${namePrefix}`, position: "SUPERVISOR", joinedAt: "2022-01-10", kpi: 88, disiplin: 98, output: "EXCEED", attitude: 4.8, contractEnd: "2028-12-31", type: "TETAP", rev: 1, pkwtStart: "2023-01-01", pkwtEnd: "2028-12-31" },
    { id: `1002-${namePrefix[0]}`, name: `SITI ${namePrefix}`, position: "STAFF", joinedAt: "2023-05-15", kpi: 72, disiplin: 92, output: "NORMAL", attitude: 4.2, contractEnd: "2026-06-30", type: "PKWT-1", rev: 0, pkwtStart: "2024-01-01", pkwtEnd: "2026-06-30" },
    { id: `1003-${namePrefix[0]}`, name: `TONI ${namePrefix}`, position: "OPERATOR", joinedAt: "2024-02-20", kpi: 65, disiplin: 85, output: "LOW", attitude: 3.5, contractEnd: "2026-08-20", type: "PROBATION", rev: 0, pkwtStart: "2026-02-20", pkwtEnd: "2026-08-20" }
  ];

  const listData = data.length > 0 ? data : getDummyPersonnel(title.split(" ").slice(1).join(" "));

  return (
    <div style={{ marginBottom: "3rem" }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "11px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#1E293B" }} /> {number}. {title}
      </h3>
      <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th colSpan={2} style={{ padding: "0.75rem 1.5rem", fontSize: "8px", fontWeight: 950, color: "#64748B", borderRight: "1px solid #E2E8F0" }}>I. IDENTITAS & JABATAN</th>
              <th colSpan={4} style={{ padding: "0.75rem 1rem", fontSize: "8px", fontWeight: 950, color: "#64748B", borderRight: "1px solid #E2E8F0", textAlign: "center" }}>II. EVALUASI PERFORMA (KPI)</th>
              <th colSpan={3} style={{ padding: "0.75rem 1rem", fontSize: "8px", fontWeight: 950, color: "#64748B", borderRight: "1px solid #E2E8F0", textAlign: "center" }}>III. AUDIT PKWT (KONTRAK)</th>
              <th colSpan={2} style={{ padding: "0.75rem 1.5rem", fontSize: "8px", fontWeight: 950, color: "#64748B", textAlign: "right" }}>IV. STATUS & ACTION</th>
            </tr>
            <tr style={{ background: "white", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "0.75rem 1.5rem", width: "25%", fontSize: "7px", fontWeight: 950, color: "#94A3B8" }}>NAMA & POSISI</th>
              <th style={{ padding: "0.75rem 1rem", width: "10%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", borderRight: "1px solid #F1F5F9" }}>TGL MASUK</th>
              <th style={{ padding: "0.75rem 0.5rem", width: "7%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>SKOR KPI</th>
              <th style={{ padding: "0.75rem 0.5rem", width: "7%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>DISIPLIN</th>
              <th style={{ padding: "0.75rem 0.5rem", width: "7%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>OUTPUT</th>
              <th style={{ padding: "0.75rem 0.5rem", width: "7%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center", borderRight: "1px solid #F1F5F9" }}>ATTITUDE</th>
              <th style={{ padding: "0.75rem 1rem", width: "10%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>DURASI KONTRAK</th>
              <th style={{ padding: "0.75rem 1rem", width: "8%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>TIPE</th>
              <th style={{ padding: "0.75rem 1rem", width: "4%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center", borderRight: "1px solid #F1F5F9" }}>REV</th>
              <th style={{ padding: "0.75rem 1rem", width: "12%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>VISUAL PROGRESS</th>
              <th style={{ padding: "0.75rem 1.5rem", width: "15%", fontSize: "7px", fontWeight: 950, color: "#94A3B8", textAlign: "right" }}>AUDIT STATE</th>
            </tr>
          </thead>
          <tbody>
            {listData.map((e, t) => {
              const start = e.pkwtStart || e.joinedAt;
              const end = e.pkwtEnd || e.contractEnd || "2027-12-31";
              
              const totalDays = new Date(end).getTime() - new Date(start).getTime();
              const elapsedDays = new Date().getTime() - new Date(start).getTime();
              const pct = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 100;
              
              const leftDays = Math.ceil((new Date(end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const daysLeftBarWidth = Math.min(100, Math.max(5, (Math.max(0, leftDays) / 365) * 100));
              const isCritical = leftDays < 60;
              const isLowKpi = e.kpi < 70;

              const joinDateFormatted = e.joinedAt ? new Date(e.joinedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-";
              const contractEndFormatted = e.contractEnd || e.pkwtEnd ? new Date(e.contractEnd || e.pkwtEnd || "").toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

              return (
                <tr key={t} style={{ borderBottom: "1px solid #F1F5F9", background: isCritical ? "#FFF1F2" : "transparent" }}>
                  <td style={{ padding: "0.75rem 1.5rem" }}>
                    <div style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{e.name}</div>
                    <div style={{ fontSize: "7px", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>{e.position} | ID: {e.id?.slice(0, 8)}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", borderRight: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "#1E293B" }}>{joinDateFormatted}</div>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", fontWeight: 950, color: isLowKpi ? "#EF4444" : "#1E293B" }}>{e.kpi}</div>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>{e.disiplin}%</div>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", textTransform: "uppercase" }}>{e.output || "NORMAL"}</div>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", borderRight: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>{e.attitude}/5</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{contractEndFormatted}</div>
                    <div style={{ fontSize: "7px", color: isCritical ? "#EF4444" : "#94A3B8", fontWeight: 800 }}>
                      SISA {Math.max(0, leftDays)} HARI
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <span style={{ fontSize: "8px", fontWeight: 900, color: "#6366F1", textTransform: "uppercase" }}>{e.type || "TETAP"}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", borderRight: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "#1E293B" }}>{e.rev ?? 0}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ width: "100%", height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${daysLeftBarWidth}%`, height: "100%", background: isCritical ? "#EF4444" : "#10B981" }} />
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                    <span style={{ 
                       background: isCritical ? "#BE123C" : isLowKpi ? "#B45309" : "#059669", 
                       color: "white", 
                       padding: "3px 8px", 
                       borderRadius: "8px", 
                       fontSize: "7px", 
                       fontWeight: 950,
                       whiteSpace: "nowrap"
                    }}>
                       {isCritical ? "CRITICAL EXPIRE" : isLowKpi ? "PERFORMANCE REVIEW" : "AUDIT CLEAR"}
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

export default function HRDashboardClient() {
  const [executive, setExecutive] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<Record<string, Employee[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [execRes, deptRes] = await Promise.all([
          api.get("/hr/executive-summary"),
          api.get("/hr/department-scores"),
        ]);

        setExecutive(execRes.data);

        // Map department scores response to our 8 sections
        const divisions = deptRes.data || [];
        const mapped: Record<string, Employee[]> = {};

        for (const [key, group] of Object.entries(DIVISION_MAP)) {
          const allEmployees: Employee[] = [];
          for (const div of group.divisions) {
            const dept = divisions.find((d: any) => d.division === div);
            if (dept?.employees) {
              allEmployees.push(...dept.employees);
            }
          }
          mapped[key] = allEmployees;
        }

        setDepartmentData(mapped);
      } catch (err: any) {
        console.error("HR Dashboard fetch error:", err);
        setError(err?.message || "Failed to load HR data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <Loader2 />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <ShieldAlert className="w-8 h-8 text-rose-500" />
        <p style={{ fontSize: "11px", fontWeight: 950, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>{error}</p>
        <p style={{ fontSize: "9px", color: "#64748B", fontWeight: 950, textTransform: "uppercase" }}>Run seed first: npx prisma db seed</p>
      </div>
    );
  }

  // Static pipeline fallback matching prototype exactly
  const recruitmentPipeline = [
    { id: "801", name: "ADITYA PUTRA", source: "LINKEDIN", pos: "SENIOR FORMULATOR", dept: "R&D", pic: "DINA", stage: "OFFERING", apply: "20/03", intv: "25/03", join: "15/04", status: "SENT" },
    { id: "802", name: "SASA AMALIA", source: "REFERRAL", pos: "SCM OFFICER", dept: "SCM", pic: "ANDI", stage: "HIRED", apply: "22/03", intv: "28/03", join: "01/04", status: "DONE" },
    { id: "805", name: "RAYHAN ALI", source: "GLINTS", pos: "PRODUCTION TECH", dept: "PROD", pic: "DINA", stage: "SCREEN", apply: "01/04", intv: "-", join: "-", status: "PEND" }
  ];

  return (
    <div className="view-section active" style={{ paddingBottom: "10rem", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* I. EXECUTIVE KPI CARDS (5 COLUMNS GRID) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        {/* Card 1: Budget Savings */}
        <div style={{ background: "#F0F9FF", padding: "1.25rem", borderRadius: "24px", border: "1px solid #BAE6FD" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Wallet className="w-3.5 h-3.5 text-blue-500" style={{ color: "#0369A1" }} />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#0C4A6E", letterSpacing: "0.05em", margin: 0 }}>BUDGET & SAVINGS</p>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 950, color: "#0C4A6E", margin: 0 }}>
            Rp {executive?.budgetSavings || "1.42 M"}
          </p>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "10px", fontWeight: 950, color: "#10B981" }}>+ Rp 380 JT SAVINGS</span>
          </div>
        </div>

        {/* Card 2: Hiring Speed */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <UserPlus className="w-3.5 h-3.5 text-emerald-500" style={{ color: "#10B981" }} />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>HIRING SPEED</p>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
            {executive?.hiringSpeed || "18 Days"}
          </p>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>AVG TIME TO FILL</span>
        </div>

        {/* Card 3: Stability Index */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" style={{ color: "#EF4444" }} />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>STABILITY INDEX</p>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
            {executive?.stabilityIndex ? `${executive.stabilityIndex}%` : "2.4%"}
          </p>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>TURNOVER RATE</span>
        </div>

        {/* Card 4: Workload */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Activity className="w-3.5 h-3.5 text-amber-500" style={{ color: "#F59E0B" }} />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>WORKLOAD</p>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
            {executive?.workload || "48"}
          </p>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>ACTIVE INTERVIEWS</span>
        </div>

        {/* Card 5: Avg KPI */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Award className="w-3.5 h-3.5 text-blue-500" style={{ color: "#3B82F6" }} />
            <p style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>AVG KPI</p>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 950, color: "#3B82F6", margin: 0 }}>
            {executive?.avgKpi ? `${(parseFloat(executive.avgKpi)/10).toFixed(1)}/10` : "8.4/10"}
          </p>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748B" }}>DEPT PERFORMANCE</span>
        </div>

      </div>

      {/* 1. RECRUITMENT PIPELINE */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "11px", fontWeight: 950, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
          <GitPullRequest className="w-3.5 h-3.5 text-indigo-500" style={{ color: "#6366F1" }} /> 1. RECRUITMENT PIPELINE (ACTIVE AUDIT)
        </h3>
        <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "1rem 1.5rem", width: "25%", fontSize: "8px", fontWeight: 950, color: "#64748B" }}>CANDIDATE / SOURCE</th>
                <th style={{ padding: "1rem 1rem", width: "25%", fontSize: "8px", fontWeight: 950, color: "#64748B" }}>POSITION / DEPT</th>
                <th style={{ padding: "1rem 1rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#64748B", textAlign: "center" }}>HR PIC</th>
                <th style={{ padding: "1rem 1rem", width: "20%", fontSize: "8px", fontWeight: 950, color: "#64748B", textAlign: "center" }}>STAGES (DATE)</th>
                <th style={{ padding: "1rem 1.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#64748B", textAlign: "right" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recruitmentPipeline.map((e, t) => (
                <tr key={t} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "1rem 1.5rem" }}>
                    <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{e.name}</div>
                    <div style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8" }}>{e.source} | {e.apply}</div>
                  </td>
                  <td style={{ padding: "1rem 1rem" }}>
                    <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{e.pos}</div>
                    <div style={{ fontSize: "8px", fontWeight: 800, color: "#64748B" }}>{e.dept}</div>
                  </td>
                  <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", fontWeight: 950, color: "#6366F1" }}>{e.pic}</div>
                  </td>
                  <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B" }}>{e.stage}</div>
                    <div style={{ fontSize: "8px", color: "#94A3B8" }}>INT: {e.intv}</div>
                  </td>
                  <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                    <span style={{ 
                      background: e.stage === "HIRED" ? "#10B981" : e.stage === "REJECT" ? "#EF4444" : "#F59E0B", 
                      color: "white", 
                      padding: "4px 10px", 
                      borderRadius: "12px", 
                      fontSize: "8px", 
                      fontWeight: 950 
                    }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. DIVISIONAL PERFORMANCE & CONTRACT AUDIT */}
      <div>
        <h3 style={{ margin: "2rem 0 1.5rem 0", fontSize: "14px", fontWeight: 950, color: "#0F172A", display: "flex", alignItems: "center", gap: "10px", borderBottom: "2px solid #E2E8F0", paddingBottom: "10px" }}>
          <Activity className="w-[18px] h-[18px] text-slate-800" /> 2. DIVISIONAL PERFORMANCE & CONTRACT AUDIT
        </h3>
        {Object.entries(DIVISION_MAP).map(([key, group]) => (
          <PersonnelTable
            key={key}
            number={group.number}
            title={group.name}
            icon={group.icon}
            data={departmentData[key] || []}
          />
        ))}
      </div>

    </div>
  );
}

function Loader2() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p style={{ fontSize: "10px", fontWeight: 950, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Syncing HR DNA...</p>
    </div>
  );
}
