"use client";

import React, { useEffect, useState, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  User,
  Banknote,
  Calendar,
  Package,
  FileText,
  Mail,
  FileSearch,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
  type: string;
  file_path: string;
  url: string;
}

interface ApplicationDetails {
  application: {
    id: string;
    applicant_name: string;
    email: string;
    product_name: string;
    amount: string;
    duration_months: number;
    purpose: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
  };
  documents: Document[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", className: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "text-destructive bg-destructive/5 border-destructive/20", icon: XCircle },
} as const;

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString("en-BD");
}

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionModal, setActionModal] = useState<{ id: string; action: "approve" | "reject"; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/mfi/applications/${id}`);
      setDetails(res.data?.data ?? null);
      setError(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to load application details.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openActionModal = (action: "approve" | "reject") => {
    if (!details) return;
    setActionModal({ id: details.application.id, action, name: details.application.applicant_name });
  };

  const executeAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await api.post(`/mfi/applications/${actionModal.id}/${actionModal.action}`);
      toast.success(`Application ${actionModal.action}d successfully!`);
      fetchDetails();
      setActionModal(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${actionModal.action} application.`;
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

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
              <div className={cn("h-1.5 w-full", actionModal.action === "approve" ? "bg-emerald-500" : "bg-destructive")} />
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", actionModal.action === "approve" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive")}>
                    {actionModal.action === "approve" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <button onClick={() => setActionModal(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold tracking-tight capitalize">{actionModal.action} Application?</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Are you sure you want to {actionModal.action} the application for <span className="font-bold text-foreground">{actionModal.name}</span>?
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setActionModal(null)} disabled={actionLoading}>
                    Cancel
                  </Button>
                  <Button 
                    variant={actionModal.action === "approve" ? "default" : "destructive"} 
                    className={cn("flex-1 rounded-xl h-12 gap-2", actionModal.action === "approve" && "bg-emerald-600 hover:bg-emerald-700")} 
                    onClick={executeAction} 
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : `Yes, ${actionModal.action}`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div>
        <Link href="/mfi/applications" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Applications
        </Link>

        {/* Hero Banner */}
        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                <FileSearch size={12} /> Application Details
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Review Application</h1>
              <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
                Review the entrepreneur's details, financials, and submitted documents.
              </p>
            </div>
            {details && details.application.status === "pending" && (
              <div className="flex gap-3 shrink-0 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 md:flex-none h-12 px-6 rounded-xl"
                  onClick={() => openActionModal("reject")}
                >
                  <X size={16} className="mr-2" /> Reject
                </Button>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent flex-1 md:flex-none h-12 px-6 rounded-xl shadow-lg"
                  onClick={() => openActionModal("approve")}
                >
                  <Check size={16} className="mr-2" /> Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading application details…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle size={28} className="text-destructive" />
          </div>
          <p className="font-bold text-sm">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
          <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={fetchDetails}>
            Try Again
          </Button>
        </div>
      ) : details ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/40" />
              <CardContent className="p-8 space-y-8">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center">
                      {initials(details.application.applicant_name)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{details.application.applicant_name}</h2>
                      <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
                        <Mail size={14} /> {details.application.email}
                      </p>
                    </div>
                  </div>
                  
                  {(() => {
                    const status = STATUS_CONFIG[details.application.status];
                    const StatusIcon = status.icon;
                    return (
                      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold uppercase tracking-wider text-xs", status.className)}>
                        <StatusIcon size={14} />
                        {status.label}
                      </div>
                    );
                  })()}
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border/50">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Package size={14} /> Product</p>
                    <p className="font-bold">{details.application.product_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><User size={14} /> Applied On</p>
                    <p className="font-bold">{formatDate(details.application.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Banknote size={14} /> Requested Amount</p>
                    <p className="font-bold text-lg text-primary">৳ {formatAmount(details.application.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar size={14} /> Duration</p>
                    <p className="font-bold text-lg">{details.application.duration_months} Months</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><FileText size={14} /> Stated Purpose</p>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                    {details.application.purpose || "No purpose stated."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Column */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Submitted Documents</h3>
                  <p className="text-sm text-muted-foreground mt-1">Review the verified files.</p>
                </div>

                {details.documents.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <p className="text-sm">No documents attached.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {details.documents.map((doc, i) => (
                      <div key={i} className="space-y-3 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText size={14} />
                            </div>
                            <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{doc.type}</p>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                            title="View Full Size"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        
                        <div className="relative aspect-[3/4] sm:aspect-video md:aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-inner group-hover:border-primary/30 transition-all duration-500">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={doc.url} 
                            alt={doc.type} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
