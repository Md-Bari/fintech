"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Landmark, CreditCard, Loader2, DollarSign, Activity, ShieldAlert, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  total_mfis: number;
  active_mfis: number;
  total_users: number;
  total_loans: number;
  total_revenue: number;
  active_subscriptions: number;
}

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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, aiRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/ai-center-insights"),
        ]);
        setData(dashRes.data?.data || null);
        setInsights(aiRes.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch admin dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || !insights) return null;

  const inactiveMfis = data.total_mfis - data.active_mfis;
  const overallFraudRate = insights.summary.total_applications
    ? Math.round((insights.summary.fraud_applications / insights.summary.total_applications) * 100)
    : 0;

  const pieData = [
    { name: "Active MFIs", value: data.active_mfis, color: "#10b981" },
    { name: "Inactive MFIs", value: inactiveMfis > 0 ? inactiveMfis : 0, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const statusPie = insights.status_risk.map((row) => ({
    name: row.status,
    value: row.count,
    color:
      row.status.toLowerCase() === "approved"
        ? "#10b981"
        : row.status.toLowerCase() === "pending"
          ? "#f59e0b"
          : "#ef4444",
  }));

  const platformBars = [
    { name: "Users", count: data.total_users, fill: "#3b82f6" },
    { name: "MFIs", count: data.total_mfis, fill: "#10b981" },
    { name: "Loans", count: data.total_loans, fill: "#f59e0b" },
    { name: "Subs", count: data.active_subscriptions, fill: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Activity size={12} />
              Super Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Platform AI Dashboard</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Unified overview with fraud trends, risky MFIs, and payment anomaly intelligence.
            </p>
          </div>
          <Link href="/admin/subscription-plans" className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto gap-2 rounded-xl h-12 px-6 bg-white text-primary hover:bg-white/90 font-bold shadow-lg">
              <CreditCard size={20} />
              Subscription Plans
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Users", value: data.total_users.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Total Applications", value: insights.summary.total_applications.toLocaleString(), icon: ShieldAlert, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Fraud Loans", value: insights.summary.fraud_applications.toLocaleString(), icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
          { title: "Overall Fraud Rate", value: `${overallFraudRate}%`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
            <Card className="border-none shadow-sm rounded-3xl h-full transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-xl transition-colors", stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Fraud Rate Among MFIs</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.fraud_rate_by_mfi.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="mfi_name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, "Fraud Rate"]} />
                <Bar dataKey="fraud_rate" radius={[0, 6, 6, 0]}>
                  {insights.fraud_rate_by_mfi.slice(0, 8).map((r, idx) => <Cell key={idx} fill={Number(r.fraud_rate) >= 40 ? "#ef4444" : "#0f766e"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Application Status Mix</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {statusPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Monthly Fraud Trend</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.daily_fraud_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fraud_applications" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud Loans" />
                <Line type="monotone" dataKey="total_applications" stroke="#0f766e" strokeWidth={2} dot={false} name="Total Loans" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Payment Anomaly by MFI</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
            {insights.payment_anomaly_by_mfi.slice(0, 8).map((row) => (
              <div key={row.mfi_name} className="rounded-xl border border-border p-3">
                <p className="font-semibold text-sm">{row.mfi_name}</p>
                <p className="text-xs text-muted-foreground">Failed Rate: <span className="font-bold text-rose-700">{Number(row.failed_rate).toFixed(1)}%</span></p>
                <p className="text-xs text-muted-foreground">Failed: {row.failed_transactions} | Pending: {row.pending_transactions} | Total: {row.total_transactions}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Fraud Purpose Distribution</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.fraud_by_purpose} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="purpose" angle={-20} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="fraud_applications" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-xl font-extrabold tracking-tight">Platform Scale</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformBars}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), "Count"]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {platformBars.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Active MFIs</p><p className="text-3xl font-extrabold">{data.active_mfis.toLocaleString()}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Revenue</p><p className="text-3xl font-extrabold">BDT {data.total_revenue.toLocaleString()}</p></CardContent></Card>
        <Card className="rounded-2xl border-none shadow-sm"><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Approved High Fraud</p><p className="text-3xl font-extrabold text-rose-700">{insights.summary.approved_high_fraud.toLocaleString()}</p></CardContent></Card>
      </div>
    </div>
  );
}
