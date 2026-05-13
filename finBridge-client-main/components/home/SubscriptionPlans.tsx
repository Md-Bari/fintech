"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
  X,
  CreditCard,
  Calendar,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price_bdt: number;
}

interface PlanDetail {
  id: string;
  name: string;
  price_bdt: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const PLAN_META: Record<string, { badge?: string; features: string[]; highlight: boolean }> = {
  trial: {
    features: [
      "Access to all loan listings",
      "1 active loan application",
      "Basic profile page",
      "Email support",
    ],
    highlight: false,
  },
  pro: {
    badge: "Most Popular",
    features: [
      "Everything in Trial",
      "Unlimited loan applications",
      "Priority matching with MFIs",
      "Advanced analytics dashboard",
      "Dedicated account support",
    ],
    highlight: true,
  },
};

function planLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
}

function getPlanMeta(name: string) {
  return (
    PLAN_META[name.toLowerCase()] ?? {
      features: ["Full platform access", "Priority support"],
      highlight: false,
    }
  );
}

// ── Plan Detail + Pay Modal ────────────────────────────────────────────────
function PlanModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [paying, setPaying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .get(`/subscription-plans/${plan.id}`)
      .then((res) => setDetail(res.data?.data ?? null))
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [plan.id]);

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await api.post("/subscription/subscribe", { plan_id: plan.id });
      // Backend may return a payment URL for SSL Commerz redirect
      const paymentUrl = res.data?.data?.payment_url ?? res.data?.payment_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.success("Subscription initiated successfully!");
        onClose();
        router.push("/mfi/subscription");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to initiate payment. Please try again.";
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-background rounded-[2rem] shadow-2xl border border-border max-w-md w-full overflow-hidden"
      >
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary/40" />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Plan Details
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {planLabel(plan.name)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <X size={20} />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : detail ? (
            <>
              {/* Price */}
              <div className="flex items-end gap-1 pb-4 border-b border-border">
                <span className="text-xl font-bold">৳</span>
                <span className="text-5xl font-extrabold">
                  {detail.price_bdt.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground mb-2">/month</span>
              </div>

              {/* Detail rows */}
              <div className="space-y-3">
                {[
                  { icon: BadgeCheck, label: "Status", value: detail.status, valueClass: "capitalize text-emerald-600 font-bold" },
                  { icon: Calendar, label: "Created", value: new Date(detail.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), valueClass: "" },
                  { icon: CreditCard, label: "Plan ID", value: detail.id.slice(0, 16) + "…", valueClass: "font-mono text-xs" },
                ].map(({ icon: Icon, label, value, valueClass }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon size={15} className="text-primary/60" />
                      {label}
                    </div>
                    <span className={cn("text-sm font-semibold", valueClass)}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Features from meta */}
              <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  What&apos;s included
                </p>
                {getPlanMeta(plan.name).features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Pay Now */}
              <Button
                className="w-full h-12 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20"
                onClick={handlePayNow}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay Now — ৳{detail.price_bdt.toLocaleString()}
                  </>
                )}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Could not load plan details.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Section ───────────────────────────────────────────────────────────
export default function SubscriptionPlans() {
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    api
      .get("/subscription-plans")
      .then((res) => setPlans(res.data?.data ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const isMfiAdmin = isMounted && isAuthenticated && user?.role?.toUpperCase() === "MFI_ADMIN";
  const isLoggedIn = isMounted && isAuthenticated;
  const isOtherRole = isLoggedIn && !isMfiAdmin;

  // Resolve CTA behaviour for each plan
  const getCta = (plan: Plan) => {
    const isFree = plan.price_bdt === 0;

    if (!isMounted) {
      // SSR skeleton — disabled
      return { label: isFree ? "Get Started Free" : `Get ${planLabel(plan.name)}`, disabled: true, onClick: undefined };
    }

    if (isMfiAdmin) {
      if (isFree) {
        // Trial auto-started on registration
        return { label: "Trial Active on Sign-up", disabled: true, onClick: undefined };
      }
      // Paid plan — open detail/pay modal
      return {
        label: `Get ${planLabel(plan.name)}`,
        disabled: false,
        onClick: () => setSelectedPlan(plan),
      };
    }

    if (isOtherRole) {
      // Other roles — all disabled
      return { label: isFree ? "MFI Admins Only" : `MFI Admins Only`, disabled: true, onClick: undefined };
    }

    // Not logged in — redirect to MFI registration
    return {
      label: isFree ? "Get Started Free" : `MFI Admins Only`,
      disabled: !isFree,
      onClick: isFree ? () => router.push("/register/mfi") : undefined,
    };
  };

  return (
    <>
      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
        )}
      </AnimatePresence>

      <section id="plans" className="py-24 px-4 bg-muted/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
              <Sparkles size={16} />
              Subscription Plans
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your journey. Start for free, upgrade when you&apos;re ready.
            </p>
            {/* Role hint */}
            {isMounted && isOtherRole && (
              <p className="text-sm text-muted-foreground bg-muted/60 border border-border inline-flex items-center gap-2 px-4 py-2 rounded-full">
                <BadgeCheck size={15} className="text-primary" />
                Subscription plans are available for MFI Admin accounts only.
              </p>
            )}
            {isMounted && !isLoggedIn && (
              <p className="text-sm text-muted-foreground bg-muted/60 border border-border inline-flex items-center gap-2 px-4 py-2 rounded-full">
                <ArrowRight size={15} className="text-primary" />
                Register as an MFI Institution to get started.
              </p>
            )}
          </motion.div>

          {/* Plans Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={36} className="animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No plans available at the moment.
            </p>
          ) : (
            <div
              className={cn(
                "grid gap-8 mx-auto",
                plans.length === 1
                  ? "max-w-sm"
                  : plans.length === 2
                  ? "md:grid-cols-2 max-w-3xl"
                  : "md:grid-cols-3 max-w-5xl"
              )}
            >
              {plans.map((plan, i) => {
                const meta = getPlanMeta(plan.name);
                const cta = getCta(plan);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                      "relative rounded-[2rem] p-8 flex flex-col gap-8 border transition-all duration-300",
                      meta.highlight
                        ? "bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-[1.02]"
                        : "bg-background border-border shadow-sm hover:shadow-md hover:border-primary/30"
                    )}
                  >
                    {/* Popular badge */}
                    {meta.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-lg">
                          <Zap size={12} />
                          {meta.badge}
                        </span>
                      </div>
                    )}

                    {/* Plan name & price */}
                    <div className="space-y-3">
                      <p
                        className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          meta.highlight ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}
                      >
                        {planLabel(plan.name)}
                      </p>
                      <div className="flex items-end gap-1">
                        {plan.price_bdt === 0 ? (
                          <span className="text-5xl font-extrabold">Free</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold mt-2">৳</span>
                            <span className="text-5xl font-extrabold">
                              {plan.price_bdt.toLocaleString()}
                            </span>
                            <span
                              className={cn(
                                "text-sm mb-2",
                                meta.highlight
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground"
                              )}
                            >
                              /mo
                            </span>
                          </>
                        )}
                      </div>
                      {plan.price_bdt === 0 && (
                        <p
                          className={cn(
                            "text-sm",
                            meta.highlight
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground"
                          )}
                        >
                          No credit card required
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div
                      className={cn(
                        "border-t",
                        meta.highlight ? "border-primary-foreground/20" : "border-border"
                      )}
                    />

                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {meta.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-3 text-sm">
                          <CheckCircle2
                            size={17}
                            className={cn(
                              "mt-0.5 shrink-0",
                              meta.highlight
                                ? "text-primary-foreground/80"
                                : "text-primary"
                            )}
                          />
                          <span
                            className={
                              meta.highlight ? "text-primary-foreground/90" : ""
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      size="lg"
                      className={cn(
                        "w-full h-12 rounded-xl font-semibold",
                        meta.highlight
                          ? "bg-white text-primary hover:bg-white/90 disabled:bg-white/50"
                          : "shadow-lg shadow-primary/20"
                      )}
                      disabled={cta.disabled}
                      onClick={cta.onClick}
                      aria-label={cta.label}
                    >
                      {cta.label}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
