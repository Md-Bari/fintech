"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, Loader2, CheckCircle2, Clock, XCircle, Search, Landmark } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

interface Application {
  id: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  borrower_name: string;
  mfi_name: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/admin/applications");
        const data = res.data?.data || [];
        setApplications(data);
      } catch (err) {
        console.error("Failed to fetch admin applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filteredApps = applications.filter(app => 
    app.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.mfi_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedCount = applications.filter(a => a.status === "approved").length;
  const pendingCount = applications.filter(a => a.status === "pending").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;
  const totalVolume = applications.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Status Distribution Chart
  const pieData = [
    { name: "Approved", value: approvedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#f59e0b" },
    { name: "Rejected", value: rejectedCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Top MFIs by Application Count (Top 5)
  const mfiCounts: Record<string, number> = {};
  applications.forEach(app => {
    mfiCounts[app.mfi_name] = (mfiCounts[app.mfi_name] || 0) + 1;
  });
  
  const barData = Object.entries(mfiCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <ClipboardList size={12} /> Platform Oversight
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Loan Applications</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Monitor loan applications across all registered microfinance institutions.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm shrink-0 min-w-[200px]">
            <p className="text-sm text-primary-foreground/70 mb-1">Total Requested Volume</p>
            <p className="text-3xl font-extrabold">৳ {totalVolume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading applications data…</p>
        </div>
      ) : applications.length === 0 ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No Applications Found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              No loan applications have been submitted on the platform yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Global Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
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

            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Top MFIs by Application Volume</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value: any) => [value, 'Applications']}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="rounded-[2rem] border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl font-extrabold tracking-tight">Application Ledger</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search borrower or MFI..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-4 font-bold pl-4">Application ID</th>
                      <th className="pb-4 font-bold">Borrower</th>
                      <th className="pb-4 font-bold">Institution (MFI)</th>
                      <th className="pb-4 font-bold">Requested</th>
                      <th className="pb-4 font-bold text-right pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground">
                          No matching applications found.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app, i) => (
                        <motion.tr 
                          key={app.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 pl-4">
                            <p className="font-mono text-xs font-bold text-foreground">{app.id.slice(0,8).toUpperCase()}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(app.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </td>
                          <td className="py-4">
                            <p className="font-bold text-sm">{app.borrower_name}</p>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1.5">
                              <Landmark size={14} className="text-primary/60" />
                              <span className="text-sm font-medium">{app.mfi_name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-extrabold text-primary whitespace-nowrap">
                            ৳ {Number(app.amount).toLocaleString()}
                          </td>
                          <td className="py-4 text-right pr-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ml-auto",
                              app.status === "approved" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                              app.status === "rejected" ? "text-destructive bg-destructive/10 border-destructive/20" :
                              "text-amber-600 bg-amber-50 border-amber-200"
                            )}>
                              {app.status === "approved" && <CheckCircle2 size={12} />}
                              {app.status === "rejected" && <XCircle size={12} />}
                              {app.status === "pending" && <Clock size={12} />}
                              {app.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
