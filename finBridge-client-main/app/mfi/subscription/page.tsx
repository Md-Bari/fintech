"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Loader2, XCircle, Calendar, CreditCard, Zap, CheckCircle2, ArrowLeft, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SubscriptionFeatures {
  can_create_loan_products: boolean;
  priority_listing: boolean;
  analytics_dashboard: boolean;
  more_features_coming: boolean;
}

interface SubscriptionLimits {
  max_approvals: string | number;
  max_products: string | number;
}

interface SubscriptionUsage {
  approved_loans: number;
  loan_products: number;
}

interface SubscriptionPayment {
  status: string | null;
  amount: number | null;
}

interface Subscription {
  subscription_id: string;
  plan_name: string;
  price_bdt: number;
  status: string;
  start_date: string;
  end_date: string;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  payment: SubscriptionPayment;
}

const FEATURE_LABELS: Record<keyof SubscriptionFeatures, string> = {
  can_create_loan_products: "Create Loan Products",
  priority_listing: "Priority Listing",
  analytics_dashboard: "Analytics Dashboard",
  more_features_coming: "More Features Coming Soon",
};

function planLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function daysLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function MFISubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/mfi/subscription")
      .then((res) => setSub(res.data?.data ?? null))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to load subscription.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const remaining = sub ? daysLeft(sub.end_date) : 0;
  const totalDays = sub
    ? Math.ceil((new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const progress = sub ? Math.min(100, Math.max(0, Math.round(((totalDays - remaining) / totalDays) * 100))) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/mfi" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                <BadgeCheck size={12} />
                MFI Admin
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">My Subscription</h1>
              <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
                View your current plan, active features, limits, and subscription period.
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <CreditCard size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading subscription…</p>
        </div>
      ) : error ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle size={28} className="text-destructive" />
            </div>
            <p className="font-bold">Could not load subscription</p>
            <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
            <Button variant="outline" size="sm" className="rounded-xl mt-2" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : !sub ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CreditCard size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No active subscription</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              You don&apos;t have an active subscription. Visit our plans page to get started.
            </p>
            <Link href="/#plans">
              <Button className="rounded-xl mt-2 gap-2 shadow-lg shadow-primary/20">
                <Zap size={16} /> View Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main subscription card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary/40" />
              <CardContent className="p-8 space-y-6">
                {/* Plan name + status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Current Plan</p>
                    <h2 className="text-3xl font-extrabold tracking-tight">{planLabel(sub.plan_name)}</h2>
                  </div>
                  <span className={cn(
                    "self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                    sub.status === "active"
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                      : "text-amber-600 bg-amber-50 border-amber-200"
                  )}>
                    <BadgeCheck size={13} />
                    {sub.status}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 pb-4 border-b border-border">
                  <span className="text-xl font-bold text-muted-foreground">৳</span>
                  <span className="text-4xl font-extrabold text-primary">{sub.price_bdt.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground mb-1.5">/month</span>
                </div>

                {/* Payment Info */}
                {sub.payment.amount !== null ? (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Last Payment</p>
                        <p className="font-bold text-sm">
                          ৳{sub.payment.amount.toLocaleString()} <span className="text-muted-foreground font-normal capitalize">({sub.payment.status})</span>
                        </p>
                      </div>
                    </div>
                    {sub.payment.status === "success" && (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                        Paid
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Payment Info</p>
                        <p className="font-bold text-sm">Free Trial Active</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Start Date", value: formatDate(sub.start_date), icon: Calendar },
                    { label: "End Date", value: formatDate(sub.end_date), icon: Calendar },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-4 rounded-2xl bg-muted/40 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Icon size={13} />
                        {label}
                      </div>
                      <p className="font-bold text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Subscription period</span>
                    <span className="font-bold text-primary">{remaining} days remaining</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{progress}% of billing period used</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription ID */}
            <div className="px-2">
              <p className="text-xs text-muted-foreground">Subscription ID</p>
              <p className="font-mono text-xs text-foreground/70">{sub.subscription_id}</p>
            </div>
          </div>

          {/* Right Column: Limits, Usage, Features */}
          <div className="space-y-6">
            
            {/* Usage & Limits */}
            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-primary" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Usage & Limits</p>
                </div>
                
                <div className="space-y-5">
                  {/* Approved Loans */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Approved Loans</span>
                      <span className="font-bold">
                        {sub.usage.approved_loans} / {sub.limits.max_approvals === "unlimited" ? "∞" : sub.limits.max_approvals}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: sub.limits.max_approvals === "unlimited" ? "0%" : `${Math.min(100, (sub.usage.approved_loans / (Number(sub.limits.max_approvals) || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Loan Products */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Loan Products</span>
                      <span className="font-bold">
                        {sub.usage.loan_products} / {sub.limits.max_products === "unlimited" ? "∞" : sub.limits.max_products}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: sub.limits.max_products === "unlimited" ? "0%" : `${Math.min(100, (sub.usage.loan_products / (Number(sub.limits.max_products) || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features panel */}
            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-primary" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Plan Features</p>
                </div>
                <div className="space-y-3">
                  {(Object.keys(sub.features) as (keyof SubscriptionFeatures)[]).map((key) => {
                    const enabled = sub.features[key];
                    return (
                      <div key={key} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors",
                        enabled ? "bg-primary/5" : "opacity-40"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-sm font-medium">{FEATURE_LABELS[key]}</span>
                        {!enabled && (
                          <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border">
                  <Link href="/#plans" className="w-full">
                    <Button variant="outline" className="w-full rounded-xl gap-2 h-11">
                      <Zap size={16} />
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
