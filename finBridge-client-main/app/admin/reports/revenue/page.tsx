"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Loader2, Calendar, Clock } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface TrendData {
  date: string;
  total: number;
}

interface RevenueReport {
  total_revenue: number;
  today_revenue: number;
  monthly_revenue: number;
  trend_last_7_days: TrendData[];
}

export default function AdminRevenueReportPage() {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get("/admin/reports/revenue");
        setReport(res.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch revenue report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating revenue report…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <TrendingUp size={28} className="text-muted-foreground" />
        </div>
        <p className="font-bold">Report Unavailable</p>
        <p className="text-sm text-muted-foreground">Unable to load the revenue data at this time.</p>
      </div>
    );
  }

  // Format trend data for the chart
  const chartData = [...report.trend_last_7_days].reverse().map(item => ({
    name: new Date(item.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }),
    revenue: item.total
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <TrendingUp size={12} /> Financial Analytics
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Revenue Report</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Real-time platform earnings, daily trends, and overall financial health.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm shrink-0 min-w-[200px]">
            <p className="text-sm text-primary-foreground/70 mb-1">Total Lifetime Revenue</p>
            <p className="text-3xl font-extrabold flex items-center gap-1">
              ৳ {report.total_revenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Today's Revenue", value: report.today_revenue, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Monthly Revenue", value: report.monthly_revenue, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Total Lifetime", value: report.total_revenue, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-3xl h-full transition-all hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-xl transition-colors", stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold">৳ {stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <Card className="rounded-[2rem] border-none shadow-sm relative overflow-hidden group">
        <CardHeader className="pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold tracking-tight">Revenue Trend (Last 7 Days)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Daily income generated over the past week.</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-200">
              <TrendingUp size={16} /> Live Data
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No trend data available for the last 7 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `৳${val.toLocaleString()}`} 
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: any) => [`৳ ${Number(value).toLocaleString()}`, 'Daily Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
