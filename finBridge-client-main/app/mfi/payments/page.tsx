"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ReceiptText, Loader2, CheckCircle2, Clock, XCircle, FileText, Search } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Payment {
  id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  payment_gateway: string;
  created_at: string;
  plan_name: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("/mfi/payments");
        const data = res.data?.data || [];
        setPayments(data);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const filteredPayments = sortedPayments.filter((p) => {
    if (!normalizedSearch) return true;
    return (
      p.id.toLowerCase().includes(normalizedSearch) ||
      p.plan_name.toLowerCase().includes(normalizedSearch) ||
      p.payment_gateway.toLowerCase().includes(normalizedSearch) ||
      p.status.toLowerCase().includes(normalizedSearch)
    );
  });
  const visiblePayments = filteredPayments.slice(0, 10);

  const successfulPayments = visiblePayments.filter(p => p.status === "success");
  const pendingPayments = visiblePayments.filter(p => p.status === "pending");
  const failedPayments = visiblePayments.filter(p => p.status === "failed");
  const totalSpent = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Status Distribution Chart Data
  const pieData = [
    { name: "Success", value: successfulPayments.length, color: "#10b981" },
    { name: "Pending", value: pendingPayments.length, color: "#f59e0b" },
    { name: "Failed", value: failedPayments.length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Spend Over Time Chart Data (group by date)
  const areaData = [...visiblePayments].reverse().map(p => ({
    name: new Date(p.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
    amount: p.status === "success" ? p.amount : 0,
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <CreditCard size={12} /> Billing & Payments
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Payment History</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Review your subscription payments, download invoices, and track your financial history.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm shrink-0">
            <p className="text-sm text-primary-foreground/70 mb-1">Total Lifetime Spend</p>
            <p className="text-3xl font-extrabold">৳ {totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payment history…</p>
        </div>
      ) : visiblePayments.length === 0 ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ReceiptText size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No Payments Found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              No recent payments matched your search.
            </p>
            <Link href="/mfi/subscription">
              <Button className="rounded-xl mt-2 gap-2 shadow-lg shadow-primary/20">
                View Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput);
                }}
                className="flex flex-col md:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by transaction ID, plan, gateway, or status"
                    className="w-full h-11 rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="h-11 px-4 rounded-xl border border-input text-sm font-semibold"
                >
                  Clear
                </button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Showing latest 10 transactions{search ? ` for "${search}"` : ""}.
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Transaction Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
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
                <CardTitle className="text-lg font-bold">Successful Payments Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="rounded-[2rem] border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-xl font-extrabold tracking-tight">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-4 font-bold pl-4">Transaction ID</th>
                      <th className="pb-4 font-bold">Date</th>
                      <th className="pb-4 font-bold">Plan</th>
                      <th className="pb-4 font-bold">Amount</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold text-right pr-4">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visiblePayments.map((payment, i) => (
                      <motion.tr 
                        key={payment.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 pl-4">
                          <p className="font-mono text-xs font-bold text-foreground">{payment.id.toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{payment.payment_gateway}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-medium">{new Date(payment.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(payment.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            {payment.plan_name}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-extrabold whitespace-nowrap">
                          ৳ {payment.amount.toLocaleString()}
                        </td>
                        <td className="py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                            payment.status === "success" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                            payment.status === "failed" ? "text-destructive bg-destructive/10 border-destructive/20" :
                            "text-amber-600 bg-amber-50 border-amber-200"
                          )}>
                            {payment.status === "success" && <CheckCircle2 size={12} />}
                            {payment.status === "failed" && <XCircle size={12} />}
                            {payment.status === "pending" && <Clock size={12} />}
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-4">
                          {payment.status === "success" ? (
                            <Link href={`/mfi/invoice/${payment.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="View Invoice">
                                <FileText size={16} />
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">N/A</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {visiblePayments.map((payment, i) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="font-mono text-xs font-bold break-all">{payment.id.toUpperCase()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 capitalize">{payment.payment_gateway}</p>
                    <p className="text-xs mt-2">{new Date(payment.created_at).toLocaleString()}</p>
                    <p className="text-xs mt-1">{payment.plan_name}</p>
                    <p className="text-sm font-extrabold mt-1">৳ {payment.amount.toLocaleString()}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        payment.status === "success" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                        payment.status === "failed" ? "text-destructive bg-destructive/10 border-destructive/20" :
                        "text-amber-600 bg-amber-50 border-amber-200"
                      )}>
                        {payment.status === "success" && <CheckCircle2 size={12} />}
                        {payment.status === "failed" && <XCircle size={12} />}
                        {payment.status === "pending" && <Clock size={12} />}
                        {payment.status}
                      </span>
                      {payment.status === "success" ? (
                        <Link href={`/mfi/invoice/${payment.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="View Invoice">
                            <FileText size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">N/A</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
