"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Landmark,
  Loader2,
  ArrowLeft,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  BadgePercent,
  Sparkles,
  Pencil,
  CheckCircle2,
  Plus,
  Activity,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────
interface LoanProduct {
  id: string;
  mfi_id: string;
  name: string;
  min_amount: string | null;
  max_amount: string;
  interest_rate: string;
  duration_months: number;
  status: string;
  created_at: string;
  updated_at: string;
  description: string;
  processing_fee: string;
}

interface LoanProductForm {
  name: string;
  min_amount: string;
  max_amount: string;
  interest_rate: string;
  duration_months: string;
  description: string;
  processing_fee: string;
}

const initialForm: LoanProductForm = {
  name: "",
  min_amount: "",
  max_amount: "",
  interest_rate: "",
  duration_months: "",
  description: "",
  processing_fee: "",
};

// ── Shared Field Component ──────────────────────────────────────────────────
function Field({ label, required, icon, children, hint }: { label: string; required?: boolean; icon: React.ReactNode; children: React.ReactNode; hint?: string; }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary shrink-0">
          {icon}
        </span>
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground pl-7">{hint}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ManageLoanProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<LoanProductForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<LoanProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/mfi/loan-products");
      setProducts(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load loan products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = (): boolean => {
    if (!form.name.trim()) { toast.error("Product name is required."); return false; }
    if (!form.min_amount || Number(form.min_amount) <= 0) { toast.error("Valid minimum amount required."); return false; }
    if (!form.max_amount || Number(form.max_amount) <= 0) { toast.error("Valid maximum amount required."); return false; }
    if (Number(form.min_amount) > Number(form.max_amount)) { toast.error("Minimum amount cannot be greater than maximum amount."); return false; }
    if (!form.interest_rate || Number(form.interest_rate) < 0) { toast.error("Valid interest rate required."); return false; }
    if (!form.duration_months || Number(form.duration_months) < 1) { toast.error("Duration must be at least 1 month."); return false; }
    if (!form.description.trim()) { toast.error("Description is required."); return false; }
    if (!form.processing_fee || Number(form.processing_fee) < 0) { toast.error("Valid processing fee required."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        interest_rate: Number(form.interest_rate),
        duration_months: Number(form.duration_months),
        description: form.description.trim(),
        processing_fee: parseFloat(form.processing_fee),
      };

      if (editingId) {
        await api.put(`/mfi/loan-products/${editingId}`, payload);
        toast.success("Loan product updated!");
        setEditingId(null);
      } else {
        await api.post("/mfi/loan-products", payload);
        toast.success("Loan product created!");
      }
      setForm(initialForm);
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save loan product.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: LoanProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      min_amount: p.min_amount ? String(p.min_amount) : "",
      max_amount: String(p.max_amount),
      interest_rate: String(p.interest_rate),
      duration_months: String(p.duration_months),
      description: p.description,
      processing_fee: String(p.processing_fee),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/mfi/loan-products/${productToDelete.id}`);
      toast.success("Loan product deleted!");
      if (editingId === productToDelete.id) cancelEdit();
      fetchProducts();
      setProductToDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete loan product.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50 text-sm disabled:opacity-50";

  return (
    <div className="space-y-8 pb-10">

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background rounded-[2rem] shadow-2xl border border-border max-w-sm w-full overflow-hidden"
            >
              <div className="h-1.5 w-full bg-destructive" />
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <Trash2 size={24} />
                  </div>
                  <button onClick={() => setProductToDelete(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Delete Product?</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-foreground">{productToDelete.name}</span>? This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setProductToDelete(null)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1 rounded-xl h-12 gap-2" onClick={executeDelete} disabled={deleting}>
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : "Yes, delete"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
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
                <Sparkles size={12} />
                MFI Admin
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Loan Products</h1>
              <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
                Manage and create structured loan offerings for entrepreneurs.
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Landmark size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column Layout ── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── FORM COLUMN ── */}
        <div className="lg:col-span-1">
          <div className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden sticky top-28">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary/40" />
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-bold text-base">{editingId ? "Edit Loan Product" : "New Loan Product"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingId ? "Update product parameters" : "Define a new product offering"}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field label="Product Name" required icon={<FileText size={12} />}>
                  <input type="text" name="name" placeholder="e.g. Small Business Loan" value={form.name} onChange={handleChange} disabled={submitting} className={inputClass} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Min Amount" required icon={<DollarSign size={12} />}>
                    <input type="number" name="min_amount" min="1" placeholder="10000" value={form.min_amount} onChange={handleChange} disabled={submitting} className={inputClass} />
                  </Field>
                  <Field label="Max Amount" required icon={<DollarSign size={12} />}>
                    <input type="number" name="max_amount" min="1" placeholder="50000" value={form.max_amount} onChange={handleChange} disabled={submitting} className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Duration" required icon={<Calendar size={12} />} hint="Months">
                    <input type="number" name="duration_months" min="1" placeholder="6" value={form.duration_months} onChange={handleChange} disabled={submitting} className={inputClass} />
                  </Field>
                  <Field label="Interest Rate" required icon={<Percent size={12} />} hint="% APR">
                    <input type="number" name="interest_rate" min="0" step="0.01" placeholder="12" value={form.interest_rate} onChange={handleChange} disabled={submitting} className={inputClass} />
                  </Field>
                </div>

                <Field label="Processing Fee" required icon={<BadgePercent size={12} />} hint="One-time fee charged on disbursal (৳)">
                  <input type="number" name="processing_fee" min="0" step="0.01" placeholder="250.00" value={form.processing_fee} onChange={handleChange} disabled={submitting} className={inputClass} />
                </Field>

                <Field label="Description" required icon={<FileText size={12} />}>
                  <textarea name="description" rows={3} placeholder="Describe eligibility and benefits..." value={form.description} onChange={handleChange} disabled={submitting} className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50 text-sm resize-none disabled:opacity-50" />
                </Field>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" disabled={submitting} onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className={cn("rounded-xl h-11 gap-2", editingId ? "flex-1" : "w-full")} disabled={submitting}>
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editingId ? (
                      <><CheckCircle2 size={16} /> Update</>
                    ) : (
                      <><Plus size={16} /> Create</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── LIST COLUMN ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Listed Products ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <Card className="rounded-[2rem] border-none shadow-sm">
              <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Landmark size={28} className="text-muted-foreground" />
                </div>
                <p className="font-bold">No products found</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Create your first loan product offering using the form on the left.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div key={p.id} className={cn(
                  "p-6 rounded-[1.5rem] bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group",
                  editingId === p.id && "border-primary/40 shadow-sm ring-1 ring-primary/20"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Header: Name + Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Landmark size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{p.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">ID: {p.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          p.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-muted text-muted-foreground"
                        )}>
                          <Activity size={10} />
                          {p.status}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                          <Calendar size={10} />
                          {p.duration_months} Months
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="sm:text-right space-y-1 bg-muted/30 p-3 rounded-xl border border-border/50 shrink-0">
                      <div className="flex justify-between sm:justify-end items-center gap-4">
                        <span className="text-xs text-muted-foreground">Amount Limit</span>
                        <span className="font-bold text-primary">৳{p.min_amount ? Number(p.min_amount).toLocaleString() : 0} - ৳{Number(p.max_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between sm:justify-end items-center gap-4">
                        <span className="text-xs text-muted-foreground">Interest</span>
                        <span className="font-bold">{p.interest_rate}% APR</span>
                      </div>
                      <div className="flex justify-between sm:justify-end items-center gap-4">
                        <span className="text-xs text-muted-foreground">Fee</span>
                        <span className="font-bold">৳{Number(p.processing_fee).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description snippet */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleEdit(p)}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setProductToDelete(p)}>
                      <Trash2 size={14} /> Delete
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
