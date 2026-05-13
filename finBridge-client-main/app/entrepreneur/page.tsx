"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Landmark,
  Calendar,
  Loader2,
  Activity
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Application {
  id: string;
  product_name: string;
  mfi_name: string;
  amount: string;
  duration_months: number;
  status: string;
  created_at: string;
}

export default function EntrepreneurDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/entrepreneur/applications")
      .then((res) => setApplications(res.data?.data || []))
      .catch((err) => console.error("Failed to fetch applications", err))
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = applications.filter((a) => a.status.toLowerCase() === "pending").length;
  const approvedCount = applications.filter((a) => a.status.toLowerCase() === "approved").length;
  const rejectedCount = applications.filter((a) => a.status.toLowerCase() === "rejected").length;

  const pieData = [
    { name: "Approved", value: approvedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#f59e0b" },
    { name: "Rejected", value: rejectedCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const barData = [...applications].reverse().map(app => ({
    name: new Date(app.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
    amount: Number(app.amount),
    product: app.product_name,
  }));

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
              Entrepreneur Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Overview</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Track your loan applications, manage your profile, and discover new funding opportunities.
            </p>
          </div>
          <Link href="/loans" className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto gap-2 rounded-xl h-12 px-6 bg-white text-primary hover:bg-white/90 font-bold shadow-lg">
              <PlusCircle size={20} />
              Apply for New Loan
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Applications", value: applications.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
              { title: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { title: "Approved Loans", value: approvedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "Rejected", value: rejectedCount, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm rounded-3xl h-full transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                        <stat.icon size={20} />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-extrabold">{stat.value}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          {applications.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-extrabold tracking-tight">Application Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
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

              <Card className="rounded-[2rem] border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-extrabold tracking-tight">Requested Amounts History</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val}`} width={80} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Applications List */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold tracking-tight">Your Applications</h2>

            {applications.length === 0 ? (
              <Card className="rounded-[2rem] border-none shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText size={28} className="text-muted-foreground" />
                  </div>
                  <p className="font-bold">No applications found</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You haven&apos;t applied for any loans yet. Browse available products to get started.
                  </p>
                  <Link href="/loans">
                    <Button className="rounded-xl mt-2 gap-2 shadow-lg shadow-primary/20">
                      <PlusCircle size={16} /> Explore Loans
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <Card key={app.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        {/* Primary Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Landmark size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              {app.mfi_name}
                            </p>
                            <h3 className="text-lg font-bold leading-tight">{app.product_name}</h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <Clock size={12} />
                              Applied on {new Date(app.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Financials & Status */}
                        <div className="flex flex-wrap items-center gap-6 md:justify-end">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium text-right">Requested Amount</p>
                            <p className="text-xl font-extrabold text-primary">৳{Number(app.amount).toLocaleString()}</p>
                          </div>
                          
                          <div className="w-px h-10 bg-border hidden md:block" />
                          
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium text-right">Duration</p>
                            <p className="text-sm font-bold flex items-center justify-end gap-1.5">
                              <Calendar size={14} className="text-muted-foreground" />
                              {app.duration_months} mo
                            </p>
                          </div>

                          <div className="w-px h-10 bg-border hidden md:block" />

                          <div>
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
                              app.status.toLowerCase() === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              app.status.toLowerCase() === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                              {app.status.toLowerCase() === "approved" && <CheckCircle size={14} />}
                              {app.status.toLowerCase() === "rejected" && <XCircle size={14} />}
                              {app.status.toLowerCase() === "pending" && <Clock size={14} />}
                              {app.status}
                            </span>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
