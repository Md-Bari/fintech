"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ReceiptText, Loader2, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Payment {
  id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  created_at: string;
  mfi_name: string;
  mfi_id: string;
  mfi_phone?: string | null;
  mfi_email?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
}

const MAX_DISPLAY_PAYMENTS = 10;
const MAX_CHART_POINTS = 120;

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchPayments = async (searchValue: string) => {
    const isFirstLoad = payments.length === 0;
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError(null);
    let timedOut = false;
    const watchdog = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      setRefreshing(false);
      setLoadError("Server is taking too long. You can retry.");
    }, 8000);

    try {
      const res = await api.get("/admin/payments", {
        params: {
          all: 1,
          search: searchValue || undefined,
        },
        timeout: 15000,
      });
      if (timedOut) return;
      const data = res.data?.data || [];
      setPayments(data);
    } catch (err) {
      if (timedOut) return;
      console.error("Failed to fetch admin payments", err);
      setPayments([]);
      setLoadError("Request timed out or failed. Please try again.");
    } finally {
      clearTimeout(watchdog);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments(search);
  }, [search]);

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const visiblePayments = useMemo(() => {
    const sorted = [...payments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted.slice(0, MAX_DISPLAY_PAYMENTS);
  }, [payments]);

  const successfulPayments = useMemo(() => payments.filter((p) => p.status === "success"), [payments]);
  const pendingPayments = useMemo(() => payments.filter((p) => p.status === "pending"), [payments]);
  const failedPayments = useMemo(() => payments.filter((p) => p.status === "failed"), [payments]);
  const totalRevenue = useMemo(
    () => successfulPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    [successfulPayments]
  );

  const pieData = [
    { name: "Success", value: successfulPayments.length, color: "#10b981" },
    { name: "Pending", value: pendingPayments.length, color: "#f59e0b" },
    { name: "Failed", value: failedPayments.length, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const areaData = [...payments]
    .slice(0, MAX_CHART_POINTS)
    .reverse()
    .map((p) => ({
    name: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: p.status === "success" ? Number(p.amount) : 0,
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <CreditCard size={12} /> Platform Revenue
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Payments</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              Monitor incoming subscription payments and revenue streams from all MFIs across the platform.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm shrink-0">
            <p className="text-sm text-primary-foreground/70 mb-1">Total Generated Revenue</p>
            <p className="text-3xl font-extrabold">BDT {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by transaction ID, name, mfi/user ID, phone, or email"
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
          <p className="text-xs text-muted-foreground mt-2">Showing latest {MAX_DISPLAY_PAYMENTS} transactions{search ? ` for "${search}"` : ""}. Insights are calculated from all matched transactions.</p>
          {refreshing ? <p className="text-xs text-muted-foreground mt-1">Refreshing data...</p> : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payment data...</p>
        </div>
      ) : loadError ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ReceiptText size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">Couldn&apos;t Load Payments</p>
            <p className="text-sm text-muted-foreground max-w-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => fetchPayments(search)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : visiblePayments.length === 0 ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ReceiptText size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No Payments Found</p>
            <p className="text-sm text-muted-foreground max-w-xs">No recent payments matched your search.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">{payments.length.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Successful Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold">BDT {totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Transaction Health</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Revenue Timeline</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmountAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(val) => `?${val}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value) => [`?${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountAdmin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 mb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-extrabold tracking-tight">Global Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-4 font-bold pl-4">Transaction ID</th>
                      <th className="pb-4 font-bold">Institution</th>
                      <th className="pb-4 font-bold">Contact</th>
                      <th className="pb-4 font-bold">Date</th>
                      <th className="pb-4 font-bold">Amount</th>
                      <th className="pb-4 font-bold text-right pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visiblePayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 pl-4">
                          <p className="font-mono text-xs font-bold text-foreground">{payment.id.toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">MFI: {payment.mfi_id}</p>
                        </td>
                        <td className="py-4">
                          <p className="font-bold text-sm">{payment.mfi_name}</p>
                          {payment.owner_name ? <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {payment.owner_name}</p> : null}
                        </td>
                        <td className="py-4">
                          <p className="text-xs">{payment.owner_phone || payment.mfi_phone || "-"}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{payment.owner_email || payment.mfi_email || "-"}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-medium">{new Date(payment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(payment.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="py-4 text-sm font-extrabold whitespace-nowrap text-primary">BDT {Number(payment.amount).toLocaleString()}</td>
                        <td className="py-4 text-right pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ml-auto",
                              payment.status === "success"
                                ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                                : payment.status === "failed"
                                ? "text-destructive bg-destructive/10 border-destructive/20"
                                : "text-amber-600 bg-amber-50 border-amber-200"
                            )}
                          >
                            {payment.status === "success" && <CheckCircle2 size={12} />}
                            {payment.status === "failed" && <XCircle size={12} />}
                            {payment.status === "pending" && <Clock size={12} />}
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {visiblePayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="font-mono text-xs font-bold break-all">{payment.id.toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">MFI: {payment.mfi_id}</p>
                    <p className="font-semibold text-sm mt-2">{payment.mfi_name}</p>
                    {payment.owner_name ? <p className="text-[11px] text-muted-foreground">Owner: {payment.owner_name}</p> : null}
                    <p className="text-xs mt-2">{payment.owner_phone || payment.mfi_phone || "-"}</p>
                    <p className="text-[11px] text-muted-foreground">{payment.owner_email || payment.mfi_email || "-"}</p>
                    <p className="text-xs mt-2">{new Date(payment.created_at).toLocaleString()}</p>
                    <p className="text-sm font-extrabold whitespace-nowrap text-primary mt-2">BDT {Number(payment.amount).toLocaleString()}</p>
                    <div className="mt-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          payment.status === "success"
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                            : payment.status === "failed"
                            ? "text-destructive bg-destructive/10 border-destructive/20"
                            : "text-amber-600 bg-amber-50 border-amber-200"
                        )}
                      >
                        {payment.status === "success" && <CheckCircle2 size={12} />}
                        {payment.status === "failed" && <XCircle size={12} />}
                        {payment.status === "pending" && <Clock size={12} />}
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
