"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  User,
  Banknote,
  Calendar,
  Package,
  Search,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
  id: string;
  applicant_name: string;
  email: string;
  product_name: string;
  amount: string;
  duration_months: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

type Tab = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "text-amber-600 bg-amber-50 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "text-destructive bg-destructive/5 border-destructive/20",
    icon: XCircle,
  },
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString("en-BD");
}

export default function MFIApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionModal, setActionModal] = useState<{
    id: string;
    action: "approve" | "reject";
    name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      const res = await api.get(`/mfi/applications?${params.toString()}`);
      setApplications(res.data?.data ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load applications.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplications();
  }, [fetchApplications]);

  const openActionModal = (
    id: string,
    action: "approve" | "reject",
    name: string,
  ) => {
    setActionModal({ id, action, name });
  };

  const executeAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await api.post(
        `/mfi/applications/${actionModal.id}/${actionModal.action}`,
      );
      toast.success(`Application ${actionModal.action}d successfully!`);
      fetchApplications();
      setActionModal(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || `Failed to ${actionModal.action} application.`;
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    activeColor: string;
  }[] = [
    {
      key: "all",
      label: "All",
      icon: ClipboardList,
      activeColor: "text-blue-600 bg-blue-50 border-blue-300",
    },
    {
      key: "pending",
      label: "Pending",
      icon: Clock,
      activeColor: "text-amber-600 bg-amber-50 border-amber-300",
    },
    {
      key: "approved",
      label: "Approved",
      icon: CheckCircle2,
      activeColor: "text-emerald-600 bg-emerald-50 border-emerald-300",
    },
    {
      key: "rejected",
      label: "Rejected",
      icon: XCircle,
      activeColor: "text-destructive bg-destructive/10 border-destructive/30",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── Action Confirmation Modal ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background rounded-[2rem] shadow-2xl border border-border max-w-sm w-full overflow-hidden"
            >
              <div
                className={cn(
                  "h-1.5 w-full",
                  actionModal.action === "approve"
                    ? "bg-emerald-500"
                    : "bg-destructive",
                )}
              />
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      actionModal.action === "approve"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {actionModal.action === "approve" ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <XCircle size={24} />
                    )}
                  </div>
                  <button
                    onClick={() => setActionModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight capitalize">
                    {actionModal.action} Application?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Are you sure you want to {actionModal.action} the
                    application for{" "}
                    <span className="font-bold text-foreground">
                      {actionModal.name}
                    </span>
                    ?
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-12"
                    onClick={() => setActionModal(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={
                      actionModal.action === "approve"
                        ? "default"
                        : "destructive"
                    }
                    className={cn(
                      "flex-1 rounded-xl h-12 gap-2",
                      actionModal.action === "approve" &&
                        "bg-emerald-600 hover:bg-emerald-700",
                    )}
                    onClick={executeAction}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      `Yes, ${actionModal.action}`
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div>
        <Link
          href="/mfi"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Dashboard
        </Link>

        {/* Hero Banner */}
        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                <ClipboardList size={12} /> MFI Admin
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Loan Applications
              </h1>
              <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
                Review and manage all incoming loan applications from
                entrepreneurs across the platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2 p-1.5 bg-muted rounded-2xl overflow-x-auto w-full md:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  size={16}
                  className={isActive ? tab.activeColor.split(" ")[0] : ""}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by applicant name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>

      {/* ── Content area ── */}
      <Card className="rounded-[2rem] border-none shadow-sm">
        <CardContent className="p-6 min-h-[400px]">
          {loading && applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading applications…
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle size={28} className="text-destructive" />
              </div>
              <p className="font-bold text-sm">Something went wrong</p>
              <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-xl"
                onClick={fetchApplications}
              >
                Try Again
              </Button>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-muted">
                <Search size={36} className="text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Applications Found</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                We couldn't find any applications matching your current filters
                and search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const status = STATUS_CONFIG[app.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={app.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
                  >
                    {/* Left: Avatar + Name + Meta */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        {initials(app.applicant_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {app.applicant_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {app.email}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Details grid */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 lg:flex-1 lg:justify-center px-0 lg:px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Package
                          size={13}
                          className="text-primary/60 shrink-0"
                        />
                        <span className="font-medium text-foreground">
                          {app.product_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Banknote
                          size={13}
                          className="text-primary/60 shrink-0"
                        />
                        <span className="font-semibold text-primary">
                          ৳ {formatAmount(app.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={13} className="shrink-0" />
                        <span>{app.duration_months} mo</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={13} className="shrink-0" />
                        <span>{formatDate(app.created_at)}</span>
                      </div>
                    </div>

                    {/* Right: Actions / Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      {app.status === "pending" && (
                        <div className="flex gap-2 mr-2 border-r border-border pr-5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            onClick={() =>
                              openActionModal(
                                app.id,
                                "reject",
                                app.applicant_name,
                              )
                            }
                          >
                            <X size={14} /> Reject
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() =>
                              openActionModal(
                                app.id,
                                "approve",
                                app.applicant_name,
                              )
                            }
                          >
                            <Check size={14} /> Approve
                          </Button>
                        </div>
                      )}

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                          status.className,
                        )}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>

                      <Link href={`/mfi/applications/${app.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="View Details"
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
