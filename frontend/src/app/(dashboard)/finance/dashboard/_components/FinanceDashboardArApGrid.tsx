import React from "react";
import {
  FinanceDashboardReceivable,
  FinanceDashboardPayable,
} from "../_types/dashboard.types";

const FALLBACK_AR: FinanceDashboardReceivable[] = [];
const FALLBACK_AP: FinanceDashboardPayable[] = [];

interface FinanceDashboardArApGridProps {
  receivables?: FinanceDashboardReceivable[];
  payables?: FinanceDashboardPayable[];
}

export function FinanceDashboardArApGrid({
  receivables,
  payables,
}: FinanceDashboardArApGridProps) {
  const displayReceivables = receivables?.length ? receivables : FALLBACK_AR;
  const displayPayables = payables?.length ? payables : FALLBACK_AP;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
        marginBottom: "4rem",
      }}
    >
      {/* accounts receivable */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#3B82F6", marginBottom: "1.25rem" }}
        >
          ðŸ”µ 2. ACCOUNTS RECEIVABLE (PIUTANG)
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
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  INVOICE / CUSTOMER
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  OUTSTANDING
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {displayReceivables.map((row: any, i: number) => {
                const isOverdue = row.status === "OVERDUE";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "1rem", textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 950,
                          color: "#1E293B",
                        }}
                      >
                        {row.id}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: "#94A3B8",
                        }}
                      >
                        {row.name}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 950,
                          color: isOverdue ? "#EF4444" : "#1E293B",
                        }}
                      >
                        Rp {row.out}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: "#94A3B8",
                          marginTop: "2px",
                        }}
                      >
                        {row.due}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          background: isOverdue ? "#FEF2F2" : "#FFFBEB",
                          color: isOverdue ? "#DC2626" : "#D97706",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "9px",
                          fontWeight: 900,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* accounts payable */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#F59E0B", marginBottom: "1.25rem" }}
        >
          ðŸŸ  3. ACCOUNTS PAYABLE (HUTANG)
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
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  BILL / SUPPLIER
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  OUTSTANDING
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {displayPayables.map((row: any, i: number) => {
                const isOverdue = row.status === "OVERDUE";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "1rem", textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 950,
                          color: "#1E293B",
                        }}
                      >
                        {row.id}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: "#94A3B8",
                        }}
                      >
                        {row.name}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 950,
                          color: isOverdue ? "#EF4444" : "#1E293B",
                        }}
                      >
                        Rp {row.out}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: "#94A3B8",
                          marginTop: "2px",
                        }}
                      >
                        {row.due}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          background: isOverdue
                            ? "#FEF2F2"
                            : row.status === "PARTIAL"
                            ? "#FFFBEB"
                            : "#F1F5F9",
                          color: isOverdue
                            ? "#DC2626"
                            : row.status === "PARTIAL"
                            ? "#D97706"
                            : "#64748B",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "9px",
                          fontWeight: 900,
                        }}
                      >
                        {row.status}
                      </span>
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
