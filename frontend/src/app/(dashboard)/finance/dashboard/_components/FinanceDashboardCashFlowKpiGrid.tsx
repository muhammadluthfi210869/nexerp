import React from "react";
import {
  FinanceDashboardCashPosition,
  FinanceDashboardKpiPerformance,
} from "../_types/dashboard.types";

const FALLBACK_CASH: FinanceDashboardCashPosition[] = [];
const FALLBACK_KPI: FinanceDashboardKpiPerformance[] = [];

interface FinanceDashboardCashFlowKpiGridProps {
  cashPosition?: FinanceDashboardCashPosition[];
  kpiPerformance?: FinanceDashboardKpiPerformance[];
}

export function FinanceDashboardCashFlowKpiGrid({
  cashPosition,
  kpiPerformance,
}: FinanceDashboardCashFlowKpiGridProps) {
  const displayCash = cashPosition?.length ? cashPosition : FALLBACK_CASH;
  const displayKpi = kpiPerformance?.length ? kpiPerformance : FALLBACK_KPI;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
      }}
    >
      {/* cash position */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#475569", marginBottom: "1.25rem" }}
        >
          ðŸ“ 6. DAILY CASH POSITION
        </h3>
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  DATE
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  IN / OUT
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  CLOSING
                </th>
              </tr>
            </thead>
            <tbody>
              {displayCash.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 950,
                        color: "#1E293B",
                      }}
                    >
                      {row.date}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 950,
                        color: "#10B981",
                      }}
                    >
                      {row.in}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 950,
                        color: "#EF4444",
                        marginTop: "2px",
                      }}
                    >
                      {row.out}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: 950,
                      color: "#1E293B",
                    }}
                  >
                    {row.closing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* kpi performance */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#EC4899", marginBottom: "1.25rem" }}
        >
          ðŸŒ¸ 7. KPI PERFORMANCE (FINANCIAL SCORE)
        </h3>
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  PERIOD
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  MARGIN / COLL
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  HEALTH SCORE
                </th>
              </tr>
            </thead>
            <tbody>
              {displayKpi.map((row: any, i: number) => {
                const isStable = row.status === "STABLE";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 950,
                          color: "#1E293B",
                        }}
                      >
                        {row.period}
                      </div>
                      <span
                        style={{
                          background: isStable ? "#ECFDF5" : "#FFFBEB",
                          color: isStable ? "#059669" : "#D97706",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "8px",
                          fontWeight: 900,
                          marginTop: "4px",
                          display: "inline-block",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: 950,
                        color: "#1E293B",
                      }}
                    >
                      {row.margin} / {row.coll}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontSize: "18px",
                        fontWeight: 950,
                        color: isStable ? "#10B981" : "#F59E0B",
                      }}
                    >
                      {row.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
