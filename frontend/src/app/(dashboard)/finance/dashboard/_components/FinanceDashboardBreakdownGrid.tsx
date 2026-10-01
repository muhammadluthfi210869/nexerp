import React from "react";
import {
  FinanceDashboardExpenseBreakdown,
  FinanceDashboardRevenueBreakdown,
} from "../_types/dashboard.types";

const FALLBACK_EXPENSE: FinanceDashboardExpenseBreakdown[] = [];
const FALLBACK_REVENUE: FinanceDashboardRevenueBreakdown[] = [];

interface FinanceDashboardBreakdownGridProps {
  expenseBreakdown?: FinanceDashboardExpenseBreakdown[];
  revenueBreakdown?: FinanceDashboardRevenueBreakdown[];
}

export function FinanceDashboardBreakdownGrid({
  expenseBreakdown,
  revenueBreakdown,
}: FinanceDashboardBreakdownGridProps) {
  const displayExpense = expenseBreakdown?.length
    ? expenseBreakdown
    : FALLBACK_EXPENSE;
  const displayRevenue = revenueBreakdown?.length
    ? revenueBreakdown
    : FALLBACK_REVENUE;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
        marginBottom: "4rem",
      }}
    >
      {/* Expense breakdown */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#EAB308", marginBottom: "1.25rem" }}
        >
          ðŸŸ¢ 4. EXPENSE BREAKDOWN (DEPT AUDIT)
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
                  CATEGORY / DEPT
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {displayExpense.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 950,
                        color: "#1E293B",
                      }}
                    >
                      {row.cat}
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        color: "#94A3B8",
                      }}
                    >
                      {row.sub}
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
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div>
        <h3
          className="section-label"
          style={{ color: "#3B82F6", marginBottom: "1.25rem" }}
        >
          ðŸ”µ 5. REVENUE BREAKDOWN (GROWTH AUDIT)
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
                  CUSTOMER / PRODUCT
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  SOURCE
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "right",
                    fontSize: "9px",
                    fontWeight: 950,
                  }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRevenue.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 950,
                        color: "#1E293B",
                      }}
                    >
                      {row.name}
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        color: "#94A3B8",
                      }}
                    >
                      {row.prod}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: 900,
                      }}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: 950,
                      color: "#10B981",
                    }}
                  >
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
