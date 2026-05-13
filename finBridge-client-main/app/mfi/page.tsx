"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, FileText, Landmark, UserCheck, ClipboardList, Clock, CheckCircle2, XCircle, Lock, Crown } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Application {
  id: string;
  applicant_name: string;
  product_name: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface Product {
  id: string;
  status: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MFIDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("trial");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, prodRes, subRes] = await Promise.all([
          api.get("/mfi/applications").catch(() => null),
          api.get("/mfi/loan-products").catch(() => null),
          api.get("/mfi/subscription").catch(() => null) // Catch safely in case it fails
        ]);
        
        const apps = (appRes?.data?.data || []).sort((a: Application, b: Application) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setApplications(apps);
        setProducts(prodRes?.data?.data || []);
        
        if (subRes && subRes.data?.data?.plan_name) {
          setSubscriptionPlan(subRes.data.data.plan_name.toLowerCase());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalApplicants = applications.length;
  const pendingReview = applications.filter(a => a.status === "pending").length;
  const approved = applications.filter(a => a.status === "approved").length;
  const rejected = applications.filter(a => a.status === "rejected").length;
  const activeProducts = products.filter(p => p.status === "active").length;
  const disbursalRate = totalApplicants > 0 ? Math.round((approved / totalApplicants) * 100) : 0;

  const recentApps = applications.slice(0, 5);

  // Chart Data Preparation
  const pieData = [
    { name: "Approved", value: approved, color: "#10b981" },
    { name: "Pending", value: pendingReview, color: "#f59e0b" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
  ];

  const barData = [
    { name: "Approved", count: approved, fill: "#10b981" },
    { name: "Pending", count: pendingReview, fill: "#f59e0b" },
    { name: "Rejected", count: rejected, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MFI Management</h1>
          <p className="text-muted-foreground">Monitor your loan products and application pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/mfi/loan-products">
            <Button className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
              <Landmark size={20} />
              Manage Loan Products
            </Button>
          </Link>
          <Link href="/mfi/applications">
            <Button variant="outline" className="gap-2 rounded-xl h-12 px-6">
              <ClipboardList size={20} />
              View Applications
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <>
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
          <Card className="rounded-[2rem] border-none shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded w-full" />
              ))}
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Top Analytics Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Applications", value: totalApplicants.toLocaleString(), icon: UserCheck, color: "text-primary", bg: "bg-primary/10" },
              { title: "Pending Review", value: pendingReview.toLocaleString(), icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
              { title: "Active Products", value: activeProducts.toLocaleString(), icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "Disbursal Rate", value: `${disbursalRate}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm rounded-3xl h-full transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={cn("p-2 rounded-xl", stat.bg)}>
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
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold tracking-tight">Application Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {subscriptionPlan !== "pro" ? (
                  <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/50 flex flex-col items-center justify-center p-6 text-center border border-primary/20 rounded-[2rem]">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Lock size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Crown size={20} className="text-amber-500" /> Pro Feature</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mb-6">Unlock deep analytics and data visualizations by upgrading to the Pro plan.</p>
                    <Link href="/mfi/subscription">
                      <Button className="rounded-xl shadow-lg gap-2">Upgrade Now</Button>
                    </Link>
                  </div>
                ) : null}
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

            <Card className="rounded-[2rem] border-none shadow-sm relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold tracking-tight">Application Volume Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {subscriptionPlan !== "pro" ? (
                  <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/50 flex flex-col items-center justify-center p-6 text-center border border-primary/20 rounded-[2rem]">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Lock size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Crown size={20} className="text-amber-500" /> Pro Feature</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mb-6">Unlock deep analytics and data visualizations by upgrading to the Pro plan.</p>
                    <Link href="/mfi/subscription">
                      <Button className="rounded-xl shadow-lg gap-2">Upgrade Now</Button>
                    </Link>
                  </div>
                ) : null}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 mb-6">
              <CardTitle className="text-xl font-extrabold tracking-tight">Recent Applications Pipeline</CardTitle>
              <Link href="/mfi/applications">
                <Button variant="outline" size="sm" className="rounded-xl">View Full Pipeline</Button>
              </Link>
            </CardHeader>
            <CardContent className="px-0">
              {recentApps.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No recent applications found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4 font-bold pl-4">Applicant</th>
                        <th className="pb-4 font-bold">Product</th>
                        <th className="pb-4 font-bold">Amount</th>
                        <th className="pb-4 font-bold">Status</th>
                        <th className="pb-4 font-bold text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentApps.map((app) => (
                        <tr key={app.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                {initials(app.applicant_name)}
                              </div>
                              <div>
                                <p className="font-bold text-sm truncate max-w-[150px] sm:max-w-xs">{app.applicant_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">ID: #{app.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-xs">
                            {app.product_name}
                          </td>
                          <td className="py-4 text-sm font-extrabold text-primary whitespace-nowrap">
                            ৳ {Number(app.amount).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                              app.status === "approved" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                              app.status === "rejected" ? "text-destructive bg-destructive/10 border-destructive/20" :
                              "text-amber-600 bg-amber-50 border-amber-200"
                            )}>
                              {app.status === "approved" && <CheckCircle2 size={10} />}
                              {app.status === "rejected" && <XCircle size={10} />}
                              {app.status === "pending" && <Clock size={10} />}
                              {app.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-4">
                            <Link href={`/mfi/applications/${app.id}`}>
                              <Button variant="ghost" size="sm" className="font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                                Review
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
