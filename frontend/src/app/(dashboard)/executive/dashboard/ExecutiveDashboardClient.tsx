"use client";

import React from "react";
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  FlaskConical,
  Factory,
  Wallet,
  Zap,
  ChevronRight,
  Bell,
  AlertTriangle
} from "lucide-react";

interface AlertCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  items: { label: string; value: string; color: string }[];
  action: string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  items,
  action
}) => {
  return (
    <div
      style={{
        background: "white",
        padding: "2rem",
        borderRadius: "32px",
        border: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
      }}
    >
      {/* Card Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            background: iconColor + "15",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "#F8FAFC",
              padding: "12px 16px",
              borderRadius: "16px",
              border: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748B" }}>
              {item.label}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 950, color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div
        style={{
          background: "#F8FAFC",
          padding: "1.25rem",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid #F1F5F9",
          cursor: "pointer",
          marginTop: "auto"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "white",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E2E8F0"
            }}
          >
            <Zap size={14} color={iconColor} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "8px", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase" }}>
              Command Center Action:
            </p>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "#1E293B" }}>
              {action}
            </p>
          </div>
        </div>
        <ChevronRight size={16} color="#CBD5E1" />
      </div>
    </div>
  );
};

export default function ExecutiveDashboardClient() {
  return (
    <div
      style={{
        padding: "3rem",
        background: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif"
      }}
    >
      {/* Top Banner and Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "3rem"
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 950,
              color: "#0F172A",
              letterSpacing: "-0.04em"
            }}
          >
            DASHBOARD ALERT
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
            <div
              style={{
                background: "#FEE2E2",
                color: "#DC2626",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "9px",
                fontWeight: 950,
                letterSpacing: "0.05em"
              }}
            >
              SYSTEM ANOMALY DETECTED
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>
              <span style={{ color: "#0F172A", fontWeight: 800 }}>6 Node Kritis</span> Teridentifikasi • Status:{" "}
              <span style={{ color: "#10B981", fontWeight: 900 }}>SYNCED</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              background: "white",
              border: "1px solid #E2E8F0",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 900,
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} /> REFRESH PARAMS
          </button>
          <button
            style={{
              background: "#0F172A",
              border: "none",
              padding: "10px 24px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 900,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
          >
            <CheckCircle size={14} /> AUDIT ALL NODES
          </button>
        </div>
      </div>

      {/* Grid of Alert Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem",
          marginBottom: "2.5rem"
        }}
      >
        {/* Card 1: BD Alert */}
        <AlertCard
          title="SALES ALERT (BD)"
          subtitle="Peluang uang yang hampir hilang"
          icon={TrendingUp}
          iconColor="#EF4444"
          items={[
            { label: "Leads belum di follow up > 24 jam", value: "15", color: "#EF4444" },
            { label: "Deal stuck > 7 hari (Sample/Nego)", value: "8", color: "#F59E0B" },
            { label: "Client high value belum closing", value: "2", color: "#DC2626" }
          ]}
          action="Paksa BD follow up hari ini"
        />

        {/* Card 2: Sample & R&D Alert */}
        <AlertCard
          title="SAMPLE & R&D ALERT"
          subtitle="Bottleneck tersembunyi di operasional"
          icon={FlaskConical}
          iconColor="#F59E0B"
          items={[
            { label: "Sample overdue > SLA (3-5 hari)", value: "6", color: "#EF4444" },
            { label: "Sample revisi berkali-kali", value: "4", color: "#F59E0B" },
            { label: "Sample belum approval / dikirim", value: "10", color: "#F59E0B" }
          ]}
          action="Dorong R&D / lab percepat proses internal"
        />

        {/* Card 3: Repeat Order Alert */}
        <AlertCard
          title="REPEAT ORDER ALERT"
          subtitle="Retensi & Kesetiaan Pelanggan"
          icon={RefreshCw}
          iconColor="#8B5CF6"
          items={[
            { label: "Client siap repeat minggu ini", value: "20", color: "#F59E0B" },
            { label: "Client telat reorder (Churn Risk)", value: "8", color: "#EF4444" },
            { label: "High value client belum di follow up", value: "3", color: "#F59E0B" }
          ]}
          action="BD wajib kontak client hari ini"
        />

        {/* Card 4: Lost Risk Alert */}
        <AlertCard
          title="LOST RISK ALERT (ADVANCED)"
          subtitle="Ketajaman Owner & Pencegahan Churn"
          icon={ShieldAlert}
          iconColor="#475569"
          items={[
            { label: "Client risiko churn (Trend Turun)", value: "5", color: "#EF4444" },
            { label: "Deal hampir batal (Prospect Lost)", value: "3", color: "#EF4444" },
            { label: "Komplain tinggi dalam 30 hari", value: "HIGH", color: "#DC2626" }
          ]}
          action="Intervensi Owner / Head of BD segera"
        />

        {/* Card 5: Production Alert */}
        <AlertCard
          title="PRODUCTION ALERT"
          subtitle="Reputasi bisnis & Ketepatan waktu"
          icon={Factory}
          iconColor="#F59E0B"
          items={[
            { label: "Order overdue produksi (Telat)", value: "5", color: "#EF4444" },
            { label: "Order hampir telat deadline", value: "12", color: "#F59E0B" },
            { label: "Bottleneck di QC / packing", value: "STUCK", color: "#F59E0B" }
          ]}
          action="Prioritas produksi (Bukan FIFO, tapi Urgency)"
        />

        {/* Card 6: Cashflow Alert */}
        <AlertCard
          title="CASHFLOW ALERT (KRITIS)"
          subtitle="Hidup mati bisnis & Kesehatan Finansial"
          icon={Wallet}
          iconColor="#3B82F6"
          items={[
            { label: "Invoice belum dibayar (Overdue)", value: "Rp 800 Jt", color: "#EF4444" },
            { label: "Client besar belum bayar > 30 hari", value: "10", color: "#EF4444" }
          ]}
          action="Tim finance + BD follow up payment segera"
        />
      </div>
    </div>
  );
}
