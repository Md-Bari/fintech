"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Download,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface InsightApp {
  id: string;
  applicant_name: string;
  email: string;
  product_name: string;
  amount: string;
  duration_months: number;
  fraud_score?: number | null;
  fraud_reason?: string | null;
  status: string;
  created_at: string;
}

interface InsightRow extends InsightApp {
  fraud_pct: number;
}

const AI_INSIGHT_CACHE_KEY = "mfi-ai-insight-cache-v1";

function toPercent(score?: number | null) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function riskBucket(pct: number) {
  if (pct >= 70) return "Critical";
  if (pct >= 40) return "Elevated";
  if (pct >= 20) return "Watch";
  return "Low";
}

function formatMoney(value: number) {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

function formatMoneyPdf(value: number) {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

export default function MFIAiInsightPage() {
  const [items, setItems] = useState<InsightApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const cachedRaw = sessionStorage.getItem(AI_INSIGHT_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as InsightApp[];
          if (Array.isArray(cached) && cached.length > 0) {
            setItems(cached);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore malformed cache and refetch.
        }
      }

      setLoading(true);
      try {
        const res = await api.get("/mfi/applications?all=1&hydrate_ai=0");
        const rows: InsightApp[] = res.data?.data ?? [];
        setItems(rows);
        sessionStorage.setItem(AI_INSIGHT_CACHE_KEY, JSON.stringify(rows));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows = useMemo<InsightRow[]>(
    () => items.map((x) => ({ ...x, fraud_pct: toPercent(x.fraud_score) })),
    [items],
  );

  const summary = useMemo(() => {
    const total = rows.length;
    const highRisk = rows.filter((r) => r.fraud_pct >= 40).length;
    const critical = rows.filter((r) => r.fraud_pct >= 70).length;
    const aiReviewed = rows.filter((r) => (r.fraud_reason ?? "").trim().length > 0).length;
    const avgRisk = total ? Math.round(rows.reduce((a, b) => a + b.fraud_pct, 0) / total) : 0;
    const riskExposure = rows
      .filter((r) => r.fraud_pct >= 40)
      .reduce((a, b) => a + Number(b.amount || 0), 0);
    const totalVolume = rows.reduce((a, b) => a + Number(b.amount || 0), 0);
    const reviewedCoverage = total ? Math.round((aiReviewed / total) * 100) : 0;
    return {
      total,
      highRisk,
      critical,
      aiReviewed,
      avgRisk,
      riskExposure,
      totalVolume,
      reviewedCoverage,
    };
  }, [rows]);

  const riskDist = useMemo(() => {
    const buckets = ["Low", "Watch", "Elevated", "Critical"] as const;
    const colors = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
    return buckets.map((bucket, idx) => ({
      name: bucket,
      value: rows.filter((r) => riskBucket(r.fraud_pct) === bucket).length,
      color: colors[idx],
    }));
  }, [rows]);

  const statusVsRisk = useMemo(() => {
    const statuses = ["pending", "approved", "rejected"];
    return statuses.map((s) => {
      const list = rows.filter((r) => (r.status || "").toLowerCase() === s);
      const avg = list.length ? Math.round(list.reduce((a, b) => a + b.fraud_pct, 0) / list.length) : 0;
      return {
        status: s.charAt(0).toUpperCase() + s.slice(1),
        avgRisk: avg,
        count: list.length,
      };
    });
  }, [rows]);

  const highFraudApproved = useMemo(() => {
    return rows
      .filter((r) => (r.status || "").toLowerCase() === "approved" && r.fraud_pct >= 40)
      .sort((a, b) => b.fraud_pct - a.fraud_pct);
  }, [rows]);

  const productRisk = useMemo(() => {
    const map = new Map<string, { totalRisk: number; count: number; volume: number }>();
    rows.forEach((r) => {
      const key = r.product_name || "Unknown Product";
      const prev = map.get(key) ?? { totalRisk: 0, count: 0, volume: 0 };
      prev.totalRisk += r.fraud_pct;
      prev.count += 1;
      prev.volume += Number(r.amount || 0);
      map.set(key, prev);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        avgRisk: Math.round(v.totalRisk / Math.max(v.count, 1)),
        count: v.count,
        volume: v.volume,
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 6);
  }, [rows]);

  const monthlyRiskTrend = useMemo(() => {
    const monthMap = new Map<string, { totalRisk: number; count: number }>();
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prev = monthMap.get(key) ?? { totalRisk: 0, count: 0 };
      prev.totalRisk += r.fraud_pct;
      prev.count += 1;
      monthMap.set(key, prev);
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        avgRisk: Math.round(v.totalRisk / Math.max(v.count, 1)),
      }))
      .slice(-8);
  }, [rows]);

  const insightBullets = useMemo(() => {
    const bullets: string[] = [];
    bullets.push(`Average fraud risk is ${summary.avgRisk}% across ${summary.total} analyzed applications.`);
    bullets.push(`${summary.highRisk} applications are in elevated risk (>=40%), with ${summary.critical} in critical risk (>=70%).`);
    bullets.push(`Potential high-risk exposure stands at ${formatMoneyPdf(summary.riskExposure)} out of ${formatMoneyPdf(summary.totalVolume)} total requested volume.`);
    if (productRisk[0]) {
      bullets.push(`Highest-risk product segment is ${productRisk[0].name} with average risk ${productRisk[0].avgRisk}%.`);
    }
    bullets.push(`AI review coverage is ${summary.reviewedCoverage}% of analyzed applications.`);
    return bullets;
  }, [summary, productRisk]);

  const downloadDesignedReport = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 46;

    doc.setFillColor(6, 95, 70);
    doc.roundedRect(margin, y - 24, pageWidth - margin * 2, 70, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("finBridge AI Insight Report", margin + 16, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 16, y + 24);

    y += 66;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Executive KPIs", margin, y);

    y += 14;
    autoTable(doc, {
      startY: y,
      head: [["Analyzed", "High Risk (>=40%)", "Critical (>=70%)", "Average Risk"]],
      body: [[String(summary.total), String(summary.highRisk), String(summary.critical), `${summary.avgRisk}%`]],
      styles: { fontSize: 10, halign: "center" },
      headStyles: { fillColor: [15, 118, 110] },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 60;
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Key Insights", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    insightBullets.forEach((line) => {
      const split = doc.splitTextToSize(`- ${line}`, pageWidth - margin * 2);
      doc.text(split, margin, y + 14);
      y += split.length * 13 + 4;
    });

    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Risk Band", "Applications"]],
      body: riskDist.map((r) => [r.name, String(r.value)]),
      headStyles: { fillColor: [15, 118, 110] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
    });

    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 60;
    y += 14;
    autoTable(doc, {
      startY: y,
      head: [["Product", "Average Risk", "Applications", "Requested Volume"]],
      body: productRisk.map((p) => [p.name, `${p.avgRisk}%`, String(p.count), formatMoneyPdf(p.volume)]),
      headStyles: { fillColor: [15, 118, 110] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
    });

    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 60;
    y += 14;
    autoTable(doc, {
      startY: y,
      head: [["Month", "Average Risk"]],
      body: monthlyRiskTrend.map((t) => [t.month, `${t.avgRisk}%`]),
      headStyles: { fillColor: [15, 118, 110] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
    });

    doc.save(`ai-insight-overall-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadHighFraudApprovedReport = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 46;

    doc.setFillColor(127, 29, 29);
    doc.roundedRect(margin, y - 24, pageWidth - margin * 2, 76, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("Exception Report: High Fraud but Approved", margin + 16, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 16, y + 22);
    doc.text(`Threshold: Fraud Risk >= 40% and Status = Approved`, margin + 16, y + 38);

    y += 72;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Summary", margin, y);

    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Flagged Approvals", "Average Fraud Risk", "Total Requested Volume"]],
      body: [[
        String(highFraudApproved.length),
        `${highFraudApproved.length ? Math.round(highFraudApproved.reduce((a, b) => a + b.fraud_pct, 0) / highFraudApproved.length) : 0}%`,
        formatMoneyPdf(highFraudApproved.reduce((a, b) => a + Number(b.amount || 0), 0)),
      ]],
      styles: { fontSize: 10, halign: "center" },
      headStyles: { fillColor: [127, 29, 29] },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 60;
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Flagged Application List", margin, y);

    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Applicant", "Product", "Amount", "Fraud Risk", "Applied On"]],
      body: highFraudApproved.map((app) => [
        app.applicant_name,
        app.product_name || "N/A",
        formatMoneyPdf(Number(app.amount || 0)),
        `${app.fraud_pct}%`,
        new Date(app.created_at).toLocaleDateString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [127, 29, 29] },
      margin: { left: margin, right: margin },
    });

    doc.save(`high-fraud-approved-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <Link
          href="/mfi"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                <BrainCircuit size={12} /> AI Insight
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Overall Fraud Intelligence</h1>
              <p className="text-primary-foreground/70 text-sm max-w-xl leading-relaxed">
                Portfolio-level risk insights, model exposure analytics, and a designed downloadable report for compliance and management review.
              </p>
            </div>
            <Button onClick={downloadDesignedReport} className="rounded-xl bg-white text-primary hover:bg-white/90 gap-2 border border-white/40">
              <Download size={15} />
              Download Designed Report
            </Button>
            <Button
              onClick={downloadHighFraudApprovedReport}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 gap-2 border border-rose-400/70"
            >
              <ShieldAlert size={15} />
              High Fraud but Approved Report
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AI insights...</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Analyzed Applications", value: summary.total, icon: Sparkles },
              { label: "High Risk (>=40%)", value: summary.highRisk, icon: ShieldAlert },
              { label: "Critical Risk (>=70%)", value: summary.critical, icon: AlertTriangle },
              { label: "Average Risk", value: `${summary.avgRisk}%`, icon: TrendingUp },
              { label: "High Fraud but Approved", value: highFraudApproved.length, icon: ShieldAlert },
            ].map((item) => (
              <Card key={item.label} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
                    <p className="text-2xl font-extrabold mt-1">{item.value}</p>
                  </div>
                  <item.icon size={18} className="text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status vs Average Fraud Risk</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusVsRisk}>
                    <XAxis dataKey="status" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: unknown) => [`${Number(v ?? 0)}%`, "Avg Fraud Risk"]} />
                    <Bar dataKey="avgRisk" radius={[8, 8, 0, 0]}>
                      {statusVsRisk.map((row, idx) => (
                        <Cell key={`status-${idx}`} fill={row.avgRisk >= 40 ? "#ef4444" : "#0f766e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskDist} innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={4}>
                      {riskDist.map((entry, idx) => (
                        <Cell key={`risk-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Monthly Risk Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRiskTrend}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: unknown) => [`${Number(v ?? 0)}%`, "Average Risk"]} />
                    <Area type="monotone" dataKey="avgRisk" stroke="#0f766e" fill="url(#riskFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Portfolio Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total Requested Volume</p>
                  <p className="text-lg font-extrabold">{formatMoney(summary.totalVolume)}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">High-Risk Exposure</p>
                  <p className="text-lg font-extrabold text-rose-700">{formatMoney(summary.riskExposure)}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">AI Review Coverage</p>
                  <p className="text-lg font-extrabold">{summary.reviewedCoverage}%</p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-emerald-50/50">
                  <p className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Suggested Action
                  </p>
                  <p className="text-sm mt-1 text-slate-700">
                    Prioritize manual review queues for Critical and Elevated risk bands to reduce potential high-risk approval leakage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Top Product Risk Segments</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3">Product</th>
                    <th className="py-3">Average Risk</th>
                    <th className="py-3">Applications</th>
                    <th className="py-3">Requested Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {productRisk.map((p) => (
                    <tr key={p.name} className="border-b border-border/60">
                      <td className="py-3 font-semibold">{p.name}</td>
                      <td className="py-3">{p.avgRisk}%</td>
                      <td className="py-3">{p.count}</td>
                      <td className="py-3">{formatMoney(p.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


