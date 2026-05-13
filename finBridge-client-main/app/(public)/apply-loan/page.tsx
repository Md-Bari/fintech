"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, FileText, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled: boolean;
}

function FileUploadField({ label, required, file, onFile, disabled }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 2MB.");
      return;
    }
    onFile(f);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {!required && <span className="text-muted-foreground text-xs">(Optional)</span>}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex items-center justify-between gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all
          ${file ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 bg-muted/30"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          disabled={disabled}
          onChange={handleChange}
        />
        {file ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={18} className="text-primary shrink-0" />
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onFile(null); if (inputRef.current) inputRef.current.value = ""; }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Upload size={18} />
            <span className="text-sm">Click to upload · JPG, PNG Max 2MB</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplyLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, token } = useAuthStore();

  const mfiId = searchParams.get("mfi_id");
  const loanProductId = searchParams.get("loan_product_id");

  const [amount, setAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [purpose, setPurpose] = useState("");
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [tinFile, setTinFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Edge case guards — run after mount to avoid SSR mismatch
  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const role = user?.role?.toLowerCase();
    if (role !== "entrepreneur") {
      router.replace("/loans");
      return;
    }
    if (!mfiId || !loanProductId) {
      router.replace("/loans");
    }
  }, [isMounted, isAuthenticated, user, mfiId, loanProductId, router]);

  const validate = (): boolean => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid loan amount greater than 0.");
      return false;
    }
    if (!durationMonths || Number(durationMonths) < 1) {
      toast.error("Duration must be at least 1 month.");
      return false;
    }
    if (!purpose.trim()) {
      toast.error("Please describe the purpose of your loan.");
      return false;
    }
    if (!nidFile) {
      toast.error("NID document is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        mfi_id: mfiId,
        loan_product_id: loanProductId,
        amount: Number(amount),
        duration_months: Number(durationMonths),
        purpose: purpose.trim(),
      })
    );
    if (nidFile) formData.append("nid", nidFile);
    if (taxFile) formData.append("tax", taxFile);
    if (tinFile) formData.append("tin", tinFile);

    try {
      await api.post("/loan/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Loan application submitted successfully! The MFI will review and contact you.");
      // Reset form
      setAmount("");
      setDurationMonths("");
      setPurpose("");
      setNidFile(null);
      setTaxFile(null);
      setTinFile(null);
      setTimeout(() => router.push("/entrepreneur"), 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Application failed. Please try again.";
      const knownErrors: Record<string, string> = {
        "Only entrepreneurs can apply": "Only entrepreneurs can apply for loans.",
        "You have already applied": "You have already applied for this loan product.",
        "Invalid loan product": "The selected loan product is no longer available.",
      };
      const display = knownErrors[msg] ?? msg;
      toast.error(display);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/loans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Loan Products
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Loan Application
          </h1>
          <p className="text-muted-foreground mt-2">
            Fill in your details carefully. All information will be reviewed by the MFI before approval.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-2xl border-primary/10">
            <CardHeader className="border-b bg-muted/30 rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <FileText size={22} className="text-primary" />
                Application Form
              </CardTitle>
              <CardDescription>
                Fields marked with <span className="text-destructive">*</span> are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hidden fields info */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
                  <span>MFI ID: <span className="font-mono text-foreground/70">{mfiId?.slice(0, 8)}…</span></span>
                  <span>·</span>
                  <span>Product ID: <span className="font-mono text-foreground/70">{loanProductId?.slice(0, 8)}…</span></span>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Loan Amount (৳) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 20000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting}
                    className="w-full h-12 px-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all disabled:opacity-50"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Duration (Months) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    disabled={submitting}
                    className="w-full h-12 px-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all disabled:opacity-50"
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Purpose <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe how you plan to use the loan..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    disabled={submitting}
                    className="w-full p-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all resize-none disabled:opacity-50"
                  />
                </div>

                {/* File Uploads */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Document Uploads
                  </h3>
                  <FileUploadField
                    label="National ID (NID)"
                    required
                    file={nidFile}
                    onFile={setNidFile}
                    disabled={submitting}
                  />
                  <FileUploadField
                    label="Tax Certificate"
                    file={taxFile}
                    onFile={setTaxFile}
                    disabled={submitting}
                  />
                  <FileUploadField
                    label="TIN Certificate"
                    file={tinFile}
                    onFile={setTinFile}
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 rounded-xl text-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      Submitting Application…
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function ApplyLoanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <ApplyLoanForm />
    </Suspense>
  );
}
