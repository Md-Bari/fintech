"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BrainCircuit, Loader2, ShieldAlert, TrendingUp, WalletCards } from "lucide-react";
import api from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Summary = {
  total_applications: number;
  fraud_applications: number;
  avg_fraud_score: number;
  approved_high_fraud: number;
};

type RateByMfi = { mfi_name: string; total_applications: number; fraud_applications: number; fraud_rate: number };
type DailyTrend = { day: string; fraud_applications: number; total_applications: number };
type PurposeRow = { purpose: string; fraud_applications: number };
type StatusRisk = { status: string; count: number; avg_fraud_score: number };
type PaymentAnomaly = { mfi_name: string; total_transactions: number; failed_transactions: number; pending_transactions: number; failed_rate: number };

type InsightsData = {
  threshold: number;
  summary: Summary;
  fraud_rate_by_mfi: RateByMfi[];
  daily_fraud_trend: DailyTrend[];
  fraud_by_purpose: PurposeRow[];
  status_risk: StatusRisk[];
  payment_anomaly_by_mfi: PaymentAnomaly[];
};

export default function AdminAiCenterPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/admin/ai-center-insights", { timeout: 15000 });
        setData(res.data?.data ?? null);
      } catch (e) {
        console.error("AI Center insights load failed", e);
        setError("Failed to load AI Center insights.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const overallFraudRate = useMemo(() => {
    if (!data?.summary?.total_applications) return 0;
    return Math.round((data.summary.fraud_applications / data.summary.total_applications) * 100);
  }, [data]);

  const statusPie = useMemo(() => {
    const rows = data?.status_risk ?? [];
    const map: Record<string, string> = {
      approved: "#10b981",
      pending: "#f59e0b",
      rejected: "#ef4444",
    };
    return rows.map((row) => ({
      name: row.status,
      value: row.count,
      color: map[row.status.toLowerCase()] ?? "#64748b",
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">AI Center</h1>
          <p className="text-primary-foreground/75 text-sm mt-2">Loading AI insights...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AI Center data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-[2rem] border-none shadow-sm">
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <AlertTriangle className="text-rose-600" size={28} />
          <p className="font-bold">AI Center Unavailable</p>
          <p className="text-sm text-muted-foreground">{error ?? "No data returned."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
            <BrainCircuit size={12} /> Platform AI Command
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin AI Center</h1>
          <p className="text-primary-foreground/70 text-sm max-w-2xl leading-relaxed">
            Unified AI intelligence across fraud detection, approval-risk leakage, day-wise fraud movement, purpose-wise hotspots, and payment anomalies.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total Applications</p><p className="text-3xl font-extrabold mt-1">{data.summary.total_applications.toLocaleString()}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Fraud Loans ({">="} {data.threshold}%)</p><p className="text-3xl font-extrabold mt-1 text-rose-700">{data.summary.fraud_applications.toLocaleString()}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Fraud Rate</p><p className="text-3xl font-extrabold mt-1">{overallFraudRate}%</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Approved but High Fraud</p><p className="text-3xl font-extrabold mt-1 text-amber-700">{data.summary.approved_high_fraud.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg font-bold inline-flex items-center gap-2"><ShieldAlert size={16} /> Fraud Rate Among MFIs</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fraud_rate_by_mfi.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 18, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="mfi_name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, "Fraud Rate"]} />
                <Bar dataKey="fraud_rate" radius={[0, 6, 6, 0]}>
                  {data.fraud_rate_by_mfi.slice(0, 10).map((row, i) => <Cell key={i} fill={Number(row.fraud_rate) >= 40 ? "#ef4444" : "#0f766e"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg font-bold inline-flex items-center gap-2"><TrendingUp size={16} /> Day-Wise Fraud Report</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_fraud_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fraud_applications" stroke="#ef4444" strokeWidth={2} name="Fraud Loans" dot={false} />
                <Line type="monotone" dataKey="total_applications" stroke="#0f766e" strokeWidth={2} name="Total Loans" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="text-lg font-bold">Status Mix</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" innerRadius={52} outerRadius={86} paddingAngle={3}>
                  {statusPie.map((row, i) => <Cell key={i} fill={row.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="text-lg font-bold">Fraud by Purpose</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fraud_by_purpose} margin={{ top: 0, right: 10, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="purpose" angle={-25} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="fraud_applications" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="text-lg font-bold inline-flex items-center gap-2"><WalletCards size={16} /> Payment Anomaly by MFI</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
            {data.payment_anomaly_by_mfi.map((row) => (
              <div key={row.mfi_name} className="rounded-xl border border-border p-3">
                <p className="font-semibold text-sm">{row.mfi_name}</p>
                <p className="text-xs text-muted-foreground">Failed Rate: <span className="font-bold text-rose-700">{Number(row.failed_rate).toFixed(1)}%</span></p>
                <p className="text-xs text-muted-foreground">Failed: {row.failed_transactions} | Pending: {row.pending_transactions} | Total: {row.total_transactions}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
