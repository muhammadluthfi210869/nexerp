"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface RepeatLead {
  id: string;
  clientName: string;
  brandName?: string;
  estimatedValue?: number;
  createdAt: string;
}

export default function ClientRepeatOrderPage() {
  const [rows, setRows] = useState<RepeatLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bussdev/leads/group/ro")
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black tracking-tight mb-6">Client RO</h1>
      <p className="text-sm text-slate-500 mb-6">
        Repeat-order customers (leads yang sudah pernah menjadi client dan order lagi).
      </p>
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-400">Belum ada repeat-order client.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Client</th>
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-right">Est. Value</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.clientName}</td>
                <td className="p-2">{r.brandName ?? "-"}</td>
                <td className="p-2 text-right">
                  {r.estimatedValue
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(Number(r.estimatedValue))
                    : "-"}
                </td>
                <td className="p-2">
                  {new Date(r.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}