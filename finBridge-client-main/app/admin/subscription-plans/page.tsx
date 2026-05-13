"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price_bdt: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function planLabel(name: string) {
  return name
    .split(/_|-/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50 text-sm disabled:opacity-50";

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({
  plan,
  onConfirm,
  onCancel,
  loading,
}: {
  plan: Plan;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-background rounded-[2rem] shadow-2xl border border-border max-w-sm w-full p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Delete Plan?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">&ldquo;{planLabel(plan.name)}&rdquo;</span> will be permanently deleted. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Detail Drawer ─────────────────────────────────────────────────────
function PlanDetail({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [detail, setDetail] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/subscription-plans/${plan.id}`)
      .then((res) => setDetail(res.data?.data))
      .catch(() => setDetail(plan))
      .finally(() => setLoading(false));
  }, [plan]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
      <div className="bg-background rounded-[2rem] shadow-2xl border border-border max-w-md w-full p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Plan Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            {[
              { label: "Name", value: planLabel(detail.name) },
              { label: "Price (BDT)", value: detail.price_bdt === 0 ? "Free" : `৳ ${detail.price_bdt.toLocaleString()}` },
              { label: "Status", value: detail.status ?? "—" },
              { label: "Created", value: detail.created_at ?? "—" },
              { label: "Updated", value: detail.updated_at ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <span className="text-sm font-semibold capitalize">{value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const fetchPlans = async () => {
    try {
      const res = await api.get("/subscription-plans");
      setPlans(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // ── Create ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error("Plan name is required."); return; }
    if (newPrice === "" || Number(newPrice) < 0) { toast.error("Enter a valid price."); return; }
    setSubmitting(true);
    try {
      await api.post("/admin/subscription-plans", {
        name: newName.trim().toLowerCase().replace(/\s+/g, "_"),
        price_bdt: Number(newPrice),
      });
      toast.success("Plan created successfully!");
      setNewName("");
      setNewPrice("");
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create plan.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setEditName(plan.name);
    setEditPrice(String(plan.price_bdt));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;
    if (!editName.trim()) { toast.error("Plan name is required."); return; }
    if (editPrice === "" || Number(editPrice) < 0) { toast.error("Enter a valid price."); return; }
    setSubmitting(true);
    try {
      await api.put(`/admin/subscription-plans/${editPlan.id}`, {
        name: editName.trim().toLowerCase().replace(/\s+/g, "_"),
        price_bdt: Number(editPrice),
      });
      toast.success("Plan updated successfully!");
      setEditPlan(null);
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update plan.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!confirmPlan) return;
    setDeletingId(confirmPlan.id);
    try {
      await api.delete(`/admin/subscription-plans/${confirmPlan.id}`);
      toast.success("Plan deleted.");
      setConfirmPlan(null);
      fetchPlans();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete plan.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      {confirmPlan && (
        <ConfirmModal
          plan={confirmPlan}
          onConfirm={handleDelete}
          onCancel={() => setConfirmPlan(null)}
          loading={!!deletingId}
        />
      )}
      {detailPlan && (
        <PlanDetail plan={detailPlan} onClose={() => setDetailPlan(null)} />
      )}

      {/* ── Header ── */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={12} />
                Platform Admin
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Subscription Plans</h1>
              <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
                Create and manage subscription tiers available to users on the finBridge platform.
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <CreditCard size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Create / Edit Form */}
        <div className="lg:col-span-1">
          <div className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden sticky top-28">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary/40" />
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-bold text-base">
                  {editPlan ? "Edit Plan" : "New Plan"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editPlan ? `Editing "${planLabel(editPlan.name)}"` : "Add a new subscription tier"}
                </p>
              </div>

              <form onSubmit={editPlan ? handleUpdate : handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. pro_plus"
                    value={editPlan ? editName : newName}
                    onChange={(e) => editPlan ? setEditName(e.target.value) : setNewName(e.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-muted-foreground pl-1">Use lowercase with underscores</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1999 (0 for free)"
                    value={editPlan ? editPrice : newPrice}
                    onChange={(e) => editPlan ? setEditPrice(e.target.value) : setNewPrice(e.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  {editPlan && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl h-11"
                      disabled={submitting}
                      onClick={() => setEditPlan(null)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className={cn("rounded-xl h-11 gap-2", editPlan ? "flex-1" : "w-full")}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editPlan ? (
                      <><CheckCircle2 size={16} /> Save Changes</>
                    ) : (
                      <><Plus size={16} /> Create Plan</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Plan List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-base text-muted-foreground uppercase tracking-wider text-sm">
            Existing Plans ({plans.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard size={28} className="text-muted-foreground" />
                </div>
                <p className="font-bold">No plans yet</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Create your first subscription plan using the form on the left.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group",
                    editPlan?.id === plan.id && "border-primary/40 shadow-sm"
                  )}
                  onClick={() => setDetailPlan(plan)}
                >
                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{planLabel(plan.name)}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {plan.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="sm:flex-1 sm:text-center">
                    <p className="text-xl font-extrabold text-primary">
                      {plan.price_bdt === 0 ? "Free" : `৳ ${plan.price_bdt.toLocaleString()}`}
                    </p>
                    {plan.price_bdt > 0 && (
                      <p className="text-xs text-muted-foreground">per month</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 h-9"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl gap-1.5 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmPlan(plan)}
                      disabled={deletingId === plan.id}
                    >
                      {deletingId === plan.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
