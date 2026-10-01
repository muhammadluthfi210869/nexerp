import React from "react";
import { FinanceDashboardTransaction } from "../_types/dashboard.types";

const FALLBACK_TRANSACTIONS: FinanceDashboardTransaction[] = [];

interface FinanceDashboardTransactionLogProps {
  transactions?: FinanceDashboardTransaction[];
}

export function FinanceDashboardTransactionLog({
  transactions,
}: FinanceDashboardTransactionLogProps) {
  const displayTransactions = transactions?.length
    ? transactions
    : FALLBACK_TRANSACTIONS;

  return (
    <div style={{ marginBottom: "4rem" }}>
      <h3 className="section-label" style={{ marginBottom: "1.25rem" }}>
        ðŸ”´ 1. FINANCIAL TRANSACTION LOG (CENTRAL LEDGER)
      </h3>
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "1200px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  TRANS ID / DATE
                </th>
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  TYPE / CATEGORY
                </th>
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  REFERENCE (REF ID)
                </th>
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  AMOUNT
                </th>
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  METHOD
                </th>
                <th
                  style={{
                    padding: "1.25rem 1.5rem",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 950,
                    color: "#64748B",
                  }}
                >
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((row: any, i: number) => {
                const isIn = row.type === "IN";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 950,
                          color: "#1E293B",
                        }}
                      >
                        {row.id}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color: "#64748B",
                        }}
                      >
                        {row.date}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1.5rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 950,
                          color: isIn ? "#10B981" : "#EF4444",
                        }}
                      >
                        {row.type} / {row.cat || "COGS"}
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 950,
                          color: "#1E293B",
                        }}
                      >
                        {row.ref}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1.5rem",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: 950,
                        color: isIn ? "#10B981" : "#1E293B",
                      }}
                    >
                      Rp {row.amount}
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1.5rem",
                        textAlign: "center",
                        fontSize: "10px",
                        fontWeight: 850,
                      }}
                    >
                      {row.method}
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1.5rem",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          background:
                            row.status === "PAID" ? "#ECFDF5" : "#FFFBEB",
                          color:
                            row.status === "PAID" ? "#059669" : "#D97706",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "10px",
                          fontWeight: 900,
                          textTransform: "uppercase",
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
