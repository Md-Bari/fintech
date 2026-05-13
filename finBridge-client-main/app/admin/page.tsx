"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Landmark, CreditCard, Loader2, DollarSign, Activity, FileText } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface DashboardData {
  total_mfis: number;
  active_mfis: number;
  total_users: number;
  total_loans: number;
  total_revenue: number;
  active_subscriptions: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data?.data || null);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
            <p className="text-muted-foreground">Global overview and platform health.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading platform analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const inactiveMfis = data.total_mfis - data.active_mfis;

  const pieData = [
    { name: "Active MFIs", value: data.active_mfis, color: "#10b981" },
    { name: "Inactive MFIs", value: inactiveMfis > 0 ? inactiveMfis : 0, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  const barData = [
    { name: "Entrepreneurs", count: data.total_users, fill: "#3b82f6" },
    { name: "MFIs", count: data.total_mfis, fill: "#10b981" },
    { name: "Loan Prods", count: data.total_loans, fill: "#f59e0b" },
    { name: "Active Subs", count: data.active_subscriptions, fill: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Area */}
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Activity size={12} />
              Super Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Platform Overview</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Monitor global platform metrics, user growth, and revenue generation.
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

      {/* Main Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Users", value: data.total_users.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active MFIs", value: data.active_mfis.toLocaleString(), icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Total Revenue", value: `৳${data.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Active Subs", value: data.active_subscriptions.toLocaleString(), icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2 relative overflow-hidden group">
          <CardHeader>
            <CardTitle className="text-xl font-extrabold tracking-tight">Platform Scale Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: any) => [Number(value).toLocaleString(), 'Count']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1 relative overflow-hidden group">
          <CardHeader>
            <CardTitle className="text-xl font-extrabold tracking-tight">MFI Health</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden group">
          <div className="p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Global Loan Products</p>
              <h3 className="text-4xl font-extrabold mt-1">{data.total_loans.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground mt-2">Total financial products listed across all MFIs</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden group">
          <div className="p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Landmark size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Registered MFIs</p>
              <h3 className="text-4xl font-extrabold mt-1">{data.total_mfis.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground mt-2">Institutions currently onboarded to finBridge</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
