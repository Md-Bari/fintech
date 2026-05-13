"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, ClipboardList, Loader2, ShieldAlert, TrendingUp } from "lucide-react";
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
};

type MfiFraudRow = {
  mfi_name: string;
  total_applications: number;
  fraud_applications: number;
  fraud_rate: number;
};

type DailyFraudRow = {
  day: string;
  fraud_applications: number;
  total_applications: number;
};

type PurposeFraudRow = {
  purpose: string;
  total_applications: number;
  fraud_applications: number;
};

type StatusRow = {
  status: string;
  count: number;
  avg_fraud_score: number;
};

type InsightsResponse = {
  threshold: number;
  summary: Summary;
  fraud_rate_by_mfi: MfiFraudRow[];
  daily_fraud_trend: DailyFraudRow[];
  fraud_by_purpose: PurposeFraudRow[];
  status_breakdown: StatusRow[];
};

export default function AdminApplicationsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/admin/application-insights", { timeout: 15000 });
        setInsights(res.data?.data ?? null);
      } catch (e) {
        console.error("Failed to fetch admin application insights", e);
        setError("Could not load application insights.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const fraudRatePct = useMemo(() => {
    if (!insights?.summary?.total_applications) return 0;
    return Math.round((insights.summary.fraud_applications / insights.summary.total_applications) * 100);
  }, [insights]);

  const statusPie = useMemo(() => {
    const rows = insights?.status_breakdown ?? [];
    const colors: Record<string, string> = {
      approved: "#10b981",
      pending: "#f59e0b",
      rejected: "#ef4444",
    };

    return rows.map((r) => ({
      name: r.status,
      value: r.count,
      color: colors[r.status.toLowerCase()] ?? "#64748b",
    }));
  }, [insights]);

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Loan Insights</h1>
          <p className="text-primary-foreground/75 text-sm mt-2">Loading fraud intelligence dashboard...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading insights data...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="space-y-8 pb-10">
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <AlertTriangle className="text-rose-600" size={28} />
            <p className="font-bold">Insights Unavailable</p>
            <p className="text-sm text-muted-foreground">{error ?? "No insights data returned."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = insights.summary;

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
            <ClipboardList size={12} /> Platform Fraud Insights
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Loan Insights</h1>
          <p className="text-primary-foreground/70 text-sm max-w-2xl leading-relaxed">
            Live platform intelligence: fraud rate among MFIs, day-wise fraud volume, and category patterns behind risky applications.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Applications</p>
            <p className="text-3xl font-extrabold mt-1">{summary.total_applications.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Fraud Loans ({">="} {insights.threshold}%)</p>
            <p className="text-3xl font-extrabold mt-1 text-rose-700">{summary.fraud_applications.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Fraud Rate</p>
            <p className="text-3xl font-extrabold mt-1">{fraudRatePct}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Fraud Score</p>
            <p className="text-3xl font-extrabold mt-1">{Number(summary.avg_fraud_score || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold inline-flex items-center gap-2"><ShieldAlert size={16} /> Fraud Rate Among MFIs</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.fraud_rate_by_mfi.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 18, left: 28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="mfi_name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, "Fraud Rate"]} />
                <Bar dataKey="fraud_rate" radius={[0, 6, 6, 0]}>
                  {insights.fraud_rate_by_mfi.slice(0, 10).map((r, i) => (
                    <Cell key={`mfi-rate-${i}`} fill={Number(r.fraud_rate) >= 40 ? "#ef4444" : "#0f766e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold inline-flex items-center gap-2"><TrendingUp size={16} /> Fraud Loans Day-Wise (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.daily_fraud_trend}>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold inline-flex items-center gap-2"><BarChart3 size={16} /> Fraud-Prone Purposes</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.fraud_by_purpose} margin={{ top: 0, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="purpose" angle={-25} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="fraud_applications" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Application Status Mix and Risk</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 h-[360px]">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {statusPie.map((s, i) => (
                      <Cell key={`status-${i}`} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-y-auto pr-1">
              <div className="space-y-3">
                {insights.status_breakdown.map((row) => (
                  <div key={row.status} className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{row.status}</p>
                    <p className="text-lg font-extrabold">{row.count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Avg Fraud Score: {Number(row.avg_fraud_score || 0).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
